define(['../utils'], function(utils) {
    /**
     * Takes a delegate DataSource and adapts it into a TreeSource. Hierarchy is built up using one of two methods:
     * - each child row has a 'parent' property that references the id of its parent
     * - each row has a 'children' property containing an array of its children
     *
     * @param delegate
     * @constructor
     */
    function DefaultTreeSource(delegate) {
        utils.Evented.apply(this);
        this.delegate = delegate;

        if (delegate.isReady()) {
            this.load();
        }

        delegate.on("dataloaded", this.load.bind(this));

        this.passthroughFrom(delegate, "datachanged","editabilitychanged","validationresultchanged");
    }

    DefaultTreeSource.prototype = {
        isReady: function() {
            return this.tree !== undefined;
        },

        load: function () {
            var self = this;
            if (this.delegate) {
                if (this.delegate.buildTree) {
                    console.warn("buildTree() on datasource is deprecated. Consider implementing a TreeSource instead.");
                    this.tree = this.delegate.buildTree();
                    this.tree.forEach(function(item) {
                        self.nodesPerId[item.id] = item;
                    });
                    this.trigger('dataloaded');
                } else {
                    this.buildTree(this.delegate.getData());
                }
            }
        },

        sort: function (comparator) {
            if(arguments.length == 1) {
                this.comparator = comparator;
            }

            var self = this;

            function sort(arr) {
                arr.sort(self.comparator);
                for (var x = 0, l = arr.length; x < l; x++) {
                    var children = self.nodesPerId[arr[x].id].children;
                    if (children) {
                        sort(children);
                    }
                }
            }

            sort(this.tree);
            this.trigger('dataloaded');
        },

        buildTree: function (data) {
            var rootNodes = [],
                nodesPerId = {};

            function processChildren(parentRecord) {
                if(parentRecord.children) {
                    for(var x = 0, l = parentRecord.children.length; x < l; x++) {
                        var childRecord = parentRecord.children[x],
                            node = {
                                record: childRecord,
                                children: processChildren(childRecord)
                            };
                        nodesPerId[childRecord.id] = node;
                    }
                    return [].concat(parentRecord.children);
                } else {
                    return [];
                }
            }

            for (var x = 0, l = data.length; x < l; x++) {
                var record = data[x],
                    node = {
                        record: record,
                        children: processChildren(record)
                    };
                nodesPerId[record.id] = node;

                if (record.parent !== undefined) {
                    var parentNode = nodesPerId[record.parent];
                    parentNode.children.push(record);
                } else {
                    rootNodes.push(record);
                }
            }

            this.nodesPerId = nodesPerId;
            this.tree = rootNodes;
            this.trigger('dataloaded');
        },

        getRootNodes: function(start, end) {
            if(this.predicate) {
                return this.tree.filter(function(node) {
                    return node.isFilterMatch;
                }).slice(start || 0, end);
            } else {
                return this.tree.slice(start || 0, end)
            }
        },

        getRecordById: function (id) {
            return this.delegate.getRecordById(id);
        },

        hasChildren: function (row) {
            if (this.delegate && this.delegate.hasChildren) {
                return this.delegate.hasChildren.apply(this.delegate, arguments);
            }

            var node = this.nodesPerId[row.id];
            return node.children.length > 0;
        },

        children: function (row, start, end) {
            var node = this.nodesPerId[row.id];
            if(this.predicate) {
                return node.children.filter(function(child) {
                    return child.isFilterMatch;
                }).slice(start || 0, end);
            } else {
                return node.children.slice(start || 0, end);
            }
        },

        countChildren: function(row) {
            var node = this.nodesPerId[row.id];
            if(this.predicate) {
                // filtering is enabled
                return node.children.reduce(function(total, child) {
                    if(child.isFilterMatch) return total + 1;
                    else return total;
                }, 0);
            } else {
                return node.children.length;
            }
        },

        countRootNodes: function() {
            if(this.predicate) {
                return this.getRootNodes().reduce(function(total, node) {
                    if(node.isFilterMatch) return total + 1;
                    else return total;
                }, 0);
            }
            return this.getRootNodes().length;
        },

        rowOrAncestorMatches: function (row) {
            return !this.filter || this.filter(row) || (this.parent(row) !== undefined && this.rowOrAncestorMatches(this.getRecordById(this.parent(row))));
        },

        buildStatistics: function () {
            var stats = this.delegate &&
                this.delegate.statistics &&
                this.delegate.statistics();

            if (!stats) {
                return {
                    actualRecordCount: this.delegate && this.delegate.recordCount()
                };
            } else {
                return stats;
            }
        },

        filter: function(columnSettings, predicate) {
            this.predicate = predicate;
            this.refreshFilterAttributes();
            this.trigger('dataloaded');
        },

        refreshFilterAttributes: function() {
            var predicate = this.predicate;
            function matches(node) {
                if(!predicate) {
                    return 1;
                } else {
                    return predicate(node);
                }
            }

            function apply(nodes, parentMatches) {
                var treeMatch = 0;

                for(var x=0,l=nodes.length;x<l;x++) {
                    var node = nodes[x],
                        nodeMatch = matches(node),
                        match;

                    if(nodeMatch < 0) {
                        match = false;
                    } else if(node.children && node.children.length) {
                        var childrenMatch = apply(node.children, nodeMatch > 0);
                        if(childrenMatch < 0) {
                            match = false;
                        } else if(childrenMatch == 0) {
                            match = parentMatches || (nodeMatch > 0);
                        } else {
                            match = true;
                        }
                    } else {
                        match = parentMatches || (nodeMatch > 0);
                    }

                    node.isFilterMatch = match;
                    if(match < 0) {
                        treeMatch = -1;
                    } else if(match > 0 && treeMatch != -1) {
                        treeMatch = 1;
                    }
                }

                return treeMatch;
            }

            apply(this.tree, false);
        },

        statistics: function () {
            return this._statistics;
        },

        setValue: function(rowId, key, value) {
            this.delegate.setValue(rowId, key, value);
        }
    };

    return DefaultTreeSource;
});
