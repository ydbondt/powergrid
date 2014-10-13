define(['override', 'utils', 'jquery', 'jsrender', 'promise', 'extensions/treegrid', 'dragndrop', 'text!../templates/grouper.html',
        'text!../templates/grouprow.html', 'text!../templates/groupindicator.html'],
       function(override, utils, $, jsrender, Promise, treegrid, DragNDrop, grouperTemplate, grouprow, groupindicator) {
    "use strict";
    
    function GroupingDataSource(delegate) {
        this.delegate = delegate;
        if(delegate.isReady()) {
            this.load();
        }
        
        $(delegate).on("dataloaded", this.load.bind(this));
        this.groups = [];
    }
    
    GroupingDataSource.prototype = {
        load: function() {
            this.updateView();
        },
        
        updateView: function() {
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
                        var g = f(nodes[x][col.key]);
                        var r = groupMap[g];
                        if(!r) {
                            groups.push(groupMap[g] = r = {
                                groupRow: true,
                                id: parentGroupId + g + ":",
                                description: g,
                                children: [],
                                _groupColumn: col,
                                _groupLevel: level
                            });
                            
                            r[col.key] = g;
                        }
                        r.children.push(nodes[x]);
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
            this.updateView();
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
                        var groupSettings = grid.loadSetting("grouping");
                        if (groupSettings !== undefined && groupSettings !== null && groupSettings !== "") {
                            this.grouping.groups = groupSettings;
                        }
                        $super.init();
                        
                        this.target.on("click", ".pg-grouping-grouptoggle", function(event) {
                            var toggle = this,
                                groupId = $(toggle).attr("data-id");
                            
                            treeds.toggle(groupId);
                        });
                        
                        var grouper = $(grouperTemplate);
                        this.columnheadercontainer.addClass("pg-grouping-enabled").prepend(grouper);
                        
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

                        $(this.dataSource).one("dataloaded", function(event) {
                            var groupSettings = grid.loadSetting("grouping");
                            if (groupSettings !== undefined && groupSettings !== null && groupSettings !== "") {
                                grid.grouping.groups = groupSettings;
                                groupSettings.forEach(function(group) {
                                    self.grouping.grouper.append(grid.grouping.renderGroupIndicator(group));
                                });
                                grid.grouping.updateGroups();
                            }
                        });
                    },
                    
                    headerHeight: function() {
                        return $super.headerHeight() + this.target.find(".pg-grouper").outerHeight();
                    },
                    
                    renderRowToParts: function(record, rowIdx, rowFixedPartLeft, rowScrollingPart, rowFixedPartRight) {
                        if(record.groupRow) {
                            var firstPart = rowFixedPartLeft || rowScrollingPart || rowFixedPartRight;
                            firstPart.addClass("pg-grouping-grouprow");
                            firstPart.html(groupRowTemplate.render(record, { column: record._groupColumn }));
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
                            grid.renderData();
                            grid.saveSetting("grouping", this.groups);
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
                        }
                    }
                };
            });
        }
   };
});