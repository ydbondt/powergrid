define(['jquery','override'], function($, override) {
    
    return {
        init: function(grid, pluginOptions) {
            override(grid, function($super) {
                return {
                    init: function() {
                        $super.init();
                        $(this.dataSource).on("validationchanged", function(event) {
                            
                        });
                    },
                    
                    afterCellRendered: function renderCell(record, column, cell) {
                        var validationresult = grid.validation.validate(record, column);
                        
                        var previousClasses = cell.data("validationclasses");
                        if(previousClasses) cell.removeClass(previousClasses);
                        
                        if(validationresult) {
                            var levels = {};
                            for(var x = 0,l=validationresult.length;x<l;x++) {
                                levels[validationresult[x].severity]=true;
                            }
                            var validationClasses = "pg-cell-invalid " + (Object.keys(levels).map(function(level) { return "pg-cell-validation-" + level }).join(" "));
                            cell.addClass(validationClasses).attr("title", validationresult.message);
                            cell.data("validationclasses", validationClasses); // store validationclasses separately so we can more easily remove them afterwards when needed
                        }
                        
                        $super.afterCellRendered(record, column, cell);
                    },
                    
                    validation: {
                        validate: function(record, column, value) {
                            // value parameter should be optional; if omitted, value in datasource should be validated. Otherwise, the passes value should be validated.
                            return grid.dataSource.validate && grid.dataSource.validate(record, column, value);
                        }
                    }
                };
            });
        }
    };
    
});