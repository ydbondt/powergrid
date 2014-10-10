(function(define) {
    "use strict";
    
    define(['jquery'], function($) {
        return {
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
            }
        }
    });
})(define);