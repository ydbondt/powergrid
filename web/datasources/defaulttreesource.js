define([], function() {
    function DefaultTreeSource(delegate) {
        this.delegate = delegate;

        for (var x in this.delegate) {
            if (!this[x] && (typeof this.delegate[x] === "function")) {
                this[x] = this.delegate[x].bind(this.delegate);
            }
        }

        if (delegate.isReady()) {
            this.load();
        }

        $(delegate).on("dataloaded", this.load.bind(this));

        $(delegate).on("datachanged editabilitychanged validationresultchanged", function (event, data) {
            $(self).trigger(event.type, [data]);
        });
    }

    DefaultTreeSource.prototype = {
        isReady: function() {
            return this.tree !== undefined;
        },

        load: function () {
            var self = this;
            if (this.delegate) {
                if (this.delegate.buildTree) {
                    this.tree = this.delegate.buildTree();
                    this.tree.forEach(function(item) {
                        self.nodesPerId[item.id] = item;
                    });
                    $(this).trigger('dataloaded');
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
                    var children = arr[x].children;
                    if (children) {
                        sort(children);
                    }
                }
            }

            sort(this.tree);

            $(this).trigger('dataloaded');
        },

        buildTree: function (data) {
            var rootNodes = [],
                nodesPerId = {};

            for (var x = 0, l = data.length; x < l; x++) {
                var r = data[x];
            }

            for (var x = 0, l = data.length; x < l; x++) {
                var record = data[x],
                    node = {
                        record: record,
                        children: []
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
            $(this).trigger('dataloaded');
        },

        getRootNodes: function() {
            return this.tree;
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

        children: function (row) {
            var node = this.nodesPerId[row.id];
            return node.children;
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

        statistics: function () {
            return this._statistics;
        }
    };

    return DefaultTreeSource;
});
