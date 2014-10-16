define(['override', 'vein', 'utils'], function(override, vein, utils) {
    "use strict";
    
    return {
        loadFirst: ['filtering'],
        init: function(grid, pluginOptions) {
            override(grid, function($super) {
                return {
                    init: function() {
                        $super.init();

                        var cells, oX, oY, dragstarted, tracking, col, startX, idx, offset, header, key, dragTarget, offsetX, offsetY;

                        function startDrag(event) {
                            if($(this).parents(".powergrid")[0] !== grid.container[0]) return;
                            header = this;
                            key = $(header).attr("data-column-key");
                            if(!key) return;
                            idx = utils.findInArray(grid.options.columns, function(col) { return col.key == key; });
                            col = grid.options.columns[idx];
                            
                            var positions = grid.adjustColumnPositions();
                            startX = positions[idx];

                            oX = event.pageX;
                            oY = event.pageY;
                            
                            offsetX = event.offsetX;
                            offsetY = event.offsetY;

                            offset = event.offsetX || event.originalEvent.layerX || 0;

                            if(offset <= header.offsetWidth - 8 && offset >= 8) {
                                cells = $(grid.target).find("> .powergrid > .pg-rowgroup > .pg-container > .pg-row > .pg-column" + key + ", > .powergrid > .pg-rowgroup > .pg-container > .pg-row > .pg-inner-row > .pg-column" + key + ", > .powergrid > .pg-columnheaders > .pg-container > .pg-row > .pg-column" + key + ""); //$(grid.target).find(".pg-column" + key);

                                tracking = true;
                                dragstarted = false;

                                event.stopPropagation();
                            }
                        }
                        
                        function doDrag(event) {
                            if(!tracking) return;
                            
                            var dX = event.pageX - oX, dY = event.pageY - oY;

                            if(!dragstarted) {
                                var dragevent = new $.Event('columndragstart', {
                                    idx: idx,
                                    column: col,
                                    offsetX: offsetX,
                                    offsetY: offsetY
                                });
                                grid.trigger(dragevent);
                                
                                if(event.isDefaultPrevented()) {
                                    return;
                                }
                                
                                if(dX * dX + dY * dY > 400) {
                                    cells.addClass("pg-columndragging");
                                    dragstarted = true;
                                    oX = event.pageX;
                                } else {
                                    return;
                                }
                            }

                            var newX = (startX + event.pageX - oX), newY = event.pageY - oY, outOfViewPort, resetCellStyles;
                            
                            if(pluginOptions.allowDragOutsideOfViewPort) {
                                var element = utils.elementFromPoint(event.pageX, event.pageY, ".pg-column-dragtarget");
                                
                                if(element && element !== dragTarget) {
                                    var event = new $.Event("columndragenter", {
                                        column: col
                                    });
                                
                                    element.trigger(event);
                                    
                                    if(dragTarget) dragTarget.removeClass("pg-column-dragtarget-focussed");
                                    else resetCellStyles = true;
                                    
                                    if(!event.isDefaultPrevented()) {
                                        element.addClass("pg-column-dragtarget-focussed");
                                        dragTarget = element;
                                        outOfViewPort = true;
                                    }
                                } else if(dragTarget) {
                                    dragTarget.trigger("columndragexit");
                                    dragTarget.removeClass("pg-column-dragtarget-focussed");
                                    dragTarget = null;
                                }
                            }
                            
                            grid.trigger(new $.Event("columndragmove", {
                                column: col, x: newX, y: newY, outOfViewPort: outOfViewPort
                            }));

                            requestAnimationFrame(function() {
                                if(!tracking) return;
                                if(outOfViewPort) {
                                    if(resetCellStyles) {
                                        cells.css({ "transform": "" });
                                    }
                                    $(header).css({ "transform": "translate(" + (newX - col.offsetLeft) + "px, " + newY + "px)" });
                                } else {
                                    cells.css({ "transform": "translate(" + (newX - col.offsetLeft) + "px)" });
                                }
                            });
                        }
                    
                        function endDrag(event) {
                            tracking = false;
                            if(dragstarted) {
                                if(dragTarget) {
                                    dragTarget.trigger(new $.Event("columndropped", {
                                        column: col
                                    }));
                                    dragTarget.removeClass("pg-column-dragtarget-focussed");
                                    dragTarget = null;
                                }
                                
                                if(event.type === 'mouseup' && ($(event.target).hasClass('pg-columnheader') || $(event.target).parents(".pg-columnheader").length)) return;
                                
                                grid.trigger(new $.Event("columndragend"));
                                
                                dragstarted = false;
                                
                                $(grid.baseSelector + " .pg-column" + col.key).css({ "transform": "" });
                                cells.removeClass("pg-columndragging");
                                
                                event.preventDefault();
                                event.stopImmediatePropagation();
                            }
                            
                            // clean up
                            cells = null;
                            col = null;
                            header = null;
                            key = null;
                        }
                        
                        this.target
                            .on("mousedown", ".pg-columnheader", startDrag)
                            .on("click", ".pg-columnheader", endDrag);
                        
                        $(window)
                            .on("mousemove", doDrag)
                            .on("mouseup", endDrag);
                    }
                }
            });
        }
    };
});