/**
 * Allows rows to have different heights
 */
define(['../override', '../jquery', '../utils'], function(override, $) {
    "use strict";

    return function(grid, pluginOptions) {
        override(grid, function($super) {
            return {
                rowHeight: function(start, end) {
                    var self = this;
                    return this.dataSource.getData(start, arguments.length > 1 ? end : start + 1).reduce(function(height, row) {
                        return height + self.variableRowHeight(row)
                    }, 0);
                },

                variableRowHeight: function(row) {
                    if(typeof pluginOptions.variableRowHeight !== 'function') {
                        throw "variableRowHeight plugin requires 'variableRowHeight' function in plugin options";
                    }
                    return pluginOptions.variableRowHeight.apply(this, [row]);
                }
            }
        });
    };
});
