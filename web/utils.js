(function(define) {
    "use strict";
    
    define({
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
        }
    });
})(define);