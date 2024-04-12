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

class Kalatorimax extends \Magento\Payment\Model\Method\AbstractMethod
{
    public const PAYMENT_METHOD_KALATORIMAX_CODE = 'kalatorimax';

    /**
     * @var string
     */
    protected $_code = self::PAYMENT_METHOD_KALATORIMAX_CODE;

    /**
     * @var bool
     */
    protected $_isOffline = true;
}
