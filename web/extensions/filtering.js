define(['../override', '../jquery', '../utils',
    '../datasources/filteringdatasource',
+    '../templates/filterPane.html!text',
    '../templates/filterBox.html!text'], function(override, $, utils, FilteringDataSource, filterPane, filterBox) {
    "use strict";

    return {
        init: function(grid, pluginOptions) {
            return override(grid, function($super) {
                var columnSettings = {};
                
                var currentFilterPane;

                var filters = {};
                
                return {
                    init: function() {
                        if(typeof this.dataSource.applyFilter !== 'function') {
                            this.dataSource = new FilteringDataSource(this.dataSource);
                        }
                        
                        $super.init();
                        
                        this.container.on("click mousedown", ".pg-filter-box", function(event) {
                            event.stopPropagation();
                        });
                    },
                    
                    destroy: function() {
                        $super.destroy();
                    },

                    renderHeaderCell: function(column, columnIdx) {
                        var header = $super.renderHeaderCell(column, columnIdx);
                        
                        if(column.filterable === undefined || column.filterable) {
                            header.addClass("pg-filterable");
                            var filter = this.filtering.createFilterBox(column);
                            filters[column.key] = filter;
                            header.append(filter.filterBox);
                            filter.on("change", function(value) {
                                if(value !== null && value !== undefined) {
                                    columnSettings[column.key] = value;
                                } else {
                                    delete columnSettings[column.key];
                                }
                                grid.filtering.filter(columnSettings);
                            });
                        }

                        return header;
                    },
                    
                    filterHeight: function() {
                        return Math.max.apply(undefined, this.target.find(".pg-columnheader .pg-filter-box").map(function(i, e) {
                            return $(e).outerHeight();
                        }));
                    },
                    
                    headerHeight: function() {
                        return $super.headerHeight() + this.filterHeight();
                    },
                    
                    filtering: {
                        createFilterBox: function(column) {
                            if(column.type && pluginOptions.filterFactories && column.type in pluginOptions.filterFactories) {
                                return pluginOptions.filterFactories[column.type](column, grid);
                            } else {
                                return this.createDefaultFilterBox(column);
                            }
                        },

                        createDefaultFilterBox: function(column) {
                            var listener = utils.createEventListener(),
                                fragment = $(filterBox),
                                filterValue = { value: '', method: 'contains', type: 'inclusive' },
                                filter = {
                                    filterBox: fragment,
                                    on: listener.on,
                                    trigger: listener.trigger,
                                    value: filterValue,
                                    valueMatches: function(value, columnSettings) {
                                        var hasValue = value !== undefined && value !== null && value !== "";
                                        switch(columnSettings.method) {
                                            case "contains":
                                                return (!columnSettings.value || hasValue && (value.toLocaleUpperCase()).indexOf(columnSettings.value.toLocaleUpperCase()) > -1);
                                            case "beginsWith":
                                                return (!columnSettings.value || hasValue && value.length >= columnSettings.value.length && value.substring(0, columnSettings.value.length).toLocaleUpperCase() == columnSettings.value.toLocaleUpperCase());
                                            case "endsWith":
                                                return (!columnSettings.value || hasValue && value.length >= columnSettings.value.length && value.substring(value.length - columnSettings.value.length).toLocaleUpperCase() == columnSettings.value.toLocaleUpperCase());
                                            default: throw "Unsupported filter operator " + columnSettings.type;
                                        }
                                    }
                                },
                                currentFilterPane;

                            function closeFilterPane() {
                                currentFilterPane.remove();
                                currentFilterPane = null;
                            }

                            fragment.on("click", ".pg-filter", function(event) {
                                var $this = $(this),
                                    key = $this.parents('.pg-columnheader').attr('data-column-key'),
                                    column = grid.getColumnForKey(key);

                                if(currentFilterPane) {
                                    return;
                                }

                                currentFilterPane = $("<div class='pg-filter-pane'>");

                                currentFilterPane.html(filterPane);
                                currentFilterPane.on("click", "[data-filter-method],[data-filter-type]", function(event) {
                                    filterValue.method = $(this).attr("data-filter-method");
                                    filterValue.type = $(this).attr("data-filter-type");
                                    filter.trigger('change', filterValue);
                                    grid.filtering.closeFilterPane();
                                });

                                currentFilterPane.css("top", $this.offset().top + "px").css("left", $this.offset().left + "px");
                                $("body").append(currentFilterPane);

                                event.preventDefault();
                                event.stopPropagation();

                                $("body").one("click", function(event) {
                                    if(currentFilterPane && $(this).parents(".pg-filter-pane").empty()) {
                                        grid.filtering.closeFilterPane();
                                    }
                                });
                            });

                            var timer;

                            fragment.on("keyup", ".pg-filter-input", function(event) {
                                var value = this.value;
                                if(timer) clearTimeout(timer);
                                timer = setTimeout(function() {
                                    filterValue.value = value;
                                    filter.trigger('change', filterValue);
                                    timer = null;
                                }, 1000);
                            });

                            return filter;
                        },
                        
                        filter: function(settings) {
                            grid.dataSource.applyFilter(settings, settings && this.rowMatches.bind(this, settings));
                        },
                        
                        rowMatches: function(settings, row) {
                            for(var x in settings) {
                                if(!filters[x].valueMatches(utils.getValue(row, x), settings[x])) {
                                    if(settings[x].type == 'inclusive' || settings[x].type === undefined) {
                                        return 0;
                                    }
                                } else {
                                    if(settings[x].type == 'exclusive') {
                                        return -1;
                                    }
                                }
                            }
                            return 1;
                        }
                    }
                }
            });
        }
   };
    
});
