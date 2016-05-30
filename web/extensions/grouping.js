define(['../override', '../utils', '../jquery', 'jsrender/jsrender', '../extensions/treegrid', '../dragndrop',
        '../templates/grouper.html!text',
        '../templates/grouprow.html!text',
        '../templates/groupindicator.html!text'],
       function(override, utils, $, jsrender, treegrid, DragNDrop, grouperTemplate, grouprow, groupindicator) {
    "use strict";
    
    function GroupingDataSource(delegate) {
        var self = this;
        this.delegate = delegate;
        for (var x in this.delegate) {
            if (!this[x] && (typeof this.delegate[x] === "function")) {
                this[x] = this.delegate[x].bind(this.delegate);
            }
        }
        if(delegate.isReady()) {
            this.load();
        }
        
        $(delegate).on("datachanged", function(event, data) {
            self.load();
            $(self).trigger(event.type, [data]);
        });
        
        $(delegate).on("dataloaded", this.load.bind(this));
        this.groups = [];
    }
    
    GroupingDataSource.prototype = {
        load: function() {
            this.parentByIdMap = {};
            this.updateView();
        },
        
        updateView: function() {
            var ds = this;
            var groupRows = this.groupRows = {};
            var rowToGroupMap = {};
            function group(nodes, groupings, parentGroupId, level) {
                if(groupings && groupings.length) {
                    var groupMap = {},
                        groups = [],
                        col = groupings[0],
                        f = col.groupProjection && col.groupProjection(nodes) || function(v) { return v; },
                        nextGroupings = groupings.slice(1);
                    for(var x=0,l=nodes.length;x<l;x++) {
                        var g = f(utils.getValue(nodes[x], col.key));
                        var r = groupMap[g];
                        if(!r) {
                            groups.push(groupMap[g] = r = {
                                groupRow: true,
                                id: parentGroupId + g + ":",
                                description: g,
                                children: [],
                                _groupColumn: col,
                                _groupLevel: level,
                                parent: parentGroupId
                            });
                            
                            r[col.key] = g;
                        }
                        r.children.push(nodes[x]);
                        ds.parentByIdMap[nodes[x].id] = r;
                        groupRows[r.id] = r;
                    }
                    
                    for(var x=0,l=groups.length;x<l;x++) {
                        groups[x].recordCount = groups[x].children.length;
                        groups[x].children = group(groups[x].children, nextGroupings, groups[x].id, level + 1);
                    }
                    
                    return groups;
                } else {
                    for(var x=0,l=nodes.length;x<l;x++) {
                        rowToGroupMap[nodes[x].id] = parentGroupId;
                    }
                    return nodes;
                }
            }
            
            this.view = group(this.delegate.getData(), this.groups, "group:", 0);
            $(this).trigger("dataloaded");
        },
        
        group: function(groupings) {
            this.groups = groupings;
            if(this.isReady()) {
                this.updateView();
            }
        },
        
        getRecordById: function(id) {
            return this.groupRows[id] || this.delegate.getRecordById(id);
        },
        
        getData: function(start, end) {
            this.assertReady();
            if(start !== undefined || end !== undefined) {
                return this.view.slice(start, end);
            } else {
                return this.view;
            }
        },
        
        recordCount: function() {
            this.assertReady();
            return this.view.length;
        },
        
        isReady: function() {
            return this.view !== undefined;
        },
        
        assertReady: function() {
            if(!this.isReady()) {
                throw "Datasource not ready yet";
            }
        },

        parent: function(row) {
            return row.parent || this.parentByIdMap[row.id].id;
        },

        hasChildren: function(row) {
            var groupRow = this.groupRows[row.id];
            if (groupRow) {
                return groupRow.children && groupRow.children.length > 0;
            } else {
                return false;
            }
        },

        buildTree: function() {
            return this.getData();
        }
    };
    
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
            
            var groupingds = new GroupingDataSource(grid.dataSource),
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
