"use strict";
define(
    ['QUnit', 'powergrid', '../extensions/dragging', '../extensions/columnmoving', '../extensions/columnsizing', '../extensions/sorting'],
    function(QUnit, PowerGrid, dragging, columnmoving, columnsizing, sorting) {
        return function() {
            QUnit.asyncTest("Plugin load order", function(assert) {
                var pg = new PowerGrid(false, {
                    extensions: {
                        'columnsizing': {},
                        'columnmoving': {},
                        'editing': true,
                        'grouping': {},
                        'sorting': true,
                        'filtering': {}
                    }
                });

                assert.expect(1);

                pg.loadExtensions(function(pluginList, plugins) {
                    var sorted = pg.sortByLoadOrder(pluginList, plugins);
                    assert.ok(sorted.indexOf("dragging") < sorted.indexOf("sorting"), "Dragging should come before sorting");

                    QUnit.start();
                });
            });
        };
    }
);
