define(['override'], function(override) {
    
    "use strict";
    
    function findInArray(array, selector) {
        for(var x=0,l=array.length;x<l;x++) {
            if(selector(array[x], x)) return x;
        }
        return -1;
    }
    
    function anim(event) {
        requestAnimationFrame(function() {
            event.data(event);
        });
    }
    
    return function(grid, pluginOptions) {
        override(grid, function($super) {
            return {
                renderHeaderCell: function(column, idx) {
                    var h = $super.renderHeaderCell(column, idx);
                    h.attr("data-column-key", column.key);
                    return h;
                },
                
                init: function() {
                    $super.init();
                    var grid = this;
                    this.target.on("mousedown", ".columnheader", function(event) {
                        var header = event.target,
                                key = parseInt($(header).attr("data-column-key")),
                                idx = findInArray(grid.options.columns, function(col) { return col.key == key; }),
                                col = grid.options.columns[idx],
                                oX = event.pageX,
                                w = col.width;
                        
                        if(idx < grid.options.columns.length - grid.options.frozenColumnsRight // it's not a right frozen column
                           && event.offsetX > event.target.offsetWidth - 5) {
                            
                            $(document).on("mousemove.columnTracking", function(event) {
                                col.width = Math.max(0, event.pageX - oX + w);
                                grid.adjustWidths();
                                grid.adjustColumnPositions();
                            }, anim).on("mouseup.columnTracking", function(event) {
                                $(document).off("mousemove.columnTracking").off("mouseup.columnTracking");
                            }, anim);
                            
                        } else if(event.offsetX < 5 && idx >= grid.options.columns.length - grid.options.frozenColumnsRight) {
                            $(document).on("mousemove.columnTracking", function(event) {
                                col.width = Math.max(0, oX - event.pageX + w);
                                grid.adjustWidths();
                                grid.adjustColumnPositions();
                            }, anim).on("mouseup.columnTracking", function(event) {
                                $(document).off("mousemove.columnTracking").off("mouseup.columnTracking");
                            }, anim);
                        }
                    });
                }
            }
        });
    };
    
});