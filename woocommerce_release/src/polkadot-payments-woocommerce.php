<?php

/* Plugin name: Polkadot payments for WooCommerce
 * Plugin URI: https://woocommerce.zymologia.fi/Alzymologist/about.html
 * Description: Use Polkadot blokchain for direct payments
 * Author: Alzymologist OY
 * Author URI: https://zymologia.fi
 * Version: 1.0.1
*/

if ( ! defined( 'ABSPATH' ) ) exit;

/*
 * Этот фильтр-хук позволяет зарегистрировать наш PHP-класс в качестве платёжного шлюза WooCommerce
 */
add_filter( 'woocommerce_payment_gateways', 'polkadot_register_gateway_class' );
function polkadot_register_gateway_class( $gateways ) {
    $gateways[] = 'WC_Polkadot_Gateway'; // название вашего класса, добавляем его в общий массив
    return $gateways;
}

/*
 * сам класс внутри хука plugins_loaded
 */

add_action( 'plugins_loaded', 'polkadot_gateway_class' );
function polkadot_gateway_class() {

    class WC_Polkadot_Gateway extends WC_Payment_Gateway {
	/**
	 * Это конструктор класса, о нём мы с вами ещё поговорим в 3-м шаге урока
	 */
	public function __construct() {

	    $this->id = 'polkadot'; // ID платёжного шлюза
	    $this->icon = 'https://assets.polkadot.network/brand/Polkadot_Logo/Horizontal/SVG/Transparent/Polkadot_Logo_Horizontal_Pink-White.svg'; // 'https://lleo.me/fon1.jpg'; // URL иконки, которая будет отображаться на странице оформления заказа рядом с этим методом оплаты
	    // $this->has_fields = true; // если нужна собственная форма ввода полей карты
	    $this->method_title = 'Polkadot payments';
	    $this->method_description = 'Polkadot direct payments'; // будет отображаться в админке
	    // платёжные плагины могут поддерживать подписки, сохранённые карты, возвраты, но начнём с простых платежей
	    $this->supports = array( 'products' );

	    // все поля настроек админки
	    $this->form_fields = array(
		'enabled' => array(
		    'title'       => 'On/Off',
		    'label'       => 'Turn on Polkadot payments',
		    'type'        => 'checkbox',
		    'description' => '',
		    'default'     => 'no'
		),
		'store_name' => array(
		    'title'       => 'Store name',
		    'description' => 'Enter your store name or leave blank',
		    'default'     => '',
		    'type'        => 'text'
		),

		'daemon_url' => array(
		    'title'       => 'Daemon url',
		    'description' => "Enter your daemon url like http://localhost:16726",
		    'default'     => 'http://localhost:16726',
		    'placeholder' => 'http://localhost:16726',
		    'type'        => 'text'
		),

                'currences' => array(
                    'title' => "Enabled currences"
// URL: https://woocommerce.zymologia.fi/wp-content/plugins/polkadot-payments-woocommerce
."<span id='woocommerce_polkadot_plugin_url' class='ui-helper-hidden'>".plugins_url('', __FILE__)."</span>"
,
		    'description' => "Left blank for enable all currences",
                    'default' => '',
                    'type' => 'text',
                    'id' => 'kalatori_currences', // id='woocommerce_polkadot_currences'
                ),
	    );

	    // инициализируем настройки
	    $this->init_settings();
	    $this->enabled = $this->get_option( 'enabled' );
	    $this->store_name = $this->get_option( 'store_name' );
	    $this->daemon_url = $this->get_option( 'daemon_url' );
	    $this->currences = $this->get_option( 'currences' );
	    // Хук для сохранения всех настроек
	    add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
	}
    }
}

/*
function enqueue_custom_admin_script() {
    // Check if we're on the WooCommerce settings page
    if (isset($_GET['page']) && $_GET['page'] == 'wc-settings') {
        wp_enqueue_script('custom-admin-script', plugin_dir_url(__FILE__) . 'admin.js'
.'?rand='.rand(0,99999999)
); // , array('jquery'), '1.0.0', true);
    }
}
add_action('admin_enqueue_scripts', 'enqueue_custom_admin_script');

*/

/*
// https://woocommerce.zymologia.fi/wp-json/kalatori/v1/health
add_action('rest_api_init', function () {
    register_rest_route('kalatori/v1', '/health/', array(
        'methods' => 'POST',
        'callback' => 'kalatori_health_ajax',
    ));
});
function kalatori_health_ajax(WP_REST_Request $request) {
    $opt = get_option( 'woocommerce_polkadot_settings', [] );
    $daemon_url = $opt['daemon_url']; if(empty($daemon_url)) $daemon_url='http://localhost:16726';
    $r=ajax($daemon_url."/order/0/price/0");
    jdie($r);
}
*/



// https://woocommerce.zymologia.fi/wp-json/kalatori/v1/status
add_action('rest_api_init', function() {
    register_rest_route('kalatori/v1', '/status/',
    array('methods' => 'POST,GET','callback' => 'kalatori_status')
    );
});
function kalatori_status(WP_REST_Request $request) {
    // S t a t u s
    $opt = get_option( 'woocommerce_polkadot_settings', [] );
    $url = $opt['daemon_url']; if(empty($url)) $url='http://localhost:16726';
    $r = ajax($url."/v2/status");
    jdie($r);
}


// https://woocommerce.zymologia.fi/wp-json/wc/store/v1/checkout?_locale=user&ajax=1&currency=USDC-L
add_action( 'woocommerce_store_api_checkout_order_processed', 'polkadot_callback' ); // ,10)
function polkadot_callback( $order_pointer ) {
    // Что нам известно внутри магазина
    $opt = get_option( 'woocommerce_polkadot_settings', [] );
    if('no' === $opt['enabled']) ejdie('Plugin disabled. Use admin page for enable');
        $daemon_url = $opt['daemon_url']; if(empty($daemon_url)) $daemon_url='http://localhost:16726';
	$store_name = $opt['store_name']; if(empty($store_name)) $store_name='';
        $currences = $opt['currences'];
    // payment request
	    if(!$order_pointer) ejdie('Order pointer not found!');
	$status = $order_pointer->get_status();

        $order = $order_pointer->get_id();
	    if(!$order) ejdie('Order not found!');
	$amount = $order_pointer->get_total();
	$currency0 = $order_pointer->get_currency();
	$hash = WC()->cart->get_cart_hash();
	// ? $status = $order_pointer->get_status();
	$user_id = WC()->session->get_customer_id();

    // что нам прислали?
	$currency = $_GET['currency'];

        // Проверяем, разрешен ли
        if(!empty($currences)) {
            $currences = str_replace(',',' ',$currences);
            $C = ( strpos($currences,' ')<0 ? array($currences) : explode(' ',$currences) );
            foreach($C as $n=>$c) $C[$n] = trim($c);
            if(!in_array($currency,$C)) ejdie('Currency not in list');
        }
        if($currency0 != substr($currency,0,strlen($currency0))) ejdie('Currency not found');



    $daemon_url.="/v2/order/wc_".urlencode($store_name."_".$hash."_".$order."_".$user_id);
    // A J A X
    $data = array(
    	'currency' => $currency,
    	'amount' => $amount
    );
    $r = ajax($daemon_url,$data);
    if(!isset($r['payment_status'])) ejdie($r);

/*
pending / checkout-draft
+ --> 'wc-processing'
Processing: This status is automatically assigned to an order once the
payment is successfully made on the checkout page. It indicates that the
order is being prepared for shipment.

--> 'wc-completed'
- Completed: This status indicates that the order has been successfully
processed, shipped, and delivered to the customer.

--> 'wc-on-hold'
On Hold: The order status may be put on hold when there is a delay in
processing your payment. In this case, you must confirm the payment to
process your order successfully.

--> 'wc-cancelled'
- Cancelled: The order status changes to cancelled when the store owner or
customer cancels the order. The order stock increases to its previous
quantity and will not be fulfilled.

--> 'wc-failed'
- Failed: The order gets a failed status when there is an issue with the
payment processing or if it fails for some reason. This status may not
show immediately but instead show as ‘Pending’ until the confirmation.


Pending Payment: This is the initial status when a customer places an
order. It represents that the order is awaiting payment confirmation.

'wc-refunded'
Refunded: The order status changes to refunded when a customer
successfully processes and gets an order refunded.

Draft: The draft order gets created when shoppers start the checkout
process in WooCommerce but have not yet completed the purchase.
*/

    // получили Paid
    if(strtolower($r['payment_status'])!='paid') jdie($r);

    // Уплочено!
    $order_pointer->add_order_note( 'Paid by DOT: success' );
    // $order_pointer->set_status( 'on-hold' );
    // $order_pointer->update_status('wc-pending-payment');
    $order_pointer->payment_complete();
    $order_pointer->save();
    return true;
}

// Registering plugin
add_action('plugins_loaded', function() {
  if ( class_exists( 'Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType' ) ) {
    require_once plugin_dir_path( __FILE__ ) . '/Polkadot.class.php';
    add_action( 'woocommerce_blocks_payment_method_type_registration',
	function ($registry) {
	    $registry->register( new Automattic\WooCommerce\Blocks\Payments\Integrations\Polkadot() );
	}
    );
 }
});

// //////////////////////////////////////////////
/*
    function logs($s='') {
	$f = "/home/WWW/shop-WooCommerce/www/wp-content/plugins/polkadot-payments-woocommerce/__kalatori.log";
	$l=fopen($f,'a+');
	fputs($l,$s."\n");
	fclose($l);
	chmod($f,0666);
    }
*/

  function ejdie($s) { jdie(array('error'=>1,'error_message'=>$s)); }
  function jdie($j) { die(json_encode($j)); }

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
    if(curl_errno($ch) || empty($r)) ejdie("Daemon responce empty: ".curl_error($ch));

    $r = (array) json_decode($r);
    if(empty($r)) ejdie("Daemon responce error parsing");
    // Add the HTTP response code
    $r['http_code'] = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    return $r;
  }
