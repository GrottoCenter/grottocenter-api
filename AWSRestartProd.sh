#!/usr/bin/env bash

. /home/ec2-user/.nvm/nvm.sh
. /home/ec2-user/.bashrc

nvm use 16.14.2

cd /home/ec2-user/GrottoCenter3

echo "# ========== Lancement de l'application"
NODE_ENV=production sails_hooks__grunt=false pm2 start app.js -l gc3.log --time -- --prod --production
echo "# ========== Lancement terminé"
#cd /home/ec2-user/db
#sh ./dump_db.sh
