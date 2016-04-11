"use strict";
define(
    ['QUnit', '../extensions/treegrid', '../arraydatasource', '../utils'],
    function(QUnit, treegrid, arraydatasource, utils) {
        return function() {
            QUnit.test("Tree collapsing and expanding", function(assert) {
                var data = [
                    {id: 0, d: "A"},
                    {id: 1, d: "B"},
                    {id: 2, parent: 1, d: "X"},
                    {id: 3, parent: 1, d: "J"},
                    {id: 4, parent: 3, d: "K"},
                    {id: 5, parent: 3, d: "M"},
                    {id: 6, parent: 3, d: "L"},
                    {id: 7, parent: 6, d: "Z"},
                    {id: 8, parent: 3, d: "J"},
                    {id: 9, d: "N"}
                ];
                var dds = new arraydatasource(data);
                var ds = new treegrid.TreeGridDataSource(dds, {initialTreeDepth: 1});

                function check(ds, expectedIds, message) {
                    utils.handleAnimationFrames();
                    var ids = ds.getData().map(function(e) { return e.id; });
                    assert.deepEqual(ids, expectedIds, message);
                }

                check(ds, [0,1,2,3,9], "initial tree depth");

                ds.toggle(6);

                check(ds, [0,1,2,3,9], "after toggle 6");

                ds.toggle(3);

                check(ds, [0,1,2,3,4,5,6,7,8,9], "after toggle 3");

                ds.toggle(6);

                check(ds, [0,1,2,3,4,5,6,8,9], "after collapse 6");

                ds.toggle(1);

                check(ds, [0,1,9], "after collapse 1");

                ds.expandAll();

                check(ds, [0,1,2,3,4,5,6,7,8,9], "after expand all");
            });

            QUnit.test("Tree sorting", function(assert) {
                var data = [
                    {id: 0, d: "B"},
                    {id: 1, d: "A"},
                    {id: 2, parent: 1, d: "X"},
                    {id: 3, parent: 1, d: "J"},
                    {id: 4, parent: 3, d: "K"},
                    {id: 5, parent: 3, d: "M"},
                    {id: 6, parent: 3, d: "L"},
                    {id: 7, parent: 6, d: "Z"},
                    {id: 8, parent: 3, d: "J"},
                    {id: 9, d: "N"}
                ];
                var dds = new arraydatasource(data);
                var ds = new treegrid.TreeGridDataSource(dds, {initialTreeDepth: 3});

                function check(ds, expectedIds, message) {
                    var ids = ds.getData().map(function(e) { return e.id; });
                    assert.deepEqual(ids, expectedIds, message);
                }

                check(ds, [0,1,2,3,4,5,6,7,8,9], "initial tree depth");

                ds.sort(function(a,b) {
                    return a.d<b.d?-1:a.d>b.d?1:0;
                });

                check(ds, [1,3,8,4,6,7,5,2,0,9], "after sort");
            });
        };
    }
);
