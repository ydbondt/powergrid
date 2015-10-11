define(['../override', 'jquery',
    '../templates/filterPane.html!text',
    '../templates/filterBox.html!text'], function(override, $, filterPane, filterBox) {
    "use strict";
    
    function FilteringDataSource(delegate) {
        var self = this;
        this.delegate = delegate;
        
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

        if(typeof delegate.sort === 'function') {
            this.sort = delegate.sort.bind(delegate);
        }
    }
    
    FilteringDataSource.prototype = {
        view: null,
        
        isReady: function() {
            return this.view != null;
        },
        
        reload: function() {
            this.delegate.assertReady();
            this.view = this.delegate.getData();
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

        setValue: function(rowId, key, value) {
            this.delegate.setValue(rowId, key, value);
        },
        
        assertReady: function() {
            if(!this.isReady()) throw Error("Datasource not ready yet");
        },
        
        buildStatistics: function() {
            return {
                actualRecordCount: this.delegate && this.delegate.recordCount()
            };
        },
        
        applyFilter: function(settings, filter) {
            var oldview = this.view,
                view = this.delegate.getData().filter(filter);
            this.view = view;
            $(this).trigger('datachanged', { data: view, oldData: oldview });
        },

        getRecordById: function(id) {
            return this.delegate.getRecordById(id);
        }
    };
    
    return {
        init: function(grid, pluginOptions) {
            return override(grid, function($super) {
                var columnSettings = {};
                
                var currentFilterPane;
                
                return {
                    init: function() {
                        if(typeof this.dataSource.applyFilter !== 'function') {
                            this.dataSource = new FilteringDataSource(this.dataSource);
                        }
                        
                        $super.init();
                        
                        this.container.on("click", ".pg-filter", function(event) {
                            var $this = $(this),
                                key = $this.parents('.pg-columnheader').attr('data-column-key'),
                                column = grid.getColumnForKey(key);
                            
                            if(currentFilterPane) {
                                grid.filtering.closeFilterPane();
                            }
                            
                            currentFilterPane = $("<div class='pg-filter-pane'>");
                            grid.filtering.renderFilterPane(currentFilterPane, column);
                            currentFilterPane.css("top", $this.offset().top + "px").css("left", $this.offset().left + "px");
                            $("body").append(currentFilterPane);
                            
                            event.preventDefault();
                            event.stopPropagation();
                        });
                        
                        $("body").on("click." + this.id, function(event) {
                            if(currentFilterPane && $(this).parents(".pg-filter-pane").empty()) {
                                grid.filtering.closeFilterPane();
                            }
                        });
                        
                        this.container.on("click mousedown", ".pg-filter-box", function(event) {
                            event.stopPropagation();
                        });
                    },
                    
                    destroy: function() {
                        $super.destroy();
                        $("body").off("click." + this.id);
                    },

                    renderHeaderCell: function(column, columnIdx) {
                        var header = $super.renderHeaderCell(column, columnIdx);
                        
                        if(column.filterable === undefined || column.filterable) {
                            header.addClass("pg-filterable");
                            header.append(filterBox);

                            var timer;
                            
                            header.on("keyup", ".pg-filter-input", function(event) {
                                var self = this;
                                if(timer) clearTimeout(timer);
                                timer = setTimeout(function() {
                                    grid.filtering.setColumnFilteringAttribute(column.key, { "value": self.value });
                                    timer = null;
                                }, 1000);
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
                        renderFilterPane: function(container, column) {
                            container.html(filterPane);
                            container.on("click", "[data-filter-method],[data-filter-type]", function(event) {
                                grid.filtering.setColumnFilteringAttribute(column.key, 
                                    {
                                        method: $(this).attr("data-filter-method"),
                                        type: $(this).attr("data-filter-type")
                                    });
                                grid.filtering.closeFilterPane();
                            });
                        },
                        
                        closeFilterPane: function() {
                            currentFilterPane.remove();
                            currentFilterPane = null;
                        },
                        
                        filter: function(settings) {
                            grid.dataSource.applyFilter(settings, settings && this.rowMatches.bind(this, settings));
                        },
                        
                        rowMatches: function(settings, row) {
                            for(var x in settings) {
                                if(!this.valueMatches(settings[x], row[x])) {
                                    if(settings[x].type == 'inclusive') {
                                        return 0;
                                    }
                                } else {
                                    if(settings[x].type == 'exclusive') {
                                        return -1;
                                    }
                                }
                            }
                            return 1;
                        },
                        
                        valueMatches: function(columnSetting, value) {
                            var hasValue = value !== undefined && value !== null && value !== "";
                            switch(columnSetting.method) {
                                case "contains":
                                    return (!columnSetting.value || hasValue && (value.toLocaleUpperCase()).indexOf(columnSetting.value.toLocaleUpperCase()) > -1);
                                case "beginsWith":
                                    return (!columnSetting.value || hasValue && value.length >= columnSetting.value.length && value.substring(0, columnSetting.value.length).toLocaleUpperCase() == columnSetting.value.toLocaleUpperCase());
                                case "endsWith":
                                    return (!columnSetting.value || hasValue && value.length >= columnSetting.value.length && value.substring(value.length - columnSetting.value.length).toLocaleUpperCase() == columnSetting.value.toLocaleUpperCase());
                                default: throw "Unsupported filter operator " + columnSetting.type;
                            }
                        },
                        
                        setColumnFilteringAttribute: function(key, attributes) {
                            if(!columnSettings[key]) columnSettings[key] = this.createDefaultFiltering(key);
                            $.extend(columnSettings[key], attributes);
                            this.filter(columnSettings);
                        },
                        
                        createDefaultFiltering: function(key) {
                            return { value: '', method: 'contains', type: 'inclusive' };
                        }
                    }
                }
            });
        }
   };
    
});