(function($) {
	// use strict;
	
	$.fn.extend({
		powerGrid: function() {
			var data = [];
			for(var x = 0; x < 500; x++) {
				data[x] = [];
				for(var y = 0; y < 30; y++) {
					data[x][y] = x + "," + y;
				}
			}
			
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

			function createRowGroup(data, start, end, container) {
				var fixedPartLeft = $("<div class='container fixed left'>");
				var fixedPartRight = $("<div class='container fixed right'>");
				var scrollingPart = $("<div class='container scrolling'>");
				
				fixedLeft = fixedLeft.add(fixedPartLeft);
				fixedRight = fixedRight.add(fixedPartRight);
				
				// start rendering
				for(var x = start; x < end; x++) {
					var rowFixedPartLeft = $("<div class='row fixed'>");
					var rowFixedPartRight = $("<div class='row fixed'>");
					var rowScrollingPart = $("<div class='row scrolling'>");
					
					for(var y = 0; y < data[x].length; y++) {
						var cell = $("<div class='cell'>");
						cell.text(data[x][y]);
						if(y < frozenColumnsLeft) {
							rowFixedPartLeft.append(cell);
						} else if(y > data[x].length - frozenColumnsRight - 1) {
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

			createRowGroup(data, 0, frozenRowsTop, headercontainer);
			createRowGroup(data, frozenRowsTop, data.length - frozenRowsBottom, scrollingcontainer);
			createRowGroup(data, data.length - frozenRowsBottom, data.length, footercontainer);

            container.append(headercontainer).append(scrollingcontainer).append(footercontainer);
			$(this).append(container);
            
            $(".powergrid > div").scroll(function(event) {
                $(".container.fixed.left").css("left", this.scrollLeft + "px");
                $(".container.fixed.right").css("right", "-" + this.scrollLeft + "px");
                $(".powergrid > div").scrollLeft(this.scrollLeft);
            });
		}
	});
})(jQuery);