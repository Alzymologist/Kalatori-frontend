<?php
/**
 * Example external payment gateway implementation for Gutenberg Blocks for the non-existant gateway "Polkadot"
 *
 * @package WooCommerce/Blocks
 * @since 3.0.0
 */


// use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;

namespace Automattic\WooCommerce\Blocks\Payments\Integrations;

// Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType

final class Polkadot extends AbstractPaymentMethodType {
	protected $name = 'polkadot';

	public function initialize() {
		$this->settings = get_option( 'woocommerce_polkadot_settings', [] );

                // Polkadot doesn't actually exist, so we'll fake some options instead. Delete this for actual payment methods.
                if (empty($this->settings)) {
                   $this->settings = array('enabled'=>'yes',
			'title'=>'Polkadot!',
			'description'=>'Polkadots is a payment method that does not exist'
		    );
                }
	}

	public function is_active() {
		return filter_var( $this->get_setting( 'enabled', false ), FILTER_VALIDATE_BOOLEAN );
	}

	public function get_payment_method_script_handles() {
                $version = "1.0.0";
                $path = plugins_url('wc-payment-method-polkadot.js?'.rand(0,99999999), __FILE__); //lleorand
		// $n='WC_Polkadot_Gateway';
		$n='wc-payment-method-polkadot';
                $handle = $n;
                $dependencies = array(); // array('wc-vendors', 'wc-blocks' );
                wp_register_script($handle, $path, $dependencies, $version, true);
                wp_set_script_translations( $n, 'polkadot' );
		return [ $n ];
	}

	public function get_payment_method_data() {
		return [
			'root_url'	=> plugins_url('', __FILE__),
			'name'		=> $this->get_setting( 'store_name' ),
			// 'description'=> $this->get_setting( 'description' ),
			'currences'	=> $this->get_setting( 'currences' ),
			'currency'	=> get_woocommerce_currency()
		];
	}
}


