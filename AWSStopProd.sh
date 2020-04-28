#!/usr/bin/env bash
# Script used to kill app during deployment
#. /home/ec2-user/.nvm/nvm.sh

#cd /home/ec2-user/GrottoCenter3

#nvm use 10.4.1

NAME="app.js" # nodejs script's name here
RUN=`pgrep -f $NAME`

if [ "$RUN" == "" ]; then
 echo "Script is not running"
 exit 0
else
 echo "Script is running"
 killall node
 exit 0
fi