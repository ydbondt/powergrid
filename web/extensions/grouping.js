define(['../override', '../utils', '../jquery', 'jsrender/jsrender', '../extensions/treegrid', '../dragndrop', '../datasources/groupingdatasource',
        '../templates/grouper.html!text',
        '../templates/grouprow.html!text',
        '../templates/groupindicator.html!text'],
       function(override, utils, $, jsrender, treegrid, DragNDrop, GroupingDataSource, grouperTemplate, grouprow, groupindicator) {
    "use strict";
    
    return {
        conflicts: ['treegrid'],
        requires: {
            dragging: {
                allowDragOutsideOfViewPort: true
            },
            treegrid: {
                autoTreeDataSource: false
            }
        },
        init: function(grid, pluginOptions) {
            
            var groupingds = (typeof grid.dataSource.group  === 'function' ? grid.dataSource : new GroupingDataSource(grid.dataSource)),
                treeds = new treegrid.TreeGridDataSource(groupingds),
                groupRowTemplate = $.templates(grouprow),
                groupIndicatorTemplate = $.templates(groupindicator);
            
            grid.dataSource = treeds;
            
            return override(grid,function($super) {
                return {
                    init: function() {
                        $super.init();

                        var groupKeys = grid.loadSetting("grouping");
                        if ((!groupKeys || groupKeys.length == 0) && pluginOptions.defaultGroupedColumns) {
                            groupKeys = pluginOptions.defaultGroupedColumns;
                        }
                        var groupSettings = groupKeys && groupKeys.map(this.getColumnForKey.bind(this));
                        if (groupSettings !== undefined && groupSettings !== null && groupSettings !== "") {
                            this.grouping.groups = groupSettings;
                            this.grouping.updateGroups();
                        }
                        
                        this.container.on("click", ".pg-grouping-grouptoggle", function(event) {
                            var toggle = this,
                                groupId = $(toggle).attr("data-id");
                            
                            treeds.toggle(groupId);
                        });
                        
                        var grouper = $(grouperTemplate);
                        this.columnheadercontainer.addClass("pg-grouping-enabled").prepend(grouper);
                        
                        if(this.grouping.groups) {
                            this.grouping.groups.forEach(function(group) {
                                grouper.append(grid.grouping.renderGroupIndicator(group));
                            });
                        }
                        
                        grouper.on("click", ".pg-group-delete", function(event) {
                            grid.grouping.removeGroupBy(grid.getColumnForKey($(this).attr("data-group-key")));
                            event.stopPropagation();
                            event.stopImmediatePropagation();
                            event.preventDefault();
                        }).on("mousedown", ".pg-group-delete", utils.cancelEvent);
                        
                        this.grouping.initReordering(grouper);
                        
                        this.grouping.grouper = grouper;
                        
                        grouper.on("columndropped", function(event) {
                            grid.grouping.addGroupBy(event.column);
                        }).on("columndragenter", function(event) {
                            if(grid.grouping.groups.indexOf(event.column) > -1) {
                                event.preventDefault();
                            }
                        });
                    },
                    
                    headerContainerHeight: function() {
                        return $super.headerContainerHeight() + this.target.find(".pg-grouper").outerHeight();
                    },
                    
                    renderRowToParts: function(record, rowIdx, rowFixedPartLeft, rowScrollingPart, rowFixedPartRight) {
                        if(record.groupRow) {
                            var firstPart = rowFixedPartLeft || rowScrollingPart || rowFixedPartRight;
                            $(firstPart).addClass("pg-grouping-grouprow");

                            var groupToggle = document.createElement("span");
                            groupToggle.className = "pg-grouping-grouptoggle pg-tree-level-" + record._groupLevel;
                            groupToggle.setAttribute("data-id", record.id);

                            $(firstPart).empty().append(groupToggle).append((pluginOptions.renderGroupRow || this.grouping.renderGroupRow)(record._groupColumn, record));
                        } else {
                            $super.renderRowToParts(record, rowIdx, rowFixedPartLeft, rowScrollingPart, rowFixedPartRight);
                        }
                    },
                    
                    grouping: {
                        groups: [],
                        
                        initReordering: function(grouper) {
                            new DragNDrop(grouper, ".pg-group-indicator", ".pg-group-indicator");

                            var newOrder;
                            
                            grouper.on("customdragstart", function(event) {
                            }).on("customdragover", ".pg-group-indicator", function(event) {
                                var targetKey = $(this).attr("data-group-key"),
                                    dragKey = $(event.dragee).attr("data-group-key"),
                                    gKeys = (newOrder || grid.grouping.groups).map(function(e) { return e.key; }),
                                    tIdx = gKeys.indexOf(targetKey),
                                    dIdx = gKeys.indexOf(dragKey);

                                if(tIdx < dIdx && event.pageX < ($(this).offset().left + $(event.dragee).outerWidth())) {
                                    $(this).before(event.dragee.detach());
                                } else if(dIdx < tIdx) {
                                    $(this).after(event.dragee.detach());
                                }
                                newOrder = grouper.children(".pg-group-indicator").map(function(i,e) {
                                    return grid.getColumnForKey( $(e).attr("data-group-key") );
                                }).toArray();
                            }).on("customdragend", ".pg-group-indicator", function(event) {
                                if(newOrder !== undefined) {
                                    grid.grouping.groups = newOrder;
                                    grid.grouping.updateGroups();
                                    newOrder = undefined;
                                }
                            });
                        },
                        
                        addGroupBy: function(column) {
                            this.groups.push(column);
                            this.grouper.append(this.renderGroupIndicator(column));
                            this.updateGroups();
                        },
                        
                        removeGroupBy: function(column) {
                            var indicator = this.grouper.find(".pg-group-indicator[data-group-key='" + column.key +"']");
                            indicator.remove();
                            this.groups.splice(this.groups.indexOf(column), 1);
                            this.updateGroups();
                        },
                        
                        updateGroups: function() {
                            groupingds.group(this.groups);
                            grid.trigger("groupingchanged", this.groups);
                            grid.target.attr("data-group-leaf-level", this.groups.length);
                            if(groupingds.isReady()) {
                                grid.renderData();
                            }
                            grid.saveSetting("grouping", this.groups.map(function(column) { return column.key; }));
                        },
                        
                        updateGrouper: function() {
                            var grouper = this.grouper.empty();
                            this.target.attr("data-group-leaf-level", this.groups.length);
                            this.groups.forEach(function(e) {
                                grouper.append(grid.grouping.renderGroupIndicator(e));
                            });
                        },
                        
                        renderGroupIndicator: function(column) {
                            return groupIndicatorTemplate.render(column);
                        },

                        renderGroupRow: function(column, record) {
                            // <span class="pg-grouping-grouptoggle pg-tree-level-{{:_groupLevel}}" data-id="{{:id}}"></span>
                            return $(groupRowTemplate.render(record, { column: record._groupColumn }));
                        }
                    }
                };
            });
        }
   };
});
