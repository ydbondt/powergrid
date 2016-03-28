define(['../override', '../utils', '../jquery'],
       function(override, utils, $) {
    "use strict";
    
    return {
        init: function(grid, pluginOptions) {
            
            function autosize(col, shrink) {
                var cells = grid.target.find(".pg-cell[data-column-key='" + col.key + "']");
                
                if(!cells.length) {
                    // no visible cells, so leave column as is.
                    return;
                }
                
                if(shrink) {
                    col.width = 0;
                    grid.adjustColumnPositions();
                }
                
                var contentWidths = cells.map(function(i,e) { return e.scrollWidth });
                var padding = 2;
                col.width = Math.max.apply(null, contentWidths) + padding;
                grid.adjustColumnPositions();
            }
            
            grid.on("datarendered datachanged rowsadded", function(evt) {
                for(var x=0,l=grid.options.columns.length;x<l;x++) {
                    var col = grid.options.columns[x];
                    if(col.autoSize) {
                        autosize(col, true);
                    }
                }
            });
            
            if(grid.options.extensions.columnsizing) {
                return override(grid, function($super) {
                    return {
                        init: function() {
                            $super.init();
                            
                            this.container.on("dblclick", ".pg-resizehandle", function(event) {
                                if($(this).parents('.powergrid')[0] !== grid.container[0]) return;
                                var header = event.target.parentNode,
                                    key = $(header).attr("data-column-key"),
                                    idx = utils.findInArray(grid.options.columns, function(col) { return col.key == key; }),
                                    col = grid.options.columns[idx];
                                
                                autosize(col, true);
                                event.stopPropagation();
                                event.preventDefault();
                            });
                        }
                    };
                });
            } else {
                return grid;
            }
        }
   };
});