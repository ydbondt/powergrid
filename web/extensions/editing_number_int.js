/***
 * Editing for number fields
 * Enabled when column is of type 'INT'
 * Supports following column options:
 *  - decimalSymbol
 *  - groupSymbol
 *  - currencyPrecision
 */

define(['override', 'jquery', 'utils', 'w2ui'], function(override, $) {

    "use strict";

    return function(grid, pluginOptions) {
        override(grid, function($super) {
            return {
                requires: {
                    editing: {
                    }
                },
                init: function() {
                    var grid = this;
                    $super.init();
                    this.options.columns.forEach(function(column) {
                        if(column.type && column.type == 'INT') {
                            w2utils.settings.decimalSymbol = column.decimalSymbol; //This overwrites the global setting, issue in w2ui 1.4.2, it doesn't support per editor decimalSymbol settings.
                            grid.editing.addEditor(column,  function(value) {
                                var input = $("<input>").w2field('int', {
                                    autoFormat: true,
                                    groupSymbol: column.groupSymbol
                                });
                                input.value(value);
                                return input;
                            })
                        }
                    });
                }
            }
        });
    };
});