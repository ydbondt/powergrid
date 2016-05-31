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
    return {
        requires: {
            editing: true
        },

        init: function (grid, pluginOptions) {
            override(grid.editing, function ($super) {
                return {
                    createEditor: function(record, column, value) {
                        if(column.type=='date') {
                            var committed = false;
                            var input = $("<input>").datepicker({
                                dateFormat: column.format,
                                onSelect: function(value, obj) {
                                    committed = true;
                                    $(this).trigger('commit', [$(this).datepicker('getDate')]);
                                },
                                onClose: function() {
                                    if(!committed) {
                                        $(this).trigger('abort');
                                    }
                                }
                            });

                            setTimeout(function() {
                                input.datepicker('setDate', value);
                                input.datepicker('show');
                            }, 0);

                            return input;
                        } else {
                            return $super.createEditor(record, column, value);
                        }
                    }
                };
            });
        }
    };
});