define(['es6-promise'], function(es6promise) {
    if(window.Promise) return window.Promise;
    return es6promise.Promise;
});