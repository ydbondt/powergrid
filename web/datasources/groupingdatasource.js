define(['../utils'], function (utils) {
    function GroupingDataSource(delegate) {
        var self = this;
        this.delegate = delegate;
        for (var x in this.delegate) {
            if (!this[x] && (typeof this.delegate[x] === "function")) {
                this[x] = this.delegate[x].bind(this.delegate);
            }
        }
        if (delegate.isReady()) {
            this.load();
        }

        $(delegate).on("datachanged", function (event, data) {
            self.load();
            $(self).trigger(event.type, [data]);
        });

        $(delegate).on("dataloaded", this.load.bind(this));
        this.groups = [];
    }

    GroupingDataSource.prototype = {
        load: function () {
            this.parentByIdMap = {};
            this.updateView();
        },

        updateView: function () {
            var ds = this;
            var groupRows = this.groupRows = {};
            var rowToGroupMap = {};

            function group(nodes, groupings, parentGroupId, level) {
                if (groupings && groupings.length) {
                    var groupMap = {},
                        groups = [],
                        col = groupings[0],
                        f = col.groupProjection && col.groupProjection(nodes) || function (v) {
                                return v;
                            },
                        nextGroupings = groupings.slice(1);
                    for (var x = 0, l = nodes.length; x < l; x++) {
                        var baseValue = utils.getValue(nodes[x], col.key);
                        var g = f(baseValue);
                        var r = groupMap[g];
                        if (!r) {
                            groups.push(groupMap[g] = r = {
                                groupRow: true,
                                id: parentGroupId + x + ":",
                                description: g,
                                children: [],
                                _groupColumn: col,
                                _groupLevel: level,
                                parent: parentGroupId
                            });

                            r[col.key] = baseValue;
                        }
                        r.children.push(nodes[x]);
                        ds.parentByIdMap[nodes[x].id] = r;
                        groupRows[r.id] = r;
                    }

                    for (var x = 0, l = groups.length; x < l; x++) {
                        groups[x].recordCount = ds.groupRecordCount(groups[x]);
                        groups[x].children = group(groups[x].children, nextGroupings, groups[x].id, level + 1);
                        ds.processGroup(groups[x]);
                    }

                    return groups;
                } else {
                    for (var x = 0, l = nodes.length; x < l; x++) {
                        rowToGroupMap[nodes[x].id] = parentGroupId;
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

        groupRecordCount(group) {
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

        isReady: function () {
            return this.view !== undefined;
        },

        assertReady: function () {
            if (!this.isReady()) {
                throw "Datasource not ready yet";
            }
        },

        parent: function (row) {
            return row.parent || this.parentByIdMap[row.id].id;
        },

        hasChildren: function (row) {
            var groupRow = this.groupRows[row.id];
            if (groupRow) {
                return groupRow.children && groupRow.children.length > 0;
            } else {
                return false;
            }
        },

        buildTree: function () {
            return this.getData();
        },

        processGroup: function(group) {

        }
    };

    return GroupingDataSource;

});
