define(['../utils', './defaulttreesource'], function (utils, DefaultTreeSource) {
    // Adds treegrid functionality to the grid.
    // This works by wrapping the datasource in a TreeGridDataSource whose data can change
    // depending on which rows are collapsed or expanded.

    function TreeGridDataSource(treesource, options) {
        this._treeSettings = {};

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
        load: function() {
            var self = this;
            this.parentByIdMap = {};
            this.childrenByIdMap = {};
            this.recordByIdMap = {};

            this.initView(this.options && this.options.initialTreeDepth || 0).then(function() {
                $(self).trigger("dataloaded");
            });
        },

        treeSettings: function (row) {
            if (!this._treeSettings[row.id]) {
                var depth = this.parent(row) ? this._treeSettings[this.parent(row)].depth + 1 : 0;
                this._treeSettings[row.id] = {expanded: false, depth: depth};
            }
            return this._treeSettings[row.id];
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
            if (start !== undefined || end !== undefined) {
                return this.view.slice(start, end);
            } else {
                return this.view;
            }
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
            var rowId = row.id, l, x, start, self = this;

            if (this.isExpanded(row)) {
                // already expanded, don't do anything
                return;
            }

            // find the location of this row in the current view
            for (x = 0, l = this.view.length; x < l; x++) {
                if (this.view[x].id == rowId) {
                    start = x;
                    break;
                }
            }

            // expand it. then we must insert rows
            this.treeSettings(row).expanded = true;
            if (start !== undefined) {
                this.flattenSubTree(row).then(function(rows) {
                    self.view.splice.apply(self.view, [start + 1, 0].concat(rows));
                    $(self).trigger('rowsadded', {start: start + 1, end: start + 1 + rows.length});
                    $(self).trigger('treetoggled', {id: rowId, index: start, state: self.isExpanded(row)});
                });
            } else {
                $(this).trigger('treetoggled', {id: rowId, index: start, state: this.isExpanded(row)});
            }
        },

        collapse: function (row) {
            var rowId = row.id, x, l, start, end, startDepth;

            if (!this.isExpanded(row)) {
                // already collapsed, don't do anything
                return;
            }

            for (x = 0, l = this.view.length; x < l; x++) {
                if (start === undefined && this.view[x].id == rowId) {
                    startDepth = this.treeSettings(row).depth;
                    start = x;
                } else if (start !== undefined) {
                    if (this.treeSettings(this.view[x]).depth <= startDepth) {
                        break;
                    }
                }
            }

            end = x;

            // collapse it. we must remove some rows from the view.
            this.treeSettings(row).expanded = false;
            if (start !== undefined) {
                this.view.splice(start + 1, end - start - 1);
                $(this).trigger('rowsremoved', {start: start + 1, end: end});
            }

            $(this).trigger('treetoggled', {id: rowId, index: start, state: this.isExpanded(row)});
        },

        isExpanded: function (row) {
            return this.treeSettings(row).expanded;
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

        flattenTree: function (nodes, depth) {
            var view = [],
                self = this,
                treesource = this.treesource;

            function preload(nodes) {
                var promises = [];
                for(var x  = 0, l = nodes.length; x < l; x++) {
                    var r = nodes[x];
                    if(self.isExpanded(r) && !(r.id in self.childrenByIdMap)) {
                        promises.push(self.children(r).then(function(children) {
                            preload(children);
                        }));
                    }
                }
                return Promise.all(promises);
            }

            function build(nodes, depth, parent) {
                var childPromises = [];
                for (var x = 0, l = nodes.length; x < l; x++) {
                    var r = nodes[x];
                    var treesettings = self.treeSettings(r);
                    treesettings.depth = depth;
                    self.recordByIdMap[r.id] = r;

                    view.push(r);

                    if (self.isExpanded(r) && r.id in self.childrenByIdMap) {
                        var children = self.childrenByIdMap[r.id];
                        build(children, depth + 1);
                    }
                }
            }

            return preload(nodes).then(function() {
                build(nodes, depth);
                return view;
            });
        },

        flattenSubTree: function(node) {
            var self = this, rs = this.treeSettings(node);
            return this.children(node).then(function(children) {
                return self.flattenTree(children, rs.depth + 1);
            })
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
        }

    };

    return TreeGridDataSource;
});
