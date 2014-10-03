define(['override', 'jquery','promise'], function(override, $, Promise) {
    "use strict";
    
    return {
        loadFirst: ['columnmoving', 'columnsizing'],
        init: function(grid, pluginOptions) {
            override(grid, function($super) {
                var sortColumns=[];
                
                return {
                    init: function() {
                        $super.init();
                        this.target.on("click", ".pg-columnheader", function(event) {
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
                            
                            sortColumns = [{ key: key, direction: direction, column: grid.getColumnForKey(key) }].concat(sortColumns.filter(function(e) {
                                return e.key !== key;
                            }));
                            
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
                            var p = grid.dataSource.sort(this.compareRow.bind(this, columnSettings), columnSettings);
                            Promise.resolve(p).then(function() {
                                grid.sorting.afterSort(columnSettings);
                            });
                        },
                        
                        afterSort: function(columnSettings) {
                            grid.renderData();
                        },
                        
                        compareRow: function(columnSettings, a, b) {
                            for(var x=0,l=columnSettings.length;x<l;x++) {
                                var setting = columnSettings[x],
                                    column = setting.column,
                                    result;
                                
                                if(typeof column.compare === 'function') {
                                    result = column.compare(a[column.key],b[column.key]);
                                } else {
                                    result = this.compareValue(a[column.key],b[column.key]);
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