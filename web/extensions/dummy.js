/**
 * Enables aligning of cell contents.
 *
 * Usage:
 */
define(['../override'], function(override, $) {
  "use strict";

  return function(grid, pluginOptions) {
    override(grid, pluginOptions.bind(this, override));
  };
});
