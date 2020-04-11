#!/usr/bin/env bash

. /home/ec2-user/.nvm/nvm.sh
. /home/ec2-user/.bashrc

nvm use 10.15.2

# Use forever to use node app 
#npm install forever -g

cd /home/ec2-user/GrottoCenter3

echo "# ========== Lancement de l'application"
NODE_ENV=production sails_hooks__grunt=false nohup node app.js --production > log.txt
echo "# ========== Lancement terminé"
#cd /home/ec2-user/db
#sh ./dump_db.sh