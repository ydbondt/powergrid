/**
 * Allows cells to be split into subcells. Usage:
 * {
 *     'subcells': {
 *         cellpadding: 10,
 *         cellheight: 19
 *     }
 * }
 *
 * Row height calculation becomes a bit more complicated, which is why both padding and (sub)cell height are required
 * information. It's important to note that this completely overrides row height calculation, and therefore any
 * extensions that alter the row height (e.g. subview) should be loaded after this one.
 *
 * To split a subcell, you can use the following syntax in a column key: "collection[*].property". This will split the
 * cell in a subcell for each entry in 'collection', and populate the cell with the value for 'property' of each child.
 * The order of the collection is maintained, and empty values are rendered as well, so it should display the properties
 * of the same entries on the same "subrow". The columns settings are maintained when rendering the subcells.
 *
 * Each subcell is a div with class "pg-subcell". Its height is fixed using inline style to the one provided in the
 * plugin options.
 */
define(['../override', '../utils'], function(override, utils) {
    return {
        init: function(grid, pluginOptions) {
            var MULTIROWKEY = /^(.*)\[\*\]\.(.*)$/,
                subcelltemplate = utils.createElement("div", {'class': 'pg-subcell', 'style': 'height: ' + pluginOptions.cellheight + 'px'});

            override(grid, function($super) {
                return {
                    init: function() {
                        $super.init();

                        // Parse the keys and store the result
                        this.options.columns.forEach(function(column, index) {
                            column.keySubrowDecomp = column.key.match(MULTIROWKEY);
                        });
                    },

                    renderCellContent: function(record, column) {
                        if(column.keySubrowDecomp) {
                            var collectionKey = column.keySubrowDecomp[1],
                                childKey = column.keySubrowDecomp[2],
                                collection = utils.getValue(record, collectionKey),
                                fragment = document.createDocumentFragment();

                            if(collection) {
                                for (var x = 0, l = collection.length; x < l; x++) {
                                    var subrowvalue = utils.getValue(collection[x], childKey),
                                        subcellcontent = this.renderCellValue(record, column, this.getCellTextValue(subrowvalue, record, column)),
                                        subcell = subcelltemplate.cloneNode();
                                    subcell.appendChild(subcellcontent)
                                    fragment.appendChild(subcell);
                                }
                            }

                            return fragment;
                        } else {
                            return $super.renderCellContent(record, column);
                        }
                    },

                    rowHeight: function(start, end) {
                        function height(count) {
                            return pluginOptions.cellpadding + pluginOptions.cellheight * count;
                        }
                        var h;
                        if(end === undefined) {
                            h = height(this.subcells.count(this.dataSource.getData(start, start+1)[0]));
                        } else {
                            h = this.dataSource.getData(start, end).reduce(function(total, record) {
                                return total + height(grid.subcells.count(record));
                            }, 0);
                        }
                        return h;
                    },

                    subcells: {
                        count: function(record, column) {
                            if(arguments.length == 1) {
                                // max for all columns
                                var alreadydone = {};
                                return grid.options.columns.reduce(function(count, column) {
                                    if(column.keySubrowDecomp && !alreadydone[column.keySubrowDecomp[1]]) {
                                        alreadydone[column.keySubrowDecomp[1]] = true;
                                        return Math.max(grid.subcells.count(record, column), count);
                                    } else {
                                        return count;
                                    }
                                }, 1);
                            }
                            if(column.keySubrowDecomp) {
                                var collection = utils.getValue(record, column.keySubrowDecomp[1]);
                                return collection ? collection.length : 0;
                            }
                        }
                    }
                };
            })
        }
    }

});
