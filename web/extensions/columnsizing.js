define(['override'], function(override) {
    
    return function(grid, pluginOptions) {
        override(grid, function($super) {
            return {
                renderHeaderCell: function(column, idx) {
                    var h = $super.renderHeaderCell(column, idx);
                    h.attr("data-column-idx", idx);
                    return h;
                },
                
                init: function() {
                    $super.init();
                    var grid = this;
                    this.target.on("mousedown", ".columnheader", function(event) {
                        var header = event.target,
                                idx = parseInt($(header).attr("data-column-idx")),
                                col = grid.options.columns[idx],
                                oX = event.pageX,
                                w = col.width;
                        
                        if(idx < grid.options.columns.length - grid.options.frozenColumnsRight // it's not a right frozen column
                           && event.offsetX > event.target.offsetWidth - 5) {
                            
                            $(document).on("mousemove.columnTracking", function(event) {
                                col.width = Math.max(0, event.pageX - oX + w);
                                grid.adjustWidths();
                            }).on("mouseup.columnTracking", function(event) {
                                $(document).off("mousemove.columnTracking").off("mouseup.columnTracking");
                            });
                            
                        } else if(event.offsetX < 5 && idx >= grid.options.columns.length - grid.options.frozenColumnsRight) {
                            $(document).on("mousemove.columnTracking", function(event) {
                                col.width = Math.max(0, oX - event.pageX + w);
                                grid.adjustWidths();
                            }).on("mouseup.columnTracking", function(event) {
                                $(document).off("mousemove.columnTracking").off("mouseup.columnTracking");
                            });
                        }
                    });
                }
            }
        });
    };
    
});