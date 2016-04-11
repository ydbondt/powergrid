/***
 * Editing for currency fields
 * Enabled when column is of type 'CURRENCY'
 * Supports following column options:
 *  - decimalSymbol
 *  - groupSymbol
 *  - currencyPrecision
 */

define(['override', 'jquery', 'extensions/currencyconversion'], function (override, $, currencyconversion) {

    "use strict";
    return function (grid, pluginOptions) {
        override(grid, function ($super) {
            $.extend(true, grid.options.extensions.editing,
                {
                    grid: grid,
                    editors: {
                        currency: function (record, column, value) {
                            var input = $("<input>").w2field('money', {
                                autoFormat: true,
                                currencyPrefix: '',
                                currencyPrecision: column.precision,
                                precision: column.precision,
                                groupSymbol: i18n('groupingSeparator'),
                                decimalSymbol: i18n('decimalSeparator')
                            });
                            var offeringCurrency = grid.currencyConverter.getCurrencyInformation().offeringCurrencyCode;
                            var activeCurrencyCode = grid.currencyConverter.getCurrencyInformation().activeCurrencyCode;
                            input.val(grid.currencyConverter.convert(offeringCurrency, activeCurrencyCode, value));
                            var w2 = input.data('w2field');

                            var v = input.val.bind(input);

                            input.val = function (x) {
                                return grid.currencyConverter.convert(activeCurrencyCode, offeringCurrency, w2.clean(v()));
                            };

                            return input;
                        }
                    }
                }
            );
            return {
                init: function () {
                    var grid = this;
                    $super.init();
                    grid.currencyConverter = currencyconversion(grid.target);
                }
            }
        });
    }
});