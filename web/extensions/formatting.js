/**
 * Enables formatting of cells.
 *
 * pluginOptions should map formatter names to actual formatter implementation.
 *  pluginOptions: {
 *      dateFormatter: function(value) { return value.toUTCString()}
 *  }
 *
 *  A formatter function accepts 3 parameters:
 *   - value: the value to be formatted
 *   - record: the current record
 *   - column: the current columnsettings
 *
 *  Two additional column options are supported:
 *   - formatter: the formatter name to use (looked up in pluginoptions) or the formatter function
 *   - format: Column specific options for the formatter
 *
 */
define(['../override', '../jquery', '../utils'], function(override, $) {
    "use strict";

    return function(grid, pluginOptions) {
        override(grid, function($super) {
            return {
                getCellTextValue: function (value, record, column) {
                    var formatter = column.formatter;
                    if (typeof column.formatter === "string") {
                        formatter = pluginOptions[column.formatter];
                    } else if(column.formatter == null && column.type) {
                        formatter = pluginOptions[column.type];
                    }

                    if (formatter) {
                        return formatter.apply(grid, [value, record, column]);
                    } else {
                        return $super.getCellTextValue.apply(this, arguments);
                    }
                }
            }
        });
    };
});
