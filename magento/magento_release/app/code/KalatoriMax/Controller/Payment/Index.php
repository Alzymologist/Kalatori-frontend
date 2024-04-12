<?php
/**
 * @category    Alzymologist
 * @package     Alzymologist_KalatoriMax
 * @author      Alzymologist
 * @copyright   Alzymologist (https://alzymologist.com)
 * @license     https://github.com/alzymologist/kalatori/blob/master/LICENSE The MIT License (MIT)
 */

declare(strict_types=1);

namespace Alzymologist\KalatoriMax\Controller\Payment;

use Alzymologist\KalatoriMax\Model\Config;
use Magento\Checkout\Model\Session as CheckoutSession;
use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Controller\Result\Json as ResultJson;
use Magento\Framework\Controller\Result\JsonFactory as ResultJsonFactory;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Store\Model\StoreManagerInterface;

class Index extends Action
{
    private ResultJsonFactory $resultJsonFactory;
    private Config $config;
    private CheckoutSession $checkoutSession;
    private StoreManagerInterface $storeManager;

    public function __construct(
        Context $context,
        ResultJsonFactory $resultJsonFactory,
        Config $config,
        CheckoutSession $checkoutSession,
        StoreManagerInterface $storeManager
    ) {
        parent::__construct($context);
        $this->resultJsonFactory = $resultJsonFactory;
        $this->config = $config;
        $this->checkoutSession = $checkoutSession;
        $this->storeManager = $storeManager;
    }

    /**
     * @return ResultJson
     * @throws LocalizedException
     * @throws NoSuchEntityException
     */
    public function execute()
    {
        /** @var ResultJson $resultJson */
        $resultJson = $this->resultJsonFactory->create();
        $response = [];

        /** @var \Magento\Quote\Model\Quote $quote */
        $quote = $this->checkoutSession->getQuote();		// "42"
        $order_id = $this->checkoutSession->getQuoteId();
        $total = $quote->getGrandTotal();			// "905.0000"
        $currency = $quote->getQuoteCurrencyCode();		// "USD"
        /** @var \Magento\Store\Api\Data\StoreInterface $store */
        // $store = $this->storeManager->getStore(); $store_base_url = $store->getBaseUrl(); // "https:\/\/magento.zymologia.fi\/"
        // $config_title = $this->config->getTitle(); // "Dotpayment via Alzymologist"
        $daemon_url = $this->config->getDaemonUrl();
        if(empty($daemon_url)) $daemon_url = 'http://localhost:16726';

	if(! empty($_REQUEST['health']) ) {
	    // Health request
	    $url = $daemon_url."/order/0/price/0";
	} else {
	    // Payment request
	    $url = $daemon_url."/order/"."Magento_".$order_id."/price/".$total;
	}
        $r = $this->ajax($url);

	if(strtolower($r['result'])=='paid') {
	    $r['REALLY_PAID']='OK';
	    // [ !!! ] Тут должны быть процедуры, закрывающие ордер как оплаченный
	    // $r['location'] = '/fihish/tpl.html'; // Тут можно указать редирект на страницу звершенного платежа
	}

	// Add our datas
	$r['store_total'] = $total;
	$r['store_order_id'] = $order_id;
	$r['store_currency'] = $currency;
	return $resultJson->setData($r);
    }

    public function ajax($url) {
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_HTTPHEADER => array('Content-Type:application/json'),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FAILONERROR => true,
        CURLOPT_CONNECTTIMEOUT => 2, // only spend 3 seconds trying to connect
        CURLOPT_TIMEOUT => 2 // 30 sec waiting for answer
    ));
    $r = curl_exec($ch);
    if(curl_errno($ch) || empty($r)) return array('error'=>'connect','error_message'=>curl_error($ch),'url'=>$url);

    $r = (array)json_decode($r);
    if(empty($r)) return array('error'=>'json','error_message'=>'Wrong json format','url'=>$url);
    curl_close($ch);

    // Йобаные патчи для kalatori
    if(isset($r['order'])) $r['order_id']=$r['order'];
    if(isset($r['price'])) $r['price']=1*$r['price'];
    $r['order_id']=preg_replace("/^.*\_/s",'',$r['order_id']);
    if( isset($r['mul']) && $r['mul'] < 20 ) $r['mul']=pow(10, $r['mul']);
    return $r;
  }


}