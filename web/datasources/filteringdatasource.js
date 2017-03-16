define(['../utils'], function (utils) {
    function FilteringDataSource(delegate) {
        var self = this;
        this.delegate = delegate;

        $(delegate).on("dataloaded", function (event) {
            self.reload();
            $(self).trigger("dataloaded");
        }).on("datachanged", function (event, data) {
            self.reload();
            $(self).trigger("datachanged", [data]);
        });

        if (delegate.isReady()) {
            this.reload();
        }

        utils.passthrough(this, delegate, ['sort','commitRow','startEdit','rollbackRow','replace']);
    }

    FilteringDataSource.prototype = {
        view: null,

        isReady: function () {
            return this.view != null;
        },

        reload: function () {
            this.delegate.assertReady();
            var data = this.delegate.getData();
            if(this.filter) {
                this.view = data.filter(filter);
            } else {
                this.view = data;
            }
        },

        recordCount: function () {
            this.assertReady();
            return this.view.length;
        },

        getData: function (start, end) {
            this.assertReady();
            if (start === undefined && end === undefined) return this.view;
            if (start === undefined) start = 0;
            if (end === undefined) end = this.recordCount();
            return this.view.slice(start, end);
        },

        setValue: function (rowId, key, value) {
            this.delegate.setValue(rowId, key, value);
        },

        assertReady: function () {
            if (!this.isReady()) throw Error("Datasource not ready yet");
        },

        buildStatistics: function () {
            return {
                actualRecordCount: this.delegate && this.delegate.recordCount()
            };
        },

        applyFilter: function (settings, filter) {
            var oldview = this.view,
                view = this.delegate.getData().filter(filter);
            this.view = view;
            this.filter = filter;
            this.settings = settings;
            $(this).trigger('datachanged', {data: view, oldData: oldview});
        },

        getRecordById: function (id) {
            return this.delegate.getRecordById(id);
        }
    };

    return FilteringDataSource;
});
