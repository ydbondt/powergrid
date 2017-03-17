define(['../utils'], function (utils) {
    function SummarizingDataSource(delegate, summaryFactory) {
        var self = this;
        this.delegate = delegate;
        this.summaryFactory = summaryFactory;

        $(delegate).on("dataloaded", function (event) {
            self.reload();
            $(self).trigger("dataloaded");
        }).on("datachanged", function (event, data) {
            self.reload();
            $(self).trigger("datachanged", [data]);
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
                return [this.getSummaryRow()];
            } else if((start === undefined && end === undefined) || (end !== undefined && end > rc)) {
                return this.delegate.getData(start, end).concat([this.getSummaryRow()]);
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
            sr.id = "summary_row";
            return sr;
        }
    };

    return SummarizingDataSource;
});
