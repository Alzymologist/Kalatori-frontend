<?php

$store_name = "local_donate";
$daemon_url = "http://localhost:16726";
$success_redirect = "https://lleo.me";

//    _  __     _       _             _     ____             _                  _
//   | |/ /__ _| | __ _| |_ ___  _ __(_)   | __ )  __ _  ___| | _____ _ __   __| |
//   | ' // _` | |/ _` | __/ _ \| '__| |   |  _ \ / _` |/ __| |/ / _ \ '_ \ / _` |
//   | . \ (_| | | (_| | || (_) | |  | |   | |_) | (_| | (__|   <  __/ | | | (_| |
//   |_|\_\__,_|_|\__,_|\__\___/|_|  |_|   |____/ \__,_|\___|_|\_\___|_| |_|\__,_|
//

header('Access-Control-Allow-Origin: https://lleo.me'); // header('Access-Control-Allow-Headers: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: X-PINGOTHER, Content-Type, x-requested-with');
// header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS');


pay();

function pay() {
    // Что нам известно внутри магазина
    // $total = 10;
    // $currency = 'USD';
    // $order_id = date("Y-m-d H:i:s");

    // что нам прислали
    $input = (array)json_decode( file_get_contents("php://input") );

    if(empty($input) || empty($input['price']) || empty($input['order_id'])) {
	$ajax_order_id = $ajax_total = 0;
    } else {
	$ajax_order_id = $input['order_id'];
	$ajax_total = $input['price'];
    }

// die(print_r($input,1));

    if($order_id) {
	$order_present = 1;
	$json = array(
    	    'ajax_order_id' => $ajax_order_id,
	    'ajax_total' => $ajax_total,
	    'store_currency' => $currency,
	    'store_order_id' => $order_id,
	    'store_total' => $total,
	    'store_customer' => $customer
	);
    } else { // уже оплачен и корзина сброшена, делаем тогда проверку из наших данных
// die("www2");
	$order_present = 0;
	// берем наши данные
//	if( $ajax_order_id * $ajax_total == 0 ) ejdie("Data error #001: order_id, total not found");
	$order_id = $ajax_order_id;
	$total = $ajax_total;
	$json = array(
	    'ajax_order_id' => $input['order_id'],
	    'ajax_total' => $input['total']
	);
    }

    // Defaults
    $url = $GLOBALS['daemon_url']; // 'http://localhost:16726';
    $url .= "/order/".$GLOBALS['store_name']."_".$order_id."/price/".$total;

// file_put_contents('ajax.log',$url);

    // A J A X
    $r = ajax($url);

    if(isset($r['error'])) jdie($r);
    // Йобаные патчи для kalatori
    if(isset($r['order'])) $r['order_id']=$r['order'];
    $r['order_id']=preg_replace("/^.*\_/s",'',$r['order_id']);

    foreach($r as $n=>$l) $json[$n]=$l;

    // Log
    // logs(date("Y-m-d H:i:s")." [".$json['result']."] order:".$json['ajax_order_id']." total:".$json['ajax_total']." ".$r['pay_account']);

    // Success ?
    if(isset($r['result']) && strtolower($r['result'])=='paid') {
	// paid success
	// if( $order_present ) {
	    // SUCCESS
	    // die();
        // }

    // Log
    logs(date("Y-m-d H:i:s")." [".$json['result']."] order:".$json['ajax_order_id']." total:".$json['ajax_total']." ".$r['pay_account']);

	file_get_contents("https://lleo.me/bot/t.php?id=000000-FEEFAA&soft=kalatori&message=".urlencode(
	"Test Payment ".$json['price']." DOT ".$input['order_id']));

        $json['redirect'] = $GLOBALS['success_redirect']; // 'https://natribu.org/fi';
	jdie($json);
    }

    jdie($json);
  }


  function ejdie($s) { jdie(array('error'=>1,'error_message'=>$s)); }
  function jdie($j) { die(json_encode($j)); }

  function ajax($url) {
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_HTTPHEADER => array('Content-Type:application/json'),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FAILONERROR => true,
        CURLOPT_CONNECTTIMEOUT => 2, // only spend 3 seconds trying to connect
        CURLOPT_TIMEOUT => 2 // 30 sec waiting for answer
    ));
    $r = curl_exec($ch);
    if(curl_errno($ch) || empty($r)) ejdie("Daemon responce empty : ".curl_error($ch));

 file_put_contents('ajax.log',$r);


    $r = (array) json_decode($r);
    if(empty($r)) ejdie("Daemon responce error parsing");
    curl_close($ch);
    return $r;
  }

  function logs($s='') {
	$f = "./kalatori.log";
	$l = fopen($f,'a+');
	fputs($l,$s."\n");
	fclose($l);
	chmod($f,0666);
  }

?>