define(['./powergrid', './datasources/arraydatasource', './datasources/jsondatasource', './datasources/groupingdatasource', './datasources/sortingdatasource', './datasources/filteringdatasource'],
    function (PowerGrid, ArrayDataSource, JsonDataSource, GroupingDataSource, SortingDataSource, FilteringDataSource) {
        return {
            PowerGrid: PowerGrid,
            ArrayDataSource: ArrayDataSource,
            JsonDataSource: JsonDataSource,
            GroupingDataSource: GroupingDataSource,
            SortingDataSource: SortingDataSource,
            FilteringDataSource: FilteringDataSource
        };
    });
