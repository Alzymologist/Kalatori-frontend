#!/bin/bash

clear

export KALATORI_HOST="0.0.0.0:16726"
export KALATORI_SEED="typical final fee winner cabin friend lemon today write rose coach jewel"
#export KALATORI_DESTINATION="5EqPxC7iRP6vQTsg9rwXNHsA7VqbZa7uBjj7P4YqjTvfLiiJ"
export KALATORI_DESTINATION="1sa1P9pU4Pa6JM2nyB2vcAQw9cCxttzpovAmCwcUHZ6UxET"
export KALATORI_REMARK="DEBUG=true;Ebala=1"

nodejs ./daemon.js


