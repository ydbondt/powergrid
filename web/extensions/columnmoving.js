define(['override', 'vein', 'utils'], function(override, vein, utils) {
    "use strict";
    
    function updateStyle(selector, style) {
        $(selector).css(style);
        //vein.inject(selector, style);
    }
    
    return {
        loadFirst: ['filtering'],
        init: function(grid, pluginOptions) {
            override(grid, function($super) {
                return {
                    init: function() {
                        $super.init();

                        var cells, oX, dragstarted, tracking, start, end, col, startX, positions, idx, offset, header, key, w;

                        this.target.on("mousedown", ".pg-columnheader", function(event) {
                            header = event.target;
                            key = $(header).attr("data-column-key");
                            if(!key) return;
                            idx = utils.findInArray(grid.options.columns, function(col) { return col.key == key; });
                            col = grid.options.columns[idx];
                            w = col.width;

                            oX = event.pageX;

                            offset = event.offsetX || event.originalEvent.layerX || 0;

                            if(offset <= header.offsetWidth - 8 && offset >= 8) {
                                positions = grid.adjustColumnPositions();
                                startX = positions[idx];

                                if(idx < grid.options.frozenColumnsLeft) {
                                    start = 0; end = grid.options.frozenColumnsLeft;
                                } else if(idx > positions.length - grid.options.frozenColumnsRight) {
                                    start = positions.length - grid.options.frozenColumnsRight;
                                    end = positions.length;
                                } else {
                                    start = grid.options.frozenColumnsLeft;
                                    end = positions.length - grid.options.frozenColumnsRight;
                                }

                                cells = $(grid.target).find(".pg-column" + key);

                                tracking = true;
                                dragstarted = false;

                                event.stopPropagation();
                            }
                        }).on("mousemove", function(event) {
                            if(!tracking) return;

                            if(!dragstarted) {
                                if(Math.abs(event.pageX - oX) > 20) {
                                    cells.addClass("pg-columndragging");
                                    dragstarted = true;
                                    oX = event.pageX;
                                } else {
                                    return;
                                }
                            }

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
                                updateStyle(grid.baseSelector + " .pg-column" + col.key, { "left": newPos + "px" });
                            });
                        }).on("click", ".pg-columnheader", function(event) {
                            tracking = false;
                            if(dragstarted) {
                                dragstarted = false;
                                updateStyle(grid.baseSelector + " .pg-column" + col.key, { "left": "" });
                                vein.inject(grid.baseSelector + " .pg-column" + col.key, { "left": positions[idx] + "px" });
                                cells.removeClass("pg-columndragging");
                                event.preventDefault();
                                event.stopImmediatePropagation();
                            }
                        });
                    }
                }
            });
        }
    };
    
});