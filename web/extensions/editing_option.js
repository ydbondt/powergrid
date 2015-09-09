/***
 * Editing for option fields
 * Enabled when column is of type 'option'
 * Generates a simple html select / option list
 */

define(['../override', 'jquery', '../utils'], function(override, $) {

    "use strict";

    return {
        requires: {
            editing: {
                editors: {
                    option: function(record, column, value) {
                        var select = $("<select>");
                        var optionElement =  $('<option>');
                        optionElement.text("");
                        optionElement.value(null);
                        select.append(optionElement);
                        for (var i = 0; i < column.options.length; i++) {
                            optionElement = $('<option>');
                            var option = column.options[i];
                            optionElement.text(option.label);
                            optionElement.value(option.value);
                            if (value === option.value) {
                                optionElement.attr('selected', '');
                            }
                            select.append(optionElement);
                        }
                        return select;
                    }
                }
            }
        }
    };
});