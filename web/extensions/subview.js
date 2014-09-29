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
                        
                        if(!subviewsExpanded[rowIdx]) {
                            grid.expandView(grid.dataSource.getRecordById(rowId), rowIdx);
                        } else {
                            grid.collapseView(grid.dataSource.getRecordById(rowId), rowIdx);
                        }
                        
                        event.stopPropagation();
                        event.preventDefault();
                    });
                },
                
                expandView: function(record, rowIdx) {
                    var group = this.getRowGroupFor(rowIdx);
                    if(!subviewsExpanded[rowIdx]) {
                        subviewsExpanded[rowIdx] = true;
                        this.afterRenderRow(record, rowIdx, group.all.children("[data-row-id='" + record.id + "']"));
                    }
                },
                
                collapseView: function(record, rowIdx) {
                    var group = this.getRowGroupFor(rowIdx);
                    if(subviewsExpanded[rowIdx]) {
                        subviewsExpanded[rowIdx] = false;
                        group.all.children("[data-row-id='" + record.id + "']").css("height", grid.rowHeight(rowIdx) + "px");
                    }
                },
                
                afterRenderRow: function(record, rowIdx, rowParts) {
                    var target = $(rowParts[0]), subview;
                    
                    function finish() {
                        target.append(subview);

                        requestAnimationFrame(function() {
                            subViewHeights[rowIdx] = subview[0].scrollHeight;
                            rowParts.css('height', grid.rowHeight(rowIdx) + "px");
                            grid.adjustHeights();
                        });
                    }
                    
                    if(record && pluginOptions.hasSubView(record) && subviewsExpanded[rowIdx]) {
                        if(!target.is(".pg-row-has-subview")) {
                            target.addClass("pg-row-has-subview");
                            target.wrapInner('<div class="pg-inner-row"></div>');
                            target.children('.pg-inner-row').css('height', $super.rowHeight(rowIdx) + "px");
                            
                            subview = $('<div class="pg-subview">');
                            
                            var promise = pluginOptions.renderSubView(record, subview);
                            
                            if(promise.then) {
                                promise.then(finish);
                            } else {
                                finish();
                            }
                        } else {
                            rowParts.css('height', grid.rowHeight(rowIdx) + "px");
                        }
                    }
                },
                
                renderCellContent: function(record, rowIdx, column, value) {
                    var content = $super.renderCellContent.apply(this, arguments);
                    if(column.subViewToggle && record && pluginOptions.hasSubView(record)) {
                        return $('<div>')
                            .addClass("pg-subview-toggle")
                            .addClass(column.subViewToggleClass || "pg-subview-toggle-default")
                            .toggleClass("pg-subview-expanded", subviewsExpanded[rowIdx] == true)
                            .add(content);
                    } else {
                        return content;
                    }
                },
                
                rowHeight: function rowHeight(start, end) {
                    if(end === undefined) {
                        return $super.rowHeight(start) + (subviewsExpanded[start] && subViewHeights[start] || 0);
                    } else {
                        return $super.rowHeight(start, end) + subViewHeights.filter(function(e,i) { return i >= start && i < end && subviewsExpanded[i] && true; }).reduce(function(a,b) { return a+(b||0);},0);
                    }
                }
            }
        });
    };
    
});