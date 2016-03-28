/**
 * DragNDrop.js
 * @author Christoph Cantillon
 * Custom implementation of html5 drag and drop events which looks nicer because objects don't get a rectangular background.
 */
define(['./jquery'], function($) {
    "use strict";
    
    function DragNDrop(container, selector, targetselector) {
        var target, oX, oY, possibleTargets, prevDropTarget, oOffset, pX, pY;
        
        $(container).on("mousedown", selector, function(event) {
            target = $(this);
            
            var event = new $.Event("customdragstart", {
                dragee: target,
                pageX: event.pageX,
                pageY: event.pageY
            });
            
            target.trigger(event);
            
            if(!event.isDefaultPrevented()) {
                oX = event.pageX;
                oY = event.pageY;
                oOffset = target.offset();
                possibleTargets = $(container).find(targetselector);
                pX = 0;
                pY = 0;
            } else {
                target = undefined;
            }
        });
        
        $(window).on("mousemove", function(event) {
            if(target !== undefined) {
                var newTarget;
                for(var x = 0,l=possibleTargets.length;x<l;x++) {
                    if(possibleTargets[x] === target[0]) continue;
                    
                    var t = $(possibleTargets[x]),
                        o = t.offset();
                    if(event.pageX >= o.left && event.pageY >= o.top && event.pageX < o.left + t.outerWidth() && event.pageY < o.top + t.outerHeight()) {
                        if(t[0] !== prevDropTarget) {
                            var event = new $.Event("customdragover", {
                                pageX: event.pageX,
                                pageY: event.pageY,
                                dragee: target
                            });

                            t.trigger(event);

                            if(!event.isDefaultPrevented()) {
                                newTarget = t[0];
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                }
                
                prevDropTarget = newTarget;
                
                var nOffset = $(target).offset();
                       
                target.css("transform", "translate(" + (pX = (event.pageX - oX + oOffset.left - nOffset.left + pX)) + "px, " + (pY = (event.pageY - oY + oOffset.top - nOffset.top + pY)) + "px)");
            }
        }).on("mouseup", function(event) {
            if(target !== undefined) {
                if(prevDropTarget !== undefined) {
                    var event = new $.Event("customdrop", {
                        pageX: event.pageX,
                        pageY: event.pageY,
                        dragee: target
                    });
                    
                    $(prevDropTarget).trigger(event);
                }
                
                target.trigger($.Event("customdragend", {
                    pageX: event.pageX,
                    pageY: event.pageY,
                    dragee: target
                }));
                
                target.css("transform", "");
                target = undefined;
            }
        });
    };
    
    return DragNDrop;
    
});