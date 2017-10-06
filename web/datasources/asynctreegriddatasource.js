define(['../utils'], function (utils) {
    /**
     * Takes a TreeSource and adapts it to represent the flat list of expanded nodes.
     */

    /*
     * Shadow node object description:
     * {
     *   level: tree level (0 for root rows)
     *   index: index of this node within its parents children
     *   expanded: true if node is expanded in tree
     *   id: id of the row associated with this shadow node. undefined if not yet known (i.e. row is not yet loaded)
     *   parentId: id of the parent row. undefined for root rows
     */

    function AsyncTreeGridDataSource(treesource, options) {
        utils.Evented.apply(this);

        this.options = options;
        this.expandedById = {};

        this.treesource = treesource;

        if(this.treesource.isReady()) {
            this.load();
        }

        this.treesource.on("dataloaded", this.load.bind(this));

        this.passthroughFrom(this.treesource, "datachanged", "editabilitychanged", "validationresultchanged");

        utils.passthrough(this, treesource, ['hasSubView']);

    }

    AsyncTreeGridDataSource.prototype = {
        initShadowTree: function () {
            if(!this.treesource.isReady()) {
                throw new Error("Treesource is not ready yet.");
            }

            this.shadowTree = [];

            for (var x = 0, l = this.treesource.countRootNodes(); x < l; x++) {
                this.shadowTree[x] = {
                    level: 0,
                    index: x,
                    expanded: false
                };
            }

            this.view = this.shadowTree.concat([]); // initial (unexpanded) view is copy of root shadow tree
        },

        findShadowNodeForId: function(id, searchIn) {
            if(arguments.length == 1) {
                return this.findShadowNodeForId(id, this.shadowTree);
            } else {
                for(var x=0,l=searchIn.length;x<l;x++) {
                    if(searchIn[x].id == id) return searchIn[x];
                    if(searchIn[x].children) {
                        var result = this.findShadowNodeForId(id, searchIn[x].children);
                        if(result !== null) {
                            return result;
                        }
                    }
                }
                return null;
            }
        },

        /**
         * Returns the number descendant rows of the given shadowNode that should be visible in the grid, assuming the given shadowNode is visible (i.e. ancestry expanded)
         * @param shadowNode
         * @returns number
         */
        getShadowNodeSubTreeSize: function(shadowNode) {
            var self = this;

            if(shadowNode.children === undefined) {
                throw new Error("Shadow Node children expected to be known (as shadow nodes) when it is expanded");
            }

            return shadowNode.children.reduce(function(count, child) {
                return count + (child.expanded ? self.getShadowNodeSubTreeSize(child) : 0);
            }, shadowNode.children.length);
        },

        loadShadowEntries: function(shadowNodes) {
            var rootNodes = [],
                nodesPerParentId = {},
                self = this;

            for(var x=0,l=shadowNodes.length;x<l;x++) {
                var node = shadowNodes[x];
                if(node.id === undefined) {
                    if (node.parentId !== undefined) {
                        if (!(node.parentId in nodesPerParentId)) {
                            nodesPerParentId[node.parentId] = [node];
                        } else {
                            nodesPerParentId[node.parentId].push(node);
                        }
                    } else {
                        rootNodes.push(node);
                    }
                }
            }

            var promises = [];

            function createLUT(shadowNodes) {
                var index = [];
                for(var x=0,l=shadowNodes.length;x<l;x++) {
                    index[shadowNodes[x].index] = shadowNodes[x];
                }
                return index;
            }

            function toIndex(node) {
                return node.index;
            }

            if(rootNodes.length) {
                var rootNodeRanges = utils.findRanges(rootNodes.map(toIndex)),
                    lut = createLUT(rootNodes);

                promises = promises.concat(rootNodeRanges.map(function(range) {
                    return Promise.resolve(self.treesource.getRootNodes(range.start, range.start + range.count)).then(function(result) {
                        if(result.length != range.count) {
                            throw new Error("Treesource returned incorrect amount of root nodes");
                        }
                        var promises = [];
                        for(var x=0, l = result.length; x < l; x++) {
                            var row = result[x];
                            self.recordByIdMap[row.id] = row;
                            var shadowNode = lut[range.start + x];
                            shadowNode.id = row.id;

                            if(self.expandedById[row.id]) {
                                promises.push(self._expandShadowNode(shadowNode, row));
                            }
                        }
                        return Promise.all(promises);
                    });
                }));
            }

            for(var parentId in nodesPerParentId) {
                (function() {
                    var childNodeRanges = utils.findRanges(nodesPerParentId[parentId].map(toIndex)),
                        parent = self.getRecordById(parentId),
                        lut = createLUT(nodesPerParentId[parentId]);

                    promises = promises.concat(childNodeRanges.map(function(range) {
                        return Promise.resolve(self.treesource.children(parent, range.start, range.start + range.count)).then(function(result) {
                            if(result.length != range.count) {
                                throw new Error("Treesource returned incorrect amount of child nodes");
                            }
                            var promises = [];
                            for(var x=0, l = result.length; x < l; x++) {
                                var row = result[x];
                                self.recordByIdMap[row.id] = row;
                                var shadowNode = lut[range.start + x];
                                shadowNode.id = row.id;

                                if(self.expandedById[row.id]) {
                                    promises.push(self._expandShadowNode(shadowNode, row));
                                }
                            }
                            return Promise.all(promises);
                        });
                    }));
                })();
            }

            return Promise.all(promises).then(function(ranges) {
                return shadowNodes;
            });
        },

        load: function() {
            var self = this;
            this.parentByIdMap = {};
            this.childrenByIdMap = {};
            this.recordByIdMap = {};

            this.initShadowTree();
            self.trigger("dataloaded");
        },

        isReady: function () {
            return this.view !== undefined;
        },

        assertReady: function () {
            if (!this.isReady()) {
                throw "Datasource not ready yet";
            }
        },

        getData: function (start, end) {
            this.assertReady();
            var self = this, shadowRows;
            if (start !== undefined || end !== undefined) {
                shadowRows = this.view.slice(start, end);
            } else {
                shadowRows = this.view;
            }

            return this.loadShadowEntries(shadowRows).then(function() {
                return shadowRows.map(function(shadowRow) {
                    return self.getRecordById(shadowRow.id);
                });
            });
        },

        recordCount: function () {
            this.assertReady();
            return this.view.length;
        },

        toggle: function (rowId) {
            var shadowNode = this.findShadowNodeForId(rowId);
            if(shadowNode) {
                /** If no shadow node could be found, then that means the node isn't visible yet and we'll do nothing */
                var row = this.getRecordById(rowId);
                if (this.isExpanded(row)) {
                    return this.collapse(row);
                } else {
                    return this._expandShadowNode(shadowNode, row);
                }
            }
        },

        expand: function (row) {
            var shadowNode = this.findShadowNodeForId(row.id);
            return this._expandShadowNode(shadowNode, row);
        },

        _expandShadowNode: function(shadowNode, row) {
            var self = this;

            if(shadowNode.expanded) {
                // already expanded, don't do anything
                return Promise.resolve();
            }

            this.expandedById[row.id] = true;

            return (shadowNode.children === undefined ? Promise.resolve(this.treesource.countChildren(row)).then(function(rowCount) {
                // generate shadow children
                shadowNode.children = new Array(rowCount);
                for(var x=0;x<rowCount;x++) {
                    shadowNode.children[x] = {
                        parentId: row.id,
                        index: x,
                        level: shadowNode.level + 1,
                        expanded: false
                    };
                }
            }) : Promise.resolve()).then(function() {
                // expand it. then we must insert rows
                shadowNode.expanded = true;

                var start = self.view.indexOf(shadowNode);

                if (start !== undefined) {
                    var rows = self.flattenShadowSubTree(shadowNode);

                    self.view.splice.apply(self.view, [start + 1, 0].concat(rows));

                    self.trigger('rowsadded', {start: start + 1, end: start + 1 + rows.length});
                }
                self.trigger('treetoggled', {id: row.id, index: start, state: true});
            });
        },

        collapse: function (row) {
            var shadowNode = this.findShadowNodeForId(row.id);
            this._collapseShadowNode(shadowNode);
        },

        _collapseShadowNode: function(shadowNode) {
            if (!shadowNode.expanded) {
                // already collapsed, don't do anything
                return Promise.resolve();
            }

            this.expandedById[shadowNode.id] = false;

            var start = this.view.indexOf(shadowNode);

            shadowNode.expanded = false;
            if (start !== undefined) {
                var count = this.getShadowNodeSubTreeSize(shadowNode);

                this.view.splice(start + 1, count);
                this.trigger('rowsremoved', {start: start + 1, end: start + count + 1});
            }

            this.trigger('treetoggled', {id: shadowNode.id, index: start, state: false});

            return Promise.resolve();
        },

        isExpanded: function (row) {
            return this.findShadowNodeForId(row.id).expanded;
        },

        getTreeLevel: function(row) {
            return this.findShadowNodeForId(row.id).level;
        },

        expandAll: function (rowId, depth) {
            var self = this;
            function expand(nodes, depth) {
                return self.loadShadowEntries(nodes).then(function() {
                    return Promise.all(nodes.map(function(node) {
                        var record = self.getRecordById(node.id);
                        return self._expandShadowNode(node, record).then(function() {
                            if(node.children && (depth === undefined || depth > 1)) {
                                return expand(node.children, depth === undefined ? undefined : depth - 1);
                            }
                        });
                    }));
                });
            }
            var nodes;
            if(rowId) {
                nodes = [this.findShadowNodeForId(rowId)];
            } else {
                nodes = this.shadowTree;
            }
            return expand(nodes, depth);
        },

        expandToLevel: function(depth) {
            return this.expandAll(false, depth);
        },

        collapseAll: function (rowId) {
            var ds = this;
            utils.inAnimationFrame(function () {
                function collapseall(row) {
                    ds.collapse(row);
                    var children = ds.children(row);
                    if (children) {
                        children.forEach(collapseall);
                    }
                }

                if (rowId === undefined) {
                    ds.tree.forEach(collapseall);
                } else {
                    collapseall(ds.getRecordById(rowId));
                }
            });
        },

        flattenShadowSubTree: function(shadowNode) {
            if(shadowNode.expanded) {
                var flat = [];
                for(var x=0,l=shadowNode.children.length;x<l;x++) {
                    flat.push(shadowNode.children[x]);
                    flat = flat.concat(this.flattenShadowSubTree(shadowNode.children[x]));
                }
                return flat;
            } else {
                return [];
            }
        },

        hasChildren: function(row) {
            return this.treesource.hasChildren(row);
        },

        children: function (row) {
            var self = this;
            if (!this.childrenByIdMap[row.id]) {
                return Promise.resolve(this.treesource.children(row)).then(function(children) {
                    self.childrenByIdMap[row.id] = children;
                    if (children !== undefined) {
                        for (var x = 0, l = children.length; x < l; x++) {
                            self.parentByIdMap[children[x].id] = row.id;
                        }
                    }
                    return children;
                });
            } else {
                return Promise.resolve(this.childrenByIdMap[row.id]);
            }
        },

        getRecordById: function(id) {
            if(!(id in this.recordByIdMap)) {
                throw new Error("Record with id " + id + " not yet loaded or does not exist. This is likely a bug or incorrect usage.");
            }
            return this.recordByIdMap[id];
        },

        parent: function (row) {
            if (this.treesource && typeof this.treesource.parent === 'function') {
                return this.treesource.parent(row);
            }
            return this.parentByIdMap[row.id];
        },

        sort: function (comparator, settings) {
            this.treesource.sort(comparator, settings);
        },

        group: function(settings) {
            return this.treesource.group(settings);
        },

        applyFilter: function (columnSettings, filterFunction) {
            this.treesource.filter(columnSettings, filterFunction);
        },

        setValue: function(rowId, key, value) {
            this.treesource.setValue(rowId, key, value);
        }

    };

    return AsyncTreeGridDataSource;
});
