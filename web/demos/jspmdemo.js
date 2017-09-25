import {PowerGrid} from './main.js';

var numbers = (function(s){var l,x=[];while(s>(l=x.length))x[l]=l;return x})(30);

var columns = numbers.map(function(e) {
    return {
        title: "Column " + e,
        width: e==0?150:e==6?250:100,
        editable: e > 5 && e < 10
    };
});

var data = new Array(2500);

var pg = new PowerGrid($("#test"), {
    columns: columns,

    frozenColumnsLeft: 4,
    frozenColumnsRight: 2,

    frozenRowsTop: 2,
    frozenRowsBottom: 1,

    dataSource: {
        recordCount: function() {
            return data.length;
        },

        getRowByIndex: function(idx) {
            if(data[idx] === undefined) {
                var row = columns.map(function(e,i) {
                    return "Cell " + idx + ", " + i;
                });
                row.id = idx + "";
                return data[idx] = row;
            } else {
                return data[idx];
            }
        },

        getRecordById: function(id) {
            return this.getRowByIndex(parseInt(id));
        },

        getData: function(start, end) {
            if(!start) start = 0;
            if(!end) end = this.recordCount();
            var d = new Array(end-start);
            for(var x = start; x < end; x++) {
                d[x-start] = this.getRowByIndex(x);
            }
            return d;
        },

        setValue: function(rowIdx, key, value) {
            data[rowIdx][key] = value;
        },

        isReady: function() {
            return true;
        }
    },

    extensions: {
        'columnsizing': {},
        'columnmoving': {},
        'editing': true
    }
});
