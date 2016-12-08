define(['../jquery','../override', '../utils', '../promise'], function($, override, utils, Promise) {
    "use strict";

    return function(grid, pluginOptions) {
        override(grid, function() {

            return {

                export: {
                    csv: function (fn) {
                        var self = this;
                        return this.toCsvString().then(function (csv) {
                            return self.toFile(csv, fn);
                        });
                    },

                    toCsvString: function () {
                        var self = this;
                        return new Promise(function (resolve) {

                            var ds = grid.dataSource;
                            var header = [], columnKeys = [], csv = "";

                            grid.options.columns.forEach(function (col) {
                                header.push(self.format(col.title));
                                columnKeys.push(col.key);
                            });

                            csv += header.join(",");
                            csv += "\n";

                            ds.getData().forEach(function (row) {
                                var values = [];
                                columnKeys.forEach(function (key) {
                                    var val = utils.getValue(row, key);
                                    values.push(((val) ? self.format(val) : ""));
                                })
                                csv += values.join(",");
                                csv += "\n";
                            });

                            resolve(csv);

                        });
                    },

                    format: function (val) {
                        val = val + "";
                        return "\"" + val.replace(/[\"]/g, '\\"').replace(/[\,]/g, '\\,') + "\"";
                    },

                    toFile: function (csv, fn) {
                        return new Promise(function (resolve) {
                            resolve({stringValue: csv, filename: fn});
                        });

                    }
                }
            }

        });
    };
    
});
