define(['override', 'jquery', 'utils'], function(override, $) {
    
    "use strict";
    
    // Adds treegrid functionality to the grid.
    // This works by wrapping the datasource in a TreeGridDataSource whose data can change
    // depending on which rows are collapsed or expanded.
    
    function TreeGridDataSource(delegate) {
        this.delegate = delegate;
        
        if(delegate.isReady()) {
            this.load();
        }
        
        $(delegate).on("dataloaded", this.load.bind(this));
    }

    TreeGridDataSource.prototype = {
        isReady: function() {
            return this.view !== undefined;
        },
        
        assertReady: function() {
            if(!this.isReady()) {
                throw "Datasource not ready yet";
            }
        },
        
        load: function() {
            this.tree = this.buildTree(this.delegate.getData());
            this.view = this.initView(this.tree, 0);
            $(this).trigger("dataloaded");
        },
        
        initView: function(data, initialTreeDepth) {
            var view = [];
            
            function calcDepth(nodes, depth) {
                nodes.forEach(function(x) {
                    x.__depth = depth;
                    x.__expanded = depth < (initialTreeDepth || 0);
                    if(depth <= (initialTreeDepth || 0)) {
                        view.push(x);
                    }
                    if(x.children && x.children.length) {
                        calcDepth(x.children, depth+1);
                    }
                });
            }
            
            calcDepth(data, 0);
            
            return view;
        },
        
        buildTree: function(data) {
            var rootNodes = [],
                recordByIdMap = {};
            
            for(var x=0,l=data.length;x<l;x++) {
                var r = data[x];
                recordByIdMap[r.id] = r;
                if(r.parent) {
                    var parent = recordByIdMap[r.parent];
                    if(!parent.children) {
                        parent.children = [];   
                    }
                    parent.children.push(r);
                } else {
                    rootNodes.push(r);
                }
            }
            
            return rootNodes;
        },
        
        getRecordById: function(id) {
            return this.delegate.getRecordById(id);
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
        
        toggle: function(rowId) {
            var row,x,l,start,end,startDepth;
            for(x=0,l=this.view.length; x<l; x++) {
                if(!row && this.view[x].id == rowId) {
                    row = this.view[x];
                    startDepth = row.__depth;
                    start = x;
                } else if(start !== undefined && row.__expanded) {
                    if(this.view[x].__depth <= startDepth) {
                        end = x;
                        break;
                    }
                }
            }

            if(row.__expanded) {
                // collapse it. we must remove some rows from the view.
                row.__expanded = false;
                this.view.splice(start+1, end-start-1);
                $(this).trigger('rowsremoved',{start: start+1, end: end});
            } else {
                // expand it. then we must insert rows
                row.__expanded = true;
                var rows = this.flattenSubTree(row.children);
                this.view.splice.apply(this.view, [start+1, 0].concat(rows));
                $(this).trigger('rowsadded',{start: start+1, end: end});
            }
        },

        flattenSubTree: function(nodes) {
            var out = [];
            function f(nodes) {
                for(var x=0,l=nodes.length;x<l;x++) {
                    var node = nodes[x];
                    out.push(node);
                    if(node.children && node.__expanded) {
                        f(nodes[x].children);
                    }
                }
            }
            if(nodes) f(nodes);
            return out;
        }
    };
    
    return function(grid, pluginOptions) {
        var treedepths = [],
            data,
            view;
        
        override(grid, function($super) {
            var treeDS = new TreeGridDataSource(this.dataSource);
            
            return {
                init: function() {
                    $super.init();
                    
                    this.target.on("click", ".pg-treetoggle", function(event) {
                        var row = $(this).parents(".row").first(),
                            rowId = row.attr("data-row-id");
                        
                        treeDS.toggle(rowId);
                        
                        event.stopPropagation();
                    });
                },
                
                renderCellContent: function(record, column, value) {
                    var content = $super.renderCellContent.apply(this, arguments);
                    if(column.treeColumn) {
                        return $('<div>')
                            .addClass((record.children && record.children.length) ? "pg-treetoggle" : "pg-treeleaf")
                            .addClass('pg-tree-level-' + record.__depth)
                            .toggleClass("pg-tree-expanded", record.__expanded)
                            .add(content);
                    } else {
                        return content;
                    }
                },
                
                dataSource: treeDS
            }
        });
    };
    
});