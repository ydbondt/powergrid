define({
    handleEventInAnimationFrame: function (event) {
        requestAnimationFrame(function() {
            event.data(event);
        });
    },
    
    findInArray: function (array, selector) {
        for(var x=0,l=array.length;x<l;x++) {
            if(selector(array[x], x)) return x;
        }
        return -1;
    }
});