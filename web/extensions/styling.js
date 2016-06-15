/**
 * PowerGrid styling extension
 *
 * Allows changing the class for cells.
 *
 * Usage:
 *
 *  {
 *      styling: {
 *          applyClasses: (record, column, callback) => {
 *              // Set up binding here, so that callback is invoked with the correct class. Callback can be invoked
 *              // later, and multiple times.
 *              var class = 'someclass';
 *              callback(class);
 *
 *              // (Optionally) return a function that will be called when the cell is destroyed. Use this to destroy
 *              // bindings, for example.
 *              return function() { <<dispose here>> }
 *          }
 *      }
 * }
 */
define(['../override'], function(override) {

    var whitespace = /\s+/;

    return function(grid, pluginOptions) {
        override(grid, function($super) {
            return {
                renderCell: function(record, column, rowIdx, columnIdx) {
                    var cell = $super.renderCell.apply(this, arguments),
                        oldClasses, oldClassUnparsed;
                    var cleanup = pluginOptions.applyClasses(record, column, function(className) {
                        if(className == oldClassUnparsed) {
                            return;
                        }
                        var currentClasses = cell.className;
                        if(oldClasses) {
                            currentClasses = currentClasses.split(whitespace).filter(function(e) {
                                return oldClasses.indexOf(e) == -1;
                            }).join(" ");
                        }
                        if(className) {
                            cell.className = currentClasses + " " + className;
                            oldClasses = className.split(whitespace);
                        } else {
                            cell.className = currentClasses;
                            oldClasses = null;
                        }
                        oldClassUnparsed = className;
                    });

                    // TODO handle clean up (remove observers when cell is destroyed)

                    return cell;
                }
            }
        });
    }

});
