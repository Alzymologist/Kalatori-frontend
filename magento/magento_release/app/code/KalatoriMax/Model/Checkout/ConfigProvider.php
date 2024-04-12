<?php
/**
 * @category    Alzymologist
 * @package     Alzymologist_KalatoriMax
 * @author      Alzymologist
 * @copyright   Alzymologist (https://alzymologist.com)
 * @license     https://github.com/alzymologist/kalatori/blob/master/LICENSE The MIT License (MIT)
 */

declare(strict_types=1);

namespace Alzymologist\KalatoriMax\Model\Checkout;

use Alzymologist\KalatoriMax\Model\Config;
use Alzymologist\KalatoriMax\Model\Kalatorimax;
use Magento\Checkout\Model\ConfigProviderInterface;
use Magento\Framework\Escaper;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\View\Asset\Repository as AssetRepository;
use Magento\Payment\Helper\Data as PaymentHelper;
use Magento\Store\Model\StoreManagerInterface;

class ConfigProvider implements ConfigProviderInterface
{
    private Config $config;
    private Kalatorimax $method;
    private Escaper $escaper;
    private AssetRepository $assetRepository;
    private StoreManagerInterface $storeManager;

    /**
     * @param Config $config
     * @param PaymentHelper $paymentHelper
     * @param Escaper $escaper
     * @throws LocalizedException
     */
    public function __construct(
        Config $config,
        PaymentHelper $paymentHelper,
        Escaper $escaper,
        AssetRepository $assetRepository,
        StoreManagerInterface $storeManager
    ) {
        $this->config = $config;
        $this->method = $paymentHelper->getMethodInstance(Kalatorimax::PAYMENT_METHOD_KALATORIMAX_CODE);
        $this->escaper = $escaper;
        $this->assetRepository = $assetRepository;
        $this->storeManager = $storeManager;
    }

    /**
     * {@inheritdoc}
     */
    public function getConfig()
    {
        return $this->method->isAvailable() ? [
            'payment' => [
                Kalatorimax::PAYMENT_METHOD_KALATORIMAX_CODE => [
                    'daemon_url' => $this->config->getDaemonUrl(),
                    'assets_base_url' => $this->getAssetsBaseUrl(),
                    'store_base_url' => $this->getStoreBaseUrl(),
                ],
            ],
        ] : [];
    }

    /**
     * @return string
     */
    private function getAssetsBaseUrl(): string
    {
        return $this->escaper->escapeUrl(
            $this->assetRepository->getUrlWithParams("Alzymologist_KalatoriMax::js", [])
        );
    }

    /**
     * @return string
     * @throws NoSuchEntityException
     */
    private function getStoreBaseUrl(): string
    {
        /** @var \Magento\Store\Model\Store $store */
        $store = $this->storeManager->getStore();

        return $this->escaper->escapeUrl($store->getBaseUrl());
    }
}
