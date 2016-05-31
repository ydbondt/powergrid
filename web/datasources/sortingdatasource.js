define(['util'], function(util) {
    function SortingDataSource(delegate) {
        var self = this;
        this.delegate = delegate;

        if(typeof delegate.applyFilter === 'function') {
            this.applyFilter = delegate.applyFilter.bind(delegate);
        }

        $(delegate).on("dataloaded", function(event) {
            self.reload();
            $(self).trigger("dataloaded");
        }).on("datachanged", function(event, data) {
            self.reload();
            $(self).trigger("datachanged", [data]);
        });

        if(delegate.isReady()) {
            this.reload();
        }
    }

    SortingDataSource.prototype = {
        view: null,

        isReady: function() {
            return this.view != null;
        },

        reload: function() {
            this.delegate.assertReady();
            if(this.comparator) {
                this.view = this.delegate.getData().sort(this.comparator);
            } else {
                this.view = this.delegate.getData()
            }
        },

        recordCount: function() {
            this.assertReady();
            return this.view.length;
        },

        getData: function(start, end) {
            this.assertReady();
            if(!start && !end) return this.view;
            if(!start) start = 0;
            if(!end) end = this.recordCount();
            return this.view.slice(start, end);
        },

        getValue: function(rowId, key) {
            return this.delegate.getValue(rowId, key);
        },

        setValue: function(rowId, key, value) {
            this.delegate.setValue(rowId, key, value);
        },

        assertReady: function() {
            if(!this.isReady()) throw Error("Datasource not ready yet");
        },

        buildStatistics: function() {
            return this.delegate.buildStatistics();
        },

        getRecordById: function(id) {
            return this.delegate.getRecordById(id);
        },

        sort: function(comparator) {
            this.comparator = comparator;
            this.reload();
            $(this).trigger("dataloaded");
        }
    };

    return SortingDataSource;

});
