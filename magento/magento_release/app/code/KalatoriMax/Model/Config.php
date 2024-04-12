<?php
/**
 * @category    Alzymologist
 * @package     Alzymologist_KalatoriMax
 * @author      Alzymologist
 * @copyright   Alzymologist (https://alzymologist.com)
 * @license     https://github.com/alzymologist/kalatori/blob/master/LICENSE The MIT License (MIT)
 */

declare(strict_types=1);

namespace Alzymologist\KalatoriMax\Model;

use Magento\Framework\App\Config\ScopeConfigInterface;

class Config
{
    private const XML_PATH_PAYMENT_KALATORIMAX_ACTIVE = 'payment/kalatorimax/active';
    private const XML_PATH_PAYMENT_KALATORIMAX_TITLE = 'payment/kalatorimax/title';
    private const XML_PATH_PAYMENT_KALATORIMAX_DAEMON_URL = 'payment/kalatorimax/daemon_url';

    private ScopeConfigInterface $scopeConfig;

    public function __construct(ScopeConfigInterface $scopeConfig)
    {
        $this->scopeConfig = $scopeConfig;
    }

    /**
     * @return bool
     */
    public function isEnabled(): bool
    {
        return $this->scopeConfig->isSetFlag(self::XML_PATH_PAYMENT_KALATORIMAX_ACTIVE);
    }

    /**
     * @return string
     */
    public function getTitle(): string
    {
        return (string)$this->scopeConfig->getValue(self::XML_PATH_PAYMENT_KALATORIMAX_TITLE);
    }

    /**
     * @return string
     */
    public function getDaemonUrl(): string
    {
        return (string)$this->scopeConfig->getValue(self::XML_PATH_PAYMENT_KALATORIMAX_DAEMON_URL);
    }
}
