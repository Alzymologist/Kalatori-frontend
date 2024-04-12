define(
    [
        'jquery',
        'Magento_Checkout/js/view/payment/default',
        'Magento_Checkout/js/model/quote',
        'Magento_Checkout/js/model/payment/additional-validators',
        'Magento_Checkout/js/action/redirect-on-success'
    ],
    function (
        $,
        Component,
        quote,
        additionalValidators,
        redirectOnSuccessAction
    ) {
        'use strict';
        return Component.extend({
            defaults: {
                template: 'Alzymologist_KalatoriMax/payment/kalatorimax'
            },

            /**
             * @override
             */
            initialize: function () {
                let result = this._super();

                if (this.isActive()) {
                    this.loadPaymentDetails();
                }

                return result;
            },

            /**
             * @override
             */
            selectPaymentMethod: function () {
                let result = this._super();
                this.loadPaymentDetails();
                return result;
            },

            /**
             * Load payment details
             */
            loadPaymentDetails: function () {
                console.debug('Payment method is active');
                DOT.magento_init({
		    redirectOnSuccessAction: redirectOnSuccessAction,
		    magento_this: this,
		    total: parseFloat(quote.totals().grand_total),
		    currency: quote.totals().quote_currency_code,
		});
            },

            /**
             * @override
             */
            placeOrder: function (data, event) {
                var self = this;

                if (event) {
                    event.preventDefault();
                }

                if (this.validate() &&
                    additionalValidators.validate() &&
                    this.isPlaceOrderActionAllowed() === true
                ) {
		    DOT.all_submit();
                }

                return false;
            },

            /**
             * Check if payment is active.
             *
             * @return {Boolean}
             */
            isActive: function () {
                return this.isChecked() === this.getCode();
            },
        });
    }
);
