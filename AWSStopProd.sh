#!/usr/bin/env bash
# Script used to kill app during deployment
#. /home/ec2-user/.nvm/nvm.sh

#cd /home/ec2-user/GrottoCenter3
. /home/ec2-user/.nvm/nvm.sh
. /home/ec2-user/.bashrc
nvm use 16.14.2
pm2 delete all
exit 0
