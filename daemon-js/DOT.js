//                       _  __     _       _             _
//                      | |/ /__ _| | __ _| |_ ___  _ __(_)
//                      | ' // _` | |/ _` | __/ _ \| '__| |
//                      | . \ (_| | | (_| | || (_) | |  | |
//                      |_|\_\__,_|_|\__,_|\__\___/|_|  |_|
//

DOT={

debug: 0, // ТОЛЬКО ДЛЯ ОТЛАДКИ! ПОТОМ УБРАТЬ!

daemon: { // тут будет инфо, пришедшая от демона
    currency_name: 'DOT',
},

test_acc: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",

chain: { // тут будет инфо, запрошенное от блокчейна
    ss58: 0,
    decimals: false,
    mul: false,
    symbol: '',
    deposit: false, // 1*defaultMul,
    fee: false, // 0.02*defaultMul,

    wss: "https://node-polkadot.zymologia.fi:444",
    pay_acc: 0, //  целевой аккаунт, который пришлет магазин
    pay_bal: 0, // баланс на нём

    my_acc: "", // выбранный аккаунт

    order: false,
    total: false, // 30.1
    total_planks: false, // 301000000000
    total_add_planks: false,
    total_min_planks: false,

    hashTemplate: "https://polkadot.subscan.io/extrinsic/", // https://assethub-polkadot.subscan.io/extrinsic/
    topupButton: '', // (DOT.is_test() ? '' : "💰"),
},

flag: {/*
	paid: 0, // оплачен ли заказ уже
	finalized: 0, // запретить повторный запуск
	processing_payment: 0, // никаких платежей сейчас не происходит
 	success || DOT.intervalSec) return; DOT.flag.success=1; // запретить повторный запуск

	DOT.waitDaemon.stop();
	DOT.waitManual.stop();
	DOT.progress.stop();
*/},

reboot: function() {
    DOT.flag = {};
    DOT.waitDaemon.stop();
    DOT.waitManual.stop();
    DOT.progress.stop();
},

accs: [], // тут будет инфо аккаунтов

cx: {}, // а тут инфо от магазина

//////////////////////////////////////////////////////////

// Фишки для дизайна Света
SV: {

    // Select an Acount
    select: async function() { var e = window.event.target;

	console.log("=========== select account");

	var elem = ( e.className == 'kco-account' ? e : e.closest('.kco-account') );
	var a = false; for(var x of DOT.accs) { if(x.elem === elem) { a = x; break; } }
	if(a===false) {
	    console.log("Fucking Miracle: elem not found");
	    return false; // быть такого не может
	}

	if(e.tagName=='DIV') { // pin
	    if(!DOT.is_test()) return; // Debug feature only
	    DOT.do_button_on();
	    DOT.topUpBalance(e,a.acc);
	    return;
	}

        if(!a.active) return; // там недостаточно средств

	DOT.chain.my_acc = a.acc;
	DOT.chain.my_wallet = a.wallet;
	DOT.SV.page_Select();

	DOT.all_submit();
    },


    page_Select: function() {

	console.log("=========== SCREEN: select");

	var a = false; for(var x of DOT.accs) {
	    if(x.acc == DOT.chain.my_acc && x.wallet == DOT.chain.my_wallet) { a = x; break; }
	}

	// other: pay with this value

	DOT.SV.oneWallet(a.wallet);
	DOT.dom('sv-accounts-field').innerHTML=`
<button class="kco-button tiny tertiary" onclick="DOT.SV.drawAccountList()">
    ← Back to account list
</button>
<div id='sv-one-account'></div>
<div class="flex-row flex-start gap-small">
    <div class="kco-tac-toggler" val="0">
        <span class="material-symbols-outlined">check_box_outline_blank</span>
        <span class="material-symbols-outlined">check_box</span>
    </div>
    <span>Agree with <u>terms and conditions</u> to continue with payment</span>
</div>
<button class="kco-button kco-tac-disabled disabled" onclick="DOT.SV.page_Signature()">
    Sign transaction in your PolkadotJS browser extension
</button>
`;
	DOT.SV.init();
	a.elem.classList.remove('active');
	a.elem.classList.remove('inactive');
	a.elem.classList.add('selected');
	DOT.dom('sv-one-account').appendChild(a.elem);
    },


    page_draw_oneacc: function(){
	DOT.dom('sv-section-payManual').style.display='none';
	if(DOT.dom('sv-notification')) return; // Может и не надо отрисовывать

	DOT.dom('sv-section-payWallet').innerHTML=`
<span class="t-title">Pay with browser wallet</span>

<div class="kco-collapse-content flex-col gap-medium">
    <div class="flex-row gap-medium">
        <div id='sv-wallets' class="flex-row gap-small">
            <!-- block -->
        </div>
    </div>

    <div class="kco-accounts">
        <div class="flex-col gap-large scroll">

	    <div id='sv-one-account'></div>

            <div class="flex-row flex-start gap-small">
                <div id="sv-terms-val" class="kco-tac-toggler disabled" val="1">
                    <span class="material-symbols-outlined">check_box_outline_blank</span>
                    <span class="material-symbols-outlined">check_box</span>
                </div>
                <span onclick="DOT.dom('sv-terms-val').setAttribute('val','0')">Agree with <u>terms and conditions</u> to continue with payment</span>
            </div>
            <div id='sv-notification' class="kco-notification" onclick="DOT.SV.page_Process()">
        	<!-- message -->
            </div>
        </div>

    </div>
</div>`;

	DOT.SV.init();
	DOT.html_wallets();
	var a = false; for(var x of DOT.accs) {
console.log('--> '+x.acc);
 if(x.acc == DOT.chain.my_acc) { a = x; break; } }
	if(a) {
	    console.log('a: '+a.wallet+'/'+a.acc+'/'+a.name);

	    DOT.SV.oneWallet(a.wallet,'one');
	    a.elem.classList.remove('active');
	    a.elem.classList.remove('inactive');
	    a.elem.classList.add('selected');
	    DOT.dom('sv-one-account').appendChild(a.elem);
	} else console.log('notf: '+DOT.chain.my_acc);
    },


    page_Signature: function() {
	console.log("=========== SCREEN: Signature");
	DOT.SV.page_draw_oneacc();
	DOT.dom('sv-notification').innerHTML = `<span>Waiting for your Signature from <span class='chain-my_wallet'></span> browser extension</span><span class="material-symbols-outlined ani-spin">autorenew</span>`;
	DOT.all_submit();
    },

    page_Process: function() { console.log("=========== SCREEN: Process");
	DOT.SV.page_draw_oneacc();
	DOT.dom('sv-notification').innerHTML = `<span>Transaction</u> is signed. Waiting for transaction <u>block</u></span><span class="material-symbols-outlined ani-spin">autorenew</span>`;
    },

    page_InBlock: function() { console.log("=========== SCREEN: InBlock");
	DOT.SV.page_draw_oneacc();
	DOT.dom('sv-notification').innerHTML = `<span><u>Transaction</u> block is ready. Waiting for transaction <u>finalized</u></span><span class="material-symbols-outlined ani-spin">autorenew</span>`;
    },

    page_IsFinalized: function(info) { console.log("=========== SCREEN: IsFinalized ("+info+")");
	if(DOT.flag.finalized || DOT.intervalSec) return; DOT.flag.finalized=1; // запретить повторный запуск
	DOT.SV.page_draw_oneacc();
	DOT.dom('sv-notification').innerHTML = `<span><u>Transaction</u> is completes. Waiting for daemon</span><span class="material-symbols-outlined ani-spin">autorenew</span>`;
	DOT.waitDaemon.start();
    },

    page_Success: function(url) { console.log("=========== SCREEN: Success");

	if(DOT.flag.success || DOT.intervalSec) return; DOT.flag.success=1; // запретить повторный запуск

	DOT.waitDaemon.stop();
	DOT.waitManual.stop();
	DOT.progress.stop();
	DOT.flag.processing_payment = 0;

	DOT.SV.page_draw_oneacc();
	DOT.dom('sv-notification').innerHTML = `<span><u>Payment</u> successful</span><span class="material-symbols-outlined">task_alt</span>`;

	var sec = 10;
	var e = DOT.dom('sv-second-counter');
	e.innerHTML = sec;
	DOT.dom('sv-redirect-button').style.display='block';

	DOT.intervalSec = setInterval(function(){
	    if(--sec >= 0) e.innerHTML = sec;
	    else {
		clearInterval(DOT.intervalSec); DOT.intervalSec = false;
		DOT.dom('sv-redirect-button').style.display='none';
		// if(url) window.location = url;
	    }
	},1000);
    },

    drawAccountList: function() {
	DOT.dom('sv-accounts-field').innerHTML=`
<div id='sv-accounts-active' class="flex-col gap-medium">
    <!-- active -->
</div>
<div id='sv-info' class="t-small t-secondary">
</div>
<span class="t-small t-secondary">
    A balance of <span class='chain-total_min'>   </span> <span class='chain-symbol'>   </span> will be sufficient to cover both your order and the transaction fee on the Polkadot network
</span>
<div class="kco-collapsable flex-col gap-medium">
    <div class="kco-collapse-toggler flex-row">
        <span class="material-symbols-outlined">chevron_right</span>
        <span class="t-title-small">Accounts below <span class='chain-total_min'>   </span> <span class='chain-symbol'>   </span></span>
    </div>

    <div id='sv-accounts-inactive' class="kco-collapse-content flex-col gap-medium">
        <!-- inactive -->
    </div>
</div>`;

	DOT.SV.init();
	DOT.re_balance();
        DOT.SV.oneWallet();
    },

    topup: async function(e) { var e = window.event.target;
	if(!DOT.is_test()) return; // Debug feature only
	DOT.do_button_on();
	e.innerHTML=DOT.ajaximg();
	await DOT.topUpPay();
	e.innerHTML=DOT.chain.topupButton;
    },

    // Copy pay_acc to buffer + some effects
    cpbufACC: function() { var e = window.event.target;
	if(!DOT.chain.pay_acc) return;
	DOT.cpbuf(DOT.chain.pay_acc);
	var w=DOT.dom('sv-toggle-manual-field').querySelectorAll(".t-account-address")[0];
	DOT.aFlash(w,0.02);
        DOT.a360(e,0.3);
    },

    // Hightlihgt only one wallet (or all wallet if undefined)
    oneWallet: function(wallet,mode) {
	var ee = DOT.dom('sv-wallets').querySelectorAll('.kco-label').forEach(e=>{
	    if(mode=='one' && e.innerHTML!=wallet) e.style.display='none';
	    else e.classList[(!wallet || e.innerHTML==wallet?'remove':'add')]('disabled');
	});
    },

    init: function(id,html) {

        var w=DOT.dom('polkadot_work');

        for(var i in DOT.chain) { w.querySelectorAll(".chain-"+i).forEach(e=>{ e.innerHTML=
	    ( i=='topupButton'? DOT.chain[i] : DOT.h( DOT.chain[i] ) );
	}); }

	// collapse and exapnd sections
        document.querySelectorAll('.kco-collapse-toggler').forEach(e=>{
	    e.onclick = function(ev) {
		this.parentElement.classList.toggle('collapsed');
	    };
	});

	// accept terms and conditions and show manual payment address
	document.querySelectorAll('.kco-tac-toggler:not(.disabled)').forEach(e=>{
	    e.onclick = function() {
		this.setAttribute('val', (1*this.getAttribute('val')?'0':'1') );
    		document.querySelector('.kco-manual-address-field').classList.toggle('blured');
    		var w=document.querySelector('.kco-tac-disabled'); if(w) w.classList.toggle('disabled');
    		document.querySelector('body').classList.toggle('kco-tac-accepted');
	    };
	});

	// QR modal
	var qrBtn = document.querySelector('.show-qr-btn');
	var qrModal = document.querySelector('.kco-qr-modal');
	qrBtn.onclick = function(e) {
	    if(!DOT.chain.pay_acc) return;
	    DOT.dom('sv-QR').src='https://api.qrserver.com/v1/create-qr-code/?data='+DOT.chain.pay_acc;
	    qrModal.classList.add('opened');
	};
	qrModal.onclick = function(e) { qrModal.classList.remove('opened'); };
    },

},


re_wallet: async function() {
    DOT.accs=[];
    DOT.dom('sv-accounts-active').innerHTML = '';
    DOT.dom('sv-accounts-inactive').innerHTML = '';
    DOT.init();
},



re_balance: function(bal,acc) {

    var w=DOT.dom('sv-accounts-active');
    if(!w) return;

    for(var a of DOT.accs) {
	// if(!a.elem) a.elem = DOT.dom("BT_"+a.wallet+"_"+a.acc);
	if(bal!=undefined && acc && acc == a.acc) a.balance = bal;
    }

    var m = DOT.accs.filter(x => x.balance >= DOT.chain.total_min_planks);

	m.sort((b,a) => a.balance - b.balance);
	m.forEach(e => {
	    e.active = true;
	    e.elem.remove(); w.appendChild(e.elem);
	    e.elem.classList.remove('selected');
	    e.elem.classList.remove('inactive');
	    e.elem.classList.add('active');
	});

    var m = DOT.accs.filter(x => x.balance === false || x.balance < DOT.chain.total_min_planks);
    var w=DOT.dom('sv-accounts-inactive');
        m.sort((b,a) => a.balance - b.balance);
	m.forEach(e => {
	    e.active = false;
	    e.elem.remove(); w.appendChild(e.elem);
	    e.elem.classList.remove('selected');
	    e.elem.classList.remove('active');
	    e.elem.classList.add('inactive');
	});

},

onredraw: function(){}, // Redraw page

design: async function(tmpl) {

    // DOT.chain.order = DOT.cx.order_id;
    DOT.chain.total = DOT.cx.total;
    // DOT.chain.currency = DOT.cx.currency;
    DOT.chain.symbol = 'DOT';



    // не рандомировать!
    await DOT.LOADS_promice([
        'https://rsms.me/inter/inter.css',
        'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&.css',
    ],1,0);
    DOT.dom('polkadot_work').innerHTML = DOT.template; // await DOT.LOAD(DOT.mainjs+"../sv-extension.html");
    DOT.onredraw();

    DOT.dom('sv-USDC').innerHTML = DOT.chain.symbol;
    document.querySelectorAll('.t-tertiary').forEach(e=>{ e.style.display='none'; });

    DOT.SV.drawAccountList();
    DOT.onredraw();

    await DOT.init();
    DOT.SV.init();
    DOT.onredraw();

    if(DOT.is_ah()) document.querySelectorAll('.t-tertiary').forEach(e=>{ e.style.display='inline-block'; });

    // DOT.SV.oneWallet();
},





//////////////////////////////////////////////////////////
solidus_init: function(cx) {
	DOT.store = 'solidus';
	DOT.cx=cx;
	DOT.health_url = "/kalatori/blockchain_status";
	DOT.cx.ajax_url = "/kalatori/address/check";

	DOT.ajax_headers = DOT.ajax_headers_info = [
		["X-CSRF-Token", document.querySelector('meta[name="csrf-token"]').getAttribute('content')],
	];

	DOT.button_on=function(){
	    document.getElementById('modal_submit').style.display='block';
	};
	DOT.button_off=function(){
	    document.getElementById('modal_submit').style.display='none';
	};

	DOT.onpaid=function() {
	    document.getElementById('checkout_form_confirm').submit();
	}
	DOT.init();
},

//////////////////////////////////////////////////////////

magento_init: function(cx) {
    if(cx) DOT.cx = cx;

    DOT.store = 'magento';

    DOT.button_on=function(){
	    jQuery('body').trigger('processStop');
	    DOT.cx.magento_this.isPlaceOrderActionAllowed(true);
    };
    DOT.button_off=function(){
	    jQuery('body').trigger('processStart');
	    DOT.cx.magento_this.isPlaceOrderActionAllowed(false);
    };

    var p = window.checkoutConfig.payment.kalatorimax;
    if(!p) DOT.error('magento system error #0104');
    DOT.mainjs = p.assets_base_url+"/"; // "https://magento.zymologia.fi/static/version1709653373/frontend/Magento/luma/en_US/Alzymologist_KalatoriMax/js"
    DOT.chain.ajax_url = p.store_base_url+"alzymologist/payment/index"; // 'https://magento.zymologia.fi/alzymologist/payment/index'; // window.checkoutConfig.staticBaseUrl
    DOT.health_url = DOT.chain.ajax_url+"?health=1";

    DOT.onpaid=function() {
	DOT.do_button_on();
        DOT.cx.magento_this.getPlaceOrderDeferredObject().done(
                function () {
                    DOT.cx.magento_this.afterPlaceOrder();
                    if(DOT.cx.magento_this.redirectAfterPlaceOrder) {
                            DOT.cx.redirectOnSuccessAction.execute();
                    }
                }
        );
    };

    DOT.init();
},

opencart3_init: function(cx) {
    DOT.store = 'opencart3';
    DOT.button_on=function(){ $('#button-confirm').button('reset'); };
    DOT.button_off=function(){ $('#button-confirm').button('loading'); };

    DOT.class_warning=cx.class_warning;
    DOT.class_error='';
    DOT.class_ok=cx.class_ok;

    DOT.mainjs=cx.wpath+"catalog/view/javascript/polkadot/";
    DOT.mainimg=cx.wpath+"catalog/view/theme/default/image/polkadot/";

    DOT.cx=cx;

/*
    var e = DOT.dom('form-polkadot').elements;
    DOT..order_id = e.order_id.value;
    DOT..total = e.total.value;
    DOT..currency = e.currency.value;
    DOT..ajax_url = e.ajax_url.value;
    DOT..success_callback = e.success_callback.value;
    DOT..cancel_callback = e.cancel_callback.value;

//    debugger;
//    console.log(DOT.cx); // Выведет значение order_id

<input type='hidden' name='order_id' value='195'>
<input type='hidden' name='total' value='4146.716'>
<input type='hidden' name='wss' value='http://localhost:16726'>
<input type='hidden' name='ajax_url' value='https://opencart3.zymologia.fi/index.php?route=extension/payment/polkadot/confirm&user_token=9pg
<input type='hidden' name='currency' value='DOT'>
<input type='hidden' name='merchant' value=''>
    <input type='hidden' name='success_callback' value='https://opencart3.zymologia.fi/index.php?route=checkout/success'>
    <input type='hidden' name='cancel_callback' value='https://opencart3.zymologia.fi/index.php?route=checkout/checkout'>
*/
    DOT.init();
},

opencart3_submit: function() {
    // Array.from(DOT.dom('form-polkadot').elements).forEach((e) => { const { name,value } = e; DOT.cx[name]=value; });
    return DOT.all_submit();
},


// ==========================================

presta_start: function(e) {

    console.debug('presta_start()');

    e=e.closest("DIV.payment-options");
    if(!e) return DOT.error('design error 01');
    e=e.querySelector("INPUT[name='payment-option']"); // .click(); // [id*='payment-option-']
    if(!e) return DOT.error('design error 02');
    // e.style.border='10px solid red';
    e.click();
},

presta_init: function(cx) {

    console.debug('presta_init('+JSON.stringify(cx)+')');

    // запускается во время общей загрузки страницы, но выбор плагина DOT еще не сделан!
    DOT.store = 'presta';
    DOT.chain.ajax_url = (cx.ajax_url ? cx.ajax_url : cx.ajax_host);
    DOT.cx=cx;
    DOT.mainjs = cx.wpath+'/js/';

    // определяем процедуру включения основной платежной кнопки
    DOT.button_on=function() {
        document.querySelectorAll("BUTTON[type='submit'].disabled").forEach(function(e){
	    e.classList.remove("disabled");
	    e.disabled=null;
	});
    };

    // перехатываем только нашу FORM.onsubmit
    var e=document.querySelector('FORM[action*="'+cx.module_name+'"]');
    if(!e) return DOT.error("Prestashop DOT plugin: Design error!");
    e.onsubmit=function(x) { DOT.all_submit(); return false; };

/*
    // debug option
    if(DOT.debug) { // да блять согласен - поставить checkbox (ТОЛЬКО ДЛЯ ОТЛАДКИ!!!)
      document.querySelectorAll("INPUT[type='checkbox'][name*='conditions_to_approve']").forEach(function(e){
        e.parentNode.style.border='1px dotted red';
        e.setAttribute('checked',true);
      });
    }
*/

    // 1. навешиваем на каждый выбор платежной опции запоминание этой опции
    //    с функцией старта наших процедур, если выбран наш плагин
    document.querySelectorAll('DIV[id^="payment-option-"]').forEach(function(q){
        if(q.id.indexOf('-container')<0) return;
        q.onclick=function(e) { var x=this;
            if(x.tagName!='DIV'||x.id.indexOf('-container')<0) x=x.closest('DIV[id^="payment-option-"]'); if(!x) return;
            DOT.f_save('pay_select',x.id);
	    // а не наш ли это был выбран плагин?
	    if(x.querySelectorAll("IMG[src*='polkadot.webp']").length) { // да, наш!
		DOT.init();
	    }
        };
    });

    // 2. смотрим, какую платежную опцию выбирали в этом магазине прежде, делаем автовыбор
    var ps = DOT.f_read("pay_select");
    if(!ps) ps=''; else ps=''+ps;
    var p=document.getElementById(ps);
    if(p) { // если такая опция была, то сразу кликнуть нужный способ оплаты
	p=p.querySelector("INPUT#"+ps.replace(/\-container/g,''));
	if(p.focus) p.focus(); if(p.click) p.click();
    } else { // если опции не нашлось на странице
	// то какой-то вообще элемент выбран?
      document.querySelectorAll('DIV[id^="payment-option-"]').forEach(function(q){
        if(q.id.indexOf('-container')<0) return;
	if(q.querySelectorAll("IMG[src*='polkadot.webp']").length) { // если это наш, кликнуть
	    var inp = q.querySelector("INPUT[name='payment-option'");
	    if(inp && inp.checked) setTimeout(function(e){ q.click(); },100); // и если он выбран
	}
      });
    }
},

//====================================================================================================

    path: false,
    mainjs: false,

    button_on: function(){},
    button_off: function(){},
    // flag.processing_payment: 0, // никаких платежей сейчас не происходит
    do_button_on: function(){ DOT.flag.processing_payment=0; DOT.button_on(); },
    do_button_off: function(){ DOT.flag.processing_payment=1; DOT.button_off(); },

//    ajax_headers: false, // хедеры, подставляемые в платежный запрос аякса
//    ajax_headers_info false, // хедеры, подставляемые в информационный запрос аякса

    class_warning: 'alert alert-danger',

    h: function(s){
        return (''+s).replace(/\&/g,'&'+'amp;').replace(/\</g,'&'+'lt;').replace(/\>/g,'&'+'gt;').replace(/\'/g,'&'+'#039;').replace(/\"/g,'&'+'#034;'); // '
    },

    dom: function(e) { return (typeof(e)=='object' ? e : document.getElementById(e) ); },

    // alert - пишет в 'dotpay_console'
    // срабатывает всегда
    'alert': function(s){
	var w=DOT.dom('dotpay_console');
	if(!w) {
	    if(s!=='clear') console.log("DOM.alert( "+s+" )");
	    return;
	    // DOT.win_alert('no w: '+s);
	}
	if(s=='clear') { w.innerHTML=''; w.style.display='none'; }
	else { w.innerHTML+=s+'<br>';  w.style.display='block'; }
    },

    // error - сообщение о серьезной ошибке
    error: function(s) {
	DOT.reboot(); // сбросить все флаги и прочее
        DOT.do_button_on();
	DOT.alert(s);
	DOT.win_alert('DOT plugin:\n\n'+s);
	return false;
    },

    // Выдать окно с алертом ( пока alert() ) и запретить на это время уходы со страницы
    win_alert: function(s) {
	DOT.erralert=true;
	alert(s);
	DOT.erralert=false;
    },

    before_redirect: function(url) {
	DOT.SV.page_Success(url); // Before redirect
	return false;
	// alert("Payment success!\nRedirect?\n\n" + DOT.h(url) );
	// return true;
    },

    redirect: function(url) {
	if(DOT.erralert===true) DOT.win_alert('Redirect blocked: '+url);
	else {
	    console.debug("[ !!!! ] REDIRECT: "+url);
	    if( DOT.before_redirect(url) ) window.location = url;
	    return false;
	}
	return false;
    },

    // Talert - варнинги и отладочные данные
    // пишет в 'dotpay_console_test', созданной внутри 'dotpay_console' (нахера так сложно?)
    // срабатывает только при DOT.dubug=1 или при 2 аргументе: Talert( ... ,1)
    Talert: function(s,deb) {
	if(s!=='clear') console.log(s);
	if(!deb && !DOT.debug) return;

	var w=DOT.dom('dotpay_console_test');
	if(!w) {
	    if(s=='clear') return; // если пусто, то ли не создавать
	    DOT.alert("<div class='"+DOT.class_warning+"' id='dotpay_console_test'></div>");
	    w=DOT.dom('dotpay_console_test');
	    if(!w) return DOT.win_alert('Dotpayment error: '+s );
	}
	if(s=='clear') w.innerHTML='';
	else if(deb || DOT.debug) w.innerHTML+=s+'<br>';
	w.style.display=(w.innerHTML==''?'none':'block');
    },

    f_save: function(k,v){ try { return window.localStorage.setItem(k,v); } catch(e) { return ''; } },
    f_read: function(k){ try { return window.localStorage.getItem(k); } catch(e) { return ''; }},
    f_del: function(k){ try { return window.localStorage.removeItem(k); } catch(e) { return ''; }},

// ============== presta ==============
    cx: {},

is_ah: function() { // это AssetHub ?
    if( DOT.chain.wss.indexOf('-ah') < 0 ) return false;
    DOT.daemon.assethub_id = 1337; // USDC — 1337 USDT — 1984
    DOT.daemon.assethub_tip = 0; // 0 или приказываю дать татарам мзды за срочность транзации
    DOT.chain.symbol = DOT.daemon.assethub_name = "USDC";
    DOT.chain.ss58 = 0;
    DOT.chain.hashTemplate = "https://assethub-polkadot.subscan.io/extrinsic/";
    return DOT.daemon.assethub_id;
},

add_ah: function(a) { // добавляем в запрос ещё кое-какие нужные параметры, если assethub
    if(DOT.is_ah()) {
	a.tip=DOT.daemon.assethub_tip;
	a.assetId=DOT.daemon.assethub_id;
    }
    return a;
},





chain_info: async function() {
    // пытаемся установить соединение с блокчейном
    await DOT.connect();

    var cp, ah=DOT.is_ah();
    if( ah ) { // это ASSETHUB!!!
	cp = await DOT.api.query.assets.metadata(ah);
	if(!cp || !(cp=cp.toHuman())) return DOT.error("Asset toHuman");
	// Decimals
	DOT.chain.decimals = parseInt(cp.decimals); // decimals: "6"
	// chain name "DOT"
	DOT.chain.name = cp.name; // "USD Coin"
	DOT.chain.symbol = cp.symbol; // "USDC"
	// величина депозита
	cp = await DOT.api.query.assets.asset(parseInt(DOT.daemon.assethub_id));
	if(cp && (cp=cp.toHuman()) ) DOT.chain.deposit = parseInt(cp.minBalance); // minBalance 70,000
    } else {
	cp = await DOT.api.rpc.system.properties();
	if(!cp || !(cp=cp.toHuman())) return DOT.error("Chain toHuman");
	// tokenDecimals == null | [ "10" ]
	if(cp.tokenDecimals && cp.tokenDecimals[0] && 1*cp.tokenDecimals[0] ) DOT.chain.decimals = 1*cp.tokenDecimals[0];
	// chain name "DOT"
	DOT.chain.name = DOT.chain.symbol = (cp.tokenSymbol && cp.tokenSymbol[0] ? cp.tokenSymbol[0] : 'DOT');
        // ss58Format
	DOT.chain.ss58 = 1 * cp.ss58Format; // если null, то и будет 0
	// величина депозита
	DOT.chain.deposit = parseInt( await DOT.api.consts.balances.existentialDeposit );
    }

    if(	DOT.chain.decimals ) { // и если удалось принять Decimals
	DOT.chain.mul = 10 ** DOT.chain.decimals;
	if(DOT.daemon.mul && DOT.daemon.mul != DOT.chain.mul) return DOT.error('Mismatch decimals:\n\ndaemon.mul:\n'+DOT.daemon.mul+'\n\nchain.mul:\n'+DOT.chain.mul);
    } else { // а иначе берем тот, что прислал демон, если он есть, конечно
	if(!DOT.daemon.mul) return DOT.error('Empty daemon.mul and tokenDecimals both!');
        DOT.chain.mul = DOT.daemon.mul;
    }

    // Проверочки на вшивость
    if(!DOT.chain.mul) return DOT.error('Empty mul!');
    if(!DOT.chain.symbol) return DOT.error("Empty tokenSymbol");
    if(!DOT.chain.deposit) return DOT.error("Unknown existentialDeposit");

    DOT.chain.total_planks = DOT.chain.total * DOT.chain.mul;
    if(!DOT.chain.total_planks) return DOT.error("Unknown total");

    // выясним цену транзакции для НАШЕЙ КОНКРЕТНОЙ ЦЕНЫ
    var acc = (DOT.chain.pay_acc ? DOT.chain.pay_acc : DOT.test_acc );
    const { partialFee } = await DOT.Transfer(acc, DOT.chain.total_planks).paymentInfo(acc,DOT.add_ah({}));
    DOT.chain.fee_planks = parseInt(partialFee);
    if(!DOT.chain.fee_planks) return DOT.error("Unknown fee");

    DOT.chain.total_add_planks = DOT.chain.fee_planks + DOT.chain.deposit;
    DOT.chain.total_min_planks = DOT.chain.total_planks + DOT.chain.fee_planks + DOT.chain.deposit;

    DOT.chain.total_add = DOT.indot( DOT.chain.fee_planks + DOT.chain.deposit, "00X");
    DOT.chain.total_min = DOT.indot( DOT.chain.total_planks + DOT.chain.fee_planks + DOT.chain.deposit, "00X");
    DOT.chain.fee = DOT.indot( DOT.chain.fee_planks, "0000X");

},


daemon_get_info: async function() {
    // Обработали cx
    if(!DOT.chain.ajax_url && DOT.cx.ajax_url) DOT.chain.ajax_url = DOT.cx.ajax_url;
    if(!DOT.chain.order && DOT.cx.order_id) DOT.chain.order = DOT.cx.order_id;
    if(!DOT.chain.currency && DOT.cx.currency) DOT.chain.currency = DOT.cx.currency; // USD
    if(!DOT.chain.total && DOT.cx.total) DOT.chain.total = 1*((''+DOT.cx.total).replace(/^.*?([0-9\.]+).*?$/g,'$1'));

    var data = JSON.stringify({ order_id: 0, price: 0 });
    var url = ( DOT.health_url ? DOT.health_url : DOT.chain.ajax_url );
    var ajax = 'health';

    // console.log("First info:");
    // console.log(DOT.chain);

    // Если уже есть информация о цене и ордере, то сразу платежный запрос, а не health
    if( DOT.chain.order && DOT.chain.total ) {
        ajax = 'payment';
	url = DOT.chain.ajax_url;
	data = JSON.stringify({ order_id: DOT.chain.order, price: DOT.chain.total });
    }

    // Получить данные
    var s = await DOT.AJAX( url, data, DOT.ajax_headers_info );
    try { var json=JSON.parse(s); } catch(e) { return DOT.error("Json error: ["+DOT.h(s)+"]"); }
    // патчим старый формат для старых плагинов, потом уберем
    for(var n in json) { if(n.substring(0,7)=='daemon_') { json[n.substring(7)]=json[n]; } }

    // Если данные заказа пришли с бэкэнда, самое время их от него получить и запомнить
    if(json.store_total) DOT.chain.total = json.store_total;
    if(json.store_order_id) DOT.chain.order = json.store_order_id;
    if(json.store_currency) DOT.chain.currency = json.store_currency;

    // Вот оно самое главное, за чем мы ходили на бэкенд
    if(json.wss) DOT.chain.wss=json.wss;
    else {
        if(json.error) return DOT.error("Error "+json.error+(json.error_message?" ("+json.error_message+")":''));
        return DOT.error("Error connect to daemon");
    }

    // получили от демона mul?
    if((json.mul=parseInt(json.mul))) DOT.daemon.mul = ( json.mul<20 ? 10**json.mul : json.mul );

    await DOT.chain_info();

    // Вот йобаная проверка на недостаточную цену
    if(DOT.chain.total_planks <= DOT.chain.fee_planks + DOT.chain.deposit)
	return DOT.error("Error: Total can be more than "+DOT.indot( DOT.chain.fee_planks + DOT.chain.deposit, "0000X")+" (Deposit+Fee)");

    if(DOT.dom('dotpay_info')) DOT.dom('dotpay_info').innerHTML=
        "Transferring "+DOT.indot( DOT.chain.total_planks )
	+" would require approximately "+DOT.indot( DOT.chain.fee_planks )
	+" on top of that to cover transaction fees."
	//    "Amount: "+DOT.indot( DOT.chain.total_planks + DOT.chain.fee_planks)
	//    +"<br>Covers price of kit(s), transaction fee and deposit in your Polkadot account"
	+(!DOT.is_test()?'':"<br>You can see sign 💰 in a test systems. Click 💰 for top up account from Alice.")
	+"<br>&nbsp;";

    DOT.Talert("You need to have at least "+DOT.indot( DOT.chain.total_planks + DOT.chain.fee_planks + DOT.chain.deposit,1) );

    // Кстати, а не оплачен ли уже оказался наш ордер?
    if( ajax == 'payment' ) {
	if( json.pay_account ) DOT.setPayAccount(json.pay_account); // так может и платежный аккаунт уже известен?
	if( (''+json.result).toLowerCase() == 'paid' ) { DOT.onpaid(json,'get_info'); return false; }
    }

    return true;
},

indot: function(x,fmt) { // fmt: '00x' - два символа после запятой и округлить в меньшую

    var c=10000,round='round',X;
    if(fmt && fmt.length) {
	round=fmt.replace(/\d+/g,'');
	    if(round=='x') round='floor'; // округлять в меньшую
	    else if(round=='X') round='ceil'; // округлять в большую
	c=fmt.replace(/[^\d]+/g,'').length;
	if(!c) c=2;
	c=10**c;
    }

    X=Math[round]( parseInt(x)/DOT.chain.mul*c ) / c;
    if(fmt === undefined) X+=" "+DOT.chain.symbol;
    if(fmt === 1) X+=" ("+x+" planks)";
    return X;
},

ajax_process_errors: function(s0) {
    var s=''+s0; s=s.replace(/^\s+/g,'').replace(/\s+$/g,'');

    var w=s.split('{'); // }
    if(w.length>1 && w[0]!='') {
	DOT.Talert("PHP WARNING: "+DOT.h(w[0]));
	s=s.substring(w[0].length);
    }

    try { var json=JSON.parse(s); } catch(e) { return DOT.error("Json error: ["+DOT.h(s0)+"]"); }
    // патчим старый формат
    for(var n in json) { if(n.substring(0,7)=='daemon_') { json[n.substring(7)]=json[n]; } }

    if(json.error) {

        if(json.error.warning) DOT.Talert('warning: '+json.error.warning);

        if(typeof(json['error'])=='object') {
            for (i in json.error) DOT.Talert('error: '+i+' = '+json.error[i],1);
        } else {
            DOT.Talert('error: '+json.error +(json.error_message ? ' '+json.error_message : ''),1 );
        }

	return DOT.error('error: '+JSON.stringify(json) );
    }

    return json;
},


ajax_daemon: async function(info) {
    console.debug('ajax_daemon('+info+')');
    if(!DOT.chain.total || !DOT.chain.total_planks) return DOT.error('DOT plugin error 0801: empty total');
    if(!DOT.chain.order) return DOT.error('DOT plugin error 0800: empty order');
    if(!DOT.chain.ajax_url) return DOT.error('DOT plugin error 0802: empty ajax_url');
    var data = JSON.stringify({ order_id: DOT.chain.order, price: DOT.chain.total });
    // можно указать свой альтернативный AJAX для особых уродцев типа WooCommerce
    var s = await DOT[( DOT.AJAX_ALTERNATIVE ? 'AJAX_ALTERNATIVE' : 'AJAX' )]( DOT.chain.ajax_url, data, DOT.ajax_headers );
    var json = DOT.ajax_process_errors(s);
    if(!json) {
	console.debug('ajax_daemon[!]: error');
	return false;
    }
    json.ans = (''+json.result).toLowerCase(); // (waiting, paid)

    DOT.json = json;

    console.debug('ajax_daemon ans = '+json.ans);
    if(json.ans =='waiting' || json.ans == 'paid') return json;
    return DOT.error('ERROR OPT:\n\n '+JSON.stringify(json));
},

waitManual: {
    id: false,
    stop: function() {
	console.log("waitManual.stop()");
	if(DOT.waitManual.id!==false) { clearInterval(DOT.waitManual.id); DOT.waitManual.id = false; }
    },
    start: function(info) {
	console.log("waitManual.start("+info+")");
        if(DOT.waitManual.id!==false) return; // уже запущено
	DOT.waitManual.id = setInterval(
	    async function(){ // опрос демона
		if(    !DOT.chain.pay_acc
		    || !DOT.chain.my_acc
		    || !DOT.api
		) {
		    // console.log("waitManual");
		    return; // если нету платежного аккаунта или не выбран свой
		}
		// console.log("waitManual!");
		var json = await DOT.ajax_daemon('waitManual'); // сделать Ajax-запрос к демону
		if(json && json.ans == 'paid' ) {
		    console.debug("[!] waitManual: paid!");
		    DOT.waitManual.stop();
		    DOT.onpaid(json,'waitManual');
		}
	    },
	4000);
    },
},

// Думаем, что платеж завершен: тогда запустить ожидание демона
waitDaemon: {
    id: false,
    stop: function() {
	console.log("waitDaemon.stop()");
	if(DOT.waitDaemon.id!==false) {
	    clearInterval(DOT.waitDaemon.id); DOT.waitDaemon.id = false;
	    DOT.progress.stop();
	}
    },
    start: async function(info) {
	console.log("waitDaemon.start("+info+")");
        if(DOT.waitDaemon.id!==false && DOT.progress.id) return; // уже запущено
	DOT.waitDaemon.stop();
	DOT.waitDaemon.id = setInterval(
	    async function(){ // опрос демона
		var json = await DOT.ajax_daemon('waitDaemonInterval'); // сделать Ajax-запрос к демону
		if(json && json.ans == 'paid' ) {
		    console.debug("[!] waitDaemon: paid!");
		    DOT.waitDaemon.stop();
		    DOT.onpaid(json,'waitDaemon');
		}
	    },
	1000);

	// start progressbar if not yet
	DOT.progress.run(0,
    	    function(){
		DOT.error('Error: timeout');
		DOT.waitDaemon.stop();
	    }
	);

	// DOT.SV.page_IsFinalized();

    },
},

all_submit: async function(y) {
    console.debug('all_submit('+(y===undefined?'':y)+')');
    if(!y) {
	if(!DOT.chain.my_acc) {
	    console.debug('Account not selected, return');
	    return;
	}
	DOT.Talert('clear');
	DOT.alert('clear');
    }

    DOT.do_button_off();

    var json = await DOT.ajax_daemon('all_submit'); // сделать Ajax-запрос к демону
    if(json === false) return false;

    // Paid
    if( json.ans == 'paid' ) {
	console.debug("[ !!!! ] paid!");
	DOT.progress.stop();
	DOT.onpaid(json,'all_submit');
	return true;
    }

    // Waiting
    if( json.ans == 'waiting') {
	if( json.pay_account && 1*json.price ) DOT.setPayAccount(json.pay_account);
	console.debug('[#] Waiting for payment: '+DOT.chain.pay_acc );
	if(DOT.flag.paid) {
	    console.log("Transfer already done!");
	    return false;
	}
	console.log("Transfer: "+DOT.indot( DOT.chain.total_planks, 1)+"\nFrom: "+DOT.chain.my_acc+"\nTo: "+DOT.chain.pay_acc);
	DOT.payWithPolkadot(DOT.chain.my_acc, DOT.chain.total_planks, DOT.chain.pay_acc);
	return true;
    }

    return false;
  },


progress: {
    total: 30000,
    now: 0,
    timeout: 100,
    id: 0,
    fn: function(){},
    run: function(x, fn) {
	    if(x===0) { DOT.progress.now=0; DOT.progress.fn=function(){}; }
	    if(fn) DOT.progress.fn=fn;

    if(DOT.dom('dotpay_progress_info')) DOT.dom('dotpay_progress_info').innerHTML=1*DOT.progress.now+' '+1*DOT.progress.timeout;

	    if(x!=undefined && !DOT.progress.id) {
		DOT.progress.id=setInterval(DOT.progress.run,DOT.progress.timeout);
	    }

	    DOT.progress.now += DOT.progress.timeout;

	    if(DOT.progress.now >= DOT.progress.total) {
		    clearInterval(DOT.progress.id); DOT.progress.id=false;
		    return DOT.progress.fn();
	    }

	    var prc=(Math.floor(100*DOT.progress.now/DOT.progress.total));

	    // if(prc > 10) return DOT.progress.stop;

	    if(!DOT.dom('dotpay_progress')) {
		var d = document.createElement("div");
		d.id = 'dotpay_progress';
		d.style.position = 'fixed';
		d.style.left = '0px';
		d.style.bottom = '0px';
		d.style.padding = '0px 2px 1px 2px';
		d.style.width = '100%';
		d.style.height = '20px';
		d.style.zIndex = '99999';
		document.body.appendChild(d);
	    }

	    DOT.dom('dotpay_progress').innerHTML=
		"<div style='text-align: -moz-right;width:100%;height:100%;border:1px solid #666;background:linear-gradient(to right, green 0%, red 100%);'>"
		    +"<div style='height:100%;position:relative;width:"+(100-prc)+"%;background-color:white;'>"
			+"<div style='height:100%;padding:0;margin:0;position:absolute;left:5px;top:-2px;font-size:11px;color:black;'>"+(prc)+"%</div>"
		    +"</div>"
		+"</div>";
    },
    stop: function() {
	clearInterval(DOT.progress.id); DOT.progress.id=false;
	var q=DOT.dom('dotpay_progress'); if(q) document.body.removeChild(q);
    },
},

    AJAX: async function(url,data,headers) {
	if(!headers) headers=[];
        headers.push(["Content-Type", "application/json"]);
        headers.push(["X-Requested-With", "XMLHttpRequest"]);
        const r = await fetch(url,{ method:'POST',mode:'cors',credentials:'include',headers:headers,body: data});
        const txt = await r.text();
        if(r.ok) return txt;
        return DOT.error("Error: " + r.status + " "+txt);
    },

    LOAD: async function(url) {
        const r = await fetch(url,{ method:'GET'/*,mode:'cors',credentials:'include'*/});
        const txt = await r.text();
        if(r.ok) return txt;
        return DOT.error("File not found: " + r.status + " "+txt);
    },

    Transfer: function(destination, price) {
	var ah=DOT.is_ah();
	if(ah) { // AssetHub!!!
	    if(!DOT.api.tx.assets.transferKeepAlive) return DOT.error("AssetHub Transfer not found: api.tx.assets.transferKeepAlive");
	    return DOT.api.tx.assets.transferKeepAlive(ah, destination, price);
	}
	// transfer
	if( !DOT.api.tx.balances.transferKeepAlive ) return DOT.error("Transfer not found: api.tx.balances.transferKeepAlive");
	return DOT.api.tx.balances.transferKeepAlive(destination, price);
    },


    payWithPolkadot: async function(SENDER, price, destination) {

	console.log("============> DOT.payWithPolkadot()");

	DOT.Talert('clear');
	await DOT.connect();

	if(DOT.debug) DOT.Talert('Start balance: '+ await DOT.Balance(destination) );

        // Waiting for signature
	console.log("Wallet asking for signature: "+DOT.chain.my_wallet);

	const injector = await polkadotExtensionDapp.web3FromAddress(SENDER);
        DOT.SV.page_Process(); // Transaction is signed. Waiting for transaction block

	await DOT.Transfer(destination, price).signAndSend(SENDER,
	    DOT.add_ah({signer: injector.signer})
	, ({ status }) => {

	    // start progressbar if not yet
            if(!DOT.progress.id) DOT.progress.run(0,
		    function(){
			DOT.error('Error: timeout');
			setTimeout(DOT.progress.stop,800);
		    }
	    );

	    if(status.isInBlock || status.type == 'InBlock') {
		try {
		    var x=status.asInBlock.toString();
		    console.log("===> status.isInBlock: " + DOT.h(x) );
		    if(x) DOT.chain.my_hash=x;
		    DOT.SV.page_InBlock(DOT.chain.my_hash); // Transaction is completes. Waiting for daemon
		} catch(er){ console.log("Erroro 773: "+er); }
	    } else if(status.isFinalized || status.type == 'Finalized') {
		try { DOT.chain.my_hash = status.asFinalized.toString(); } catch(er) { console.log(er); }
		console.log("===> status.isFinalized: "+DOT.chain.my_hash);
		DOT.progress.stop();
		// payment done!!!
		DOT.flag.paid = 1; // чтоб второй раз не платить
		console.log('payment_done IsFinalized with hash: '+DOT.chain.my_hash);
		DOT.SV.page_IsFinalized('Finalized'); // Transaction is completes. Waiting for daemon
		return;
	    } else {
		console.log("===> status: "+status.type);
	    }
	}).catch((error) => {
            DOT.progress.stop(); // stop progressbar
	    DOT.disconnect();
	    DOT.error('transaction failed: '+error);
        });

    },


    onpaid: function(json,info) {
        if(json.redirect) return DOT.redirect(json.redirect);
	return DOT.error('Paid success. What?! Ask admin, what can we do now?');
    },

    // ИЗМЕНЕНИЕ БАЛАНСА
    onBalance: async function(from,to,amount){

	// Это событие связано с платежным аккаунтом?
	if( DOT.chain.pay_acc && ( DOT.chain.pay_acc == to || DOT.chain.pay_acc == from) ) {
	    console.debug("onBalance (pay_acc): "+DOT.indot(amount,1)+ "\n from: "+from+"\n to: "+to );

	    // И сходим проверим баланс, а там и снова обновим re_balance()
	    setTimeout(function(){ DOT.getBalance(DOT.chain.pay_acc); },10);

	    // С цeлевого аккаунта что-то сняли? Это мог сделать только демон!
	    if( DOT.chain.pay_acc == from ) {
		return DOT.SV.page_IsFinalized('onBalance:from'); // ждем реакции демона
	    }

	    // Иначе это нам кто-то что-то прислал на наш платежный
	    DOT.chain.my_acc = from; // платим с этого аккаунта
	    var find=0; for(var e of DOT.accs) { if(e.acc == from) { find=1; break; } }
	    if(!find) { // добавить такой аккаунт если не было
		DOT.accs.push({ acc: from, wallet: 'Manual', name: 'Secret Philanthropist' }); // добавить такой адрес
		for(var e of DOT.accs) { if(e.acc == from) { DOT.html_acc(e); break; } }
		setTimeout(function(){ DOT.getBalance(e.acc); },10);
	    }

	    // возьмем баланс из amount, вдруг пока мы будем его заново читать, его уже оприходуют?
	    if(!DOT.chain.pay_bal) DOT.chain.pay_bal=0;
	    DOT.chain.pay_bal += ( DOT.chain.pay_acc == to ? 1 : -1) * parseInt(amount);
	    // И нарисовать его, если он где висит
	    DOT.setBalance( DOT.chain.pay_acc, DOT.chain.pay_bal );

	    // ушла уже нужная сумма (демон сработал)?
	    if( DOT.chain.pay_bal >= DOT.chain.total_planks ) {
		return DOT.SV.page_IsFinalized('onBalance:summ'); // ждем реакции демона
	    }

	    return;
	}

	// Это событие связано с одним из аккаунтов кошельков пользователя?
	// Мало ли, может пока страница открыта, он сходил на биржу и денег себе докинул...
	for(var a of DOT.accs) {
	    if(a.acc == from || a.acc == to) {
		console.debug("BALANCE acc: amount: "+amount + "\n from: "+from+"\n to: "+to );
		DOT.getBalance(a.acc); // сходим проверим баланс, а там и обновим re_balance()
		break;
	    }
	}

	// ну а если нет, то к нам это событие вообще не относится
    },

    setPayAccount: function(acc) {
	acc = DOT.west(acc); if(!acc) return DOT.error('error payment_account format');
	if( !DOT.chain.pay_acc ) {
            var k=0;
	    document.querySelectorAll('.B_pay_account').forEach((e)=>{ e.className='B_'+acc; k++; });
            if(k) DOT.getBalance(acc);
	}
	DOT.chain.pay_acc=acc;
	return acc;
    },

/*
    pay: async function(json) {
	console.log("============> DOT.pay()");

	if(json.my_account == 'QR') {

	    console.debug('QR payment');

	    DOT.dom('dotpay_info').innerHTML=
	    "Transfer <b>"+DOT.indot( DOT.chain.total_planks )+"</b> (will require approximately "+DOT.indot( DOT.chain.fee_planks )+" on top of that to cover Polkadot transaction fees) to the following address:"
		+"<div style='padding:10px 0 10px 0;font-weight:bold;font-size:1.1em'><a onclick='DOT.cpbuf(this.innerHTML); return false;'>"+DOT.chain.pay_acc+"</a></div>"
		// +"<div style='font-size:8px;'>"+json.chain.pay_acc+"</div>"

		+"<div style='padding-left:3em;'>"
		    +"<div id='qrcode'></div>" // QR
		    +"<div style='padding-bottom: 10px;'>Currently received: <span onclick='DOT.getBalance(this.className)' class='B_"+DOT.chain.pay_acc+"'></span></div>"
		+"</div>"

		// +"<br>Order id: "+json.order_id
		+"When sent, please press the payment button once again to finalize your purchase."
		+(!DOT.is_test()?'':"<br>Test system: click <a href='javascript:DOT.topUpPay()'>here</a> to top up 1/3 summ from Alice.")
		+"<br>&nbsp;";

	    if(DOT.mainjs) DOT.LOADS(
		// "https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js"
		DOT.mainjs+"qrcode.min.js",
		function(){ new QRCode(DOT.dom('qrcode'),{
		    text: DOT.chain.pay_acc,
		    width: 192,
		    height: 192,
		    // colorDark : '#5868bf',
		    // colorLight : '#ffffff',
		    // correctLevel : QRCode.CorrectLevel.H
		    });
		}
	    );

	    DOT.getBalance(DOT.chain.pay_acc);
	    DOT.do_button_on();
	    return;

	}


	console.log("Transfer: "+DOT.indot( DOT.chain.total_planks, 1)
		+"\nFrom: "+json.my_account
		+"\nTo: "+DOT.chain.pay_acc
	);
	DOT.payWithPolkadot(json.my_account, DOT.chain.total_planks, DOT.chain.pay_acc);
    },
*/

    mpers: function(s,a) {
      return s.replace(/\{([^\{\}]+)\}/g,function(t0,t1){
        if(typeof(a[t1])!='undefined') return a[t1]; // есть есть такое {значение} - вернуть его
        if(t1.match(/[\s\,\.]+/g)!==null) return t0; // если и имена переменных что-то через запятую - то просто вернуть
        var f=t1.substring(0,1),i=t1.substring(1);
        if(f=='#') return (typeof(a[i])=='undefined'?'': h(a[i]) );
        return '';
      });
    },

    html_accounts: function() {
	DOT.accs.forEach(x=>{ DOT.html_acc(x); });
	DOT.re_balance();
    },

    html_acc: function(a) {
	if(a.elem) return;
	var r={
	    ajaximg: DOT.ajaximg(),
	    name: DOT.h(a.name),
	    acc: DOT.h( DOT.west(a.acc) ),
	    acc_min: DOT.h( a.acc.substring(0,4)+'...'+a.acc.substring(a.acc.length-4) ),
	    wallet: DOT.h( a.wallet ),
	    walletbg: 'bg-'+DOT.walletbg[a.wallet],
	    checked: (a.deff?' checked':''),
	    // symbol: DOT.chain.symbol,
	    topup: ( !DOT.is_test()?'':"<div style='position:absolute;top:2px;right:10px;title='Top up my balabce' onclick='DOT.topUpBalance(this)'>💰</div>"),
	};
	// Create a DIV <div id='BT_{wallet}_{acc}' class='kco-account inactive {walletbg} flex-row gap-small' onclick="DOT.SV.select(this,'{acc}')"></div>
	// +"<span class='t-tertiary'>00</span>"
	a.elem = document.createElement("div");
	a.elem.className = DOT.mpers('kco-account inactive {walletbg} flex-row gap-small',r);
	a.elem.onclick = DOT.SV.select;
	a.elem.innerHTML = DOT.mpers(`
<div class='identicon I_{acc}'></div>
<div class='flex-col w100'>
    <span class='t-account-title'>{name}</span>
    <span class='t-account-address'>{acc_min}</span>
</div>
<span class='t-account-balance'>
    <span class='B_{acc}' fmt='00x'>{ajaximg}</span>
</span>
<span class='t-account-balance chain-symbol'></span>
<button class='kco-select'>
    <span>Checkout</span>
    <span class='material-symbols-outlined'>arrow_right_alt</span>
</button>
`,r);
	// нарисовать как-нибудь потом идентикон
	setTimeout(function(){
		// вернуть 1 идентикон, если уже подсчитан, иначе вычислить
		if(a.identicon) return; // если есть, то не надо
		// поискать, вдруг уже есть готовый у такого же акканта, но для другого кошелька
		for(var x of DOT.accs) { if(x.identicon && a.acc === x.acc) { a.identicon = x.identicon; break; } }
		// создать, если не найдено
		if(!a.identicon) a.identicon = identicon_render(a.acc,24);
		a.elem.querySelectorAll('.I_'+a.acc).forEach(e=>{ e.innerHTML=a.identicon }); // обновить в элементе
		document.querySelectorAll('.I_'+a.acc).forEach(e=>{ e.innerHTML=a.identicon }); // обновить на странице
	},10);
    },

    HowToInstalWallet: function() {
	var s, nav = DOT.navigator();
	if( nav == 'firefox') s = "<a href='https://addons.mozilla.org/en-US/firefox/addon/polkadot-js-extension/'>polkadot{.js} for Firefox</a>";
	else if( nav == 'chrome') s = "<a href='https://chrome.google.com/webstore/detail/polkadot%7Bjs%7D-extension/mopnmbcafieddcagagdcbnhejhlodfdd'>polkadot{.js} for Chrome</a>";
	else s = "<a href='https://github.com/polkadot-js/extension'>polkadot{.js}</a>";

	return "<b>Wallet not found</b>"
		    +"<br>You can use Wallet extention "+s
		    +" or <a href='https://www.talisman.xyz/'>Talisman</a>"
		    +" or <a href='https://www.subwallet.app/'>Subwallet</a>"
		    +"<br>Also you can pay from external wallet: QR look above";
    },


    html_wallets: function() {
	const known = ['polkadotjs','talisman','subwalletjs']; // .bg-
	const other = ['01','02','03','04','05','06','07','08','09','10']; // .bg-
	var a = [...new Set(DOT.accs.map(x => x.wallet))];
	if(!DOT.walletbg) DOT.walletbg={};
	a.forEach(x=>{
	    if(!DOT.walletbg[x]) {
		var c=x.toLowerCase().replace('-','');
		if(!known.includes(c)) c = other.filter(item => !Object.values(DOT.walletbg).includes(item))[0];
		DOT.walletbg[x] = c;
	    }
	});
	var s=''; for(var x in DOT.walletbg) s+="<div class='kco-label bg-"+DOT.walletbg[x]+"'>"+DOT.h(x)+"</div>";
	var w=DOT.dom('sv-wallets'); if(w) w.innerHTML=s;
	return s;
    },

    init: async function(mode) {

	DOT.chain.topupButton = (DOT.is_test() ? "&#128176;" : ''); // 💰

	console.log('DOT init()');

/*
	// init workplace if blank
	if(!DOT.dom('sv-wallets') && !DOT.dom('WalletID') && DOT.dom('polkadot_work')) {
            DOT.dom('polkadot_work').innerHTML=
            "<p>Select your DOT-account <span id='dotpay_wallet_finded'></span>"
            +"<div id='WalletID_load' style='display:none'></div>"
            +"<div id='WalletID' style='padding-left:30px;'>"+DOT.ajaximg()+" Loading wallets</div>"
            +"<div id='dotpay_info'></div>"
            +"<div class='"+DOT.class_warning+"' style='display:none' id='dotpay_console'></div>";
	}
*/

        DOT.Talert('clear');
	DOT.do_button_on();

	// Load scripts if need
	var originalDefine = window.define;
	window.define=undefined; // delete window.define; // йобаные патчи для Magento
	  if(DOT.mainjs) await DOT.LOADS_promice([
	    DOT.mainjs+'bundle-polkadot-util.js',
	    DOT.mainjs+'bundle-polkadot-util-crypto.js',
	    DOT.mainjs+'bundle-polkadot-extension-dapp.js',
	    DOT.mainjs+'bundle-polkadot-types.js',
	    DOT.mainjs+'bundle-polkadot-api.js',
	    DOT.mainjs+'bundle-polkadot-keyring.js', // west
	    DOT.mainjs+'identicon.js'
	  ],1,0);
	window.define = originalDefine; // йобаные патчи для Magento

	// init wallets
	var wallets = await DOT.init_wallets();
	if( !wallets ) {
	    var w=DOT.dom('sv-toggle-manual');
	    if(!w) w=DOT.dom('dot_payment_manual');
	    if(w) w.click();
	    DOT.dom('sv-info').innerHTML = DOT.HowToInstalWallet();
	}
	DOT.html_wallets();
	DOT.html_accounts();

	// Getting info
	var res = await DOT.daemon_get_info();
	if(!res) return;

	// узнать все балансы, которые неизвестны
	for(var a of DOT.accs) { if(a.balance === false) a.balance = await DOT.getBalance(a.acc); }
	if(DOT.chain.pay_acc) DOT.getBalance(DOT.chain.pay_acc);

	// Запустить следилку за мануальным пополнением
	DOT.waitManual.start();
    },



    // connect Wallets
    init_wallets: async function() {
     console.log('Find wallets');
     try {
        var wallets=await polkadotExtensionDapp.web3Enable('dotpay');
        if( !wallets.length ) { console.log('Wallets not found'); return 0; }

        var deff = DOT.f_read('WalletID');
        DOT.accounts = await polkadotExtensionDapp.web3Accounts({ss58Format:DOT.chain.ss58}); // Polkadot - 0, kusama - 2
        for(var l of DOT.accounts) {
	    var acc = l.address;
	    var name = l.meta.name;
	    var wallet = l.meta.source;
	    // Есть ли такой?
	    var find=0; for(var e of DOT.accs) { if(e.acc == acc && e.wallet == wallet) { find=1; break; } }
	    if(!find) DOT.accs.push({ // добавить такой
	        acc: DOT.west(acc),
	        wallet: DOT.h( ( wallet.charAt(0).toUpperCase()+wallet.slice(1) ).replace(/js$/g,'JS') ),
	        name: DOT.h(name),
	        balance: false, // потом узнаем
	        identicon: false, // потом нарисуем
	        checked: (deff==(acc+'') ? 1 : 0), // последний выбранный?
	    });
	}
     } catch(err) { console.log('Wallets crash: '+err);	return false; }
     return true;
    },

    // Top up pay_account from Alice for 1/3 of summ (DOT.debug=1 or 'zymologia.fi' present in url)
    topUpPay: async function() {
	document.querySelectorAll('.B_'+DOT.chain.pay_acc).forEach((e)=>{ e.innerHTML=DOT.ajaximg(); });
	document.querySelectorAll('.B_pay_bal').forEach((e)=>{ e.innerHTML=DOT.ajaximg(); });
	DOT.chain.my_hash = await DOT.topUpFromAlice( DOT.chain.pay_acc, Math.ceil(DOT.chain.total_planks / 2) );
    },

    // Top up Balance from Alice for test sites (DOT.debug=1 or 'zymologia.fi' present in url)
    topUpBalance: async function(e,addr) {
	if(e.getAttribute('oldvalue') && e.getAttribute('oldvalue').length) return; // дважды не кликать
	e.setAttribute('oldvalue',e.innerHTML); // сохранить
	e.innerHTML=DOT.ajaximg(); // поставить крутилку
    	if(!addr) addr=e.closest('label').querySelector("input[type='radio']").value;
	await DOT.topUpFromAlice(addr, DOT.chain.total_planks + DOT.chain.total_add_planks );
	e.innerHTML=e.getAttribute('oldvalue'); // вернуть
	e.setAttribute('oldvalue','');
    },

    topUpFromAlice: async function(addr,value) {
	value = Math.ceil(value);
	console.debug('Alice pay '+DOT.indot(value,1)+' to ['+addr+']');
        DOT.Talert("Top up "+addr+" for "+DOT.indot(value,1));
	await DOT.connect(); // connect if not
	console.debug('DOT .connected, keyring:');
	var keyring = new polkadotKeyring.Keyring({ type: 'sr25519' });

	if(!DOT.alice) {
	    console.debug("DOT.alice start generating pair for Alice");
	    var d=Date.now();
	    // DOT.alice = keyring.addFromUri('//Alice'); // КРИВОРУКИЕ БЛЯТЬ, 40 СЕКУНД!!! СОРОК СЕКУНД ГЕНЕРИТЬ КЛЮЧ АЛИСЫ В Firefox!!!
	    DOT.alice = keyring.addFromSeed(polkadotUtil.hexToU8a("0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a"));
	    d=Math.round((Date.now()-d)/1000);
	    console.debug('DOT.alice pair ready: '+d+' second: '+DOT.alice.address);
	    if(d>5) console.debug('БЛЯТЬ ЕБАНЫЕ ПИДАРАСЫ, КАК ЖЕ ОНО ТОРМОЗИТ!');
	}

	var hash = await DOT.Transfer(addr, value).signAndSend(DOT.alice);
	console.debug('DOT.alice hash: '+hash);
	DOT.Talert('Transaction sent with hash '+hash);
	return hash.toHex();
    },

    navigator: function(){ // get Browser' name
        var ua=navigator.userAgent, tem;
        var M=ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if(/trident/i.test(M[1])){
	    tem= /\brv[ :]+(\d+)/g.exec(ua) || [];
            return 'IE '+(tem[1] || '');
	}
        if(M[1]==='Chrome'){
	    tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
    	    if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
	}
	M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
	if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
	return M[0].toLowerCase();
    },

    save_addr: function(x) { DOT.f_save('WalletID',this.value); },


    Balance: async function(acc) {
	var e,ah=DOT.is_ah();
	try {
	    if(ah) { // AssetHub!!!
		e = await DOT.api.query.assets.account( ah, acc );
		return 1*e.toJSON().balance;
	    } else { // Polkadot
		e = await DOT.api.query.system.account( acc );
		return 1*e.data.free.toLocaleString();
	    }
	} catch(er) {
	    console.log(er);
	    return '';
	}
    },

    // скачать баланс и обновить на странице всюду
    getBalance: async function(as) {
	// await DOT.connect();
	var acc = as.match(/B_([0-9a-z]+)/gi);
	acc = (acc ? acc.replace(/^B_/g,'') : as);
	// раставили картинки-заглушки
	document.querySelectorAll('.B_'+acc).forEach((e)=>{ e.innerHTML=DOT.ajaximg(); });
	// пошли качать баланс
	if(DOT.api) {
	    var bal = await DOT.Balance(acc);
	    DOT.setBalance( acc, bal );
	    return bal;
	}
	return false;
    },

    // баланс известен, обновить его на странице всюду
    setBalance: function(acc,bal) {
	if(acc==DOT.chain.pay_acc) {
	    DOT.chain.pay_bal=bal; // Если это наш баланс, то сохранить
	    document.querySelectorAll('.B_pay_bal').forEach((e)=>{ e.innerHTML=DOT.indot( bal, e.getAttribute('fmt') ); });
	}
	document.querySelectorAll('.B_'+acc).forEach((e)=>{ e.innerHTML=DOT.indot( bal, e.getAttribute('fmt') ); });
	DOT.re_balance(bal,acc);
    },

/*
    // проверить, какие аккаунты подходят
    checkBalanceLabel: function(e,bal,acc) {

	DOT.accs.forEach(e=>{
	    if(e.acc === acc) e.balance = bal;
	});

	// console.log("BALANCE GET: "+bal+" for "+acc);

	if(DOT.dom('sv-accounts-active')) return DOT.re_balance(bal,acc);

	var w=e.closest('label.DOT_ADDR');
	if(!w || w.classList.contains('dot_manual')) return; // этот баланс не внутри блока аккаунтов, ничего делать не надо

	w.setAttribute('nobalance',0); // этот баланс уже проверен

	// какой нынче минимум баланса?
	// set Opacity
	if( bal < DOT.chain.total_min_planks ) {
	    w.style.opacity='0.5';
	    w.querySelector('INPUT').setAttribute('disabled',true);
	} else {
	    w.style.opacity='1.0';
	    w.querySelector('INPUT').removeAttribute("disabled");
	}

	// Остались ли непроверенные аккаунты?
	if( DOT.dom('WalletID').querySelectorAll("LABEL.DOT_ADDR[nobalance='1']").length ) return;

	// Сколько доступных кошельков?
	var pp=DOT.dom('WalletID').querySelectorAll("LABEL.DOT_ADDR INPUT:not([disabled])");
	// Если 1 - мануал, выделить; если 2 - что-то кроме мануала, выделить его

	if(pp.length===1 || pp.length===2) {
	    pp=pp[pp.length-1];
	    if(pp.tagName!='INPUT') pp=pp.querySelector('INPUT');
	    pp.click();
	}
    },
*/

    west: function(x) {
	if(x.length != 66 || x.substring(0,2) != '0x') x=DOT.west2id(x);
	return DOT.id2west(x);
    },

    west2id: function(west){
	try{ return polkadotUtil.u8aToHex(polkadotKeyring.decodeAddress(west)); }
        catch(e) { return false; }
    },

    id2west: function(id){ id=''+id;
	if(id.length != 66 || id.substring(0,2) !='0x') return false;
	return polkadotKeyring.encodeAddress(id,DOT.chain.ss58);
    },

    disconnect: async function() {
	if(!DOT.api) return;
	await DOT.api.disconnect();
	DOT.api=false;
    },

    connect: async function() {
	if(DOT.api) return DOT.api;
	if(!DOT.chain.wss) {
	    return DOT.error('no wss');
	}
	// соединяемся с блокчейном
	var wss = (''+DOT.chain.wss).replace(/\:\d+$/g,'');
	var Prov = new polkadotApi.WsProvider(wss);

	var a = { provider: Prov }; // для общего случая коннекта
	if(DOT.is_ah()) { // в случае assetHub добавляем невыразимой мистической хуйни от шамана Габышева и Сёко Асахара
	    a.signedExtensions = {
	          ChargeAssetTxPayment: { extrinsic: {tip: "Compact<Balance>", assetId: "Option<AssetId>" } }
	    };
	}

	DOT.api = await polkadotApi.ApiPromise.create(a);

	// и подписались на события изменения баланса
	DOT.api.query.system.events((events) => {
	  events.forEach(({ event, phase }) => {
	    // console.log(`\t: ${event.section}:${event.method}:: (phase=${phase.toString()})`);
            var [from, to, amount] = event.data;
            from = (from && from.toString ? DOT.west(from.toString()):false);
            to = (to && to.toString ? DOT.west(to.toString()):false);
            amount = (amount && amount.toString ? parseInt(amount.toString()):false);
        	//     console.log(
		// "\nfrom("+typeof(from)+") = "+from
		// +"\nto("+typeof(to)+") = "+to
		// +"\namount("+typeof(amount)+") = "+amount
		// );
		if(from) DOT.getBalance(from);
		if(to) DOT.getBalance(to);
		if(DOT.onBalance && to) DOT.onBalance(from,to,amount); // to === YOUR_TARGET_ACCOUNT_ADDRESS
	  });
	});

    },


// LOADES: {},
 LOADS: function(u,f,err,sync,rand) { if(typeof(u)=='string') u=[u];

	if(!window.DOTLOADES) window.DOTLOADES={};

        var randome='?random='+Math.random(); // DEBUG ONLY!
	if(rand===0) randome='';

        var s;
        for(var i of u) { if(window.DOTLOADES[i]) continue;
         if(/\.css($|\?.+?$)/.test(i)) {
            s=document.createElement('link');
            s.type='text/css';
            s.rel='stylesheet';
            s.href=i+randome;
            s.media='screen';
         } else {
            s=document.createElement('script');
            s.type='text/javascript';
            s.src=i+randome;
            s.defer=true;
         }
         s.setAttribute('orign',i);
         if(sync) s.async=false;
         s.onerror=( typeof(err)=='function' ? err : function(e){ DOT.error('File not found: '+e.src); } );
         s.onload=function(e){ e=e.target;

	    window.DOTLOADES[e.getAttribute('orign')]=1;
            var k=1; for(var i of u) {
		if(!window.DOTLOADES[i]){ k=0; break; }
	    }
            if(k){ if(f) f(e.src); }
         };
         document.getElementsByTagName('head').item(0).appendChild(s);
        }
        if(!s) { if(f) f(1); }
 },

 LOADS_sync: function(u,f,err,rand) { DOT.LOADS(u,f,err,1,rand) },

 LOADS_promice: function(file,sync,rand) {
        return new Promise(function(resolve, reject) { DOT.LOADS(file,resolve,reject,sync,rand); });
 },

 cpbuf: function(e,message){ if(typeof(e)=='object') e=e.innerHTML;
    var area = document.createElement('textarea');
    document.body.appendChild(area);
    area.value = e;
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
    // DOT.win_alert('Copy: '+(DOT.h(e).replace(/\n/g,'<br>')) );
 },

ajaxm: "data:image/gif;base64,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",
ajaximg: function(){ return "<img src='"+DOT.ajaxm+"'>"; },
is_test: function() {
    return (
	document.location.href.indexOf('zymologia.fi')>=0
	|| DOT.testmode
	|| DOT.debug
	? true : false
    );
},
alice_keys: function() { return JSON.parse('{"address":"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY","addressRaw":{"0":212,"1":53,"2":147,"3":199,"4":21,"5":253,"6":211,"7":28,"8":97,"9":20,"10":26,"11":189,"12":4,"13":169,"14":159,"15":214,"16":130,"17":44,"18":133,"19":88,"20":133,"21":76,"22":205,"23":227,"24":154,"25":86,"26":132,"27":231,"28":165,"29":109,"30":162,"31":125},"isLocked":false,"meta":{},"publicKey":{"0":212,"1":53,"2":147,"3":199,"4":21,"5":253,"6":211,"7":28,"8":97,"9":20,"10":26,"11":189,"12":4,"13":169,"14":159,"15":214,"16":130,"17":44,"18":133,"19":88,"20":133,"21":76,"22":205,"23":227,"24":154,"25":86,"26":132,"27":231,"28":165,"29":109,"30":162,"31":125},"type":"sr25519"}'); },

// WEB-animation
aFlash: function(p,x){
    p=DOT.dom(p).style; if(!x)x=0.5;
    p.transitionDuration=x+'s';
    p.transform='scale(1.7)';
    setTimeout(function(){ p.transitionDuration=2*x+'s'; p.transform='scale(1)';},x*2000);
    setTimeout(function(){ p.transform='unset'; },x*4200);
},

a360: function(p,x){ p=DOT.dom(p).style; if(!x)x=1;
    p.transitionDuration=x+'s';
    p.transform='rotate(360deg)';
    setTimeout(function(){ p.transform='unset'; },x*1010);
},







template: `

<div class="kco-container flex-col gap-xl">

<section id='sv-section-selectCurrency' class="flex-row gap-medium">
    Kalatori pay with
    <div class="kco-select">
        <span id='sv-USDC'>USDC</span>
        <span class="material-symbols-outlined">keyboard_arrow_down</span>
    </div>
</section>

<section id='sv-section-aboutPayment' class="flex-col gap-small">
    <div class="flex-row flex-baseline gap-small">
        <span class="t-price"><span class='chain-total'>   </span> <span class='chain-symbol'>   </span></span>
        <span class="t-small t-tertiary">(<span class='chain-total'>   </span>€, 1 <span class='chain-symbol'>   </span> = 1 €)</span>
    </div>
    <div class="t-small">
        Including potential maximum transaction fee up to ~<span class='chain-fee'>   </span> <span class='chain-symbol'>   </span>
        <span class="t-tertiary">(<span class='chain-fee'>   </span>€)</span>
    </div>
</section>

<section id='sv-section-payManual' class="kco-collapsable collapsed">
    <div id='sv-toggle-manual' class="kco-collapse-toggler flex-row">
        <span class="material-symbols-outlined">chevron_right</span>
        <span class="t-title">Pay from external wallet</span>
    </div>
    <div id='sv-toggle-manual-field' class="kco-collapse-content flex-col gap-medium">
        <p class="t-secondary t-small">
            Send your payment to the unique address for your oder. Once <span class='chain-total_min'>   </span> <span class='chain-symbol'>   </span> is received at this address, your order will be completed.
        </p>

        <div class="flex-row flex-start gap-small">
            <div class="kco-tac-toggler" val="0">
                <span class="material-symbols-outlined">check_box_outline_blank</span>
                <span class="material-symbols-outlined">check_box</span>
            </div>
            <span>Agree with <u>terms and conditions</u> to see the address and continue with payment</span>
        </div>

        <div class="kco-manual-payment-card flex-col gap-large">
            <div class="kco-manual-address-field blured flex-row gap-medium">
                <span class="t-account-address"><span class='chain-pay_acc'>   </span></span>
                <div class="kco-qr-modal">
                    <img id='sv-QR'>
                </div>
                <button class="kco-button small" onclick="DOT.SV.cpbufACC(this)">
                    <span class="material-symbols-outlined">content_copy</span>
                </button>
                <button class="kco-button small show-qr-btn">
                    <span class="material-symbols-outlined">qr_code_scanner</span>
                </button>
            </div>
            <span class="t-small"><span class='chain-topupButton' onclick='DOT.SV.topup(this)'></span>Total received <span class='chain-pay_bal B_pay_bal'></span> <span class='chain-symbol'></span> / <span class='chain-total_min'></span> <span class='chain-symbol'></span></span>
        </div>
    </div>
</section>

<section id='sv-section-payWallet' class="kco-collapsable flex-col gap-medium">
    <div id='sv-toggle-waller' class="kco-collapse-toggler flex-row">
        <span class="material-symbols-outlined">chevron_right</span>
        <span class="t-title">Pay with browser wallet</span>
    </div>

    <div class="kco-collapse-content flex-col gap-medium">
        <div class="flex-row gap-medium">
            <div id='sv-wallets' class="flex-row gap-small">
			<!-- block -->
            </div>
            <button class="kco-button secondary small" onclick="DOT.re_wallet()">
                <span class="material-symbols-outlined">sync</span>
            </button>
        </div>

        <div class="kco-accounts">
            <div id='sv-accounts-field' class="flex-col gap-large scroll">
			<!-- accounts field -->
            </div>
        </div>
    </div>
</section>

<button id='sv-redirect-button' class="kco-button" style='display:none'>
        You will be redirected to your order in <span id='sv-second-counter'>7</span> seconds
</button>

</div>
`,

};

// export DOT:
try { module.exports = DOT; } catch(e){}
