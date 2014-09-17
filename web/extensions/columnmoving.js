define(['override', 'vein'], function(override, vein) {
    "use strict";
    
    function findInArray(array, selector) {
        for(var x=0,l=array.length;x<l;x++) {
            if(selector(array[x], x)) return x;
        }
        return -1;
    }
    
    function updateStyle(selector, style) {
        $(selector).css(style);
        //vein.inject(selector, style);
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
                        
                        if(event.offsetX <= event.target.offsetWidth - 8 && event.offsetX >= 8) {
                            var positions = grid.adjustColumnPositions();
                            var startX = positions[idx];
                            var offset = event.offsetX;

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
                            
                            $(document).on("mousemove.columnTracking", requestAnimationFrame, function(event) {
                                var newPos = (startX + event.pageX - oX);
                                
                                // find the new index for the column
                                for(var newIdx = start; newIdx < end; newIdx++) {
                                    if(newPos + offset < positions[newIdx]) break;
                                }
                                newIdx--;
                                if(newIdx < start) newIdx = start;
                                console.log(newIdx, start, end);
                                
                                if(newIdx != idx) {
                                    var c = grid.options.columns.splice(idx,1);
                                    grid.options.columns.splice(newIdx, 0, c[0]);
                                    positions = grid.adjustColumnPositions();
                                    idx=newIdx;
                                }
                                
                                updateStyle(grid.baseSelector + " .column" + col.key, { "left": newPos + "px" });
                            }).on("mouseup.columnTracking", requestAnimationFrame, function(event) {
                                $(document).off("mousemove.columnTracking").off("mouseup.columnTracking");
                                updateStyle(grid.baseSelector + " .column" + col.key, { "left": "" });
                                vein.inject(grid.baseSelector + " .column" + col.key, { "left": positions[idx] + "px" });
                                cells.removeClass("columndragging");
                            });
                        }
                    });
                }
            }
        });
    };
    
});