define(["../jquery", "../utils"], function($, utils) {
    "use strict";
    
    function ArrayDataSource(data, delay) {
        if(delay) {
            setTimeout(this.load.bind(this, data), delay);
        } else {
            if(data) {
                this.load(data);
            }
        }
    }
    
    ArrayDataSource.prototype = {
        load: function(data) {
            if(data !== undefined) {
              this.data = data;
            }

            for(var x = 0, l = this.data.length;x<l;x++) {
                if(this.data[x].id === undefined) {
                    this.data[x].id = x;
                }
            }

            this.ready = true;
            $(this).trigger("dataloaded");
        },
        
        recordCount: function() {
            this.assertReady();
            return this.data.length;
        },

        getRowByIndex: function(idx) {
            this.assertReady();
            return this.data[idx];
        },

        getRecordById: function(id) {
            this.assertReady();
            for(var x=0,l=this.data.length; x<l; x++) {
                if(this.data[x].id == id) return this.data[x];
            }
        },

        getData: function(start, end) {
            this.assertReady();
            if(start === undefined && end === undefined) return this.data;
            if(start === undefined || start === null) start = 0;
            if(end === undefined) end = this.recordCount();
            return this.data.slice(start, end);
        },

        setValue: function(rowId, key, value) {
            this.assertReady();
            utils.setValue(this.getRecordById(rowId), key, value);
            $(this).trigger("datachanged", { values: [ { id: rowId, key: key } ] });
        },

        assertReady: function() {
            if(!this.isReady()) throw Error("Datasource not ready yet");
        },
        
        isReady: function() {
            return this.ready;
        },

        sort: function(comparator) {
            this.assertReady();
            this.data.sort(comparator);
            $(this).trigger("dataloaded");
        },

        replace: function(record) {
            var data = this.data,
                existingRow = data.find(function(r) { return r.id == record.id; });
            if(existingRow !== undefined) {
                data.splice(data.indexOf(existingRow), 1, record);
                $(this).trigger("datachanged", { rows: [record] })
            }
        }
    };
    
    return ArrayDataSource;
});
