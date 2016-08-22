define(['../override', 'vein', '../utils'], function(override, vein, utils) {
    "use strict";
    
    return function(grid, pluginOptions) {
        override(grid, function($super) {
            var subViewHeights = [];
            var subviewsExpanded = {};
            return {
                init: function() {
                    $super.init();
                    
                    this.container.on("click", ".pg-subview-toggle", function(event) {
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
                findRow: function(rowId) {
                    var row = $super.findRow(rowId);
                    var innerRow = row.find('.pg-inner-row');
                    return innerRow.length == 0 ? row : innerRow;
                },

                subviews: {
                    autoExpand: function(filter) {
                        var data = grid.dataSource.getData();
                        for (var i = 0, j=data.length; i < j; i++) {
                            var row = data[i];
                            if (filter.apply(this, [row.id, grid.dataSource])) {
                                this.expandView(row, i);
                            }
                        }
                    },
                    expandView: function(record, rowIdx) {
                        var rowParts = grid.getRowPartsForIndex(rowIdx);
                        if(!subviewsExpanded[record.id]) {
                            subviewsExpanded[record.id] = true;
                            grid.afterRenderRow(record, rowIdx, rowParts.toArray());
                            rowParts.find('.pg-subview-toggle').addClass('pg-subview-expanded');
                        }
                    },

                    collapseView: function(record, rowIdx) {
                        var rowParts = grid.getRowPartsForIndex(rowIdx);
                        if(subviewsExpanded[record.id]) {
                            subviewsExpanded[record.id] = false;
                            rowParts.css("height", grid.rowHeight(rowIdx) + "px");
                            rowParts.find('.pg-subview-toggle').removeClass('pg-subview-expanded');
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
                            rowParts.forEach(function(part) {
                                part.style.height = grid.rowHeight(rowIdx) + "px";
                            });
                            grid.adjustHeights();
                        });
                    }
                    
                    if(record && pluginOptions.hasSubView(grid, record) && subviewsExpanded[record.id]) {
                        if(!target.is(".pg-row-has-subview")) {
                            target.addClass("pg-row-has-subview");
                            rowParts.forEach(function(i,e) {
                                var wrapper = document.createElement("div");
                                wrapper.setAttribute('class', 'pg-inner-row');
                                wrapper.setAttribute('style', 'height: ' + $super.rowHeight(rowIdx) + "px");
                                while(i.hasChildNodes()) {
                                    wrapper.appendChild(i.firstChild);
                                }
                                i.appendChild(wrapper);
                            });
                            
                            subview = $('<div class="pg-subview">');
                            subview.attr("id", (grid.target.attr("id") || "subview") + "-" + record.id);
                            
                            var promise = pluginOptions.renderSubView(grid, record, subview[0]);
                            subview.on("resize", finish);
                            
                            target.append(subview);
                            
                            if(promise.then) {
                                promise.then(finish);
                            } else {
                                finish();
                            }
                        } else {
                            rowParts.forEach(function(part) {
                                part.style.height = grid.rowHeight(rowIdx) + "px";
                            });
                        }
                    }
                    
                    $super.afterRenderRow(record, rowIdx, rowParts);
                },
                
                renderCellContent: function(record, column, value) {
                    var content = $super.renderCellContent.apply(this, arguments);
                    if(column.subViewToggle && record && pluginOptions.hasSubView(grid, record)) {
                        var frag = document.createDocumentFragment();
                        var subview = document.createElement("div");
                        subview.classList.add("pg-subview-toggle");
                        subview.classList.add(column.subViewToggleClass || "pg-subview-toggle-default");
                        if(subviewsExpanded[record.id] == true) {
                            subview.classList.add("pg-subview-expanded");
                        }

                        frag.appendChild(subview);
                        if(content) {
                            frag.appendChild(content);
                        }
                        return frag;
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
