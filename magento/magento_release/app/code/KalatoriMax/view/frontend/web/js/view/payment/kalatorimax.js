define(
    [
        'uiComponent',
        'Magento_Checkout/js/model/payment/renderer-list'
    ],
    function (
        Component,
        rendererList
    ) {
        'use strict';
        rendererList.push(
            {
                type: 'kalatorimax',
                component: 'Alzymologist_KalatoriMax/js/view/payment/method-renderer/kalatorimax'
            }
        );
        /** Add view logic here if needed */
        return Component.extend({});
    }
);