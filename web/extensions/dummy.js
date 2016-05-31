/**
 * Dummy extension. Allows easy overriding of PowerGrid functions from the grid settings.
 *
 * Usage:
 */
define(['../override'], function(override, $) {
  "use strict";

  return function(grid, pluginOptions) {
    override(grid, pluginOptions.bind(this, override));
  };
});
