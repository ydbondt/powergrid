define(['jquery', 'vein', 'utils'], function($, vein, utils) {
	"use strict";
    
    var defaultOptions = {
        virtualScrollingExcess: 30
    };
	
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
        vein.inject('.pg-rowgroup.header', {'width': "calc(100% - " + scrollBarSize.width + "px)"});
        vein.inject('.pg-rowgroup.scrolling', {'width': "calc(100% - " + scrollBarSize.width + "px)"});
        vein.inject('.pg-rowgroup.footer', {'width': "calc(100% - " + scrollBarSize.width + "px)", 'bottom': scrollBarSize.width + "px"});
    });
    
	function PowerGrid(target, options) {
        var grid = this;
        this.options = options;
        this.target = target;
        
        for(var x in defaultOptions) {
            if(this.options[x] === undefined) {
                this.options[x] = defaultOptions[x];
            }
        }
        
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
                headercontainer = this.headercontainer = $("<div class='pg-rowgroup header'>"),
                scrollingcontainer = this.scrollingcontainer = $("<div class='pg-rowgroup scrolling'>"),
                footercontainer = this.footercontainer = $("<div class='pg-rowgroup footer'>"),
                scroller = this.scroller = $("<div class='pg-scroller'>"),
                scrollFiller = this.scrollFiller = $("<div class='pg-scroller-filler'>"),

                scrollContainers = this.scrollContainers = ($().add(scrollingcontainer).add(headercontainer).add(footercontainer)),
                recordCount = this.rowCount();
            
            this.options.columns.forEach(function(column, index) {
                if(column.key === undefined) {
                    column.key = index;
                }
            });

            this.fixedLeft = this.fixedRight = this.middleScrollers = $();

            this.createRowGroup(-1, this.options.frozenRowsTop, headercontainer, true);
            scrollingcontainer.append(headercontainer);
            this.createRowGroup(this.options.frozenRowsTop, recordCount - this.options.frozenRowsBottom, scrollingcontainer, false);
            this.createRowGroup(recordCount - this.options.frozenRowsBottom, recordCount, footercontainer, true);

            container.append(headercontainer).append(scrollingcontainer).append(footercontainer).append(scroller.append(scrollFiller));

            this.adjustHeights();
            this.adjustWidths();
            this.adjustColumnPositions();

            $(this.target).append(container);

            $(".powergrid > .pg-scroller").on('scroll', function(evt) {
                grid.syncScroll(this, evt);
            });
            
            this.viewport = {
                begin: 0,
                end: 0
            };
            
            requestAnimationFrame(function() {
                grid.updateViewport();
            });
            
            this.initScrollEvents();
        },
        
        initScrollEvents: function initScrollEvents() {
            var self = this;
            this.target.on("wheel", function(evt) {
                var dX = evt.originalEvent.deltaX, dY = evt.originalEvent.deltaY, dM = evt.originalEvent.deltaMode, ddX, ddY;
                switch(dM) {
                    case 0: ddX=ddY=1; break;
                    case 1: ddX=ddY=self.rowHeight(0); break;
                    case 2: ddX=self.pageHeight(); ddY=self.pageWidth(); break;
                }
                
                self.scrollBy(dX * ddX, dY * ddY);
            });
            
            this.initTouchScrollEvents();
        },
        
        initTouchScrollEvents: function() {
            // sets up touch scrolling
            var self = this,
                tracking = false, // keep tracking of whether we're currently tracking touch or not
                lastX, lastY,
                timeUnit = 100, // 100ms
                inertialCutOff = 0.001, // minimum speed for inertial scrolling before cutoff
                inertia = 0.998, // inertia for inertial scrolling (higher means longer scrolling, 1 = infinite (frictionless) scrolling, 0 = no inertial scrolling)
                                 // scroll speed is multiplied by this factor for each millisecond that passes
            
                eventQueue = []; // keep track of last 100ms of events to determine drag speed
            
            function pruneEventQueue() {
                // remove all eventQueue entries older than <timeUnit> milliseconds
                var t = eventQueue[0].t;
                for(var x=1,l=eventQueue.length;x<l;x++) {
                    if( (t - eventQueue[x].t) > timeUnit ) break;
                }
                eventQueue = eventQueue.slice(0, x);
            }
            
            function startInertialScroll(speedX, speedY) {
                var previousTime = new Date().getTime();

                var scrollPosition = self.getScrollPosition();
                
                function draw() {
                    if(tracking) return; // if tracking a new touch thing, stop inertial scrolling
                    
                    var t = new Date().getTime();
                    var frameDuration = t - previousTime;
                    previousTime = t;

                    var r = Math.pow(inertia, frameDuration);
                    speedX = speedX * r; // adjust speed according to drag
                    speedY = speedY * r;

                    if(Math.abs(speedX) >= inertialCutOff && Math.abs(speedY) >= inertialCutOff) {
                        // not doing relative scrolling because that looses a lot of precision
                        scrollPosition.left += speedX * frameDuration;
                        scrollPosition.top += speedY * frameDuration;
                        self.scrollTo(Math.round(scrollPosition.left), Math.round(scrollPosition.top));
                        
                        // request next frame.
                        requestAnimationFrame(draw);
                    }
                };

                requestAnimationFrame(draw);   
            }
            
            this.target.on("touchstart", function(startevent) {
                // user touches screen, so we may have to start scrolling
                tracking = true;
                lastX = startevent.originalEvent.touches[0].pageX, lastY = startevent.originalEvent.touches[0].pageY;
            }).on("touchmove", function(dragevent) {
                if(tracking) { // probably a pointless test since we shouldn't be getting a touchmove event unless we got a touchstart first anyway, but still
                    var newX = dragevent.originalEvent.touches[0].pageX, newY = dragevent.originalEvent.touches[0].pageY;
                    
                    var dX = lastX - newX, dY = lastY - newY;
                    
                    var e = {
                        x: dX,
                        y: dY,
                        t: new Date().getTime()
                    };
                    
                    eventQueue.unshift(e);
                    pruneEventQueue();
                    
                    lastX = newX;
                    lastY = newY;
                    
                    self.scrollBy(dX, dY);
                }
            }).on("touchend", function(endevent) {
                tracking = false;
                
                if(!eventQueue.length) return;
                
                var timeSinceLastEvent = (new Date().getTime()) - eventQueue[0].t;
                if(timeSinceLastEvent < timeUnit) {
                    var delta = eventQueue.reduce(function(a,b) {
                        a.dX += b.x;
                        a.dY += b.y;
                        return a;
                    }, { dX: 0, dY: 0 });
                    
                    var timeBetween = eventQueue[0].t - eventQueue[eventQueue.length-1].t;
                    
                    startInertialScroll(delta.dX / timeBetween, delta.dY / timeBetween);
                } else {
                    //console.log(timeSinceLastEvent);
                }
                
                eventQueue = [];
            });
        },
        
        createRowGroup: function createRowGroup(start, end, container, populate, adddummies) {
            var fixedPartLeft = $("<div class='container fixed left'>");
            var fixedPartRight = $("<div class='container fixed right'>");
            var scrollingPart = $("<div class='container scrolling'>");

            this.fixedLeft = this.fixedLeft.add(fixedPartLeft);
            this.fixedRight = this.fixedRight.add(fixedPartRight);
            this.middleScrollers = this.middleScrollers.add(scrollingPart);

            var self = this;
            
            // we're rendering the contents in a new frame, after layout is done
            if(populate) self.renderRowGroupContents(start, end, fixedPartLeft, scrollingPart, fixedPartRight);
            
            if(adddummies) {
                fixedPartLeft.add(scrollingPart).add(fixedPartRight).each(function(i, part) {
                    $(part).append("<div class='.pg-dummyLead'>").append("<div class='.pg-dummyTail'>");
                });
            }

            container.append(fixedPartLeft).append(scrollingPart).append(fixedPartRight);
        },
        
        renderRowGroupContents: function(start, end, fixedPartLeft, scrollingPart, fixedPartRight, prepend) {
            // start rendering
            var method = prepend === true ? 'prepend' : 'append';
            
            for(var x = prepend ? end - 1 : start; prepend ? x >= start : x < end; prepend ? x-- : x++) {
                var rowFixedPartLeft = $("<div class='row fixed'>").attr("data-row-idx", x);
                var rowFixedPartRight = $("<div class='row fixed'>").attr("data-row-idx", x);
                var rowScrollingPart = $("<div class='row scrolling'>").attr("data-row-idx", x);

                if(x == -1) {
                    $(rowFixedPartLeft).add(rowFixedPartRight).add(rowScrollingPart).addClass("headerrow");
                }

                var record = this.options.dataSource.getRecord(x);

                for(var y = 0; y < this.options.columns.length; y++) {
                    var cell, column = this.options.columns[y];
                    if(x == -1) {
                        cell = this.renderHeaderCell(column, y);
                    } else {
                        cell = this.renderCell(record, column, x, y);
                    }
                    
                    cell.addClass("column" + column.key);
                    cell.attr("data-column-key", column.key);
                    
                    if(y < this.options.frozenColumnsLeft) {
                        rowFixedPartLeft.append(cell);
                    } else if(y > this.options.columns.length - this.options.frozenColumnsRight - 1) {
                        rowFixedPartRight.append(cell);
                    } else {
                        rowScrollingPart.append(cell);
                    }
                }

                fixedPartLeft[method](rowFixedPartLeft);
                fixedPartRight[method](rowFixedPartRight);
                scrollingPart[method](rowScrollingPart);
            }
        },
        
        updateViewport: function() {
            var self = this,
                start = this.options.frozenRowsTop,
                end = this.rowCount() - this.options.frozenRowsBottom,
                sPos = this.getScrollPosition(),
                sArea = this.getScrollAreaSize(),
                range = this.rowsInView(sPos.top, sPos.top + sArea.height, start, end),
                scrolling = this.target.children('.powergrid').children('.pg-rowgroup.scrolling'),
                leftPart = scrolling.children('.container.fixed.left'),
                middlePart = scrolling.children('.container.scrolling'),
                rightPart = scrolling.children('.container.fixed.right'),
                allParts = leftPart.add(middlePart).add(rightPart);
            
            // adjust range with excess
            range.begin = Math.max(start, range.begin - this.options.virtualScrollingExcess);
            range.end = Math.min(end, range.end + this.options.virtualScrollingExcess);
            
            if(range.begin == this.viewport.begin || range.end == this.viewport.end) return; // viewport hasn't changed, so bail out
            
            var leadingHeight = this.rowHeight(start, range.begin),
                trailingHeight = this.rowHeight(range.end, end);
            
            function overlap(a,b) {
                if(a.begin < b.begin && a.end > b.begin) return true;
                if(a.begin < a.end && a.end > b.end) return true;
                if(a.begin > b.begin && a.end < b.end) return true;
                if(a.begin < b.begin && a.end > b.end) return true;
            }
            
            if(overlap(range, this.viewport)) {
                if(range.begin < this.viewport.begin) {
                    // have to add rows to beginning
                    this.renderRowGroupContents(Math.max(start, range.begin), Math.min(range.end, this.viewport.begin), leftPart, middlePart, rightPart, true);
                    console.log("Adding rows to head", range.begin, this.viewport.begin);
                } else if(range.begin > this.viewport.begin) {
                    // have to remove rows from beginning
                    console.log("Culling rows from head", range.begin, this.viewport.begin);
                    allParts.each(function(i,part) {
                        $(part).children('.row:lt(' + (range.begin - self.viewport.begin) + ')').remove();
                    });
                }

                if(range.end < this.viewport.end && range.end > this.viewport.begin) {
                    // have to remove rows from end
                    console.log("Culling rows from tail", range.end, this.viewport.end);
                    allParts.each(function(i,part) {
                        $(part).children('.row:gt(' + (range.end - self.viewport.end - 1) + ')').remove();
                    });
                } else if(range.end > this.viewport.end) {
                    // have to add rows to end
                    console.log("Adding rows to tail", range.end, this.viewport.end);
                    this.renderRowGroupContents(Math.max(this.viewport.end, range.begin), Math.min(range.end, end), leftPart, middlePart, rightPart, false);
                }
            } else {
                // no overlap, just clear the entire thing and rebuild
                allParts.empty();
                this.renderRowGroupContents(Math.max(start, range.begin), Math.min(range.end, end), leftPart, middlePart, rightPart, false);
            }
            
            allParts.css('padding-top', leadingHeight + 'px');
            allParts.css('padding-bottom', trailingHeight + 'px');
            
            if(false) { // change to if(true) if you want to debug virtual scrolling. Disable for performance
                // verify
                var idxsMatched = {};
                $(allParts).children('.row').each(function(i, row) {
                    var idx = parseInt($(row).attr('data-row-idx'));
                    idxsMatched[idx] = true;
                    if(idx < range.begin || idx >= range.end) {
                        debugger;
                    }
                });
                
                for(var x = range.begin; x < range.end ; x++) {
                    if(!idxsMatched[x]) {
                        debugger;
                    }
                }
            }
            
            this.viewport = range;
        },
        
        adjustWidths: function adjustWidths() {
            // Adjusts the widths of onscreen parts. Triggered during init, or when changing column specifications
            var columns = this.options.columns;
            for(var x = 0, l=columns.length; x < l; x++) {
                var column = columns[x];
                var w = this.columnWidth(x);
                vein.inject(this.baseSelector + " .column" + column.key, {width: w + "px"});
            }

            var leadingWidth = this.columnWidth(0, this.options.frozenColumnsLeft);
            var middleWidth = this.columnWidth(this.options.frozenColumnsLeft, this.options.columns.length - this.options.frozenColumnsRight);
            var trailingWidth = this.columnWidth(this.options.columns.length - this.options.frozenColumnsRight, this.options.columns.length);
            this.fixedLeft.css("width", leadingWidth + "px");
            this.fixedRight.css("width", trailingWidth + "px");
            this.middleScrollers.css({"left": leadingWidth + "px", "right": trailingWidth + "px"});
            this.scrollFiller.css({"width": (leadingWidth + middleWidth + trailingWidth) + "px"});
        },
        
        adjustHeights: function adjustHeights() {
            // Adjusts the heights of onscreen parts. Triggered during init, or when changing row heights and such
            var headerHeight = this.rowHeight(-1, this.options.frozenRowsTop);
            var footerHeight = this.rowHeight(this.rowCount() - this.options.frozenRowsBottom, this.rowCount());
            this.headercontainer.css("height", (headerHeight) + "px");
            this.footercontainer.css("height", (footerHeight) + "px");
            this.scrollingcontainer.css("top", headerHeight + "px").css("bottom", (footerHeight + scrollBarSize.height) + "px");
            this.scrollFiller.css({"height": this.rowHeight(0, this.rowCount()) });
        },
        
        adjustColumnPositions: function adjustColumnPositions() {
            // Repositions all columns horizontal positions
            var columns = this.options.columns;
            var pos = 0;
            var positions = new Array(this.options.length);
            for(var x=0, l = columns.length; x<l; x++) {
                var column = columns[x];
                if(x == this.options.frozenColumnsLeft || l-x == this.options.frozenColumnsRight) {
                    pos = 0;
                }
                positions[x] = pos;
                vein.inject(this.baseSelector + " .column" + column.key, {left: pos + "px"});
                
                pos += column.width;
            }
            
            return positions;
        },
        
        columnWidth: function columnWidth(start, end) {
            // Calculate the width of a single column, or of a range of columns
            if(end == undefined) {
                return this.options.columns[start].width;
            } else {
                var sum=0;
                while(start<end) {
                    sum += this.options.columns[start++].width;
                }
                return sum;
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
        
        rowsInView: function(top, bottom, start, end) {
            // Finds rows within the viewport defined by poth coordinates in pixels
            // If start is defined, row position is measured relative to start index.
            // If end is defined, counting stops at end index
            var begin=-1, ct=0;
            for(var x=(start||0),l=end||this.rowCount();x<l;x++) {
                ct += this.rowHeight(x);
                if(ct>=top && begin===-1) {
                    begin = x;
                } else if(ct > bottom) {
                    break;
                }
            }
            if(begin > -1) {
                return { begin: begin, end: x };
            }
        },
        
        scrollBy: function(dX, dY) {
            // Scroll by a specific offset
            this.scroller[0].scrollTop += dY;
            this.scroller[0].scrollLeft += dX;
            this.afterscroll();
        },
        
        scrollTo: function(x, y) {
            // Scroll to a specific location
            this.scroller[0].scrollTop = Math.max(0, y);
            this.scroller[0].scrollLeft = Math.max(0, x);
            this.afterscroll();
        },
        
        getScrollPosition: function() {
            // Get the current scroll coordinates
            return {
                left: this.scroller[0].scrollLeft,
                top: this.scroller[0].scrollTop
            };
        },
            
        getScrollAreaSize: function() {
            return {
                width: this.target.children('.powergrid').children('.pg-rowgroup.scrolling').children('.container.scrolling')[0].offsetWidth,
                height: this.target.children('.powergrid').children('.pg-rowgroup.scrolling')[0].offsetHeight
            };
        },
        
        syncScroll: function syncScroll(source, event) {
            // Sync the scrolling between the scrolling divs
            // tested CSS class injection, but was slower than direct manipulation in this case
            
            $(this.target).children('.powergrid').children('.scrolling').scrollTop(source.scrollTop);
            $(this.target).children('.powergrid').children('.pg-rowgroup').children('.scrolling').css('transform', 'translate(-' + source.scrollLeft + 'px,0)');
            this.afterscroll();
        },
        
        afterscroll: function() {
            if(!this.updateViewportTimer) {
                setTimeout(this.updateViewport.bind(this), 100);
            }
            $(this).trigger('scroll');
        },
        
        renderHeaderCell: function renderHeaderCell(column, columnIdx) {
            // Render the cell for the header
            return $("<div class='columnheader'>").text(column.title);
        },
        
        renderCell: function renderCell(record, column) {
            // Render the cell container
            return $("<div class='cell'>").append(this.renderCellContent(record, column, record[column.key]));
        },
        
        renderCellContent: function renderCellContent(record, column, value) {
            // Render the cell content
            return $("<span>").text(value);
        },
        
        getColumnForKey: function(key) {
            // Returns the column for the given key
            for(var x=0,l=this.options.columns.length; x<l; x++) {
                if(this.options.columns[x].key == key) {
                    return this.options.columns[x];
                }
            }
        },
        
        getRowForIndex: function(idx) {
            // Returns the row at the given index
            return this.options.dataSource.getRecord(idx);
        },
        
        rowCount: function() {
            return this.options.dataSource.recordCount();
        }
    };
    
    $.fn.extend({ PowerGrid: function(options) {
        return new PowerGrid(this, options);
    }});
    
    return PowerGrid;
});