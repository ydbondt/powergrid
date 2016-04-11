/***
 * Editing for currency fields
 * Enabled when column is of type 'CURRENCY'
 * Supports following column options:
 *  - decimalSymbol
 *  - groupSymbol
 *  - currencyPrecision
 */

define(['override', 'jquery', 'extensions/currencyconversion'], function(override, $, currencyconversion) {

    "use strict";
    var currencyConverter;
    return {
        init: function(grid, pluginOptions) {
            currencyConverter = currencyconversion(grid.target);
        },
        requires: {
            editing: {
                editors: {
                    currency: function(record, column, value) {
                        var input = $("<input>").w2field('money', {
                            autoFormat: true,
                            currencyPrefix: '',
                            currencyPrecision: column.precision,
                            precision: column.precision,
                            groupSymbol: i18n('groupingSeparator'),
                            decimalSymbol: i18n('decimalSeparator')
                        });
                        var offeringCurrency = currencyConverter.getCurrencyInformation().offeringCurrencyCode;
                        var activeCurrencyCode = currencyConverter.getCurrencyInformation().activeCurrencyCode;
                        input.val(currencyConverter.convert(offeringCurrency, activeCurrencyCode, value));
                        
                        var w2 = input.data('w2field');

                        var v = input.val.bind(input);
                        
                        input.val = function(x) {
                            return currencyConverter.convert(activeCurrencyCode, offeringCurrency, w2.clean(v()));
                        };
                        
                        return input;
                    }
                }
            }
        }
    };
});