define(['jquery', 'vein', 'utils'], function($, vein, utils) {
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
    
    var scrollIsSyncing=false;
    
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

                scrollContainers = this.scrollContainers = ($().add(scrollingcontainer).add(headercontainer).add(footercontainer));
            
            this.options.columns.forEach(function(column, index) {
                if(column.key === undefined) {
                    column.key = index;
                }
            });

            this.fixedLeft = this.fixedRight = this.middleScrollers = $();

            this.createRowGroup(-1, this.options.frozenRowsTop, headercontainer);
            scrollingcontainer.append(headercontainer);
            this.createRowGroup(this.options.frozenRowsTop, this.options.dataSource.recordCount() - this.options.frozenRowsBottom, scrollingcontainer);
            this.createRowGroup(this.options.dataSource.recordCount() - this.options.frozenRowsBottom, this.options.dataSource.recordCount(), footercontainer);

            container.append(headercontainer).append(scrollingcontainer).append(footercontainer).append(scroller.append(scrollFiller));

            this.adjustHeights();
            this.adjustWidths();
            this.adjustColumnPositions();

            $(this.target).append(container);

            var redrawing = false;
            
            $(".powergrid > .pg-scroller").on('scroll', function(evt) {
                if(!redrawing) {
                    var self = this;
                    redrawing = true;
//                    timer = setTimeout(function() {
                        //requestAnimationFrame(function() {
                            grid.syncScroll(self, evt);
                            redrawing = false;
                       //});
//                    }, 1000);
                }
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
                
                self.scroll(dX * ddX, dY * ddY);
            });
            
            this.initTouchScrollEvents();
        },
        
        initTouchScrollEvents: function() {
            var self = this;
            var tracking = false;
            var lastX, lastY;
            var timeUnit = 100; // 100ms
            var inertialCutOff = 0.001; // minimum speed for inertial scrolling before cutoff
            var inertia = 0.998; // inertia for inertial scrolling (higher means longer scrolling, 1 = infinite (frictionless) scrolling, 0 = no inertial scrolling)
            
            var eventQueue = []; // keep track of last 100ms of events to determine drag speed
            
            function pruneEventQueue() {
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
                    speedX = speedX * r;
                    speedY = speedY * r;

                    if(Math.abs(speedX) >= inertialCutOff && Math.abs(speedY) >= inertialCutOff) {
                        scrollPosition.left += speedX * frameDuration;
                        scrollPosition.top += speedY * frameDuration;
                        self.scrollTo(Math.round(scrollPosition.left), Math.round(scrollPosition.top));
                        requestAnimationFrame(draw);
                    }
                };

                requestAnimationFrame(draw);   
            }
            
            this.target.on("touchstart", function(startevent) {
                tracking = true;
                lastX = startevent.originalEvent.touches[0].pageX, lastY = startevent.originalEvent.touches[0].pageY;
            }).on("touchmove", function(dragevent) {
                if(tracking) {
                    var currentTime = new Date().getTime();
                    
                    var newX = dragevent.originalEvent.touches[0].pageX, newY = dragevent.originalEvent.touches[0].pageY;
                    
                    var dX = lastX - newX, dY = lastY - newY;
                    
                    var e = {
                        x: dX,
                        y: dY,
                        t: currentTime
                    };
                    
                    eventQueue.unshift(e);
                    pruneEventQueue();
                    
                    lastX = newX;
                    lastY = newY;
                    
                    self.scroll(dX, dY);
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
        
        
        createRowGroup: function createRowGroup(start, end, container) {
            var fixedPartLeft = $("<div class='container fixed left'>");
            var fixedPartRight = $("<div class='container fixed right'>");
            var scrollingPart = $("<div class='container scrolling'>");

            this.fixedLeft = this.fixedLeft.add(fixedPartLeft);
            this.fixedRight = this.fixedRight.add(fixedPartRight);
            this.middleScrollers = this.middleScrollers.add(scrollingPart);

            // start rendering
            for(var x = start; x < end; x++) {
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

                fixedPartLeft.append(rowFixedPartLeft);
                fixedPartRight.append(rowFixedPartRight);
                scrollingPart.append(rowScrollingPart);
            }

            container.append(fixedPartLeft).append(scrollingPart).append(fixedPartRight);
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
            var footerHeight = this.rowHeight(this.options.dataSource.recordCount() - this.options.frozenRowsBottom, this.options.dataSource.recordCount());
            this.headercontainer.css("height", (headerHeight) + "px");
            this.footercontainer.css("height", (footerHeight) + "px");
            this.scrollingcontainer.css("top", headerHeight + "px").css("bottom", footerHeight + "px");
            this.scrollFiller.css({"height": this.rowHeight(0, this.options.dataSource.recordCount()) });
        },
        
        adjustColumnPositions: function adjustColumnPositions() {
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
        
        scroll: function(dX, dY) {
            this.scroller[0].scrollTop += dY;
            this.scroller[0].scrollLeft += dX;
        },
        
        scrollTo: function(x, y) {
            this.scroller[0].scrollTop = Math.max(0, y);
            this.scroller[0].scrollLeft = Math.max(0, x);
        },
        
        getScrollPosition: function() {
            return {
                left: this.scroller[0].scrollLeft,
                top: this.scroller[0].scrollTop
            };
        },
        
        syncScroll: function syncScroll(source, event) {
            scrollIsSyncing = true;
            
            // Sync the scrolling between the scrolling divs
            // tested CSS class injection, but was slower than direct manipulation in this case
            
            $(this.target).children('.powergrid').children('.scrolling').scrollTop(source.scrollTop);
            $(this.target).children('.powergrid').children('.pg-rowgroup').children('.scrolling').css('transform', 'translate(-' + source.scrollLeft + 'px,0)');
        },
        
        renderHeaderCell: function renderHeaderCell(column, columnIdx) {
            // Render the cell for the header
            return $("<div class='columnheader'>").text(column.title);
        },
        
        renderCell: function renderCell(record, column) {
            // Render a data cell
            return $("<div class='cell'>").append(this.renderCellContent(record, column, record[column.key]));
        },
        
        renderCellContent: function renderCellContent(record, column, value) {
            return $("<span>").text(value);
        },
        
        getColumnForKey: function(key) {
            for(var x=0,l=this.options.columns.length; x<l; x++) {
                if(this.options.columns[x].key == key) {
                    return this.options.columns[x];
                }
            }
        },
        
        getRowForIndex: function(idx) {
            return this.options.dataSource.getRecord(idx);
        }
    };
    
    $.fn.extend({ PowerGrid: function(options) {
        return new PowerGrid(this, options);
    }});
    
    return PowerGrid;
});