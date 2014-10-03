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
                    var header, key, idx, col, oX, w, offset, resizing=0;
                    
                    
                    this.target.on("mousedown", ".pg-resizehandle", function(event) {
                        header = event.target.parentNode;
                        key = $(header).attr("data-column-key");
                        idx = utils.findInArray(grid.options.columns, function(col) { return col.key == key; });
                        col = grid.options.columns[idx];
                        oX = event.pageX;
                        w = col.width;
                        
                        offset = event.offsetX || event.originalEvent.layerX || 0;
                        
                        if(idx < grid.options.columns.length - grid.options.frozenColumnsRight) { // it's not a right frozen column
                            resizing = 1;
                        } else if(idx >= grid.options.columns.length - grid.options.frozenColumnsRight) {
                            resizing = -1;
                        }
                    }).on("mousemove", function(event) {
                        if(resizing == 1) {
                            col.width = Math.max(0, event.pageX - oX + w);
                        } else if(resizing == -1) {
                            col.width = Math.max(0, oX - event.pageX + w);
                        }
                        grid.adjustWidths();
                        grid.adjustColumnPositions();
                    }).on("click", ".pg-columnheader", function(event) {
                        resizing = 0;
                        event.preventDefault();
                        event.stopPropagation();
                    });
                }
            }
        });
    };
    
});