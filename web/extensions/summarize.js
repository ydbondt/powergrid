define(['../override', '../datasources/summarizingdatasource'],
    function(override, SummarizingDataSource) {
        "use strict";

        return {
            conflicts: ['treegrid'],
            loadFirst: ['grouping', 'filtering', 'treegrid', 'sorting'],

            init: function(grid, pluginOptions) {
                return override(grid, function($super) {
                    return {
                        init: function() {
                            $super.init();
                            this.dataSource = new SummarizingDataSource(this.dataSource, pluginOptions.summaryFactory);
                        }
                    }
                });
            }
        }
    }
);
