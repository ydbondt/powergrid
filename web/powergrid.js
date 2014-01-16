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
			
			var frozenColumns=4;
			
			var container = $("<div class='powergrid'>");
			var scrollingcontainer = $("<div class='scrolling'>");
			var fixedPart = $("<div class='container fixed'>");
			var scrollingPart = $("<div class='container scrolling'>");
			
			// start rendering
			for(var x = 0; x < data.length; x++) {
				var rowFixedPart = $("<div class='row fixed'>");
				var rowScrollingPart = $("<div class='row scrolling'>");
				
				for(var y = 0; y < data[x].length; y++) {
					var cell = $("<div class='cell'>");
					cell.text(data[x][y]);
					if(y < frozenColumns) {
						rowFixedPart.append(cell);
					} else {
						rowScrollingPart.append(cell);
					}
				}
				
				fixedPart.append(rowFixedPart);
				scrollingPart.append(rowScrollingPart);
			}

			scrollingcontainer.append(fixedPart).append(scrollingPart);
			
			
			var hscroller = $("<div class='hscroller'><div class='dummy'></div></div>");
			hscroller.children('.dummy').css("width", 30 * 80 + "px");

			container.append(scrollingcontainer);
			container.append(hscroller);
			
			hscroller.on("scroll", function() {
				scrollingPart[0].scrollLeft = this.scrollLeft;
			});
			
			$(this).append(container);
		}
	});
})(jQuery);