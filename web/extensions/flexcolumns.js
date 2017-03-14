/**
 * Enables flexible sizing of columsn.
 *
 * Usage:
 * columns: [ { key: ..., flex: <growfactor> }, ... },
 * extensions: { flexcolumns: true }
 */
define(['../override', '../jquery', '../utils'], function(override, $) {
    "use strict";

    return function(grid, pluginOptions) {
        override(grid, function($super) {
            return {
                columnWidth: function(start, end, transformation) {
                    // calculate free space
                    var totalFlex = this.getVisibleColumns().reduce(function(totalFlex, column) {
                            return totalFlex + (column.flex || 0);
                        }, 0);

                    if(totalFlex == 0) {
                        return $super.columnWidth(start, end, transformation);
                    } else {
                        var totalColumnWidth = $super.columnWidth(0, this.columnCount()),
                            gridWidth = this.viewportWidth(),
                            spareWidth = gridWidth - totalColumnWidth;

                        if(spareWidth > 0) {
                            var widthPerFlex = spareWidth / totalFlex;

                            return $super.columnWidth(start, end, function(column, width) {
                                if(column.flex) {
                                    width += widthPerFlex * column.flex;
                                }
                                if(transformation) {
                                    width = transformation(column, width);
                                }
                                return width;
                            });
                        } else {
                            return $super.columnWidth(start, end, transformation);
                        }
                    }
                },

                resize: function() {
                    this.queueAdjustColumnPositions(false);
                },

                flexcolumns: {
                    deflex: function() {
                        var columns = grid.options.columns;
                        for (var x = 0, l = columns.length; x < l; x++) {
                            if (columns[x].flex) {
                                columns[x].width = grid.columnWidth(x);
                                columns[x].flex = 0;
                            }
                        }
                    }
                }
            }
        });
    };
});
