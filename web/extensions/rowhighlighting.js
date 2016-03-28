define(['../override', '../jquery',], function(override, $) {
    "use strict";

    return function(grid, pluginOptions) {
        override(grid, function($super) {
            return {

                init: function init() {
                    $super.init.apply(this, arguments);
                    this.container.on("mouseenter", ".pg-row", function(evt) {
                        var id = $(evt.currentTarget).data('row-id');
                        $(evt.currentTarget).parents('.pg-rowgroup').first().find("> .pg-container > .pg-row[data-row-id='"+ id +"']").addClass('pg-hover');
                    }).on("mouseleave", ".pg-row", function(evt) {
                        var id = $(evt.currentTarget).data('row-id');
                        $(evt.currentTarget).parents('.pg-rowgroup').first().find("> .pg-container > .pg-row[data-row-id='"+ id +"']").removeClass('pg-hover');
                    });
                }
            }
        });
    };
});