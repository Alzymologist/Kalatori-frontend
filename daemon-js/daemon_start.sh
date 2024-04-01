#!/bin/bash

clear

export KALATORI_HOST="0.0.0.0:16726"
export KALATORI_RPC="wss://node-polkadot.zymologia.fi:443"
export KALATORI_SEED="typical final fee winner cabin friend lemon today write rose coach jewel"
export KALATORI_DESTINATION="5EqPxC7iRP6vQTsg9rwXNHsA7VqbZa7uBjj7P4YqjTvfLiiJ"
export KALATORI_DECIMALS="12"

nodejs ./daemon.js


