define(['../override', 'vein', '../utils'], function(override, vein, utils) {
    "use strict";
    
    return {
        loadFirst: ['subcells'],
        init: function(grid, pluginOptions) {
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
                                rowParts.addClass('pg-subview-expanded');
                            }

                            rowParts.each(function (i, part) {
                                part.style.height = grid.rowHeight(rowIdx) + "px";
                            });
                        },

                        collapseView: function(record, rowIdx) {
                            var rowParts = grid.getRowPartsForIndex(rowIdx);
                            if(subviewsExpanded[record.id]) {
                                subviewsExpanded[record.id] = false;
                                rowParts.css("height", grid.rowHeight(rowIdx) + "px");
                                rowParts.removeClass('pg-subview-expanded');
                            }

                            rowParts.each(function (i, part) {
                                part.style.height = grid.rowHeight(rowIdx) + "px";
                            });
                        },

                        hasSubView: function(record) {
                            if(typeof pluginOptions.hasSubView === 'function') {
                                var v = pluginOptions.hasSubView(grid, record);
                                if(v !== undefined) return v;
                            }
                            if(typeof grid.dataSource.hasSubView === 'function') {
                                var v = grid.dataSource.hasSubView(record);
                                if(v !== undefined) return v;
                            }
                            return false;
                        },

                        subview: function (id) {
                            return grid.container.find("> .pg-rowgroup > .pg-container > .pg-row.pg-row-has-subview[data-row-id='" + id + "'] > .pg-subview-container > .pg-subview");
                        }
                    },

                    afterRenderRow: function(record, rowIdx, rowParts) {
                        var target = $(rowParts[0]), subview;

                        function finish() {
                            requestAnimationFrame(function() {
                                target.addClass('pg-row-subview-rendered');
                                subViewHeights[record.id] = subview[0].scrollHeight;
                                rowParts.forEach(function(part) {
                                    part.style.height = grid.rowHeight(rowIdx) + "px";
                                });
                                grid.adjustHeights();
                            });
                        }

                        if (record && grid.subviews.hasSubView(record) && (pluginOptions.prerender || subviewsExpanded[record.id])) {
                            if (!target.is(".pg-row-has-subview")) {
                                rowParts.forEach(function (i, e) {
                                    var wrapper = document.createElement("div");
                                    wrapper.setAttribute('class', 'pg-inner-row');
                                    wrapper.setAttribute('style', 'height: ' + $super.rowHeight(rowIdx) + "px");
                                    while (i.hasChildNodes()) {
                                        wrapper.appendChild(i.firstChild);
                                    }
                                    i.appendChild(wrapper);
                                    i.setAttribute('class', i.getAttribute('class') + ' pg-row-has-subview');
                                });

                                subview = $('<div class="pg-subview">');
                                subview.on("resize", finish);
                                subview.attr("id", (grid.target.attr("id") || "subview") + "-" + record.id);

                                var subviewcontainer = $('<div class="pg-subview-container">');
                                subviewcontainer.css('top', $super.rowHeight(rowIdx));
                                subviewcontainer.append(subview);

                                target.append(subviewcontainer);
                            } else {
                                subview = [rowParts[0].querySelector(".pg-subview")];
                            }

                            if (subviewsExpanded[record.id] && !target.is(".pg-row-subview-rendered")) {
                                var promise = pluginOptions.renderSubView(grid, record, subview[0]);
                                if (promise.then) {
                                    promise.then(finish);
                                } else {
                                    finish();
                                }
                            }

                            if(subviewsExpanded[record.id] == true) {
                                target.addClass('pg-subview-expanded');
                            }
                        }

                        $super.afterRenderRow(record, rowIdx, rowParts);
                    },

                    renderCellContent: function(record, column, value) {
                        var content = $super.renderCellContent.apply(this, arguments);
                        if(column.subViewToggle && record && grid.subviews.hasSubView(record)) {
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
        }
    };
    
});
