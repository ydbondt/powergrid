define(['../override', '../jquery',], function(override, $) {
    "use strict";

    return function(grid, pluginOptions) {
        override(grid, function($super) {
            return {
                init: function init() {
                    $super.init.apply(this, arguments);
                    this.container.on("mousedown", ".pg-rowgroup .pg-row", function(evt) {
                        var id = $(evt.currentTarget).data('row-id');
                        grid.selection.selectSingleRow(id);
                    });
                    
                    if(pluginOptions.onrowselected) grid.on("rowselected", pluginOptions.onrowselected);
                },
                
                selection: {
                    selectSingleRow: function(id) {
                        if(this.selectedElements) {
                            this.selectedElements.removeClass("pg-selected");
                        }
                        this.selectedElements = grid.container.find("> .pg-rowgroup > .pg-container > .pg-row[data-row-id='" + id + "']");
                        this.selectedElements.addClass("pg-selected");
                        
                        grid.trigger("rowselected", id);
                    },

                    selectedId: function() {
                        if (!this.selectedElements) {
                            return undefined;
                        }
                        return this.selectedElements.data('row-id');
                    }
                }
            }
        });
    };
});