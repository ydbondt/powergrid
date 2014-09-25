define(['override', 'jquery', 'utils'], function(override, $) {
    
    "use strict";
    
    return function(grid, pluginOptions) {
        override(grid, function($super) {
            return {
                renderCell: function(record, column, rowIndex, columnIndex) {
                    var cell = $super.renderCell.apply(this, arguments);

                    var editable = column.editable;
                    if(editable && typeof pluginOptions.isEditable === 'function') {
                        editable = pluginOptions.isEditable(rowIndex, columnKey);
                    }
                    if(editable) {
                        cell.addClass("pg-editable");
                    }
                    
                    return cell;
                },
                
                init: function() {
                    var grid = this;
                    
                    $super.init();
                    
                    this.target.on("click", ".cell", function(event) {
                        var targetCell = event.target;
                        while(targetCell && !$(targetCell).is('.cell')) {
                            targetCell = targetCell.parentNode;
                        }
                        
                        var key = $(targetCell).attr('data-column-key');
                        var rowId = $(targetCell).parent().attr('data-row-id');
                        var record = grid.dataSource.getRecordById(rowId);
                        
                        grid.editing.startEdit(targetCell, key, rowId, record);
                    });
                },
                
                editing: {
                    grid: grid,
                    startEdit: function(target, key, rowId, record) {
                        var column = grid.getColumnForKey(key);
                        var oldValue = record[key];
                        var editor = this.createEditor(column, oldValue);
                        var editing = this;
                        
                        if($(target).is('.pg-editing')) return;
                        
                        if(!column.editable) return;
                        
                        var opts = {
                            target: target,
                            key: key,
                            rowId: rowId,
                            record: record
                        };
                        
                        var beforeEditEvent = new $.Event('beforeEdit', opts);
                        $(grid).trigger(beforeEditEvent);
                        
                        if(beforeEditEvent.isPropagationStopped()) {
                            return;
                        }
                        
                        
                        $(editor).on('commit', function(event, value, move) {
                            editing.commit(target, rowId, record, column, value, oldValue, move);
                        }).on('abort', function(event) {
                            editing.abort(target, rowId, record, column, oldValue);
                        });
                        $(target).addClass('pg-editing').empty().append(editor);
                    },
                    
                    commit: function(target, rowId, record, column, value, oldValue, move) {
                        grid.options.dataSource.setValue(rowId, column.key, value);
                        this.endEdit(target, record, column, value);
                    },
                    
                    abort: function(target, rowId, record, column, oldValue) {
                        this.endEdit(target, record, column, oldValue);
                    },
                    
                    endEdit: function(target, record, column, value) {
                        $(target).empty().append(grid.renderCellContent(record, column, value)).removeClass('pg-editing');
                    },

                    createEditor: function(column, value) {
                        var editor = $("<input>").val(value);
                        var grid = this;
                        editor.on("keydown", function(event) {
                            switch(event.keyCode) {
                            case 13:
                                $(this).trigger('commit', [this.value, 1]); break;
                            case 27:
                                $(this).trigger('abort'); break;
                            case 9:
                                $(this).trigger('commit', [this.value, 2]); break;
                            }
                        });

                        editor.on("blur", function(event) {
                            if(pluginOptions.commitOnBlur !== false) {
                                $(this).trigger('commit', [this.value]);
                            } else if(pluginOptions.abortOnBlur === true) {
                                $(this).trigger('abort');
                            }
                        });

                        setTimeout(editor[0].select.bind(editor[0]), 10);
                        return editor;
                    }
                }
            }
        });
    };
    
});