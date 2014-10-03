define(['override', 'jquery','promise', 'text!../templates/filterPane.html', 'text!../templates/filterBox.html'], function(override, $, Promise, filterPane, filterBox) {
    "use strict";
    
    return {
        init: function(grid, pluginOptions) {
            override(grid, function($super) {
                var columnSettings = {};
                
                return {
                    init: function() {
                        this.target.on("click", ".pg-filter", function(event) {
                            var $this = $(this),
                                key = $this.parents('.pg-columnheader').attr('data-column-header'),
                                column = grid.getColumnForKey(key);
                            
                            var filterPane = $("<div class='pg-filter-pane'>");
                            grid.filtering.renderFilterPane(filterPane, column);
                            filterPane.css("top", $this.offset().top + "px").css("left", $this.offset().left + "px");
                            $("body").append(filterPane);
                            
                            event.preventDefault();
                            event.stopPropagation();
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
                                columnSettings[column.key] = {
                                    value: this.value,
                                    type: "contains"
                                };
                                grid.filtering.filter(columnSettings);
                            });
                        }

                        return header;
                    },
                    
                    filtering: {
                        renderFilterPane: function(container, column) {
                            container.html(filterPane);
                        },
                        
                        filter: function(settings) {
                            grid.dataSource.applyFilter(settings, this.rowMatches.bind(this, settings));
                        },
                        
                        rowMatches: function(settings, row) {
                            for(var x in settings) {
                                if(!this.valueMatches(settings[x], row[x])) {
                                    return false;
                                }
                            }
                            return true;
                        },
                        
                        valueMatches: function(columnSetting, value) {
                            var hasValue = value !== undefined && value !== null && value !== "";
                            switch(columnSetting.type) {
                                case "contains": return !columnSetting.value || hasValue && (value.toLocaleUpperCase()).indexOf(columnSetting.value.toLocaleUpperCase()) > -1 ;
                                case "beginsWith": return !columnSetting.value || hasValue && value.length >= columnSetting.value.length && value.substring(0, columnSetting.value.length).toLocaleUpperCase() == columnSetting.value.toLocaleUpperCase();
                                case "endsWith": return !columnSetting.value || hasValue && value.length >= columnSetting.value.length && value.substring(value.length - columnSetting.value.length).toLocaleUpperCase() == columnSetting.value.toLocaleUpperCase();
                                default: throw "Unsupported filter operator " + columnSetting.type;
                            }
                        }
                    }
                }
            });
        }
   };
    
});