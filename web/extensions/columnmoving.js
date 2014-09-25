define(['override', 'vein', 'utils'], function(override, vein, utils) {
    "use strict";
    
    function updateStyle(selector, style) {
        $(selector).css(style);
        //vein.inject(selector, style);
    }
    
    return function(grid, pluginOptions) {
        override(grid, function($super) {
            return {
                init: function() {
                    $super.init();
                    var grid = this;
                    this.target.on("mousedown", ".columnheader", function(event) {
                        var header = event.target,
                            key = $(header).attr("data-column-key"),
                            idx = utils.findInArray(grid.options.columns, function(col) { return col.key == key; }),
                            col = grid.options.columns[idx],
                            oX = event.pageX,
                            w = col.width;
                        
                        var offset = event.offsetX || event.originalEvent.layerX || 0;
                        
                        if(offset <= header.offsetWidth - 8 && offset >= 8) {
                            var positions = grid.adjustColumnPositions();
                            var startX = positions[idx];

                            var start,end;
                            if(idx < grid.options.frozenColumnsLeft) {
                                start = 0; end = grid.options.frozenColumnsLeft;
                            } else if(idx > positions.length - grid.options.frozenColumnsRight) {
                                start = positions.length - grid.options.frozenColumnsRight;
                                end = positions.length;
                            } else {
                                start = grid.options.frozenColumnsLeft;
                                end = positions.length - grid.options.frozenColumnsRight;
                            }

                            var cells = $(grid.target).find(".column" + key);

                            cells.addClass("columndragging");
                            
                            var tracking = true;
                            
                            $(document).on("mousemove.columnTracking", function(event) {
                                if(!tracking) return;
                                var newPos = (startX + event.pageX - oX);
                                
                                // find the new index for the column
                                for(var newIdx = start, cw=0; newIdx < end; newIdx++) {
                                    if(idx!=newIdx) cw += grid.options.columns[newIdx].width;
                                    if(cw >= newPos) break;
                                }
                                
                                if(newIdx > idx) newIdx--;
                                
                                if(newIdx < start) newIdx = start;
                                
                                if(newIdx != idx) {
                                    var c = grid.options.columns.splice(idx,1);
                                    grid.options.columns.splice(newIdx, 0, c[0]);
                                    positions = grid.adjustColumnPositions();
                                    idx=newIdx;
                                }
                                
                                requestAnimationFrame(function() {
                                    if(!tracking) return;
                                    updateStyle(grid.baseSelector + " .column" + col.key, { "left": newPos + "px" });
                                });
                            }).on("mouseup.columnTracking", function(event) {
                                tracking = false;
                                $(document).off("mousemove.columnTracking").off("mouseup.columnTracking");
                                updateStyle(grid.baseSelector + " .column" + col.key, { "left": "" });
                                vein.inject(grid.baseSelector + " .column" + col.key, { "left": positions[idx] + "px" });
                                cells.removeClass("columndragging");
                            }, utils.handleEventInAnimationFrame);
                            
                            event.stopPropagation();
                        }
                    });
                }
            }
        });
    };
    
});