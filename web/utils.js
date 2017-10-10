(function(define) {
    "use strict";

    var animFrameQueue = [], inAnimFrame = false, animFrameRequested = false;

    var pathRegex = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]/g;

    function parsePath(key) {
        var p = [];
        if (key.replace) {
            key.replace(pathRegex, function (a, b) {
                if (b !== undefined) {
                    p.push(parseInt(b));
                } else {
                    p.push(a);
                }
            });
            return p;
        }

        return [key];
    }

    function getValue(object, key) {
        var o = object;
        for(var p=parsePath(key),x=0,l=p.length;x<l;x++) {
            if(o === undefined || o === null) {
                return o;
            }
            o = o[p[x]];
        }
        return o;
    }

    function setValue(object, key, value) {
        var o = object,
            p=parsePath(key);
        for(var x=0,l=p.length-1;x<l;x++) {
            o = o[p[x]];
        }
        o[p[x]] = value;
    }

    function createElement(tag, attributes, content) {
        var element = document.createElement(tag);
        if(typeof attributes == 'string' || Array.isArray(attributes)) {
            content = attributes;
            attributes = undefined;
        }
        if(attributes) {
            for (var x in attributes) {
                if (attributes.hasOwnProperty(x) && attributes[x] !== false) {
                    element.setAttribute(x, attributes[x]);
                }
            }
        }
        if(typeof content == 'string') {
            element.textContent = content;
        } else if(Array.isArray(content)) {
            for(var x=0,l=content.length;x<l;x++) {
                element.appendChild(content[x]);
            }
        }
        return element;
    }

    function normalizeOptions(options) {
        if(Array.isArray(options)) {
            return options;
        } else {
            return Object.keys(options).map(function(key) {
                return {
                    value: key,
                    label: options[key]
                };
            });
        }
    }

    function Evented() {
        var handlers = {};
        this.on = function (eventName, handler) {
            if (eventName in handlers) {
                handlers[eventName] = handlers[eventName].concat(handler);
            } else {
                handlers[eventName] = [handler];
            }
        };

        this.trigger = function (eventName) {
            var self = this, args = Array.apply(null, arguments).slice(1);
            if (eventName in handlers) {
                handlers[eventName].forEach(function (handler) {
                    handler.apply(self, args);
                });
            }
        };

        this.one = function(eventName, handler) {
            var selfDestructingHandler = (function() {
                var idx = handlers[eventName].indexOf(selfDestructingHandler);
                if(idx > -1) handlers[eventName].splice(idx, 1);
                handler.apply(this, arguments);
            });

            this.on(eventName, selfDestructingHandler);
        };

        this.passthroughFrom = function (target) {
            var self = this;
            for (var x = 1; x < arguments.length; x++) {
                (function (eventName) {
                    target.on(eventName, function () {
                        self.trigger.apply(self, [eventName].concat(arguments));
                    });
                })(arguments[x]);
            }
        };
    }

    function findRanges(indeces) {
        var ranges = [];
        indeces.sort(function(a,b) { return a-b; });

        var prevIdx = indeces[0], currentCount=1;
        for(var x=1; x<indeces.length;x++) {
            if(indeces[x] == indeces[x - 1] + 1) {
                currentCount++;
            } else {
                ranges.push({start: prevIdx, count: currentCount});
                prevIdx = indeces[x];
                currentCount = 1;
            }
        }

        ranges.push({start: prevIdx, count: currentCount});
        return ranges;
    }

    function SubscriptionQueue() {
        var cancelled = false;

        this.queue = function(cb) {
            return function() {
                if(!cancelled) cb.apply(this, arguments);
            }
        };

        this.cancel = function() {
            cancelled = true;
        };
    }

    define(['./jquery'], function($) {
        return {
            inAnimationFrame: function(f, queue) {
                if(inAnimFrame && !queue) {
                    f();
                } else {
                    animFrameQueue.push(f);
                    if(!animFrameRequested) {
                        animFrameRequested = true;
                        requestAnimationFrame(this.handleAnimationFrames.bind(this));
                    }
                }
            },

            handleAnimationFrames: function() {
                inAnimFrame = true;
                try {
                    while(animFrameQueue.length) {
                        animFrameQueue.pop()();
                    }
                } finally {
                    inAnimFrame = false;
                    animFrameRequested = false;
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
            },

            passthrough: function(target, delegate, functions) {
                for(var x = 0,l=functions.length;x<l;x++) {
                    if(typeof delegate[functions[x]] == 'function') {
                        target[functions[x]] = delegate[functions[x]].bind(delegate);
                    }
                }
            },

            findRanges: findRanges,

            getValue: getValue,
            setValue: setValue,

            createElement: createElement,

            normalizeOptions: normalizeOptions,

            Evented: Evented,

            SubscriptionQueue: SubscriptionQueue
        }
    });
})(define);
