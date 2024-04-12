// https://github.com/woocommerce/woocommerce-blocks/issues/3000

// КОГДА МЫ ПРОСТО ЗАГРУЗИЛИ СТРАНИЦУ
(function () {
  var my_args = false;
  var DOTloaded = false;
  // Работа с памятью браузера шоб не грузить раньше времени DOT.js
  f_save = function(k,v){ try { return window.localStorage.setItem(k,v); } catch(e) { return ''; } };
  f_read = function(k){ try { return window.localStorage.getItem(k); } catch(e) { return ''; }};

  pageload = function() { // Считаем, что загрузили полностью и реакт просрался

    var pp = document.querySelectorAll("input.wc-block-components-radio-control__input");
    if(pp.length) {
	var pay = ''+f_read('payment_select');
	pp.forEach((e) => {
	    e.addEventListener("click", (event) => {
	        var id=event.target.id;
	        f_save('payment_select',id);
	        return true;
	    });
	    if(e.id == pay) e.click();
	});
    }

    // пробуем убрать срабатывание формы
    var button = document.querySelector('.wc-block-components-checkout-place-order-button');
    button.onclick = async function(event) {
        var button = document.querySelector('.wc-block-components-checkout-place-order-button');
	var paid=button.getAttribute('paid');
	if(paid) return true; // действие кнопки как задумано
	// иначе выполняем свой Ajax вместо ихней кнопки
	event.preventDefault();
	if(event.stopPropagation) event.stopPropagation();
	if(event.stopImmediatePropagation) event.stopImmediatePropagation();
	ajax_checkout();
	return false;
    };

  };

    const BUTTON_NAME = 'Pay using Polkadot';
    // Imports
    const { decodeEntities }  = wp.htmlEntities;
    // Data
    const settings = wc.wcSettings.getSetting('polkadot_data', {});
    const path = settings.root_url+'/';
    const label = 'Kalatori'; // decodeEntities(settings.title) || 'polkadot';

    var cx = {
	    currences: settings.currences,
	    currency: settings.currency,
	    mainjs: path,
	    status_url: path.replace(/\/wp\-content\/.+$/g,'')+'/wp-json/kalatori/v1/status',
	    order_url: path.replace(/\/wp\-content\/.+$/g,'')+'/wp-json/wc/store/v1/checkout?_locale=user&ajax=1',
    };

    ajax_checkout = async function(e) {

    // переопределяем альтернативный AJAX для DOT-процедур
/*
        DOT.AJAX_ALTERNATIVE = async function(url,s) {
	    var args = JSON.parse(my_args);
	    var customer_note=document.querySelector("DIV.wc-block-checkout__add-note TEXTAREA");
	    customer_note=(customer_note ? (''+customer_note.value) : '');

	    var data={
		"shipping_address": args.cart.shippingAddress,
		"billing_address": args.cart.billingAddress,
		"customer_note": customer_note,
		"payment_method": "polkadot",
		"payment_data": [{"key":"wc-polkadot-new-payment-method","value":false}],
	    };

	    const r = await fetch(
		DOT.payment_url // +"&mul="+DOT.chain.mul
		,{ method:'POST', mode:'cors', credentials:'include', headers: [  ["Content-Type", "application/json"],
		    ["X-WP-Nonce", wp.apiFetch.nonceMiddleware.nonce ],
		    ["Nonce", JSON.parse(DOT.f_read('storeApiNonce')).nonce ],
		], body: JSON.stringify(data)
		}
	    );
	    if(!r.ok) return DOT.error("Error: " + r.status);
	    return await r.text();
	};
*/

	DOT.all_submit();
    };

wallet_start=function(){
    console.log('find wallets');

    wallet_go=function(){
        console.log('wallet go');
	if(typeof(DOT)!='object') { console.log('No DOT'); return; }
	if(!DOT.dom('polkadot_work')) { console.log('No polkadot_work yet'); return setTimeout(function(){wallet_go()},200); }
	if(DOT.inited) {
	    console.log('dot inited');
	    return;
	}
	DOT.inited=1; setTimeout(function(e){ DOT.inited=0; },3000);

        console.log('wallet go inited');

	// make data
	DOT.store = 'woocommerce';

	DOT.cx = cx;
	DOT.class_ok="wc-block-store-notice wc-block-components-notice-banner is-ok is-dismissible";
	DOT.class_error="wc-block-store-notice wc-block-components-notice-banner is-error is-dismissible";
	DOT.class_warning="wc-block-store-notice wc-block-components-notice-banner is-warning is-dismissible";

	DOT.button_on=function() {
	    var b=document.querySelector('.wc-block-components-checkout-place-order-button');
	    b.querySelectorAll('SPAN')[0].innerHTML='Pay using Kalatori';
	    b.disabled=false;
	};

	DOT.button_off=function() {
	    var b=document.querySelector('.wc-block-components-checkout-place-order-button')
	    b.querySelectorAll('SPAN')[0].innerHTML='...'; // "<img src='"+DOT.ajaxm+"'>";
	    b.disabled=true;
	};

/*
	DOT.onpaid = function(json){
	    DOT.button_on();
	    var button = document.querySelector( '.wc-block-components-checkout-place-order-button' );
	    button.setAttribute('paid','1'); // пометили, что платеж получился
	    button.click();
	    // alert('PAID!');
	};
*/

	DOT.onjson = function(json) {
	    if(json.ans =='pending' || json.ans == 'paid') return json;
	    if(!json.payment_result || json.payment_result.payment_status != "success") return json;
	    json.ans = 'paid';
	    json.redirect = json.payment_result.redirect_url;
	    return json;
	};

	DOT.ondata = function(data) {
	    // Renew headers
	    DOT.ajax_headers = {
		"X-WP-Nonce": wp.apiFetch.nonceMiddleware.nonce,
		"Nonce": JSON.parse(DOT.f_read('storeApiNonce')).nonce,
	    };
	    // Create Data
	    var args = JSON.parse(my_args);
	    var customer_note=document.querySelector("DIV.wc-block-checkout__add-note TEXTAREA");
	    customer_note=(customer_note ? (''+customer_note.value) : '');

	    DOT.cx.order_url = DOT.cx.order_url.replace(/\&currency\=.+$/g,'')+'&currency='+data.currency;

	    return {
		"shipping_address": args.cart.shippingAddress,
		"billing_address": args.cart.billingAddress,
		"customer_note": customer_note,
		"payment_method": "polkadot",
		"payment_data": [{"key":"wc-polkadot-new-payment-method","value":false}],
	    };
	};

	DOT.design();
    };



    if(typeof(DOT)=='object') wallet_go();
    else {
      if( !DOTloaded ) {
	DOTloaded = 1;
        var s=document.createElement('script');
	s.type='text/javascript';
	s.src=path+'DOT.js';
	    if(path.indexOf('https://woocommerce.zymologia.fi')===0) s.src+='?random='+Math.random(); // MY OWN DEBUG
	s.onerror=function(e){ alert('DOT plugin: script not found: '+e.src) };
	s.onload=wallet_go;
	document.getElementsByTagName('head').item(0).appendChild(s);
      }
    }
};

// При выборе Polkadot.js
const Content_open = () => {
    wallet_start();
    return Content2();
};

const Content2 = () => {
    return React.createElement('div', { className: 'greeting', id: 'polkadot_work' },
	React.createElement(
	    'div',
	    { className: 'greeting', id: 'polkadot_work' },
	    "Loading engine... If you see this message long enough to read to the end, something has gone wrong."
//	    'img',
//	    { className: 'is_error', src: path+'/image/ajaxm.gif' }, // DOT.ajaxm пока не существует
//	    null
	)
    );
};

const Label = props => {
	const { PaymentMethodLabel } = props.components;
	return React.createElement(PaymentMethodLabel, { text: label });
};

const canMakePayment = (args) => {
    // сохраним наши рабочие аргументы
    my_args = JSON.stringify(args);

    if(!args.cartTotals) alert('Error #0704 no args');
    var p=args.cartTotals;
    cx.total = p.currency_prefix + ( p.total_price / (10 ** p.currency_minor_unit) );
    cx.code = p.currency_code;

    var button = document.querySelector('.wc-block-components-checkout-place-order-button');
    if(!button) return; // пока не готово, придем в другой раз

    setTimeout(pageload,200);
    return true;
};

// Регистрируем Payment method
const PolkadotPaymentMethod = {
      name: 'polkadot',
      label: React.createElement(Label, null),
      content: React.createElement(Content_open, null),
      edit: React.createElement(Content2, null),
      placeOrderButtonLabel: BUTTON_NAME, // __('Pay using Polkadot', 'polkadot'),
      icons: null, // ??? ['https://assets.polkadot.network/brand/Polkadot_Logo/Horizontal/SVG/Transparent/Polkadot_Logo_Horizontal_Pink-White.svg'],
      canMakePayment: canMakePayment,
      ariaLabel: label
};
wc.wcBlocksRegistry.registerPaymentMethod( PolkadotPaymentMethod );

}());
