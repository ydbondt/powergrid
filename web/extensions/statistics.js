define(['../override', 'jquery', 'jsrender', '../utils', 'text!../templates/statistics.html'], function(override, $, jsrender, utils, statisticsTemplate) {
    
    "use strict";
    
    return {
        init: function(grid, pluginOptions) {
            var template = $.templates(pluginOptions.template || statisticsTemplate);
            override(grid, function($super) {
                return {
                    init: function() {
                        var grid = this;

                        if(!this.dataSource.statistics) {
                            console.log("Statistics enabled but datasource does not support it.");
                            return;
                        }
                        
                        $super.init();

                        this.statistics.container = $("<div class='pg-statistics'>");
                        this.target.append(this.statistics.container).wrapInner("<div class='pg-statistics-wrapper'>");
                        $(this.dataSource).on("statisticschanged", function() {
                            grid.statistics.updateContents();
                        });
                        this.statistics.updateContents();
                    },
                    
                    statistics: {
                        updateContents: function() {
                            this.container.html(this.renderContents());
                        },
                        
                        renderContents: function() {
                            return template.render(grid.dataSource.statistics());
                        }
                    }
                }
            });
        }
    };
});