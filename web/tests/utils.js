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

            QUnit.test("findRanges", function(assert) {
                assert.deepEqual(utils.findRanges([0,1,2,3,5,6,8,12]), [{start: 0, count: 4}, {start: 5, count: 2}, {start: 8, count: 1}, {start: 12, count: 1}], "find ranges");
                assert.deepEqual(utils.findRanges([3,1,8,2,6,0,12,5]), [{start: 0, count: 4}, {start: 5, count: 2}, {start: 8, count: 1}, {start: 12, count: 1}], "find ranges unsorted");
            });
        };
    }
);
