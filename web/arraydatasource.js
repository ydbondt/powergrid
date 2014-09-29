define(["jquery"], function($) {
    "use strict";
    
    function ArrayDataSource(data) {
        this.data = data;
    }
    
    ArrayDataSource.prototype = {
        recordCount: function() {
            return this.data.length;
        },

        getRowByIndex: function(idx) {
            return this.data[idx];
        },

        getRecordById: function(id) {
            for(var x=0,l=this.data.length; x<l; x++) {
                if(this.data[x].id == id) return this.data[x];
            }
        },

        getData: function(start, end) {
            if(!start && !end) return this.data;
            if(!start) start = 0;
            if(!end) end = this.recordCount();
            return this.data.slice(start, end);
        },

        setValue: function(rowIdx, key, value) {
            this.data[rowIdx][key] = value;
        },

        isReady: function() {
            return true;
        }
    };
    
    return ArrayDataSource;
});