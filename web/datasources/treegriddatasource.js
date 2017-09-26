define(['../utils', './defaulttreesource'], function (utils, DefaultTreeSource) {
    // Adds treegrid functionality to the grid.
    // This works by wrapping the datasource in a TreeGridDataSource whose data can change
    // depending on which rows are collapsed or expanded.

    /*
     * Shadow node object description:
     * {
     *   level: tree level (0 for root rows)
     *   index: index of this node within its parents children
     *   expanded: true if node is expanded in tree
     *   id: id of the row associated with this shadow node. undefined if not yet known (i.e. row is not yet loaded)
     *   parentId: id of the parent row. undefined for root rows
     */

    function TreeGridDataSource(treesource, options) {
        if (typeof treesource.getRootNodes == 'function') {
            this.treesource = treesource;
        } else {
            this.treesource = new DefaultTreeSource(treesource);
        }

        if(this.treesource.isReady()) {
            this.load();
        }

        $(this.treesource).on("dataloaded", this.load.bind(this));

        $(this.treesource).on("datachanged editabilitychanged validationresultchanged", function (event, data) {
            $(self).trigger(event.type, [data]);
        });

        this.options = options;
    }

    TreeGridDataSource.prototype = {
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
                var rootNodeRanges = utils.findRanges(rootNodes.map(toIndex));
                    lut = createLUT(rootNodes);

                promises = promises.concat(rootNodeRanges.map(function(range) {
                    return Promise.resolve(self.treesource.getRootNodes(range.start, range.start + range.count)).then(function(result) {
                        if(result.length > range.count) {
                            throw new Error("Treesource returns too many root nodes");
                        }
                        for(var x=0, l = result.length; x < l; x++) {
                            var row = result[x];
                            self.recordByIdMap[row.id] = row;
                            lut[range.start + x].id = row.id;
                        }
                        return range;
                    });
                }));
            }

            for(var parentId in nodesPerParentId) {
                var childNodeRanges = utils.findRanges(nodesPerParentId[parentId].map(toIndex)),
                    parent = this.getRecordById(parentId),
                    lut = createLUT(nodesPerParentId[parentId]);

                promises = promises.concat(childNodeRanges.map(function(range) {
                    return Promise.resolve(self.treesource.children(parent, range.start, range.start + range.count)).then(function(result) {
                        if(result.length > range.count) {
                            throw new Error("Treesource returns too many children");
                        }
                        for(var x=0, l = result.length; x < l; x++) {
                            var row = result[x];
                            self.recordByIdMap[row.id] = row;
                            lut[range.start + x].id = row.id;
                        }
                        return range;
                    });
                }));
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
            $(self).trigger("dataloaded");
        },

        isReady: function () {
            return this.view !== undefined;
        },

        assertReady: function () {
            if (!this.isReady()) {
                throw "Datasource not ready yet";
            }
        },

        initView: function (initialTreeDepth) {
            var self = this;
            return this.rebuildView();
        },

        rebuildView: function () {
            var self = this;
            return Promise.resolve(this.treesource.getRootNodes()).then(function (tree) {
                return self.flattenTree(tree, 0).then(function(view) {
                    self.view = view;
                    $(self).trigger("dataloaded");
                });
            });
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
            var row = this.getRecordById(rowId);
            if (this.isExpanded(row)) {
                this.collapse(row);
            } else {
                this.expand(row);
            }
        },

        expand: function (row) {
            var self = this;
            var shadowNode = this.findShadowNodeForId(row.id);

            if(shadowNode.expanded) {
                // already expanded, don't do anything
                return;
            }

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

                    $(self).trigger('rowsadded', {start: start + 1, end: start + 1 + rows.length});
                }
                $(self).trigger('treetoggled', {id: row.id, index: start, state: true});
            });
        },

        collapse: function (row) {
            var shadowNode = this.findShadowNodeForId(row.id);

            if (!shadowNode.expanded) {
                // already collapsed, don't do anything
                return;
            }

            var start = this.view.indexOf(shadowNode);

            shadowNode.expanded = false;
            if (start !== undefined) {
                var count = this.getShadowNodeSubTreeSize(shadowNode);

                this.view.splice(start + 1, count);
                $(this).trigger('rowsremoved', {start: start + 1, end: start + count + 1});
            }

            $(this).trigger('treetoggled', {id: row.id, index: start, state: false});
        },

        isExpanded: function (row) {
            return this.findShadowNodeForId(row.id).expanded;
        },

        expandAll: function (rowId) {
            var ds = this;
            utils.inAnimationFrame(function () {
                function expandall(row) {
                    var children = ds.children(row);
                    if (children) {
                        children.forEach(expandall);
                    }
                    ds.expand(row);
                }

                if (rowId === undefined) {
                    ds.tree.forEach(expandall);
                } else {
                    expandall(ds.getRecordById(rowId));
                }
            });
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

        sort: function (comparator) {
            this.treesource.sort(comparator);
        },

        applyFilter: function (columnSettings, filterFunction) {
            this.treesource.filter(columnSettings, filterFunction);
        },

        setValue: function(rowId, key, value) {
            this.treesource.setValue(rowId, key, value);
        }

    };

    return TreeGridDataSource;
});
