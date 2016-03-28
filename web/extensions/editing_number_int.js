/***
 * Editing for number fields
 * Enabled when column is of type 'INT'
 * Supports following column options:
 *  - decimalSymbol
 *  - groupSymbol
 *  - currencyPrecision
 */

define(['../override', '../jquery', '../utils', 'w2ui'], function(override, $) {

    "use strict";

    return {
        requires: {
            editing: {
                editors: {
                    int: function(record, column, value) {
                        var input = $("<input>").w2field('int', {
                            autoFormat: true,
                            groupSymbol: column.groupSymbol
                        });
                        input.value(value);
                        return input;
                    }
                }
            }
        }
    };
});