define(['../override', '../jquery', '../datasources/treegriddatasource'], function(override, $, TreeGridDataSource) {
    
    "use strict";
    
    return {
        loadFirst: ['templating', 'grouping'],
        init: function(grid, pluginOptions) {
            override(grid, function($super) {
                var treeDS;
                if(pluginOptions.autoTreeDataSource !== false) {
                    treeDS = new TreeGridDataSource(this.dataSource, pluginOptions);
                } else {
                    treeDS = this.dataSource;
                }

                return {
                    init: function() {
                        $super.init();

                        this.container.on("click", ".pg-treetoggle", function(event) {
                            var row = $(this).parents(".pg-row").first(),
                                rowId = row.attr("data-row-id");

                            treeDS.toggle(rowId);

                            event.stopPropagation();
                            event.preventDefault();
                        });

                        $(treeDS).on("treetoggled", function(event, ui) {
                            grid.target.find(".pg-row[data-row-id='" + ui.id + "']").toggleClass("pg-tree-expanded", ui.state);
                        });
                    },
                    
                    afterRenderRow: function(record, idx, rowparts) {
                        $super.afterRenderRow(record, idx, rowparts);
                        $(rowparts).toggleClass("pg-tree-expanded", treeDS.treeSettings(record).expanded);
                    },

                    renderCellContent: function(record, column) {
                        var content = $super.renderCellContent.apply(this, arguments);
                        if(column.treeColumn) {
                            var el = document.createElement("div");
                            el.classList.add((this.dataSource.hasChildren(record)) ? "pg-treetoggle" : "pg-treeleaf");
                            el.classList.add('pg-tree-level-' + treeDS.treeSettings(record).depth);

                            var frag = document.createDocumentFragment();
                            frag.appendChild(el);
                            frag.appendChild(content);
                            return frag;
                        } else {
                            return content;
                        }
                    },

                    dataSource: treeDS,
                    
                    treegrid: {
                        expandAll: function() {
                            treeDS.expandAll();
                        },
                        
                        collapseAll: function() {
                            treeDS.collapseAll();
                        }
                    }
                }
            });
        }
    };
    
});
