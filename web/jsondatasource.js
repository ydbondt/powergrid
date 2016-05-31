define(["./jquery"], function($) {
    "use strict";
    
    function JSONDataSource(settings) {
        this.settings = settings;
        this.load();
        this.data = undefined;
    }
    
    JSONDataSource.prototype = {
        assertReady: function() {
            if(!this.isReady()) {
                throw "Datasource not yet ready";
            }
        },
        
        isReady: function() {
            return this.data !== undefined;
        },
        
        load: function() {
            var self = this;
            $.getJSON(this.settings.url)
             .done(function(data) {
                self.data = data.data;
                $(self).trigger("dataloaded");
            });
        },
        
        recordCount: function() {
            this.assertReady();
            return this.data.length;
        },
        
        getData: function(start, end) {
            this.assertReady();
            if(!start && !end) {
                return this.data;
            } else {
                return this.data.slice(start, end);
            }
        },
        
        getRecordById: function(rowId) {
            this.assertReady();
            return this.data.filter(function(e) { return e.id == rowId; })[0];
        },
        
        setValue: function(rowId, key, value) {
            this.assertReady();
            this.getRecordById(rowId)[key] = value;
        }
    };
    
    return JSONDataSource;
});