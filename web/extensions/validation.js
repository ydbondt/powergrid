define(['jquery','override'], function($, override) {
    
    return {
        init: function(grid, pluginOptions) {
            override(grid, function($super) {
                return {
                    init: function() {
                        var self = this;
                        $super.init();
                        $(grid.dataSource).on("validationresultchanged", function(event, data) {
                            data.values.forEach(function (e) {
                                var column = grid.getColumnForKey(e.key);
                                if(column) {
                                    self.updateValidationStatus(e, column, grid.getCellFor(e.id, e.key));
                                }
                            })
                        })
                    },

                    updateValidationStatus: function(record, column, cell) {
                        var validationresult = grid.validation.validate(record, column, cell);

                        var previousClasses = cell.validationclasses;
                        if(previousClasses) $(cell).removeClass(previousClasses);

                        if(validationresult) {
                            var levels = {};
                            for(var x = 0,l=validationresult.length;x<l;x++) {
                                levels[validationresult[x].severity]=true;
                            }
                            var validationClasses = "pg-cell-invalid " + (Object.keys(levels).map(function(level) { return "pg-cell-validation-" + level }).join(" "));
                            $(cell).addClass(validationClasses).attr("title", i18n(validationresult[0].message));
                            cell.validationclasses = validationClasses; // store validationclasses separately so we can more easily remove them afterwards when needed
                        }
                    },

                    afterCellRendered: function renderCell(record, column, cell) {
                        this.updateValidationStatus(record, column, cell);
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