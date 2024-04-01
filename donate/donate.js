
function donate_init() {

console.log('donate_init()');

    document.querySelector('#polkadot_work').innerHTML='';

    var s=document.createElement('script');
    s.type='text/javascript';
    s.src="DOT.js"
            + '?random='+Math.random() // DEBUG ONLY!
    ;
    s.onerror=function(e){ alert('DOT plugin: script not found'+e.src) };
    s.onload=function(e) {
        DOT.store = 'donate';
        DOT.cx.order_id = my_date;
        DOT.cx.total = 1*document.querySelector('#money').value; // 100.0;
        DOT.cx.currency = 'USD';
        DOT.cx.ajax_url = "donate.php";
	DOT.mainjs = "/donate/vendor/";
        DOT.cx.success_callback = function(){ alert('SUCCESS'); };
        DOT.cx.cancel_callback = function(){ alert('CANCEL'); };
        DOT.button_on = function(){ DOT.dom('button').style.display='block'; };
	DOT.button_off = function(){ DOT.dom('button').style.display='none'; };
        // DOT.onpaid = function() { alert("ONPAID"); };
	DOT.design();
        // DOT.init();
    };
    document.getElementsByTagName('head').item(0).appendChild(s);
}

my_date=false;

function DonateGo() {

    var now = new Date();
    var year = now.getFullYear();
    var month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    var day = now.getDate().toString().padStart(2, '0');
    var hours = now.getHours().toString().padStart(2, '0');
    var minutes = now.getMinutes().toString().padStart(2, '0');
    var seconds = now.getSeconds().toString().padStart(2, '0');
    my_date = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

    document.querySelector('#bodyz').innerHTML=`<center>

<div class='topstick'>
<input id='money' type='text' size='4' onchange="f_save('money',1*this.value)">&nbsp;<button id='button' onclick="donate_init();">Donate me!</button>
</div>
<div id='polkadot_work'></div>
</center>`;

    document.querySelector('#money').value = 1*f_read('money');

    // document.querySelector('#bodyz').style.zIndex="10 !important";
    // document.querySelector('#button').onclick=function(){ console.log('DonateGo(2111)'); };

var r=`дайте денег
дайте денег
дайте денег
денег дайте
денег дайте
денег дайте
нет денег
нет денег
нет денег
денег нет
денег нет
денег нет
денег нет
в тисках нищеты
помогите<br>чем можете
не ел три дня
у меня нет<br>зимнего пальтишка
у меня нет<br>теплого белья
бульонных кубиков<br>осталось на три дня
интернет отключили
всё истратил
очень надо
нужны деньги
хочу кушать
это не разводка
завтра отдам
на неделе верну
хотя бы в долг
сколько не жалко
можно на карту
можно мелочью
хочется есть
меня уволили
нет работы`.split("\n");

    for(var i=0;i<500;i++) {
	var s=r[Math.floor(Math.random()*r.length)];
	var size=8+Math.floor(Math.random()*20);
	var x=Math.floor(Math.random()*getWinW());
	var y=Math.floor(Math.random()*getWinH());
	var rotate=Math.floor(Math.random()*90)-45;
	    var div = document.createElement("div");
	    div.style.filter = "blur(1px)";
	    div.style.zIndex = "-4";
	    div.style.transform = "rotate("+rotate+"deg)";
	    div.style.position = 'absolute';
	    div.style.display = 'inline-block';
	    div.style.top = y+'px';
	    div.style.left = x+'px';
	    div.style.fontSize = size+"px";
	    div.style.pointerEvents = 'none';
	    div.innerHTML = s;
	    document.body.appendChild(div);
    }

}

function getWinW(){ return window.innerWidth || (document.compatMode=='CSS1Compat' && !window.opera ? document.documentElement.clientWidth : document.body.clientWidth); }
function getWinH(){ return window.innerHeight || (document.compatMode=='CSS1Compat' && !window.opera ? document.documentElement.clientHeight : document.body.clientHeight); }
f_save = function(k,v){ try { return window.localStorage.setItem(k,v); } catch(e) { return ''; } };
f_read = function(k){ try { return window.localStorage.getItem(k); } catch(e) { return ''; }};
