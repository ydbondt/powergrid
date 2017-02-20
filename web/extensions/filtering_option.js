/***
 * Filtering for option fields
 * Enabled when column is of type 'option'
 * Generates a simple html select / option list
 */

var sequence=1;

function nextId() {
    return "filter-option-" + (sequence++);
}

var defaults = {
    filterBoxClass: "pg-filter-box pg-filter-options",
    filterClass: "pg-filter",
    filterInputClass: "pg-filter-input",
    currentFilterClass: "pg-filter-current-options",
    filterListClass: "pg-filter-dropdown-menu",
    filterDropDownClass: "pg-filter-dropdown",
    filterOpenDropDownClass: "pg-filter-dropdown-open"
};

define(['../override', '../jquery', '../utils'], function(override, $, utils) {

    "use strict";

    return {
        requires: {
            filtering: {
                filterFactories: {
                    option: function(column, grid) {
                        var
                            pluginOptions = $.extend({}, defaults, grid.options.extensions.filtering_option),
                            filterBox = utils.createElement("div", {"class": pluginOptions.filterBoxClass}),
                            filter = utils.createElement("div", {"class": pluginOptions.filterClass}),
                            select = utils.createElement("div", {"class": pluginOptions.filterInputClass}),
                            currentFilterIndicator = utils.createElement("ul", {"class": pluginOptions.currentFilterClass}),
                            selectedOptions = [],
                            listener = utils.createEventListener(),
                            filterObj = {
                                filterBox: filterBox,
                                on: listener.on,
                                trigger : listener.trigger,
                                valueMatches: function(value, columnSettings) {
                                    return columnSettings.selectedOptions.length == 0 || columnSettings.selectedOptions.indexOf(value) >= 0;
                                }
                            },
                            checkboxes,
                            options = utils.normalizeOptions(column.options);

                        function updateFilter() {
                            while(currentFilterIndicator.hasChildNodes()) {
                                currentFilterIndicator.removeChild(currentFilterIndicator.firstChild);
                            }

                            for(var x=0,l=options.length;x<l;x++) {
                                var option = options[x];
                                if(selectedOptions.indexOf(option.value) > -1) {
                                    currentFilterIndicator.appendChild(
                                        utils.createElement("li", option.label)
                                    );
                                }
                            }

                            filterObj.trigger('change', selectedOptions.length > 0 ? { selectedOptions: selectedOptions } : undefined);
                        }

                        function createDropDown() {
                            var optionList = utils.createElement("ul", { "class": pluginOptions.filterListClass }),
                                optionDropDown = utils.createElement("div", {"class": pluginOptions.filterDropDownClass}, [optionList]);

                            var allOptionsCheckbox, allOptions = utils.createElement("li", {'class': 'pg-filter-all-options'}, [
                                utils.createElement("a", [
                                    allOptionsCheckbox = utils.createElement("input", {type: 'checkbox'}),
                                    utils.createElement("label", "Select All")
                                ])
                            ]);

                            optionList.appendChild(allOptions);

                            checkboxes = options.map(function(option) {
                                var id = nextId(),
                                    optionElement = utils.createElement("li"),
                                    optionCheckBox = utils.createElement("input", {type: 'checkbox', value: option.value, id: id, checked: selectedOptions.indexOf(option.value) > -1 }),
                                    optionLabel = utils.createElement("label", {'for': id}, option.label),
                                    optionAnchor = utils.createElement("a", [optionCheckBox, optionLabel]);

                                optionElement.appendChild(optionAnchor);
                                optionList.appendChild(optionElement);

                                return optionCheckBox;
                            });

                            $(optionDropDown).on("change", "input", function(event) {
                                var cb = event.target;
                                if(cb == allOptionsCheckbox) {
                                    var allOptionsChecked = allOptionsCheckbox.checked;
                                    if(allOptionsChecked) {
                                        selectedOptions = options.map(function(option) {
                                            return option.value;
                                        });
                                    } else {
                                        selectedOptions = [];
                                    }

                                    checkboxes.forEach(function(cb) {
                                        cb.checked = allOptionsChecked;
                                    });

                                    updateFilter();

                                    allOptionsCheckbox.indeterminate = false;
                                } else {
                                    if(cb.checked) {
                                        selectedOptions = selectedOptions.concat([cb.value]);
                                    } else {
                                        selectedOptions = selectedOptions.filter(function(v) {
                                            return v != cb.value
                                        });
                                    }

                                    if(selectedOptions.length == options.length) {
                                        allOptionsCheckbox.indeterminate = false;
                                        allOptionsCheckbox.checked = true;
                                    } else if(selectedOptions.length == 0) {
                                        allOptionsCheckbox.indeterminate = false;
                                        allOptionsCheckbox.checked = false;
                                    } else {
                                        allOptionsCheckbox.indeterminate = true;
                                        allOptionsCheckbox.checked = true;
                                    }

                                    updateFilter();
                                }
                            });

                            return optionDropDown;
                        }

                        filterBox.addEventListener('click', function() {
                            var optionDropDown = createDropDown();
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
                        select.appendChild(currentFilterIndicator);

                        return filterObj;
                    }
                }
            }
        }
    };
});
