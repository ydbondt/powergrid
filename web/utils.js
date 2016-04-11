(function(define) {
    "use strict";
    
    var animFrameQueue = [], inAnimFrame = false, animFrameRequested = false;
    
    define(['jquery'], function($) {
        return {
            inAnimationFrame: function(f, queue) {
                if(inAnimFrame && !queue) {
                    f();
                } else {
                    animFrameQueue.push(f);
                    if(!animFrameRequested) {
                        animFrameRequested = true;
                        requestAnimationFrame(function() {
                            inAnimFrame = true;
                            try {
                                while(animFrameQueue.length) {
                                    animFrameQueue.pop()();
                                }
                            } finally {
                                inAnimFrame = false;
                                animFrameRequested = false;
                            }
                        });
                    }
                }
            },
            
            handleEventInAnimationFrame: function (event) {
                var self = this, args = arguments;
                requestAnimationFrame(function() {
                    event.data.apply(self, args);;
                });
            },

            findInArray: function (array, selector) {
                for(var x=0,l=array.length;x<l;x++) {
                    if(selector(array[x], x)) return x;
                }
                return -1;
            },

            elementFromPoint: function(x,y,selector) {
                var elements = $(selector);
                for(var i = elements.length - 1; i>=0; i--) {
                    var e = $(elements.get(i)), o = e.offset();
                    if(x >= o.left && y >= o.top && x < o.left + e.outerWidth() && y < o.top + e.outerHeight()) {
                        return e;
                    }
                }
            },
            
            loggingInterceptor: function(callback) {
                var args = Array.prototype.slice.apply(arguments, [1]);
                var r = callback.apply(this, args);
                console.log(args.map(function(e) { return e }).join(",") + " -> " + r);
                return r;
            },
            
            cancelEvent: function(event) {
                event.stopPropagation();
                event.stopImmediatePropagation();
                event.preventDefault();
            }
        }
    });
})(define);