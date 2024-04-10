#!/bin/sh

rm ./DOT.js
rm ./ajax.php
rm ./dotpay.tpl
rm ./payment.php
rm ./validation.php
rm ./infos.tpl
rm ./ps_dotpayment.php

ln -s /home/WWW/shop-PrestaShop/www/modules/ps_dotpayment/views/js/DOT.js                  ./DOT.js
ln -s /home/WWW/shop-PrestaShop/www/modules/ps_dotpayment/views/templates/front/dotpay.tpl ./dotpay.tpl
ln -s /home/WWW/shop-PrestaShop/www/modules/ps_dotpayment/controllers/front/ajax.php       ./ajax.php
ln -s /home/WWW/shop-PrestaShop/www/modules/ps_dotpayment/controllers/front/payment.php    ./payment.php
ln -s /home/WWW/shop-PrestaShop/www/modules/ps_dotpayment/controllers/front/validation.php ./validation.php
ln -s /home/WWW/shop-PrestaShop/www/modules/ps_dotpayment/views/templates/hook/infos.tpl   ./infos.tpl
ln -s /home/WWW/shop-PrestaShop/www/modules/ps_dotpayment/ps_dotpayment.php                ./ps_dotpayment.php

sudo chmod -R a+rw /home/WWW/shop-PrestaShop
