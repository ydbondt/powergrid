/**
 * Enables aligning of cell contents.
 *
 * Usage: 
 */
define(['../override', 'jquery', '../utils'], function(override, $) {
    "use strict";

    return function(grid, pluginOptions) {
        override(grid, function($super) {
            return {
                renderCell: function renderCell(record, column, rowIdx, columnIdx) {
                    var cell = $super.renderCell(record, column, rowIdx, columnIdx);
                    if(column.align) {
                        cell.addClass("pg-align-" + column.align);
                    }
                    return cell;
                }
            }
        });
    };
});