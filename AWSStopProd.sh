#!/usr/bin/env bash
# Script used to kill app during deployment
#. /home/ec2-user/.nvm/nvm.sh

#cd /home/ec2-user/GrottoCenter3

#nvm use 10.4.1

pm2 delete all
