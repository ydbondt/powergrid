define(['../override'], function(override) {

    return {
        init: function(grid) {
            override(grid, function($super) {
                return {
                    renderData: function() {
                        $super.renderData.apply(this, arguments);

                        this.renderBackdrop(this.scrollinggroup);
                    },

                    renderBackdrop: function(rowgroup) {
                        var rowFixedPartLeft = rowgroup.left && $("<div class='pg-fixed pg-backdrop'>"),
                            rowScrollingPart = rowgroup.scrolling && $("<div class='pg-scrolling pg-backdrop'>"),
                            rowFixedPartRight = rowgroup.right && $("<div class='pg-fixed pg-backdrop'>"),
                            rowParts = $();

                        if(rowgroup.left) rowgroup.left.append(rowFixedPartLeft);
                        if(rowgroup.scrolling) rowgroup.scrolling.append(rowScrollingPart);
                        if(rowgroup.right) rowgroup.right.append(rowFixedPartRight);

                        if(rowFixedPartLeft) rowParts = rowParts.add(rowFixedPartLeft);
                        if(rowScrollingPart) rowParts = rowParts.add(rowScrollingPart);
                        if(rowFixedPartRight) rowParts = rowParts.add(rowFixedPartRight);

                        for(var y = 0; y < this.options.columns.length; y++) {
                            var cell, column = this.options.columns[y];
                            cell = $("<div class='pg-column-backdrop'>");

                            cell.addClass("pg-column" + this.normalizeCssClass(column.key));
                            cell.attr("data-column-key", column.key);

                            if(y < this.options.frozenColumnsLeft) {
                                rowFixedPartLeft.append(cell);
                            } else if(y > this.options.columns.length - this.options.frozenColumnsRight - 1) {
                                rowFixedPartRight.append(cell);
                            } else {
                                rowScrollingPart.append(cell);
                            }
                        }
                    }
                };
            })
        }
    };

});
