define(['override', 'vein', 'utils', 'promise'], function(override, vein, utils, Promise) {
    "use strict";
    
    return {
        requires: {
            subview: {
                hasSubView: function(grid, record) {
                    return grid.subgrids.hasSubGrid(record);
                },
                
                renderSubView: function(grid, record, target) {
                    return grid.subgrids.renderSubGrid(record, target);
                }
            }
        },
        
        init: function(grid, pluginOptions) {
            override(grid, function($super) {
                return {
                    subgrids: {
                        hasSubGrid: function(record) {
                            return pluginOptions.hasSubGrid(grid, record);
                        },
                        
                        renderSubGrid: function(record, target) {
                            return Promise.resolve(pluginOptions.subGridSettings(record))
                                    .then(function(options) {
                                        return target.PowerGrid(options).promise;
                                    });
                        }
                    }
                }
            });
        }
    }
});