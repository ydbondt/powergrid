define(['../utils'], function (utils) {
    function SummarizingDataSource(delegate, summaryFactory) {
        utils.Evented.apply(this);

        var self = this;
        this.delegate = delegate;
        this.summaryFactory = summaryFactory;

        delegate.on("dataloaded", function() {
            self.trigger("dataloaded");
        });

        delegate.on("datachanged", function (data) {
            self.trigger("datachanged", data);
        });

        utils.passthrough(this, delegate, ['sort','group','applyFilter','commitRow','startEdit','rollbackRow','replace']);
    }

    SummarizingDataSource.prototype = {
        view: null,

        isReady: function () {
            return this.delegate.isReady();
        },

        reload: function () {
            this.delegate.reload();
        },

        recordCount: function () {
            return this.delegate.recordCount() + 1;
        },

        getData: function (start, end) {
            var rc = this.delegate.recordCount();
            if(start == rc) {
                var s = this.getSummaryRow();
                if(typeof s.then === 'function') {
                    return s.then(function(r) {
                        return [r];
                    });
                } else {
                    return [r];
                }
            } else if((start === undefined && end === undefined) || (end !== undefined && end > rc)) {
                var r = this.delegate.getData(start, end), s = this.getSummaryRow();
                if(typeof r.then === 'function' || typeof s.then === 'function') {
                    return Promise.all([r,s]).then(function(r) {
                        return r[0].concat([r[1]]);
                    });
                } else {
                    return r.concat([self.getSummaryRow()]);
                }
            } else {
                return this.delegate.getData(start, end);
            }
        },

        setValue: function (rowId, key, value) {
            this.delegate.setValue(rowId, key, value);
        },

        assertReady: function () {
            this.delegate.assertReady();
        },

        getRecordById: function (id) {
            if(id == "summary_row") {
                return this.getSummaryRow();
            } else {
                return this.delegate.getRecordById(id);
            }
        },

        getSummaryRow: function() {
            var sr;
            if(this.summaryFactory) {
                sr = this.summaryFactory(this.delegate);
            } else if(this.delegate.getSummaryRow) {
                sr = this.delegate.getSummaryRow();
            } else {
                throw "To create a summary row either implement getSummaryRow() on the datasource or pass a summaryFactory to the 'summarize' options";
            }
            if(typeof sr.then === 'function') {
                return sr.then(function(sr) {
                    sr.id = "summary_row";
                    return sr;
                });
            } else {
                sr.id = "summary_row";
                return sr;
            }
        }
    };

    return SummarizingDataSource;
});
