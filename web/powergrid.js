define(['jquery', 'vein'], function($, vein) {
	"use strict";
	
    function determineScrollBarSize() {
        // Creates a dummy div just to measure the scrollbar sizes, then deletes it when it's no longer necessary.
        var dummy = $("<div style='overflow: scroll; width: 100px; height: 100px; visibility: none; opacity: 0'></div>");
        var filler = $("<div style='width:100%; height: 100%;'></div>");
        dummy.append(filler);
        $('body').append(dummy);
        
        var size = {
            height: dummy.height() - filler.height(),
            width: dummy.width() - filler.width()
        };
        
        dummy.remove();
        
        return size;
    }
    
    var scrollBarSize;
    
    $(function() {
        scrollBarSize = determineScrollBarSize();
        
        //adjust the margin to compensate for the scrollbar
        vein.inject('.powergrid > .scrolling > .container.fixed.right', {'margin-right': "-" + scrollBarSize.width + "px"});
    });
    
	function PowerGrid(target, options) {
        var grid = this;
        this.options = options;
        this.target = target;
        
        this.beginInit();
    }
    
    PowerGrid.prototype = {
        beginInit: function() {
            var pluginIdx = 0;
            var keys = Object.keys(this.options.extensions);
            var grid = this;
            
            if(keys.length) {
                var files = keys.map(function(e) { return "extensions/" + e; });
                require(files, function() {
                    for(var x = 0; x < arguments.length; x++) {
                        // probably should do some load order manipulation here
                        arguments[x](grid, grid.options.extensions[keys[x]]);
                    }
                    grid.init();
                });
            } else {
                this.init();
            }
        },
        
        init: function init() {
            var grid = this;
            var baseSelector = this.baseSelector = "#" + this.target.attr('id'),

                container = this.container = $("<div class='powergrid'>"),
                scrollingcontainer = this.scrollingcontainer = $("<div class='scrolling'>"),
                headercontainer = this.headercontainer = $("<div class='header'>"),
                footercontainer = this.footercontainer = $("<div class='footer'>"),

                scrollContainers = this.scrollContainers = ($().add(scrollingcontainer).add(headercontainer).add(footercontainer));

            this.fixedLeft = this.fixedRight = this.middleScrollers = $();

            this.createRowGroup(-1, this.options.frozenRowsTop, headercontainer);
            this.createRowGroup(this.options.frozenRowsTop, this.options.dataSource.recordCount() - this.options.frozenRowsBottom, scrollingcontainer);
            this.createRowGroup(this.options.dataSource.recordCount() - this.options.frozenRowsBottom, this.options.dataSource.recordCount(), footercontainer);

            container.append(headercontainer).append(scrollingcontainer).append(footercontainer);

            this.adjustHeights();
            this.adjustWidths();

            $(this.target).append(container);

            $(".powergrid > div").scroll(function(event) {
                var self = this;
                requestAnimationFrame(function() {
                    grid.syncScroll(self, event);
                });
            });
        },
        
        createRowGroup: function createRowGroup(start, end, container) {
            var fixedPartLeft = $("<div class='container fixed left'>");
            var fixedPartRight = $("<div class='container fixed right'>");
            var scrollingPart = $("<div class='container scrolling'>");

            this.fixedLeft = this.fixedLeft.add(fixedPartLeft);
            this.fixedRight = this.fixedRight.add(fixedPartRight);
            this.middleScrollers = this.middleScrollers.add(scrollingPart);

            // start rendering
            for(var x = start; x < end; x++) {
                var rowFixedPartLeft = $("<div class='row fixed'>");
                var rowFixedPartRight = $("<div class='row fixed'>");
                var rowScrollingPart = $("<div class='row scrolling'>");

                if(x == -1) {
                    $(rowFixedPartLeft).add(rowFixedPartRight).add(rowScrollingPart).addClass("headerrow");
                }

                var record = this.options.dataSource.getRecord(x);

                for(var y = 0; y < this.options.columns.length; y++) {
                    var cell;
                    if(x == -1) {
                        cell = this.renderHeaderCell(this.options.columns[y], y);
                    } else {
                        cell = this.renderCell(record, y);
                    }
                    
                    cell.addClass("column" + y);
                    
                    if(y < this.options.frozenColumnsLeft) {
                        rowFixedPartLeft.append(cell);
                    } else if(y > this.options.columns.length - this.options.frozenColumnsRight - 1) {
                        rowFixedPartRight.append(cell);
                    } else {
                        rowScrollingPart.append(cell);
                    }
                }

                fixedPartLeft.append(rowFixedPartLeft);
                fixedPartRight.append(rowFixedPartRight);
                scrollingPart.append(rowScrollingPart);
            }

            container.append(fixedPartLeft).append(scrollingPart).append(fixedPartRight);
        },
        
        adjustWidths: function adjustWidths() {
            // Adjusts the widths of onscreen parts. Triggered during init, or when changing column specifications
            for(var x = 0; x < this.options.columns.length; x++) {
                var w = this.columnWidth(x);
                vein.inject(this.baseSelector + " .column" + x, {width: w + "px"});
            }

            var leadingWidth = this.columnWidth(0, this.options.frozenColumnsLeft);
            var middleWidth = this.columnWidth(this.options.frozenColumnsLeft, this.options.columns.length - this.options.frozenColumnsRight);
            var trailingWidth = this.columnWidth(this.options.columns.length - this.options.frozenColumnsRight, this.options.columns.length);
            this.fixedLeft.css("width", leadingWidth + "px");
            this.fixedRight.css("width", trailingWidth + "px");
            this.middleScrollers.css({"margin-left": leadingWidth + "px", "margin-right": trailingWidth + "px", "width": (middleWidth + trailingWidth) + "px"});
        },
        
        adjustHeights: function adjustHeights() {
            // Adjusts the heights of onscreen parts. Triggered during init, or when changing row heights and such
            var headerHeight = this.rowHeight(-1, this.options.frozenRowsTop);
            var footerHeight = this.rowHeight(this.options.dataSource.recordCount() - this.options.frozenRowsBottom, this.options.dataSource.recordCount());
            this.headercontainer.css("height", (headerHeight + scrollBarSize.height) + "px");
            this.footercontainer.css("height", (footerHeight + scrollBarSize.height) + "px");
            this.scrollingcontainer.css("top", headerHeight + "px").css("bottom", footerHeight + "px");
        },
        
        columnWidth: function columnWidth(start, end) {
            // Calculate the width of a single column, or of a range of columns
            if(end == undefined) {
                return this.options.columns[start].width;
            } else {
                return this.options.columns.slice(start, end).reduce(function(a,b) {
                    return a + b.width;
                }, 0);
            }
        },
        
        rowHeight: function rowHeight(start, end) {
            // if end argument is passed, calculates the accumulative heights of rows start until end (exclusive)
            if(end == undefined) {
                return 31;
            } else {
                return (end - start) * 31;
            }
        },
        
        syncScroll: function syncScroll(source, event) {
            // Sync the scrolling between the scrolling divs
            // tested CSS class injection, but was slower than direct manipulation in this case
            this.fixedLeft.css("left", source.scrollLeft + "px");
            this.fixedRight.css("right", "-" + source.scrollLeft + "px");
            this.scrollContainers.scrollLeft(source.scrollLeft);
        },
        
        renderHeaderCell: function renderHeaderCell(column, columnIdx) {
            // Render the cell for the header
            return $("<div class='cell columnheader'>").text(column.title);
        },
        
        renderCell: function renderCell(record, key) {
            // Render a data cell
            return $("<div class='cell'>").text(record[key]);
        }
    };
    
    $.fn.extend({ PowerGrid: function(options) {
        return new PowerGrid(this, options);
    }});
    
    return PowerGrid;
});