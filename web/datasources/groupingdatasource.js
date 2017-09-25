/**
 * Datasource for client-side grouping of an in-memory datasource.
 */

define(['../utils'], function (utils) {
    function GroupingDataSource(delegate) {
        var self = this;
        this.delegate = delegate;
        for (var x in this.delegate) {
            if (!this[x] && (typeof this.delegate[x] === "function")) {
                this[x] = this.delegate[x].bind(this.delegate);
            }
        }

        $(delegate).on("datachanged", function (event, data) {
            self.load();
            $(self).trigger(event.type, [data]);
        });

        $(delegate).on("dataloaded", this.load.bind(this));
        this.groups = [];

        utils.passthrough(this, delegate, ['commitRow','startEdit','rollbackRow','replace']);
    }

    GroupingDataSource.prototype = {
        load: function () {
            this.updateView();
        },

        getRecordCount: function() {
            return this.delegate.recordCount();
        },

        getRootNodes: function() {
            return this.view;
        },

        children: function(row, start, end) {
            switch(arguments.length) {
                case 1: return row.children;
                case 2: return row.children(slice, start);
                case 3: return row.children(slice, start, end);
            }
        },

        countChildren: function(row) {
            return row.recordCount;
        },

        filter: function(settings, predicate) {
            this.filterPredicate = predicate;
            this.updateView();
        },

        sort: function(comparator, settings) {
            var self = this;
            this.sortComparator = comparator;

            function s(nodes) {
                nodes.sort(comparator);
                if(nodes.length && nodes[0].groupRow === true) {
                    for(var x=0,l=nodes.length;x<l;x++) {
                        s(nodes[x].children);
                    }
                }
            }

            s(this.view);

            $(this).trigger('dataloaded');
        },

        updateView: function () {
            var ds = this;
            var groupRows = this.groupRows = {};
            var rowToGroupMap = {};
            var DISCARD_GROUP = {};

            this.parentByIdMap = {};

            function group(nodes, groupings, parentGroupId, level) {
                if (groupings && groupings.length) {
                    var groupMap = {},
                        groups = [],
                        col = groupings[0],
                        groupProjection = col.groupProjection && col.groupProjection(nodes),
                        nextGroupings = groupings.slice(1);

                    for (var x = 0, l = nodes.length; x < l; x++) {
                        var baseValue = utils.getValue(nodes[x], col.key);
                        var g = groupProjection ? groupProjection(baseValue) : baseValue;
                        var r = groupMap[g];

                        if(r === DISCARD_GROUP) {
                            continue;
                        }

                        if(ds.filterPredicate) {
                            var filterResult = ds.filterPredicate(nodes[x]);
                            if(filterResult < 0) {
                                if(r) {
                                    groups.splice(groups.indexOf(r), 1);
                                }
                                groupMap[g] = DISCARD_GROUP;
                                continue;
                            } else if(filterResult == 0) {
                                continue;
                            }
                        }

                        if (!r) {
                            groups.push(groupMap[g] = r = {
                                groupRow: true,
                                id: parentGroupId + g + ":",
                                description: g,
                                children: [],
                                _groupColumn: col,
                                _groupLevel: level,
                                parent: level > 0 ? parentGroupId : null
                            });

                            r[col.key] = baseValue;
                        }
                        r.children.push(nodes[x]);
                        ds.parentByIdMap[nodes[x].id] = r;
                        groupRows[r.id] = r;
                    }

                    groups = groups.filter(function(g) {
                        return g !== DISCARD_GROUP;
                    });

                    for (var x = 0, l = groups.length; x < l; x++) {
                        groups[x].recordCount = ds.groupRecordCount(groups[x]);
                        groups[x].children = group(groups[x].children, nextGroupings, groups[x].id, level + 1);
                        ds.processGroup(groups[x]);
                    }

                    groups.sort(this.comparator);

                    return groups;
                } else {
                    for (var x = 0, l = nodes.length; x < l; x++) {
                        rowToGroupMap[nodes[x].id] = parentGroupId;
                    }

                    if(ds.filterPredicate) {
                        nodes = nodes.filter(ds.filterPredicate);
                    }

                    return nodes;
                }
            }

            if(this.groups && this.groups.length) {
                this.view = group(this.delegate.getData(), this.groups, "group:", 0);
            } else {
                // make sure view is a copy of the original data, and not original array itself, so when we sort stuff
                // we don't affect the original datasource
                this.view = this.delegate.getData().concat([]);
            }
            $(this).trigger("dataloaded");
        },

        groupRecordCount: function (group) {
            return group.children.length;
        },

        group: function (groupings) {
            this.groups = groupings;
            if (this.isReady()) {
                this.updateView();
            }
        },

        getRecordById: function (id) {
            return this.groupRows[id] || this.delegate.getRecordById(id);
        },

        recordCount: function () {
            this.assertReady();
            return this.view.length;
        },

        isReady: function () {
            return this.view !== undefined;
        },

        assertReady: function () {
            if (!this.isReady()) {
                throw "Datasource not ready yet";
            }
        },

        parent: function (row) {
            var parentRow = this.parentByIdMap[row.id];
            if(parentRow) {
                return parentRow.id;
            }
        },

        hasChildren: function (row) {
            var groupRow = this.groupRows[row.id];
            if (groupRow) {
                return groupRow.children && groupRow.children.length > 0;
            } else {
                return false;
            }
        },

        processGroup: function(group) {

        },

        hasSubView: function(record) {
            if(record.groupRow) {
                return false;
            } else if(typeof this.delegate.hasSubView === 'function') {
                return this.delegate.hasSubView(record);
            }
        }
    };

    return GroupingDataSource;

});
