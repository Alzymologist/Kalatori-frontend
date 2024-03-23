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

chain: { // тут будет инфо, запрошенное от блокчейна
    ss58Format: 0,
    amountAdd: false, // 1.02*defaultMul,
    tokenDecimals: false,
    mul: false, // defaultMul,
    tokenSymbol: "ERR",
    existentialDeposit: false, // 1*defaultMul,
    partialFee: false, // 0.02*defaultMul,
},

cx: {}, // а тут инфо от магазина

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
    DOT.cx.ajax_url = p.store_base_url+"alzymologist/payment/index"; // 'https://magento.zymologia.fi/alzymologist/payment/index'; // window.checkoutConfig.staticBaseUrl
    DOT.health_url = DOT.cx.ajax_url+"?health=1";

    DOT.onpaid=function() {
	DOT.button_on();
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
    DOT.cx.order_id = e.order_id.value;
    DOT.cx.total = e.total.value;
    DOT.cx.currency = e.currency.value;
    DOT.cx.ajax_url = e.ajax_url.value;
    DOT.cx.success_callback = e.success_callback.value;
    DOT.cx.cancel_callback = e.cancel_callback.value;

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
    if(!cx.ajax_url) {
	cx.ajax_url=cx.ajax_host;
	// cx.ajax_url=cx.wpath.replace(/\/views$/g,'/')+'ajax.php';
    }

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
	if(!w) DOT.win_alert('no w: '+s);
	if(s=='clear') { w.innerHTML=''; w.style.display='none'; }
	else { w.innerHTML+=s+'<br>';  w.style.display='block'; }
    },

    // error - сообщение о серьезной ошибке
    error: function(s) {
        DOT.button_on();
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

    redirect: function(url) {
	if(DOT.erralert===true) DOT.win_alert('Redirect blocked: '+url);
	else {
	    console.debug("[ !!!! ] REDIRECT: "+url);
	    window.location = url;
	}
	return false;
    },

    // Talert - варнинги и отладочные данные
    // пишет в 'dotpay_console_test', созданной внутри 'dotpay_console' (нахера так сложно?)
    // срабатывает только при DOT.dubug=1 или при 2 аргументе: Talert( ... ,1)
    Talert: function(s,deb) {
	console.log(s);
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

// What account is selected?
selected_acc: function() {
    DOT.dom("WalletID").querySelectorAll("INPUT").forEach(function(x){ if(x.checked) DOT.cx.acc=x.value; });
    if(DOT.cx.acc && DOT.cx.acc != 'false' && DOT.cx.acc!='') return true;
    return DOT.error('Please select account');
},


is_ah: function() { // это AssetHub ?
    if( DOT.daemon.wss.indexOf('-ah') < 0 ) return false;
    DOT.daemon.assethub_id = 1337; // USDC — 1337 USDT — 1984
    DOT.daemon.assethub_tip = 0; // хуй знает чего, но 0
    DOT.daemon.assethub_name = "USDC";
    // установка важных для assethub параметров:
    DOT.chain.ss58Format = 0;
    // DOT.chain.tokenSymbol = DOT.daemon.assethub_name; // "USDC"
    return DOT.daemon.assethub_id;
},

add_ah: function(a) { // добавляем в запрос ещё кое-какие нужные параметры, если assethub
    if(DOT.is_ah()) {
	a.tip=DOT.daemon.assethub_tip;
	a.assetId=DOT.daemon.assethub_id;
    }
    return a;
},

daemon_get_info: async function() {

    var data = JSON.stringify({ order_id: 0, price: 0 });
    var url = ( DOT.health_url ? DOT.health_url : DOT.cx.ajax_url );
    var ajax = 'health';

    // Если уже есть информация о цене и ордере, то сразу платежный запрос, а не health
    if( DOT.cx.order_id && DOT.total() ) {
        ajax = 'payment';
	url = DOT.cx.ajax_url;
	data = JSON.stringify({ order_id: DOT.cx.order_id, price: DOT.total() });
    }

    console.debug("daemon_get_info: "+data);

    var s = await DOT.AJAX( url, data, DOT.ajax_headers_info );
    try { var json=JSON.parse(s); } catch(e) { return DOT.error("Json error: ["+DOT.h(s)+"]"); }

    // патчим старый формат для старых плагинов, потом уберем
    for(var n in json) { if(n.substring(0,7)=='daemon_') { json[n.substring(7)]=json[n]; } }

    // Если данные заказа пришли с бэкэнда, самое время их от него получить и запомнить
    if(json.store_total) DOT.cx.total = json.store_total;
    if(json.store_order_id) DOT.cx.order_id = json.store_order_id;
    if(json.store_currency) DOT.cx.currency = json.store_currency;

    // Вот оно самое главное, за чем мы ходили на бэкенд
    if(json.wss) DOT.daemon.wss=json.wss;
    else {
        if(json.error) return DOT.error("Error "+json.error+(json.error_message?" ("+json.error_message+")":''));
        return DOT.error("Error connect to daemon");
    }

    // получили от демона mul?
    if((json.mul=parseInt(json.mul))) DOT.daemon.mul = ( json.mul<20 ? 10**json.mul : json.mul );

    // пытаемся устновить соединение с блокчейном
    await DOT.connect();

    var cp, ah=DOT.is_ah();
    if( ah ) { // это ASSETHUB!!!
	cp = await DOT.api.query.assets.metadata(ah);
	if(!cp || !(cp=cp.toHuman())) return DOT.error("Asset toHuman");
	// Decimals
	DOT.chain.tokenDecimals = parseInt(cp.decimals); // decimals: "6"
	// chain name "DOT"
	DOT.chain.name = cp.name; // "USD Coin"
	DOT.chain.tokenSymbol = cp.symbol; // "USDC"
	// величина депозита
	cp = await DOT.api.query.assets.asset(parseInt(DOT.daemon.assethub_id));
	if(cp && (cp=cp.toHuman()) ) DOT.chain.existentialDeposit = parseInt(cp.minBalance); // minBalance 70,000
    } else {
	cp = await DOT.api.rpc.system.properties();
	if(!cp || !(cp=cp.toHuman())) return DOT.error("Chain toHuman");
	// tokenDecimals == null | [ "10" ]
	if(cp.tokenDecimals && cp.tokenDecimals[0] && 1*cp.tokenDecimals[0] ) DOT.chain.tokenDecimals = 1*cp.tokenDecimals[0];
	// chain name "DOT"
	DOT.chain.name = DOT.chain.tokenSymbol = (cp.tokenSymbol && cp.tokenSymbol[0] ? cp.tokenSymbol[0] : 'XZ');
        // ss58Format
	DOT.chain.ss58Format = 1 * cp.ss58Format; // если null, то и будет 0
	// величина депозита
	DOT.chain.existentialDeposit = parseInt( await DOT.api.consts.balances.existentialDeposit );
    }

    if(	DOT.chain.tokenDecimals ) { // и если удалось принять Decimals
	DOT.chain.mul = 10 ** DOT.chain.tokenDecimals;
	if(DOT.daemon.mul && DOT.daemon.mul != DOT.chain.mul) return DOT.error('Mismatch decimals:\n\ndaemon.mul:\n'+DOT.daemon.mul+'\n\nchain.mul:\n'+DOT.chain.mul);
    } else { // а иначе берем тот, что прислал демон, если он есть, конечно
	if(!DOT.daemon.mul) return DOT.error('Empty daemon.mul and tokenDecimals both!');
        DOT.chain.mul = DOT.daemon.mul;
    }

    // Проверочки на вшивость
    if(!DOT.chain.mul) return DOT.error('Empty mul!');
    if(!DOT.chain.tokenSymbol) return DOT.error("Empty tokenSymbol");
    if(!DOT.chain.existentialDeposit) return DOT.error("Unknown existentialDeposit");

    DOT.total_planks = DOT.total() * DOT.chain.mul;
    if(!DOT.total_planks) return DOT.error("Unknown total");

    // выясним цену транзакции для НАШЕЙ КОНКРЕТНОЙ ЦЕНЫ
    const addr = "0x80723effd95bfea4c175a1ceed58e4b4b6bd2609a709e22d8d7a415ce263863f";

    const { partialFee } = await DOT.Transfer(addr, DOT.total_planks)
	.paymentInfo(addr,DOT.add_ah({}));
    DOT.chain.partialFee = parseInt(partialFee);


    if(!DOT.chain.partialFee) return DOT.error("Unknown partialFee");
    // Итак, на сколько должна превышать сумма?
    DOT.chain.total_planksAdd = DOT.chain.partialFee + DOT.chain.existentialDeposit;

    DOT.dom('dotpay_info').innerHTML=
        "Transferring "+DOT.indot( DOT.total_planks )
	+" would require approximately "+DOT.indot( DOT.chain.partialFee )
	+" on top of that to cover transaction fees."
	//    "Amount: "+DOT.indot( DOT.total_planks + DOT.chain.partialFee)
	//    +"<br>Covers price of kit(s), transaction fee and deposit in your Polkadot account"
	+(DOT.is_test()?'':"<br>You can see sign 💰 in a test systems. Click 💰 for top up account from Alice.")
	+"<br>&nbsp;";

    DOT.Talert("You need to have at least "+DOT.indot( DOT.total_planks + DOT.chain.total_planksAdd,1) );

    // Кстати, а не оплачен ли уже оказался наш ордер?
    if( ajax == 'payment' ) {
	if( json.pay_account ) DOT.setPayAccount(json.pay_account); // так может и платежный аккаунт уже известен?
	if( (''+json.result).toLowerCase() == 'paid' ) { DOT.onpaid(json); return false; }
    }

    return true;
},

indot: function(x,planks) {
    const c=10000;
    var X=Math.floor( parseInt(x)/DOT.chain.mul*c ) / c;
    if(!X && x) X=1/c; // шоб 0 не рисовало для мизерных, но ненулевых значений
    return X + " "+DOT.chain.tokenSymbol+(planks?" ("+x+" planks)":'');
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

            if( json.redirect ) return DOT.redirect(json.redirect);
	    return json;
},


total: function() {
    var total=1*((''+DOT.cx.total).replace(/^.*?([0-9\.]+).*?$/g,'$1'));
    if(!total) DOT.error('DOT plugin error 10802 total: ['+DOT.h(DOT.cx.total)+']');
    else DOT.cx.total=''+total;
    return total;
},

all_submit: async function(y) {
    console.debug('all_submit('+typeof(y)+')');
    if(!y) {
	if(!DOT.selected_acc()) {
	    console.debug('DOT.selected_acc() - account not selected, return');
	    return;
	}
	DOT.stoploopsubmit=0;
	DOT.Talert('clear');
	DOT.alert('clear');
    } else if(DOT.stoploopsubmit) {
	console.debug('DOT.stoploopsubmit - return');
	return;
    }

    if(!DOT.total()) return DOT.error('DOT plugin error 0801: empty total');
    var cx=DOT.cx;
    DOT.button_off();

    if(!cx.id && cx.order_id) cx.id=DOT.cx.id=cx.order_id;
    if(!cx.id) return DOT.error('DOT plugin error 0800: empty cx.id');
    if(!cx.ajax_url) return DOT.error('DOT plugin error 0802: empty cx.ajax_url');

    var data = JSON.stringify({ order_id: cx.id, price: DOT.total() });

    // можно указать свой альтернативный AJAX для особых уродцев типа WooCommerce
    var s = await DOT[( DOT.AJAX_ALTERNATIVE ? 'AJAX_ALTERNATIVE' : 'AJAX' )]( cx.ajax_url, data, DOT.ajax_headers );
    var json=DOT.ajax_process_errors(s); if(!json) return false;
    var ans = (''+json.result).toLowerCase(); // (waiting, paid)

    // Waiting
    if( ans == 'waiting' && json.pay_account && 1*json.price ) {
	console.debug('[#] Waiting for payment: '+DOT.west(json.pay_account) );
        json.my_account = cx.acc;
	DOT.setPayAccount(json.pay_account);

	if(DOT.paidflag /*|| DOT.cx.acc == 'QR'*/) {
	    console.debug('[#] paidflag loop');
	    DOT.Talert('Ready! Waiting for daemon...');
	    setTimeout(function(x){ DOT.all_submit(1); },2000);
	    return true;
	}
	DOT.pay(json);
	return true;
    }

    // Paid
    if( ans == 'paid' ) {
	console.debug("[ !!!! ] paid!");
	DOT.onpaid(json);
	return true;
    }

    return DOT.error('ERROR OPT:\n\n '+JSON.stringify(json));
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
		    clearInterval(DOT.progress.id);
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


    Balance: async function(west) {
	var e,ah=DOT.is_ah();
	try {
	    if(ah) { // AssetHub!!!
		e = await DOT.api.query.assets.account( ah, west );
		return 1*e.toJSON().balance;
	    } else { // Polkadot
		e = await DOT.api.query.system.account( west );
		return 1*e.data.free.toLocaleString();
	    }
	} catch(er) {
	    console.log(er);
	    return '';
	}
    },

    payWithPolkadot: async function(json,SENDER, price, destination, wss) {
	DOT.Talert('clear');
	await DOT.connect();

	if(DOT.debug) DOT.Talert('Start balance: '+ await DOT.Balance(destination) );

	const injector = await polkadotExtensionDapp.web3FromAddress(SENDER);

	DOT.hash = await DOT.Transfer(destination, price).signAndSend(SENDER,
	    DOT.add_ah({signer: injector.signer})
	, ({ status }) => {
            if(!DOT.progress.id) DOT.progress.run(0,
		    function(){
			DOT.error('Error: timeout');
			setTimeout(DOT.progress.stop,800);
		    }); // start progressbar


// eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
//	    console.log('-----------------------------------');
//	    if(!DOT.a) DOT.a=[];
//	    DOT.a.push(status);
//	    console.log(status);
//	    console.log('-----------------------------------['+DOT.a.length+']');

	    if(status.isInBlock || status.type == 'InBlock') {
		DOT.Talert("Status: isInBlock Completed #" + DOT.h( status.asInBlock.toString() ) );
		try {
		    var x=status.asInBlock.toString();
		    if(x) DOT.hash=x;
		} catch(er){}
		// if(DOT.debug) DOT.Talert("Balance: " + (await DOT.Balance(destination)) );
	    } else if(status.isFinalized || status.type == 'Finalized') {
		try { DOT.hash = status.asFinalized.toString(); } catch(er) { console.log(er); }
		DOT.Talert("Status: Finalized "+DOT.hash);
		DOT.progress.stop();
		return DOT.payment_done( destination );
	    } else {
		DOT.Talert("Status: "+DOT.h(status.type));
	    }
	}).catch((error) => {
            DOT.progress.stop(); // stop progressbar
	    DOT.disconnect();
	    DOT.error('transaction failed: '+error);
        });

    },

    payment_done: async function( destination ) {
	DOT.Talert('payment_done: '+DOT.hash);

	if(!destination) destination = DOT.pay_account;
	else {
		var bal = await DOT.Balance(destination);
		DOT.Talert('payment_done: Ending balance: '+bal );

		if(!bal) {
		    DOT.progress.stop();
		    DOT.Talert('payment_done: Transfer error');
		    return DOT.error('payment_done: Transfer error');
		}
	}

	// типа пришло

	var k=0;
	var sin = setInterval(async function(){
	    var bal = await DOT.Balance( destination );
	    DOT.Talert('payment_done: Balance now: '+ bal );
	    if(++k > 10) { clearInterval(sin); DOT.Talert('stop'); }
	},2000);

        if(!DOT.progress.id) DOT.progress.run(0,
		    function(){
			DOT.stoploopsubmit=1;
			clearInterval(sin); DOT.Talert('stop');
			DOT.error('Error: timeout');
			setTimeout(DOT.progress.stop,800);
			DOT.win_alert('daemon error');
		    }); // start progressbar

	// DOT.progress.stop();
	// DOT.disconnect();
	DOT.Talert('Ping daemon...');
	DOT.paidflag = 1;
	DOT.all_submit(1);
    },

    onpaid: function(json) {
        if(json.redirect) return DOT.redirect(json.redirect);
	return DOT.error('Paid success. What?! Ask admin, what can we do now?');
    },

    onBalance: async function(from,to,amount){
	if(!DOT.pay_account || ( DOT.pay_account != to && DOT.pay_account != from) ) return; // это не про наш аккаунт

	console.debug("BALANCE CHANGED:"
	    +"\n from: "+from
	    +"\n to: "+to
	    +"\n amount: "+amount
	);

	if(!DOT.pay_balance) DOT.pay_balance=0;
	DOT.pay_balance+=parseInt(amount);
	if( DOT.pay_balance >= DOT.total_planks ) return DOT.payment_done();
	DOT.all_submit(1); // все-таки пойти порисовать
    },

    setPayAccount: function(acc) {
	acc = DOT.west(acc); if(!acc) return DOT.error('error payment_account format');
	if( !DOT.pay_account ) {
            var k=0;
	    document.querySelectorAll('.DOT_pay_account').forEach((e)=>{ e.className='DOT_'+acc; k++; });
            if(k) DOT.getBalance(acc);
	}
	DOT.pay_account=acc;
	return acc;
    },

    pay: async function(json) {

	if(json.my_account == 'QR') {

	    console.debug('QR payment');

	    DOT.dom('dotpay_info').innerHTML=
	    "Transfer <b>"+DOT.indot( DOT.total_planks )+"</b> (will require approximately "+DOT.indot( DOT.chain.partialFee )+" on top of that to cover Polkadot transaction fees) to the following address:"
		+"<div style='padding:10px 0 10px 0;font-weight:bold;font-size:1.1em'><a onclick='DOT.cpbuf(this.innerHTML); return false;'>"+DOT.pay_account+"</a></div>"
		// +"<div style='font-size:8px;'>"+json.pay_account+"</div>"

		+"<div style='padding-left:3em;'>"
		    +"<div id='qrcode'></div>" // QR
		    +"<div style='padding-bottom: 10px;'>Currently received: <span onclick='DOT.getBalance(this.className)' class='DOT_"+DOT.pay_account+"'></span></div>"
		+"</div>"

		// +"<br>Order id: "+json.order_id
		+"When sent, please press the payment button once again to finalize your purchase."
		+(DOT.is_test()?'':"<br>Test system: click <a href='javascript:DOT.topUpPay()'>here</a> to top up 1/3 summ from Alice.")
		+"<br>&nbsp;";

	    DOT.LOADS(
		// "https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js"
		DOT.mainjs+"qrcode.min.js",
		function(){ new QRCode(DOT.dom('qrcode'),{
		    text: DOT.pay_account,
		    width: 192,
		    height: 192,
		    // colorDark : '#5868bf',
		    // colorLight : '#ffffff',
		    // correctLevel : QRCode.CorrectLevel.H
		    });
		}
	    );

	    DOT.getBalance(DOT.pay_account);
	    DOT.button_on();
	    return;

	}

	DOT.dom('dotpay_info').innerHTML=
	    "This will send "+DOT.indot( DOT.total_planks )+" to the shop's address "
	    +DOT.pay_account
	    +", and consume approximately "+DOT.indot( DOT.chain.partialFee )
	    +" on top of that to cover Polkadot transaction fees"
	    +"<br>&nbsp;";

	DOT.Talert("Transfer <b>"+DOT.indot( DOT.total_planks, 'planks' )+"</b>"
		+"<div style='Efont-size:11px;'>From: <a onclick='DOT.cpbuf(this.innerHTML); return false;'>"+DOT.west(json.my_account)+"</a></div>"
		// +"<div style='font-size:8px;'>"+json.my_account+"</div>"
		+"<div style='Efont-size:11px;'>To: <a onclick='DOT.cpbuf(this.innerHTML); return false;'>"+DOT.pay_account+"</a></div>"
		// +"<div style='font-size:8px;'>"+json.pay_account+"</div>"
		+"<br>Order id: "+json.order_id);

	DOT.payWithPolkadot(json, json.my_account, DOT.total_planks, DOT.pay_account);
    },

    et: 0,


    init: async function() {
	console.log('DOT init()');

	// init workplace if blank
	if(!DOT.dom('WalletID') && DOT.dom('polkadot_work')) {
            DOT.dom('polkadot_work').innerHTML=
            "<p>Select your DOT-account <span id='dotpay_wallet_finded'></span>"
            +"<div id='WalletID_load' style='display:none'></div>"
            +"<div id='WalletID' style='padding-left:30px;'>"+DOT.ajaximg()+" Loading wallets</div>"
            +"<div id='dotpay_info'></div>"
            +"<div class='"+DOT.class_warning+"' style='display:none' id='dotpay_console'></div>";
	}

        DOT.Talert('clear');
	DOT.button_on();

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
	  ],1);
	window.define = originalDefine; // йобаные патчи для Magento

     try {
	// connect Wallets
        var wallets=await polkadotExtensionDapp.web3Enable('dotpay');
	DOT.wallets=wallets;

// console.log('wallets='+typeof(wallets));

	var r={'':[
		"<label class='DOT_ADDR dot_manual' style='display:flex;text-align:left;'>"
		  // +"<div style='display:inline-block; width:42px;height:42px;margin-right:8px;'></div>"
		  +"<div class='MUDidenticon' style='display:inline-block; width:42px;height:42px;margin-right:8px;'><span style='font-size:42px;'>💰</span></div>"
		  +"&nbsp;<div style='display:inline-block'>"
		     +"<input name='dot_addr' type='radio' value='QR'>&nbsp;&nbsp;<span style='font-weight:bold' title='pay_account'>Manual</span>"
		    +( DOT.pay_account
		     ? "<div onclick='DOT.getBalance(this.className)' class='DOT_"+DOT.west(DOT.pay_account)+"'>"+DOT.ajaximg()+"</div>"
		     : "<div onclick='DOT.getBalance(this.className)' class='DOT_pay_account'></div>"
		    )
		  +"</div>"

		// +"<input name='dot_addr' type='radio' style='margin-right: 5px;' id='dot_payment_manual' value='QR'>Manual"
		+"</label>",
	]};
	var wal_length=1;

        if( !wallets.length ) {

	    if(!DOT.et) DOT.alert("<b>Wallet not found</b>"
		    +"<br>You can use Wallet extention "
		    +(this.navigator()=='firefox'
			? "<a href='https://addons.mozilla.org/en-US/firefox/addon/polkadot-js-extension/'>polkadot{.js} for Firefox</a>"
			: (this.navigator()=='chrome'
			    ? "<a href='https://chrome.google.com/webstore/detail/polkadot%7Bjs%7D-extension/mopnmbcafieddcagagdcbnhejhlodfdd'>polkadot{.js} for Chrome</a>"
			    : "<a href='https://github.com/polkadot-js/extension'>polkadot{.js}</a>"
			  )
		    )
		    +" or <a href='https://www.subwallet.app/'>Subwallet</a>"
		    +"<br>Also you can make DOT-payment manually"
	    );

	} else {
	    var accounts = await polkadotExtensionDapp.web3Accounts({ss58Format:DOT.chain.ss58Format}); // 0
		// Kusama   == 2 CxDDSH8gS7jecsxaRL9Txf8H5kqesLXAEAEgp76Yz632J9M keyring.setSS58Format(2); console.log('Kusama', pair.address);
		// Polkadot == 0 1NthTCKurNHLW52mMa6iA8Gz7UFYW5UnM3yTSpVdGu4Th7h keyring.setSS58Format(0); console.log('Polkadot', pair.address);
	    DOT.accounts=accounts;
	    var deff = DOT.f_read('WalletID');
	    for(var l of accounts) {
		    var wal = l.meta.source.replace(/\-js$/,'');
		    if(!r[wal]) r[wal]=[];
		    r[wal].push("<label disabled nobalance='1' class='DOT_ADDR' style='opacity:0.5;display:block;text-align:left;position:relative;'>"
	                // top up balance from Alice for test
			+(DOT.is_test()?'':"<div style='position:absolute;top:2px;right:10px;title='Top up my balabce' onclick='DOT.topUpBalance(this)'>💰</div>")
		  +"<div class='identicon' style='display:inline-block; width:42px;height:42px;margin-right:8px;'></div>"
		  +"&nbsp;<div style='display:inline-block'>"
		     +"<input name='dot_addr' type='radio' value='"+DOT.h(l.address)+"'"
		     +(deff == l.address ? ' checked' : '')
		     +">&nbsp;&nbsp;<span style='font-weight:bold' title='"+DOT.h(l.address)+"'>"+DOT.h(l.meta.name)+"</span>"
		     +"<div onclick='DOT.getBalance(this.className)' class='DOT_"+DOT.h(l.address)+"'>"+DOT.ajaximg()+"</div>"
		  +"</div>"
		  +"</label>");
		  wal_length++;
	    }
	}

	// if(wal_length != DOT.wal_length) { // менять страницу только если что-то изменилось
	// console.debug('wallet list');

	  DOT.wal_length = wal_length;
          var op=''; for(var wal in r) {
	    op += (wal==''? r[wal].join('') : "<div style='margin-left:10%;'>"+DOT.h(wal)+"</div>" + r[wal].join('') );
	  }
	  DOT.dom('WalletID').innerHTML=op; // +(k!=1?'': "<div>Loading wallets "+DOT.ajaximg()+"</div>");
	  // Onchang -: save to LocalStorage
	  DOT.dom('WalletID').querySelectorAll("INPUT").forEach(function(ee){ ee.onchange=DOT.save_addr; });
	  DOT.dom('dotpay_wallet_finded').innerHTML=
		(wallets.length
		? "<br>found "+accounts.length+" accounts"+ (wallets.length > 1 ? " in "+wallets.length+" wallets":"")
		:''
	    );

	var res = await DOT.daemon_get_info();
	if(!res) return; //  DOT.error("Error get_info()");

        if( !wallets.length ) DOT.dom('dot_payment_manual').click();
	else DOT.identicon_init();

     } catch(ee) {

	    console.log('init error: '+ee);

	    if(!DOT.et) { DOT.et=0; }
	    if(++DOT.et < 60) setTimeout(DOT.init,1000); // setTimeout(wallet_start,1000);
     }

    },

    // Top up pay_account from Alice for 1/3 of summ (DOT.debug=1 or 'zymologia.fi' present in url)
    topUpPay: async function() {
	document.querySelectorAll('.DOT_'+DOT.pay_account).forEach((e)=>{ e.innerHTML=DOT.ajaximg(); });
	DOT.hash = await DOT.topUpFromAlice( DOT.pay_account, DOT.total_planks / 3 );
    },

    // Top up Balance from Alice for test sites (DOT.debug=1 or 'zymologia.fi' present in url)
    topUpBalance: async function(e) {
	if(e.getAttribute('oldvalue') && e.getAttribute('oldvalue').length) return; // дважды не кликать
	e.setAttribute('oldvalue',e.innerHTML); // сохранить
	e.innerHTML=DOT.ajaximg(); // поставить круктилку
            const addr=e.closest('label').querySelector("input[type='radio']").value;
	    const value = DOT.total_planks + DOT.chain.amountAdd;
	    await DOT.topUpFromAlice(addr,value);
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

    // скачать баланс и обновить на странице всюду
    getBalance: async function(west) {
	west=west.replace(/^DOT_/g,'');
	// раставили картинки-заглушки
	document.querySelectorAll('.DOT_'+west).forEach((e)=>{ e.innerHTML=DOT.ajaximg(); });
	// пошли качать баланс
	if(DOT.api) {
	    DOT.Balance(west).then((l) => { DOT.setBalance( west, l ) });
	}
    },

    // баланс известен, обновить его на странице всюду
    setBalance: function(west,bal) {
	if(west==DOT.pay_account) DOT.pay_balance=bal; // Если это наш баланс, то сохранить
	document.querySelectorAll('.DOT_'+west).forEach((e)=>{
	    e.innerHTML=DOT.ajaximg();
	    setTimeout(function(){e.innerHTML=DOT.indot( bal )},800);
	    DOT.checkBalanceLabel(e,bal);
	});
    },

    // проверить, какие аккаунты подходят
    checkBalanceLabel: function(e,bal) {
	var w=e.closest('label.DOT_ADDR');
	if(!w || w.classList.contains('dot_manual')) return; // этот баланс не внутри блока аккаунтов, ничего делать не надо

	w.setAttribute('nobalance',0); // этот баланс уже проверен

	// какой нынче минимум баланса?
	var minimum = DOT.total_planks + DOT.chain.amountAdd;
	// set Opacity
	if( bal < minimum ) {
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
	return polkadotKeyring.encodeAddress(id,DOT.chain.ss58Format);
    },

    disconnect: async function() {
	if(!DOT.api) return;
	await DOT.api.disconnect();
	DOT.api=false;
    },

    connect: async function() {
	if(DOT.api) return DOT.api;
	if(!DOT.daemon.wss) {
	    return DOT.error('no wss');
	}
	// соединяемся с блокчейном
	var wss = (''+DOT.daemon.wss).replace(/\:\d+$/g,'');
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
	    // console.log(`\tEEEEEEEEEEEEEE: ${event.section}:${event.method}:: (phase=${phase.toString()})`);
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

    identicon_init: async function() {
	await DOT.connect();
	DOT.dom('WalletID').querySelectorAll('LABEL').forEach(function(p){
	    //получить адрес
	    var adr=p.querySelector('SPAN'); if(!adr) return; adr=adr.getAttribute('title'); // adr.innerHTML;
	    if(!adr || adr=='pay_account') {
		if(!DOT.pay_account) return;
		adr=DOT.west(DOT.pay_account);
	    }
	    // var oh=p.offsetHeight; if(!oh) oh=42; oh+='px';
	    var div=p.querySelector('.identicon');
	    if(div) {
		// div.style.width=oh; div.style.height=oh;
		div.innerHTML=identicon_render(adr,42);
	    }
	    p.querySelector('INPUT').onchange=DOT.save_addr;
	    DOT.getBalance(adr);
	});
    },

 LOADES: {},
 LOADS: function(u,f,err,sync) { if(typeof(u)=='string') u=[u];

        var randome='?random='+Math.random(); // DEBUG ONLY!

        var s;
        for(var i of u) { if(DOT.LOADES[i]) continue;
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

	    DOT.LOADES[e.getAttribute('orign')]=1;
            var k=1; for(var i of u) {
		if(!DOT.LOADES[i]){ k=0; break; }
	    }
            if(k){ if(f) f(e.src); }
         };
         document.getElementsByTagName('head').item(0).appendChild(s);
        }
        if(!s) { if(f) f(1); }
 },

 LOADS_sync: function(u,f,err) { DOT.LOADS(u,f,err,1) },

 LOADS_promice: function(file,sync) {
        return new Promise(function(resolve, reject) { DOT.LOADS(file,resolve,reject,sync); });
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
is_test: function() { return ( document.location.href.indexOf('zymologia.fi')<0 && !DOT.dubug ? true : false ); },
alice_keys: function() { return JSON.parse('{"address":"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY","addressRaw":{"0":212,"1":53,"2":147,"3":199,"4":21,"5":253,"6":211,"7":28,"8":97,"9":20,"10":26,"11":189,"12":4,"13":169,"14":159,"15":214,"16":130,"17":44,"18":133,"19":88,"20":133,"21":76,"22":205,"23":227,"24":154,"25":86,"26":132,"27":231,"28":165,"29":109,"30":162,"31":125},"isLocked":false,"meta":{},"publicKey":{"0":212,"1":53,"2":147,"3":199,"4":21,"5":253,"6":211,"7":28,"8":97,"9":20,"10":26,"11":189,"12":4,"13":169,"14":159,"15":214,"16":130,"17":44,"18":133,"19":88,"20":133,"21":76,"22":205,"23":227,"24":154,"25":86,"26":132,"27":231,"28":165,"29":109,"30":162,"31":125},"type":"sr25519"}'); },
};
