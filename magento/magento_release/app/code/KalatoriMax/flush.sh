#!/bin/sh

# buntu@alzy-01:/home/WWW/shop-Magento/www/bin$ ./magento

# Restore permissions
sudo chmod -R a+rw /home/WWW/shop-Magento/www

# Flush dir
rm -r /home/WWW/shop-Magento/www/pub/static/frontend/Magento/luma/en_US/Alzymologist_KalatoriMax

# Enabled developer mode.
# /home/WWW/shop-Magento/www/bin/magento deploy:mode:set developer

# неведомая хуйня
/home/WWW/shop-Magento/www/bin/magento setup:static-content:deploy -f

# Flush cache
/home/WWW/shop-Magento/www/bin/magento cache:flush

# неведомая хуйня setup:di:compile
#/home/WWW/shop-Magento/www/bin/magento s:d:c


