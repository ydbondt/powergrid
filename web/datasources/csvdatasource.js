define(["../jquery", "../utils"], function($, utils) {
    "use strict";

    function CSVDataSource(settings) {
        utils.Evented.apply(this);

        this.settings = settings;
        this.load();
        this.data = undefined;
    }

    CSVDataSource.prototype = {
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
            $.ajax(this.settings.url)
                .done(function(data) {
                    var lines = data.split(/[\n\r]+/);
                    self.data = lines.filter(function(line) { return line.length > 0; }).map(function(line, lineIdx) {
                        var idx=0, record = [];
                        while(idx < line.length) {
                            if(line.charAt(idx) == '"') {
                                var end = idx;
                                while(end < line.length) {
                                    end = line.indexOf('"', end + 1);
                                    if(end == -1) {
                                        throw Error("Unexpected end of line");
                                    }
                                    if(end + 1 == line.length || line.charAt(end + 1) == ",") {
                                        record.push(line.substring(idx + 1, end));
                                        idx = end + 2;
                                        break;
                                    }
                                }
                            } else {
                                var end = line.indexOf(',', idx);
                                if(end == -1) {
                                    end = line.length;
                                }
                                var content = line.substring(idx, end);
                                if(content.match(/^[0-9]+\.[0-9]+$/)) {
                                    content = parseFloat(content);
                                } else if(content.match(/^[0-9]*$/)) {
                                    content = parseInt(content);
                                }
                                record.push(content);
                                idx = end + 1;
                            }
                        }
                        return record;
                    });
                    self.trigger("dataloaded");
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

    return CSVDataSource;
});
