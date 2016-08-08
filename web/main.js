define(['./powergrid', './arraydatasource', './jsondatasource', './datasources/groupingdatasource', './datasources/sortingdatasource'],
    function (PowerGrid, ArrayDataSource, JsonDataSource, GroupingDataSource, SortingDataSource) {
        return {
            PowerGrid: PowerGrid,
            ArrayDataSource: ArrayDataSource,
            JsonDataSource: JsonDataSource,
            GroupingDataSource: GroupingDataSource,
            SortingDataSource: SortingDataSource
        };
    });
