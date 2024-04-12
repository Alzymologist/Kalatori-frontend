<?php
class ControllerExtensionPaymentPolkadot extends Controller {
	public function index() {
                // $this->load->language('extension/polkadot/payment/polkadot');
		$data['button_confirm'] = $this->language->get('button_confirm');
		$this->load->model('checkout/order');
		if(
		    !isset($this->session->data['order_id'])
		    || !isset($this->session->data['payment_method'])
		) return false;
		$order_info = $this->model_checkout_order->getOrder($this->session->data['order_id']);

		$data['datas_order'] = $this->session->data['order_id'];
		$data['datas_total'] = $order_info['total'];
		$data['datas_currency'] = $order_info['currency_code'];
		$data['datas_currences'] = $this->config->get('payment_polkadot_currences');

		// $this->currency->format($order_info['total'], $order_info['currency_code'], $order_info['currency_value'], false);
                //   $data['datas_total']=($order_info? 1*$order_info["total"] : 'error');
		// $data['datas_merchant'] = $this->config->get('payment_polkadot_merchant'); // payment_polkadot_security
		// $data['datas_wss'] = $this->config->get('payment_polkadot_engineurl');
		$data['language'] = $this->config->get('config_language');
                //   $data['logged'] = $this->customer->isLogged();
                //   $data['subscription'] = $this->cart->hasSubscription();
		// $data['ap_itemname'] = $this->config->get('config_name') . ' - #' . $this->session->data['order_id'];  // Your Store - #15
		$data['datas_success_callback'] = $this->url->link('checkout/success');             // https://opencart3.zymologia.fi/index.php?route=checkout/success
		$data['datas_cancel_callback'] = $this->url->link('checkout/checkout', '', true);  // https://opencart3.zymologia.fi/index.php?route=checkout/checkout

		$data['ajax_url'] = HTTP_SERVER . 'index.php?route=extension/payment/polkadot/confirm&user_token='
		    .$this->session->data['user_token'];

		return $this->load->view('extension/payment/polkadot', $data);
	}

	public function callback() {
		if (isset($this->request->post['security']) && ($this->request->post['security'] == $this->config->get('payment_polkadot_security'))) {
			logs('payment: '
			    .$this->request->post['code']
			    .' -> '
			    .$this->config->get('payment_polkadot_order_status_id')
			    .(isset($this->session) && isset($this->session->data['order_id']) ? ' ORDER='.(1*$this->session->data['order_id']) : ' w/o order')
			);
			$this->load->model('checkout/order');
			$this->model_checkout_order->addOrderHistory($this->request->post['code'], $this->config->get('payment_polkadot_order_status_id'));
		}
	}




// ==============================================================
	public function confirm() {






	    function json_ok($x,$json) {
		$x->response->addHeader('Content-Type: text/plain'); // 'Content-Type: application/json'
	        $x->response->setOutput(json_encode($json));
	    }
	    function json_err($x,$err) { json_ok($x,array('error' => $err)); }

	    $url = $this->config->get('payment_polkadot_engineurl');

	    // S t a t u s
	    if($_GET['endpoint'] == 'status') {
    		$r = $this->ajax($url."/v2/status");
		return json_ok($this,$r);
	    }





	    // что у нас есть?
	    if ( ! isset($this->session->data['order_id']) ) return json_err($this, 'error order');
	    $order=$this->session->data['order_id'];
	    if( !$order ) return json_err($this, 'Order not found');

	    $this->load->model('checkout/order');
	    if (!($order_info = $this->model_checkout_order->getOrder($order))) return json_err($this, 'error order_info');
	    $amount = $order_info["total"];
	    $name = $this->config->get('payment_polkadot_shopname');
	    $currency0 = $order_info['currency_code'];

	    // что нам прислали?
	    $currency = $_GET['currency'];

        // Проверяем, разрешен ли
        $currences = $this->config->get('payment_polkadot_currences');
        if(!empty($currences)) {
            $currences = str_replace(',',' ',$currences);
            $C = ( strpos($currences,' ')<0 ? array($currences) : explode(' ',$currences) );
            foreach($C as $n=>$c) $C[$n] = trim($c);
            if(!in_array($currency,$C)) json_err($this, 'Currency not in list');
        }
        if($currency0 != substr($currency,0,strlen($currency0))) json_err($this, 'Currency not found');


	    $url.="/v2/order/oc3_".urlencode( (empty($name)?'':$name.'_') . $order );

	    $data = array(
    		'currency' => $currency,
    		'amount' => $amount
	    );

	    $r = $this->ajax($url,$data); // A J A X
	    if(isset($r['error'])) return json_ok($this,$r);

	    // $this->logs(date("Y-m-d H:i:s")." [".$r['result']."] order:".$order." price:".$amount." ".$r['pay_account']."\n");
	    if(isset($r['payment_status']) && strtolower($r['payment_status'])=='paid') {
                  //     1       Voided                  Аннулировано........
                  // 2       Processing              В обработке             Передан в печать....
                  //     3       Chargeback              Возврат........
                  //     4       Refunded                Возмещенный             Передан в доставку
                  //     5       Shipped                 Доставлено              Доставлен и готов к выдаче....
                  //     6       Failed                  Неудавшийся........
                  // 7       Processed               Обработано              Напечатан....
                  // 8       Pending                 Ожидание                Принят....
                  //     9       Canceled Reversal       Отмена и аннулирование........
                  //     10      Canceled                Отменено                Отменен....
                  //     11      Reversed                Полностью измененный........
                  //     12      Denied                  Полный возврат........
                  //     13      Expired                 Просрочено........
                  //     14      Complete                Сделка завершена        Выдан....
        	// $this->model_checkout_order->addHistory($this->session->data['order_id'], $this->config->get('payment_polkadot_approved_status_id'), '', true);

		// 2 Processing is recommended
		$this->model_checkout_order->addOrderHistory($order, $this->config->get('payment_polkadot_order_status_id'));
    		$r['redirect'] = $this->url->link('checkout/success', 'language=' . $this->config->get('config_language'), true);
		json_ok($this,$r);
	    }
	    return json_ok($this,$r);
	}


  function ajax($url,$data=false) {
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_HTTPHEADER => array('Content-Type:application/json'),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FAILONERROR => true,
        CURLOPT_CONNECTTIMEOUT => 2, // only spend 3 seconds trying to connect
        CURLOPT_TIMEOUT => 20 // 30 sec waiting for answer
    ));
    if($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    }
    $r = curl_exec($ch);
    if(curl_errno($ch) || empty($r)) return array( 'error' => "Error: ".curl_error($ch) );
    $r = (array) json_decode($r);
    if(empty($r)) return array( 'error' => "Daemon responce error parsing" );
    // Add the HTTP response code
    $r['http_code'] = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    return $r;
  }


	// DELETE
	function logs($s='') {
            // $f = DIR_LOGS . "polkadot_log.log";
            // $l=fopen($f,'a+'); fputs($l,$s); fclose($l); // chmod($l,0666);
        }

}