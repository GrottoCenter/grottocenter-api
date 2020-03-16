#!/usr/bin/env bash
# Author: Clément Roig - Godefroi Roussel - Wikicaves
# Contributors: Lucas Gonçalves
# Date: Jan 2019 (v2 Feb 2020)

# nvm use 10.4.1

. /home/ec2-user/.nvm/nvm.sh
. /home/ec2-user/.bashrc


cd /home/ec2-user/GrottoCenter3

#  ============= FIRST DEPLOYEMENT ONLY /!\ ============= 
#
#   Check prerequisites for development:
  npm install -g grunt-cli
#   sudo amazon-linux-extras install nginx1.12
#   npm install forever -g
#
#  ======================================================

# Install dependencies
# Fix for missing depencie

sudo chown -R ec2-user /home/ec2-user/GrottoCenter3/

# Important to keep this version


npm install grunt-cli
npm run-script build
npm install --production --unsafe-perm || \
  ((if [ -f npm-debug.log ]; then \
      cat npm-debug.log; \
    fi) && false)

# Install files from private bucket
aws s3 cp  s3://appgrottocenter3/production.js /home/ec2-user/GrottoCenter3/config/env/production.js
aws s3 cp  s3://appgrottocenter3/env /home/ec2-user/GrottoCenter3/.env
aws s3 cp  s3://appgrottocenter3/transifexrc /home/ec2-user/GrottoCenter3/.transifexrc

NODE_ENV=production sails_hooks__grunt=false nohup node app.js --production > log.txt




