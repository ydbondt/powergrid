"use strict";
define(
    ['QUnit', '../extensions/sorting'],
    function(QUnit, sorting) {
        return function() {
            QUnit.test("Test compareString", function(assert) {
                var mockgrid = {};
                sorting.init(mockgrid);

                function t(a,b) {
                    assert.equal(mockgrid.sorting.compareString(a,b), 1, a + " should > " + b);
                    assert.equal(mockgrid.sorting.compareString(b,a), -1, b + " should < " + a);
                }

                function e(a,b) {
                    assert.equal(mockgrid.sorting.compareString(a,b), 0, a + " should = " + b);
                    assert.equal(mockgrid.sorting.compareString(b,a), 0, b + " should = " + a);
                }

                e("", "");
                t("Ulalala120", "Ulalala20");
                t("Ulalala20", "U120");
                t("zazazaa", "Bababa");
                t("Zaza", "lolo");
                t("52200", "400");
                t("600000", "52200");
                t("dada", "5dada");
            });
        };
    }
);
