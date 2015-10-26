define(["jquery", "utils"], function($, utils) {
    "use strict";
    
    function ArrayDataSource(data, delay) {
        this.data = data;
        if(delay) {
            setTimeout(this.load.bind(this), delay);
        } else {
            this.load();
        }
    }
    
    ArrayDataSource.prototype = {
        load: function(data) {
            if(data !== undefined) {
              this.data = data;
            }

            $(this).trigger("dataloaded");
            for(var x = 0, l = this.data.length;x<l;x++) {
                if(this.data[x].id === undefined) {
                    this.data[x].id = x;
                }
            }

            this.ready = true;
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
            if(!start && !end) return this.data;
            if(!start) start = 0;
            if(!end) end = this.recordCount();
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
        }
    };
    
    return ArrayDataSource;
});