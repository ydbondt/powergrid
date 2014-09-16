define(['jquery', 'vein'], function($, vein) {
	"use strict";
	
    function determineScrollBarSize() {
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
        vein.inject('.powergrid > .scrolling > .container.fixed.right', {'margin-right': "-" + scrollBarSize.width + "px"});
    });
    
	function PowerGrid(options) {
        var baseSelector = "#" + this.attr('id');

        var data = [];
        for(var x = 0; x < 500; x++) {
            data[x] = [];
            for(var y = 0; y < 30; y++) {
                data[x][y] = x + "," + y;
            }
        }

        var columns = data[0].map(function(e,i) {
            return {
                title: "Column " + i,
                width: 100
            };
        });

        var frozenColumnsLeft=4;
        var frozenColumnsRight=2;

        var frozenRowsTop = 2;
        var frozenRowsBottom = 1;

        var container = $("<div class='powergrid'>");
        var scrollingcontainer = $("<div class='scrolling'>");
        var headercontainer = $("<div class='header'>");
        var footercontainer = $("<div class='footer'>");

        var fixedLeft = $();
        var fixedRight = $();
        var middleScrollers = $();
        var scrollContainers = $().add(scrollingcontainer).add(headercontainer).add(footercontainer);

        function columnWidth(start, end) {
            if(end == undefined) {
                return columns[start].width;
            } else {
                return columns.slice(start, end).reduce(function(a,b) {
                    return a + b.width;
                }, 0);
            }
        }

        function rowHeight(start, end) {
            // if end is passed, calculates the accumulative heights of rows start until end (exclusive)
            if(end == undefined) {
                return 31;
            } else {
                return (end - start) * 31;
            }
        }

        function createRowGroup(data, start, end, container) {
            var fixedPartLeft = $("<div class='container fixed left'>");
            var fixedPartRight = $("<div class='container fixed right'>");
            var scrollingPart = $("<div class='container scrolling'>");

            fixedLeft = fixedLeft.add(fixedPartLeft);
            fixedRight = fixedRight.add(fixedPartRight);
            middleScrollers = middleScrollers.add(scrollingPart);

            // start rendering
            for(var x = start; x < end; x++) {
                var rowFixedPartLeft = $("<div class='row fixed'>");
                var rowFixedPartRight = $("<div class='row fixed'>");
                var rowScrollingPart = $("<div class='row scrolling'>");

                if(x == -1) {
                    $(rowFixedPartLeft).add(rowFixedPartRight).add(rowScrollingPart).addClass("headerrow");
                }

                for(var y = 0; y < columns.length; y++) {
                    var cell;
                    if(x == -1) {
                        cell = $("<div class='cell columnheader'>").text(columns[y].title);
                    } else {
                        cell = $("<div class='cell'>").text(data[x][y]);
                    }
                    cell.addClass("column" + y);
                    if(y < frozenColumnsLeft) {
                        rowFixedPartLeft.append(cell);
                    } else if(y > columns.length - frozenColumnsRight - 1) {
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
        }

        createRowGroup(data, -1, frozenRowsTop, headercontainer);
        createRowGroup(data, frozenRowsTop, data.length - frozenRowsBottom, scrollingcontainer);
        createRowGroup(data, data.length - frozenRowsBottom, data.length, footercontainer);

        function adjustHeights() {
            var headerHeight = rowHeight(-1, frozenRowsTop);
            var footerHeight = rowHeight(data.length - frozenRowsBottom, data.length);
            headercontainer.css("height", (headerHeight + scrollBarSize.height) + "px");
            footercontainer.css("height", (footerHeight + scrollBarSize.height) + "px");
            scrollingcontainer.css("top", headerHeight + "px").css("bottom", footerHeight + "px");
        }

        function adjustWidths() {
            for(var x = 0; x < columns.length; x++) {
                var w = columnWidth(x);
                vein.inject(baseSelector + " .column" + x, {width: w + "px"});
            }

            var leadingWidth = columnWidth(0, frozenColumnsLeft);
            var middleWidth = columnWidth(frozenColumnsLeft, columns.length - frozenColumnsRight);
            var trailingWidth = columnWidth(columns.length - frozenColumnsRight, columns.length);
            fixedLeft.css("width", leadingWidth + "px");
            fixedRight.css("width", trailingWidth + "px");
            middleScrollers.css({"margin-left": leadingWidth + "px", "margin-right": trailingWidth + "px", "width": (middleWidth + trailingWidth) + "px"});
        }

        container.append(headercontainer).append(scrollingcontainer).append(footercontainer);
        adjustHeights();
        adjustWidths();
        $(this).append(container);

        $(".powergrid > div").scroll(function(event) {
            var self = this;
            requestAnimationFrame(function() {
                // tested CSS class injection, but was slower than direct manipulation in this case
                fixedLeft.css("left", self.scrollLeft + "px");
                fixedRight.css("right", "-" + self.scrollLeft + "px");
                scrollContainers.scrollLeft(self.scrollLeft);
            });
        });
    }
    
    $.fn.extend({ PowerGrid: PowerGrid });
    
    return $;
});