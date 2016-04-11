define(['override', 'utils', 'jquery'],
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
                }
                
                var contentWidths = cells.map(function(i,e) { return e.scrollWidth }),
                    padding = 2,
                    oldWidth = col.width;
                col.width = Math.max.apply(null, contentWidths) + padding;
                return col.width != oldWidth;
            }
            
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
                                
                                if(autosize(col, true)) {
                                    grid.queueAdjustColumnPositions();
                                }
                                event.stopPropagation();
                                event.preventDefault();
                            });
                        },

                        updateViewport: function() {
                            $super.updateViewport();
                            var resized = false;
                            for(var x=0,l=grid.options.columns.length;x<l;x++) {
                                var col = grid.options.columns[x];
                                if(col.autoSize) {
                                    resized |= autosize(col, true);
                                }
                            }
                            if(resized) {
                                this.queueAdjustColumnPositions();
                            }
                        }
                    };
                });
            } else {
                return grid;
            }
        }
   };
});