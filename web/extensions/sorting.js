define(['../override', '../jquery', '../utils', '../datasources/sortingdatasource'], function(override, $, utils, SortingDataSource) {
    "use strict";

    return {
        loadFirst: ['dragging', 'columnsizing'],
        init: function(grid, pluginOptions) {
            override(grid, function($super) {
                var sortColumns=[];
                function loadSettings() {
                    var sortSettings = grid.loadSetting("sorting");
                    if (sortSettings !== undefined && sortSettings !== null && sortSettings !== "") {
                        sortColumns = sortSettings;
                    } else {
                        sortColumns = pluginOptions.defaultSortedColumns;
                    }
                }
                return {
                    init: function() {
                        loadSettings();

                        if(typeof this.dataSource.sort !== 'function') {
                            this.dataSource = new SortingDataSource(this.dataSource);
                        }

                        this.sorting.sort(sortColumns);

                        $super.init();
                        this.container.on("click", ".pg-columnheader", function(event) {
                            var key = $(this).attr('data-column-key'),
                                col = grid.getColumnForKey(key),
                                direction;

                            if($(this).parents(".powergrid").get(0) != grid.container.get(0)) {
                                // columnheader does not belong to this grid
                                return;
                            }

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

                            event.stopPropagation();
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

                        compareValues: function(column, a, b) {
                            if(typeof column.compare === 'function') {
                                return column.compare(a, b);
                            } else {
                                return this.compareValue(a, b);
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

                                result = this.compareValues(column, utils.getValue(a, column.key), utils.getValue(b, column.key));
                                
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
                            var split = /([0-9]+|[^0-9]+)/g,
                                isNumber = /^[0-9]+$/,
                                sA = a.toLocaleUpperCase().match(split),
                                sB = b.toLocaleUpperCase().match(split);
                            if(a==b) return 0;
                            if(sA === null) {
                                if(sB === null) {
                                    return 0;
                                } else {
                                    return -1;
                                }
                            } else if(sB === null) {
                                return 1;
                            }
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
