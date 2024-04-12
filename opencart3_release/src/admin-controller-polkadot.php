<?php
class ControllerExtensionPaymentPolkadot extends Controller {
	private $error = array();

	public function index() {
		$this->load->language('extension/payment/polkadot');
		$this->document->setTitle($this->language->get('heading_title'));
		$this->load->model('setting/setting');

		if (($this->request->server['REQUEST_METHOD'] == 'POST') && $this->validate()) {
			$this->model_setting_setting->editSetting('payment_polkadot', $this->request->post);
			$this->session->data['success'] = $this->language->get('text_success');
			$this->response->redirect($this->url->link('marketplace/extension', 'user_token=' . $this->session->data['user_token'] . '&type=payment', true));
		}

		$data['error_warning'] = ( isset($this->error['warning']) ? $this->error['warning'] : '' );
		// $data['error_merchant'] = ( isset($this->error['merchant']) ? $this->error['merchant'] : '' );
		// $data['error_security'] = ( isset($this->error['security']) ? $this->error['security'] : '' );

		$data['breadcrumbs'] = array();
		    $data['breadcrumbs'][] = array(
			'text' => $this->language->get('text_home'),
			'href' => $this->url->link('common/dashboard', 'user_token=' . $this->session->data['user_token'], true)
		    );
		    $data['breadcrumbs'][] = array(
			'text' => $this->language->get('text_extension'),
			'href' => $this->url->link('marketplace/extension', 'user_token=' . $this->session->data['user_token'] . '&type=payment', true)
		    );
		    $data['breadcrumbs'][] = array(
			'text' => $this->language->get('heading_title'),
			'href' => $this->url->link('extension/payment/polkadot', 'user_token=' . $this->session->data['user_token'], true)
		    );


		$this->load->model('localisation/order_status'); $data['order_statuses'] = $this->model_localisation_order_status->getOrderStatuses();

		$data['action'] = $this->url->link('extension/payment/polkadot', 'user_token=' . $this->session->data['user_token'], true);
		$data['cancel'] = $this->url->link('marketplace/extension', 'user_token=' . $this->session->data['user_token'] . '&type=payment', true);

		$a=array(
			'payment_polkadot_shopname',
			'payment_polkadot_currences',
			'payment_polkadot_engineurl',
			'payment_polkadot_order_status_id',
			'payment_polkadot_status',
		);
		foreach($a as $l) $data[$l] = (isset($this->request->post[$l]) ? $this->request->post[$l] : $this->config->get($l) );

		$a=array('header','column_left','footer');
		foreach($a as $l) $data[$l] = $this->load->controller('common/'.$l);

		$data['callback'] 	= HTTP_CATALOG . 'index.php?route=extension/payment/polkadot/callback';
		$data['test_alive_url'] = HTTP_SERVER  . 'index.php?route=extension/payment/polkadot/test_alive&user_token='.$this->session->data['user_token'];

		$this->response->setOutput($this->load->view('extension/payment/polkadot', $data));
	}

	protected function validate() {
	    if(!$this->user->hasPermission('modify', 'extension/payment/polkadot')) $this->error['warning'] = $this->language->get('error_permission');
	    $a=array('engineurl'); // ,'merchant','security',
	    foreach($a as $l) { if(!$this->request->post['payment_polkadot_'.$l]) $this->error[$l] = $this->language->get('error_'.$l); }
	    return !$this->error;
	}

        public function test_alive(): void {
	    // S t a t u s
	    $ch = curl_init( $this->config->get('payment_polkadot_engineurl') . "/v2/status" );
	    curl_setopt_array($ch, array(
	        CURLOPT_HTTPHEADER => array('Content-Type:application/json'),
	        CURLOPT_RETURNTRANSFER => true,
	        CURLOPT_FAILONERROR => true,
	        CURLOPT_CONNECTTIMEOUT => 2, // only spend 3 seconds trying to connect
	        CURLOPT_TIMEOUT => 2 // 30 sec waiting for answer
	    ));
	    $r = curl_exec($ch);
	    if(curl_errno($ch) || empty($r)) $r=array("error"=>"Daemon responce empty: ".curl_error($ch));
	    else {
		$r = (array)json_decode($r);
		if(empty($r)) $r = array("error"=>"Daemon responce error parsing");
	    }
	    $r['http_code'] = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
	    curl_close($ch);
            $this->response->addHeader('Content-Type: application/json');
            $this->response->setOutput(json_encode($r));
            return;
        }

}