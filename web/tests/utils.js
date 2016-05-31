"use strict";
define(
    ['QUnit', '../utils'],
    function(QUnit, utils) {
        return function() {
            QUnit.test("getValue", function(assert) {
                var mock = {
                    a: "A",
                    b: ['x','y',0],
                    c: {
                        d: 9,
                        e: [1,2,3]
                    }
                };

                assert.ok(utils.getValue(mock, 'a') === "A", "simple getter");
                assert.ok(utils.getValue(mock, 'b[0]') === "x", "array index getter");
                assert.ok(utils.getValue(mock, 'b[2]') === 0, "array index getter with number");
                assert.ok(utils.getValue(mock, 'c.d') === 9, "nested getter");
                assert.ok(utils.getValue(mock, 'c.e[0]') === 1, "nested getter with array");
            });

            QUnit.test("setValue", function(assert) {
                var mock = {
                    a: "A",
                    b: ['x','y',0],
                    c: {
                        d: 9,
                        e: [1,2,3]
                    }
                };

                utils.setValue(mock, 'a', 'AA');
                utils.setValue(mock, 'b[0]', 'xx');
                utils.setValue(mock, 'b[2]', '00');
                utils.setValue(mock, 'c.d', 'xyy');
                utils.setValue(mock, 'c.e[0]', 'fff');

                assert.deepEqual(mock, {
                    a: "AA",
                    b: ['xx','y','00'],
                    c: {
                        d: 'xyy',
                        e: ['fff',2,3]
                    }
                });
            });
        };
    }
);
