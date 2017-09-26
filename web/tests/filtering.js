"use strict";
define(
    ['QUnit', '../datasources/treegriddatasource', '../extensions/filtering', '../datasources/arraydatasource'],
    function (QUnit, TreeGridDataSource, filtering, ArrayDataSource) {
        return function () {
            QUnit.test("3 deep treegrid filtering with inclusive and exclusive", function (assert) {
                var tree = [
                    {
                        id: 1, d: "Cruft foods", e: "B", children: [
                        {
                            id: 2, d: "IRAC7055i", e: "F", children: [
                            {id: 21, d: "IRAdvance"}
                        ]
                        },
                        {
                            id: 3, d: "ImagePRESS", e: "F", children: [
                            {id: 31, d: "IP550"}
                        ]
                        }
                    ]
                    },

                    {
                        id: 4, d: "Nettles", e: "B", children: [
                        {
                            id: 5, d: "IRAC7055i", e: "F", children: [
                            {id: 51, d: "IRAdvance"},
                            {id: 52, d: "Black & White"}
                        ]
                        },
                        {
                            id: 6, d: "IRAC7055i", e: "F", children: [
                            {id: 61, d: "Color"}
                        ]
                        }
                    ]
                    },

                    {
                        id: 7, d: "Swish Hair", e: "C", children: [
                        {id: 8, d: "ImagePRESS", e: "A"}
                    ]
                    }
                ];

                var ds = new TreeGridDataSource(new ArrayDataSource(tree));
                var mockgrid = {
                    dataSource: ds,
                    getColumnForKey: function (key) {
                        return {
                            key: key,
                            type: 'text'
                        };
                    }
                };

                filtering.init(mockgrid, {});

                function test(settings, expectedIds, name) {
                    mockgrid.filtering.filter(settings);
                    return ds.getData().then(function (data) {
                        assert.deepEqual(
                            data.map(function (r) {
                                return r.id;
                            }),
                            expectedIds,
                            name
                        );
                    });
                }

                return ds.expandToLevel(3).then(function () {
                    return test({
                        d: {
                            type: "exclusive",
                            method: "contains",
                            value: "IRAC"
                        }
                    }, [1, 3, 31, 4, 7, 8], "exclusive IRAC");
                }).then(function () {
                    return test({
                        e: {
                            type: "inclusive",
                            method: "contains",
                            value: "F"
                        }
                    }, [1, 2, 21, 3, 31, 4, 5, 51, 52, 6, 61], "inclusive F");
                }).then(function () {
                    return test({
                        d: {
                            type: "exclusive",
                            method: "contains",
                            value: "IRAC"
                        },
                        e: {
                            type: "inclusive",
                            method: "contains",
                            value: "F"
                        }
                    }, [1, 3, 31], "inclusive F exclusive IRAC");
                }).then(function () {
                    test({
                        e: {
                            type: "inclusive",
                            method: "contains",
                            value: "F"
                        },
                        d: {
                            type: "exclusive",
                            method: "contains",
                            value: "IRAC"
                        }
                    }, [1, 3, 31], "inclusive F exclusive IRAC reverse order");
                });
            });

            QUnit.test("Treegrid filtering with inclusive and exclusive", function (assert) {

                var tree = [
                    {
                        id: 1, d: "Cruft foods", e: "B", children: [
                        {id: 2, d: "IRAC7055i", e: "F"},
                        {id: 3, d: "ImagePRESS", e: "F"}
                    ]
                    },

                    {
                        id: 4, d: "Nettles", e: "B", children: [
                        {id: 5, d: "IRAC7055i", e: "F"},
                        {id: 6, d: "IRAC7055i", e: "F"}
                    ]
                    },

                    {
                        id: 7, d: "Swish Hair", e: "C", children: [
                        {id: 8, d: "ImagePRESS", e: "A"}
                    ]
                    }
                ];

                var ds = new TreeGridDataSource(new ArrayDataSource(tree));
                var mockgrid = {
                    dataSource: ds,
                    getColumnForKey: function (key) {
                        return {
                            key: key,
                            type: 'text'
                        };
                    }
                };

                filtering.init(mockgrid, {});

                function test(settings, expectedIds, name) {
                    mockgrid.filtering.filter(settings);
                    return ds.getData().then(function (data) {
                        assert.deepEqual(
                            data.map(function (r) {
                                return r.id;
                            }),
                            expectedIds,
                            name
                        )
                    });
                }

                return ds.expandToLevel(3).then(function () {
                    return test({
                        d: {
                            type: "exclusive",
                            method: "contains",
                            value: "IRAC"
                        }
                    }, [1, 3, 4, 7, 8], "exclusive IRAC");
                }).then(function () {
                    return test({
                        e: {
                            type: "inclusive",
                            method: "contains",
                            value: "F"
                        }
                    }, [1, 2, 3, 4, 5, 6], "inclusive F");

                }).then(function () {
                    return test({
                        d: {
                            type: "exclusive",
                            method: "contains",
                            value: "IRAC"
                        },
                        e: {
                            type: "inclusive",
                            method: "contains",
                            value: "F"
                        }
                    }, [1, 3], "inclusive F exclusive IRAC");

                }).then(function () {
                    return test({
                        e: {
                            type: "inclusive",
                            method: "contains",
                            value: "F"
                        },
                        d: {
                            type: "exclusive",
                            method: "contains",
                            value: "IRAC"
                        }
                    }, [1, 3], "inclusive F exclusive IRAC reverse order");
                });
            });
        };
    }
);
