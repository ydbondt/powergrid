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
			
			var container = $("<div class='powergrid'>");
			var scrollingcontainer = $("<div class='scrolling'>");
			var fixedPartLeft = $("<div class='container fixed left'>");
			var fixedPartRight = $("<div class='container fixed right'>");
			var scrollingPart = $("<div class='container scrolling'>");
			
			// start rendering
			for(var x = 0; x < data.length; x++) {
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

			scrollingcontainer.append(fixedPartLeft).append(scrollingPart).append(fixedPartRight);
            
            scrollingcontainer.scroll(function(event) {
                fixedPartLeft.css("left", scrollingcontainer.scrollLeft() + "px");
                fixedPartRight.css("right", "-" + scrollingcontainer.scrollLeft() + "px");
            });

			$(this).append(container);

            container.append(scrollingcontainer);
			
            scrollFiller.css("width", (scrollingPart[0].scrollWidth + hscroller[0].offsetWidth - scrollingPart[0].offsetWidth) + "px");
		}
	});
})(jQuery);