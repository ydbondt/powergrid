define(function() {
    "use strict";
    
    return function(object, override) {
        var $super = {};
        for(var x in object) {
            if(typeof object[x] === 'function') {
                $super[x] = object[x].bind(object);
            }
        }

        var overrides = override($super, object);

        for(var x in overrides) {
            object[x] = overrides[x];   
        }

        return object;
    }
});