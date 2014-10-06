define(['override', 'jquery','promise', 'text!../templates/filterPane.html', 'text!../templates/filterBox.html'], function(override, $, Promise, filterPane, filterBox) {
    "use strict";
    
    return {
        init: function(grid, pluginOptions) {
            return override(grid, function($super) {
                var columnSettings = {};
                
                var currentFilterPane;
                
                return {
                    init: function() {
                        this.target.on("click", ".pg-filter", function(event) {
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
                        
                        $("body").on("click", function(event) {
                            if(currentFilterPane && $(this).parents(".pg-filter-pane").empty()) {
                                grid.filtering.closeFilterPane();
                            }
                        });
                        
                        this.target.on("click", ".pg-filter-box", function(event) {
                            event.stopPropagation();
                        });
                        
                        $super.init();
                    },
                    
                    headerHeight: function() {
                        return $super.headerHeight() + 15;  
                    },

                    renderHeaderCell: function(column, columnIdx) {
                        var header = $super.renderHeaderCell(column, columnIdx);

                        if(column.filterable === undefined || column.filterable) {
                            header.append(filterBox);
                            
                            header.on("keyup", ".pg-filter-input", function(event) {
                                grid.filtering.setColumnFilteringAttribute(column.key, { "value": this.value });
                            });
                        }

                        return header;
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
                            grid.dataSource.applyFilter(settings, this.rowMatches.bind(this, settings));
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