define(['./powergrid', './datasources/arraydatasource', './datasources/jsondatasource',
        './datasources/groupingdatasource', './datasources/sortingdatasource',
        './datasources/filteringdatasource', './datasources/asynctreegriddatasource',
        './datasources/bufferedasynctreesource', './utils'],
    function (PowerGrid, ArrayDataSource, JsonDataSource, GroupingDataSource, SortingDataSource, FilteringDataSource, AsyncTreeGridDataSource, BufferedAsyncTreeSource, utils) {
        return {
            PowerGrid: PowerGrid,
            ArrayDataSource: ArrayDataSource,
            JsonDataSource: JsonDataSource,
            GroupingDataSource: GroupingDataSource,
            SortingDataSource: SortingDataSource,
            FilteringDataSource: FilteringDataSource,
            AsyncTreeGridDataSource: AsyncTreeGridDataSource,
            BufferedAsyncTreeSource: BufferedAsyncTreeSource,
            Evented: utils.Evented
        };
    });
