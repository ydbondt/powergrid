/***
 * Filtering for option fields
 * Enabled when column is of type 'option'
 * Generates a simple html select / option list
 */

var sequence=1;

function nextId() {
    return "filter-option-" + (sequence++);
}

define(['../override', '../jquery', '../utils'], function(override, $, utils) {

    "use strict";

    return {
        requires: {
            filtering: {
                filterFactories: {
                    option: function(column, grid) {
                        var filterBox = utils.createElement("div", {"class": "pg-filter-box pg-filter-options"}),
                            filter = utils.createElement("div", {"class": "pg-filter"}),
                            select = utils.createElement("div", {"class": "pg-filter-input"}),
                            currentFilterIndicator = utils.createElement("span"),
                            optionList = utils.createElement("ul"),
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
                            checkboxes;

                        filterBox.addEventListener('click', function() {
                            filterBox.classList.add("pg-focus");
                            $("body").one("click", "*", function() {
                                filterBox.classList.remove("pg-focus");
                            });
                        });

                        filterBox.appendChild(filter);
                        filterBox.appendChild(select);
                        select.appendChild(currentFilterIndicator);
                        select.appendChild(optionList);

                        var options = utils.normalizeOptions(column.options);

                        var allOptionsCheckbox, allOptions = utils.createElement("li", {'class': 'pg-filter-all-options'}, [
                            allOptionsCheckbox = utils.createElement("input", {type: 'checkbox'}),
                            utils.createElement("label", "Select All")
                        ]);

                        optionList.appendChild(allOptions);

                        checkboxes = options.map(function(option) {
                            var id = nextId(),
                                optionElement = utils.createElement("li"),
                                optionCheckBox = utils.createElement("input", {type: 'checkbox', value: option.value, id: id}),
                                optionLabel = utils.createElement("label", {'for': id}, option.label);

                            optionElement.appendChild(optionCheckBox);
                            optionElement.appendChild(optionLabel);
                            optionList.appendChild(optionElement);
                            return optionCheckBox;
                        });

                        $(filterBox).on("change", "input", function(event) {
                            var cb = event.target;
                            console.log(cb, cb.value, cb.checked);
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

                                filterObj.trigger('change', {
                                    selectedOptions: selectedOptions
                                });

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

                                filterObj.trigger('change', {
                                    selectedOptions: selectedOptions
                                });
                            }
                        });

                        return filterObj;
                    }
                }
            }
        }
    };
});
