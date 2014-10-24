define(['override', 'vein', 'utils'], function(override, vein, utils) {
    "use strict";
    
    return function(grid, pluginOptions) {
        override(grid, function($super) {
            var subViewHeights = [];
            var subviewsExpanded = {};
            return {
                init: function() {
                    $super.init();
                    
                    this.target.on("click", ".pg-subview-toggle", function(event) {
                        var row = $(this).parents(".pg-row").first(),
                            rowId = row.attr("data-row-id"),
                            rowIdx = parseInt(row.attr("data-row-idx"));
                        
                        if(!subviewsExpanded[rowId]) {
                            grid.subviews.expandView(grid.dataSource.getRecordById(rowId), rowIdx);
                        } else {
                            grid.subviews.collapseView(grid.dataSource.getRecordById(rowId), rowIdx);
                        }
                        
                        event.stopPropagation();
                        event.preventDefault();
                    });
                },
                
                subviews: {
                    expandView: function(record, rowIdx) {
                        var group = grid.getRowGroupFor(rowIdx);
                        if(!subviewsExpanded[record.id]) {
                            subviewsExpanded[record.id] = true;
                            grid.afterRenderRow(record, rowIdx, group.all.children("[data-row-id='" + record.id + "']"));
                        }
                    },

                    collapseView: function(record, rowIdx) {
                        var group = grid.getRowGroupFor(rowIdx);
                        if(subviewsExpanded[record.id]) {
                            subviewsExpanded[record.id] = false;
                            group.all.children("[data-row-id='" + record.id + "']").css("height", grid.rowHeight(rowIdx) + "px");
                        }
                    },
                    
                    subview: function(id) {
                        return grid.container.find("> .pg-rowgroup > .pg-container > .pg-row.pg-row-has-subview[data-row-id='" + id + "'] > .pg-subview");
                    }
                },
                
                afterRenderRow: function(record, rowIdx, rowParts) {
                    var target = $(rowParts[0]), subview;
                    
                    function finish() {
                        requestAnimationFrame(function() {
                            subViewHeights[record.id] = subview[0].scrollHeight;
                            rowParts.css('height', grid.rowHeight(rowIdx) + "px");
                            grid.adjustHeights();
                        });
                    }
                    
                    if(record && pluginOptions.hasSubView(grid, record) && subviewsExpanded[record.id]) {
                        if(!target.is(".pg-row-has-subview")) {
                            target.addClass("pg-row-has-subview");
                            target.wrapInner('<div class="pg-inner-row"></div>');
                            target.children('.pg-inner-row').css('height', $super.rowHeight(rowIdx) + "px");
                            
                            subview = $('<div class="pg-subview">');
                            subview.attr("id", (grid.target.attr("id") || "subview") + "-" + record.id);
                            
                            var promise = pluginOptions.renderSubView(grid, record, subview);
                            subview.on("resize", finish);
                            
                            target.append(subview);
                            
                            if(promise.then) {
                                promise.then(finish);
                            } else {
                                finish();
                            }
                        } else {
                            rowParts.css('height', grid.rowHeight(rowIdx) + "px");
                        }
                    }
                    
                    $super.afterRenderRow(record, rowIdx, rowParts);
                },
                
                renderCellContent: function(record, column, value) {
                    var content = $super.renderCellContent.apply(this, arguments);
                    if(column.subViewToggle && record && pluginOptions.hasSubView(grid, record)) {
                        return $('<div>')
                            .addClass("pg-subview-toggle")
                            .addClass(column.subViewToggleClass || "pg-subview-toggle-default")
                            .toggleClass("pg-subview-expanded", subviewsExpanded[record.id] == true)
                            .add(content);
                    } else {
                        return content;
                    }
                },
                
                rowHeight: function rowHeight(start, end) {
                    if(end === undefined) {
                        var r = grid.dataSource.getData(start, start + 1)[0].id;
                        return $super.rowHeight(start) + (subviewsExpanded[r] && subViewHeights[r] || 0);
                    } else {
                        var ids = grid.dataSource.getData(start, end).map(function(e) { return e.id; }), subviewheights = 0;
                        for(var x=start;x<end;x++) {
                            if(subviewsExpanded[ids[x]]) subviewheights += subViewHeights[ids[x]];
                        }
                        return $super.rowHeight(start, end) + subviewheights;
                    }
                }
            }
        });
    };
    
});