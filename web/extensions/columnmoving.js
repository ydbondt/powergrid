define(['override', 'vein', 'utils'], function(override, vein, utils) {
    "use strict";
    
    function updateStyle(selector, style) {
        $(selector).css(style);
        //vein.inject(selector, style);
    }
    
    return {
        loadFirst: ['filtering'],
        requires: {
            dragging: {}
        },
        init: function(grid, pluginOptions) {
            var start, end, idx, oidx, startconfig, wasOutOfBounds;
            
            grid.on("columndragstart", function(event) {
                idx = event.idx;
                oidx = idx;
                
                if(idx < grid.options.frozenColumnsLeft) {
                    start = 0; end = grid.options.frozenColumnsLeft;
                } else if(idx > grid.options.columns.length - grid.options.frozenColumnsRight) {
                    start = grid.options.columns.length - grid.options.frozenColumnsRight;
                    end = grid.options.columns.length;
                } else {
                    start = grid.options.frozenColumnsLeft;
                    end = grid.options.columns.length - grid.options.frozenColumnsRight;
                }
                
                startconfig = $.extend([], grid.options.columns);
                wasOutOfBounds = false;
            }).on("columndragmove", function(event, ui) {
                if(event.outOfViewPort) {
                    if(!wasOutOfBounds) {
                        wasOutOfBounds = true;
                        grid.options.columns = startconfig;
                        idx = oidx;
                        grid.adjustColumnPositions();
                    }
                } else {
                    var newPos = event.x;

                    // find the new index for the column
                    for(var newIdx = start, cw=0; newIdx < end; newIdx++) {
                        if(idx!=newIdx) cw += grid.options.columns[newIdx].width;
                        if(cw > newPos) break;
                    }

                    if(newIdx > idx) newIdx--;

                    if(newIdx < start) newIdx = start;

                    if(newIdx != idx) {
                        var c = grid.options.columns.splice(idx,1);
                        grid.options.columns.splice(newIdx, 0, c[0]);
                        grid.adjustColumnPositions();
                        idx=newIdx;
                    }
                }
            }).on("columndragend", function(event, ui) {
                startconfig = null;
            });
        }
    };
    
});