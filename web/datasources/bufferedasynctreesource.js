define(["../utils"], function(utils) {

    function BufferedAsyncTreeSource(delegate) {
        utils.Evented.apply(this);

        this.delegate = delegate;

        this.windowBuffer = 50; // number of records to fetch ahead. effective excess fetching could be twice this in certain cases

        var self = this;

        if(delegate.isReady()) {
            this.reset();
        }

        delegate.on('dataloaded', function() {
            self.reset();
            self.trigger('dataloaded');
        });

        utils.passthrough(this, delegate, ['hasSubView', 'getSummaryRow']);
    }

    BufferedAsyncTreeSource.prototype = {
        reset: function() {
            this.childrenCache = undefined;
            this.rootCache = undefined;
            this.rootCount = undefined;
            this.childCount = {};
            this.recordCount = undefined;
        },

        initCache: function() {
            var self = this;
            if(this.childrenCache && this.rootCache) {
                return Promise.resolve();
            } else {
                return Promise.resolve(this.countRootNodes()).then(function (rootCount) {
                    self.childrenCache = {};
                    self.rootCache = new Array(rootCount);
                });
            }
        },

        isReady: function() {
            return this.delegate.isReady();
        },

        getRecordCount: function() {
            var self = this;
            if(this.rootCount === undefined) {
                return utils.map(this.delegate.getRecordCount(), function(count) {
                    return self.rootCount = count;
                });
            } else {
                return this.rootCount;
            }
        },

        getRootNodes: function(start, end) {
            var self = this;
            return this.initCache().then(function() {
                var cache = self.rootCache;

                function query(start, end) {
                    return self.delegate.getRootNodes(start, end);
                }

                return self.bufferQuery(query, start, end, cache);
            });
        },

        hasChildren: function(row) {
            return this.delegate.hasChildren(row);
        },

        children: function(parent, start, end) {
            var self = this;
            return this.initCache().then(function() {
                var totalChildCount = self.countChildren(parent),
                    childCache;

                if(!(parent.id in self.childrenCache)) {
                    childCache = self.childrenCache[parent.id] = new Array(totalChildCount);
                } else {
                    childCache = self.childrenCache[parent.id];
                }

                function query(start, end) {
                    return self.delegate.children(parent, start, end);
                }

                return self.bufferQuery(query, start, end, childCache);
            });
        },

        bufferQuery: function(queryFunction, start, end, cache) {
            // check if requested window is fully in cache
            var queryNeeded = false;
            var promises = [];

            for(var x=start;x<end;x++) {
                if(cache[x] === undefined) {
                    queryNeeded = true;
                } else if(typeof cache[x].then === 'function') {
                    // row is already being queried
                    promises.push(cache[x]);
                }
            }

            if(!queryNeeded) {
                // requested window is fully in cache, or already being queried. wait for existing queries (if any) and resolve.
                return Promise.all(promises).then(function() {
                    return cache.slice(start, end);
                });
            }

            var fetchStart = Math.max(0, start - this.windowBuffer),
                fetchEnd = Math.min(cache.length, end + this.windowBuffer);

            // trim already fetched or being fetched rows from window
            while(cache[fetchStart] !== undefined) fetchStart++;
            while(cache[fetchEnd] !== undefined) fetchEnd--;

            // query resulting window and add to cache
            if(fetchEnd > fetchStart) {
                var promise = queryFunction(fetchStart, fetchEnd).then(function (results) {
                    for (var x = 0, l = results.length; x < l; x++) {
                        cache[fetchStart + x] = results[x];
                    }
                });

                // add query promise to promises to wait for
                promises.push(promise);

                // store query promises in cache (will be replaced by actual row when promise resolves)
                for(var x=fetchStart; x< fetchEnd; x++) {
                    if(cache[x] === undefined) {
                        cache[x] = promise;
                    }
                }
            }

            // wait for all relevant promises (new and existing queries), then return result from cache which should
            // by then be up to date.
            return Promise.all(promises).then(function() {
                return cache.slice(start, end);
            });
        },

        countChildren: function(parent) {
            var self = this;
            if(!(parent.id in this.childCount)) {
                return utils.map(this.delegate.countChildren(parent), function(count) {
                    return self.childCount[parent.id] = count;
                });
            } else {
                return this.childCount[parent.id];
            }
        },

        countRootNodes: function() {
            var self = this;
            if(this.rootCount === undefined) {
                return utils.map(this.delegate.countRootNodes(), function(count) {
                    return self.rootCount = count;
                });
            } else {
                return this.rootCount;
            }
        },

        filter: function(settings, predicate) {
            return this.delegate.filter(settings, predicate);
        },

        sort: function(comparator, settings) {
            return this.delegate.sort(comparator, settings);
        },

        group: function(settings) {
            return this.delegate.group(settings);
        },

        getStatistics: function() {
            return this.delegate.getStatistics();
        },

        getRecordById: function(id) {
            return this.delegate.getRecordById(id);
        }
    };

    return BufferedAsyncTreeSource;
});
