define(['override', 'utils', 'jquery'], function(override, utils, $) {
    
    "use strict";
    
    return function(grid, pluginOptions) {
        override(grid, function($super) {
            return {
                renderHeaderCell: function() {
                    var h = $super.renderHeaderCell.apply(this, arguments);
                    var handle = $("<div class='pg-resizehandle'></div>");
                    h.append(handle);
                    return h;
                },
                
                init: function() {
                    $super.init();
                    var grid = this;
                    this.target.on("mousedown", ".pg-resizehandle", function(event) {
                        var header = event.target.parentNode,
                            key = $(header).attr("data-column-key"),
                            idx = utils.findInArray(grid.options.columns, function(col) { return col.key == key; }),
                            col = grid.options.columns[idx],
                            oX = event.pageX,
                            w = col.width;
                        
                        var offset = event.offsetX || event.originalEvent.layerX || 0;
                        
                        if(idx < grid.options.columns.length - grid.options.frozenColumnsRight) { // it's not a right frozen column
                            
                            $(document).on("mousemove.columnTracking", function(event) {
                                col.width = Math.max(0, event.pageX - oX + w);
                                grid.adjustWidths();
                                grid.adjustColumnPositions();
                            }, utils.handleEventInAnimationFrame).on("mouseup.columnTracking", function(event) {
                                $(document).off("mousemove.columnTracking").off("mouseup.columnTracking");
                            }, utils.handleEventInAnimationFrame);
                            
                            event.stopPropagation();
                            
                        } else if(idx >= grid.options.columns.length - grid.options.frozenColumnsRight) {
                            $(document).on("mousemove.columnTracking", function(event) {
                                col.width = Math.max(0, oX - event.pageX + w);
                                grid.adjustWidths();
                                grid.adjustColumnPositions();
                            }, utils.handleEventInAnimationFrame).on("mouseup.columnTracking", function(event) {
                                $(document).off("mousemove.columnTracking").off("mouseup.columnTracking");
                            }, utils.handleEventInAnimationFrame);
                            
                            event.stopPropagation();
                        }
                    });
                }
            }
        });
    };
    
});