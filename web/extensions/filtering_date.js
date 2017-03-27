/***
 * Filtering for date fields
 * Enabled when column is of type 'date' or 'datetime'
 * By default this uses a HTML5 date field, which is very limited and not widely supported, but does not impose new
 * dependencies. This can be overridden using the plugin options, by providing a createField function, as in the example
 * below that uses bootstrap-datetimepicker
 *
 * 'filtering_date': {
 *      createField: function(value, type, callback, fieldName) {
 *          let f = document.createElement("input");
 *          $(f).datetimepicker();
 *          let dp = $(f).data('DateTimePicker');
 *          dp.date(value);
 *          $(f).on("dp.change", function(e) {
 *              callback(e.date ? e.date.toDate() : null);
 *          });
 *          return f;
 *      }
 *  }
 *
 *  - value: initial value for the field
 *  - type: 'date' or 'datetime' depending on the column type
 *  - callback: callback to invoke when the value of the field changes
 *  - fieldName: 'before' or 'after'
 */

var sequence=1;

function nextId() {
    return "filter-option-" + (sequence++);
}

var defaults = {
    filterBoxClass: "pg-filter-box",
    filterClass: "pg-filter",
    filterInputClass: "pg-filter-input",
    filterOptionsClass: "pg-filter-optionpane",
    filterDropDownClass: "pg-filter-dropdown",
    filterOpenDropDownClass: "pg-filter-dropdown-open",
    filterFormClass: "pg-filter-form"
};

define(['../override', '../jquery', '../utils'], function(override, $, utils) {

    "use strict";

    function createEditor(type) {
        return function(column, grid) {
            var
                pluginOptions = $.extend({}, defaults, grid.options.extensions.filtering_date),
                filterBox = utils.createElement("div", {"class": pluginOptions.filterBoxClass}),
                filter = utils.createElement("div", {"class": pluginOptions.filterClass}),
                select = utils.createElement("div", {"class": pluginOptions.filterInputClass}),
                listener = utils.createEventListener(),
                filterSettings = {
                    before: null,
                    after: null
                },
                filterObj = {
                    filterBox: filterBox,
                    on: listener.on,
                    trigger : listener.trigger,
                    valueMatches: function(value, columnSettings) {
                        return value && (!columnSettings.after || value >= columnSettings.after) && (!columnSettings.before || columnSettings.before > value);
                    }
                };

            function format(value) {
                return grid.getCellTextValue(value, null, column);
            }

            function updateFilter() {
                if(filterSettings.before && filterSettings.after) {
                    select.textContent = format(filterSettings.before) + " - " + format(filterSettings.after);
                } else if(filterSettings.before) {
                    select.textContent = "< " + format(filterSettings.before);
                } else if(filterSettings.after) {
                    select.textContent = "> " + format(filterSettings.after);
                } else {
                    select.textContent = "";
                }
                filterObj.trigger("change", filterSettings);
            }

            function createField(value, callback, fieldName) {
                if(pluginOptions.createField) {
                    return pluginOptions.createField(value, type, callback, fieldName);
                } else {
                    var dateField = utils.createElement("input", {type: 'date'});
                    dateField.valueAsDate = value;
                    dateField.addEventListener("change", function(event) {
                        callback(dateField.valueAsDate);
                    });
                    return dateField;
                }
            }

            function createOptionPane() {
                var beforeDatePicker = createField(filterSettings.before, function(value) {
                        filterSettings.before = value;
                        updateFilter();
                    }, 'before'),
                    afterDatePicker = createField(filterSettings.after, function(value) {
                        filterSettings.after = value;
                        updateFilter();
                    }, 'after'),
                    form = utils.createElement("form", {"class": pluginOptions.filterFormClass},
                        [ afterDatePicker, beforeDatePicker ]),
                    pane = utils.createElement("div", {"class": pluginOptions.filterOptionsClass},
                        [ form ]
                    ),
                    optionsDropDown = utils.createElement("div", {"class": pluginOptions.filterDropDownClass}, [pane]);
                return optionsDropDown;
            }

            filterBox.addEventListener('click', function() {
                var optionDropDown = createOptionPane();
                optionDropDown.classList.add(pluginOptions.filterOpenDropDownClass);
                $("body").append(optionDropDown);
                var offset = $(this).offset();
                $(optionDropDown).css({
                    left: offset.left,
                    position: 'absolute',
                    top: offset.top + $(this).height()
                });
                $(optionDropDown).on("mousedown", function(event) {
                    event.stopPropagation();
                });
                $("body").one("mousedown", function() {
                    optionDropDown.remove();
                });
            });

            filterBox.appendChild(filter);
            filterBox.appendChild(select);

            return filterObj;
        }
    }

    return {
        requires: {
            filtering: {
                filterFactories: {
                    datetime: createEditor('datetime'),
                    date: createEditor('date')
                }
            }
        }
    };
});
