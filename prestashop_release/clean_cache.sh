#!/bin/sh

DIR="../www"
sudo chmod -R a+rw "${DIR}/var/cache/prod"
rm -rf "${DIR}/var/cache/prod"