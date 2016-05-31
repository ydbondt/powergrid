define(['../override', '../jquery', '../utils'], function(override, $, utils) {
    "use strict";

    function SortingDataSource(delegate) {
        var self = this;
        this.delegate = delegate;

        if(typeof delegate.applyFilter === 'function') {
            this.applyFilter = delegate.applyFilter.bind(delegate);
        }

        $(delegate).on("dataloaded", function(event) {
            self.reload();
            $(self).trigger("dataloaded");
        }).on("datachanged", function(event, data) {
            self.reload();
            $(self).trigger("datachanged", [data]);
        });

        if(delegate.isReady()) {
            this.reload();
        }
    }

    SortingDataSource.prototype = {
        view: null,

        isReady: function() {
            return this.view != null;
        },

        reload: function() {
            this.delegate.assertReady();
            if(this.comparator) {
                this.view = this.delegate.getData().sort(this.comparator);
            } else {
                this.view = this.delegate.getData()
            }
        },

        recordCount: function() {
            this.assertReady();
            return this.view.length;
        },

        getData: function(start, end) {
            this.assertReady();
            if(!start && !end) return this.view;
            if(!start) start = 0;
            if(!end) end = this.recordCount();
            return this.view.slice(start, end);
        },

        getValue: function(rowId, key) {
            return this.delegate.getValue(rowId, key);
        },

        setValue: function(rowId, key, value) {
            this.delegate.setValue(rowId, key, value);
        },

        assertReady: function() {
            if(!this.isReady()) throw Error("Datasource not ready yet");
        },

        buildStatistics: function() {
            return this.delegate.buildStatistics();
        },

        getRecordById: function(id) {
            return this.delegate.getRecordById(id);
        },

        sort: function(comparator) {
            this.comparator = comparator;
            this.reload();
            $(this).trigger("dataloaded");
        }
    };

    return {
        loadFirst: ['dragging', 'columnsizing'],
        init: function(grid, pluginOptions) {
            override(grid, function($super) {
                var sortColumns=[];
                function loadSettings() {
                    var sortSettings = grid.loadSetting("sorting");
                    if (sortSettings !== undefined && sortSettings !== null && sortSettings !== "") {
                        sortColumns = sortSettings;
                    }
                }
                return {
                    init: function() {
                        loadSettings();

                        if(typeof this.dataSource.sort !== 'function') {
                            this.dataSource = new SortingDataSource(this.dataSource);
                        }

                        $super.init();
                        this.container.on("click", ".pg-columnheader", function(event) {
                            var key = $(this).attr('data-column-key'),
                                col = grid.getColumnForKey(key),
                                direction;
                            
                            if(sortColumns[0] && sortColumns[0].key === key) {
                                direction = sortColumns[0].direction;
                            }
                            
                            if(direction == 'ascending') {
                                direction = 'descending';
                            } else {
                                direction = 'ascending';
                            }
                            
                            grid.target.find('.pg-sort-ascending, .pg-sort-descending').removeClass('pg-sort-ascending pg-sort-descending');
                            $(this).addClass('pg-sort-' + direction);
                            
                            sortColumns = [{ key: key, direction: direction }].concat(sortColumns.filter(function(e) {
                                return e.key !== key;
                            }));
                            grid.sorting.sort(sortColumns);
                            grid.saveSetting("sorting", sortColumns);
                        });

                        $(grid.dataSource).one("dataloaded", function(e) {
                            grid.sorting.sort(sortColumns);
                        });
                    },

                    renderHeaderCell: function(column, columnIdx) {
                        var header = $super.renderHeaderCell(column, columnIdx);

                        if(column.sortable === undefined || column.sortable) {
                            header.append("<div class='pg-sorter'>");
                            header.addClass("pg-sortable");
                            if(sortColumns[0] && sortColumns[0].key === column.key) {
                                header.addClass('pg-sort-' + sortColumns[0].direction);
                            }
                        }

                        return header;
                    },
                    
                    sorting: {
                        sort: function (columnSettings) {
                            if(typeof grid.dataSource.sort !== 'function') {
                                console.warn && console.warn("Trying to sort unsortable datasource");
                            } else {
                                grid.dataSource.sort(this.compareRow.bind(this, columnSettings), columnSettings);
                            }
                        },
                        
                        compareRow: function(columnSettings, a, b) {
                            for(var x=0,l=columnSettings.length;x<l;x++) {
                                var setting = columnSettings[x],
                                    column = grid.getColumnForKey(setting.key),
                                    result;

                                if(column === undefined) {
                                    continue;
                                }

                                if(typeof column.compare === 'function') {
                                    result = column.compare(utils.getValue(a, column.key), utils.getValue(b, column.key));
                                } else {
                                    result = this.compareValue(utils.getValue(a, column.key), utils.getValue(b, column.key));
                                }
                                
                                if(result !== 0) {
                                    if(setting.direction === 'descending') {
                                        result = -1 * result;
                                    }
                                    return result;
                                }
                            }
                        },
                        
                        compareValue: function(a,b) {
                            if((a === null || a === undefined) && (b === null || b === undefined)) return 0;
                            if(a === null || a === undefined) return -1;
                            if(b === null || b === undefined) return 1;
                            
                            if(typeof a === 'string' && typeof b === 'string') return this.compareString(a,b);
                            
                            if(a<b) return -1;
                            else if(a>b) return 1;
                            else return 0;
                        },
                        
                        compareString: function(a,b) {
                            var split = /([0-9]+|.)/g,
                                isNumber = /^[0-9]+$/,
                                sA = a.toLocaleUpperCase().match(split),
                                sB = b.toLocaleUpperCase().match(split);
                            for(var x=0,l=Math.min(sA.length,sB.length);x<l;x++) {
                                var cA = sA[x], cB = sB[x];
                                if(cA.match(isNumber)) {
                                    if(!cB.match(isNumber)) {
                                        return -1;
                                    } else {
                                        var nA = parseInt(cA), nB = parseInt(cB);
                                        if(nA < nB) return -1;
                                        if(nA > nB) return 1;
                                    }
                                } else if(cB.match(isNumber)) {
                                    return 1;
                                }
                                if(sA[x] < sB[x]) return -1;
                                if(sA[x] > sB[x]) return 1;
                            }
                        }
                    }
                }
            });
        }
   };
    
});
