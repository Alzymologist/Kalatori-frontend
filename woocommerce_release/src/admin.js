jQuery(document).ready(function($) {

    var w = document.querySelector('#woocommerce_polkadot_daemon_url');

//  &nbsp; The daemon URL, default `+w.placeholder+` if empty
    var s = `<input type='button' value='check' onclick='kalatori_test(this)' style='color:sienna'>
<div id='kalatori_test' class='notice notice-warning update-nag inline' style='display:none'></div>`;
    w.parentNode.insertAdjacentHTML('beforeend', s);

//    var w = document.querySelector('#woocommerce_polkadot_currences');
//    if(!w) alert('error #0703');

});

function kalatori_pin(e) { e = e.innerHTML;
    var o={}, w = document.querySelector('#woocommerce_polkadot_currences');
    var s = w.value.replace(/,/g,' ').split(' ');
    for(var i of s) { if(i!='') o[i]=1; }
    if(o[e]) delete o[e]; else o[e]=1;
    w.value = Object.keys(o).join(' ');
    return false;
}

function kalatori_test(e) {


    var ans = document.querySelector('#kalatori_test');
    ans.style.display = 'inline-block';

    var q = document.querySelector('#woocommerce_polkadot_daemon_url');
    var url_my = q.value;
    var url = q.defaultValue;
    if(url_my != url) return ans.innerHTML = 'Save first and try again';


// https://woocommerce.zymologia.fi/wp-json/kalatori/v1/ajax
    var path = document.querySelector('#woocommerce_polkadot_plugin_url').innerHTML;
    var ajax_url = path.replace(/\/wp\-content\/.+$/g,'')+'/wp-json/kalatori/v1/status'; // ?endpoint=status

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var s = 'Daemon is not responsing: '+url;
            try {
                function hh(s) { return s.replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
                var j = JSON.parse(this.responseText);
                if(!j.error) {
                    var curs = '';
                    for(var x in j.supported_currencies) curs+=' <button onclick="return kalatori_pin(this)">'+hh(x)+'</button>';
                    s = '<div style="color:green">Daemon is avaliable: '+url+'</div>'
                    + '<div>currences:'+curs+'</div>'
                    + '<div>version: '+hh(j.server_info.version)+'</div>'
                    + '<div>remark: '+hh(j.server_info.kalatori_remark)+'</div>';

                    var w = document.querySelector('#kalatori_currences');
                    if(w.value=='') w.value = Object.keys(j.supported_currencies).join(' ');
                }
            } catch(er){}
            ans.innerHTML = s;
        }
    };
    xhttp.ontimeout = function() { ans.innerHTML = 'Server is not avaliable'; };
    xhttp.open('GET', ajax_url, true);
    xhttp.timeout = 1000; // Timeout set to 1 second
    xhttp.send();
}
