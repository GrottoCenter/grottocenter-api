#!/usr/bin/env bash

. /home/ec2-user/.nvm/nvm.sh

# Use forever to use node app 
#npm install forever -g

cd /home/ec2-user/GrottoCenter3

NODE_ENV=production sails_hooks__grunt=false nohup node app.js --production

#cd /home/ec2-user/db
#sh ./dump_db.sh