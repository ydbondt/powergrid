/**
 * Will display columns with type "checkbox" or "radio" as respective inputs
 */
define(['jquery','override'], function($, override) {
    "use strict";
    
    return {
        loadFirst: ['editing'],
        init: function(grid, pluginOptions) {
            override(grid, function($super) {
                if(grid.editing) {
                    override(grid.editing, function($superEditing) {
                        return {
                            startEdit: function(target, key, record, rowIdx) {
                                var column = grid.getColumnForKey(key);
                                if(grid.directinput.isDirectInput(column)) {
                                    return;
                                } else {
                                    $superEditing.startEdit(target, key, record, rowIdx);
                                }
                            }
                        };
                    });
                }
                
                return {
                    init: function() {
                        $super.init();
                        
                        this.container.on("change", ".pg-directinput", function(evt) {
                            var self = this;
                            var cell = $(this).parents(".pg-cell:eq(0)"),
                                row = cell.parents(".pg-row:eq(0)"),
                                key = cell.attr("data-column-key"),
                                rowId = row.data("row-id");
                            
                            grid.dataSource.setValue(rowId, key, this.checked);
                            if (grid.getColumnForKey(key).type === "radio") {
                                cell.parent().siblings().each(function(index, el) {
                                    grid.dataSource.setValue($(el).data("row-id"), key, !self.checked);
                                });
                            }
                        });
                    },
                    
                    renderCellContent: function(record, column) {
                        var value = record[column.key];
                        if(this.directinput.isDirectInput(column)) {
                            var input;
                            if((value === null || value === undefined) && column.hideOnNull !== false) {
                                input = $();
                            } else {
                                input = this.directinput.createInput(record, column, value);
                            }
                            
                            if(column.template) {
                                return input.add($super.renderCellContent(record, column));
                            } else {
                                return input;
                            }
                        } else {
                            return $super.renderCellContent(record, column, value);
                        }
                    },
                    
                    directinput: {
                        isDirectInput: function(column) {
                            return column.type === 'checkbox' || column.type === 'radio';
                        },
                            
                        createInput: function(record, column, value) {
                            var control = $("<input type='" + column.type + "' class='pg-directinput'>").attr("checked", value);

                            if(!grid.editing || !grid.editing.isEditable(record, column)) {
                                control.attr("disabled", true);
                            }

                            return control;
                        }
                    }
                }
            });
        }
    };
    
});