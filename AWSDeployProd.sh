#!/usr/bin/env bash
# Author: Clément Roig - Godefroi Roussel - Wikicaves
# Contributors: Lucas Gonçalves
# Date: Jan 2019 (v2 Feb 2020)



. /home/ec2-user/.nvm/nvm.sh
. /home/ec2-user/.bashrc

nvm use 16.14.2

cd /home/ec2-user/GrottoCenter3

#  ============= FIRST DEPLOYEMENT ONLY /!\ =============
#
#  === Increase ulimit to make the grunt build possible ===
#  = These steps are maybe not required if the build is done by travis... =
#   $ sudo vim /etc/security/limits.conf
#
#   ec2-user soft nofile 65536
#   ec2-user hard nofile 65536
#   root soft nofile 65536
#   root hard nofile 65536
#
#   Logout / login
#   ulimit -Sn 65536
#   === End of ulimit ===
#
#   $ nvm install 16.14.2
#   $ sudo amazon-linux-extras install nginx1.12
#   $ npm install pm2 -g
#   $ pm2 install pm2-logrotate
#
#  ======================================================

# Install dependencies
# Fix for missing depencie

sudo chown -R ec2-user /home/ec2-user/GrottoCenter3/

# Important to keep this version

# Install files from private bucket
echo "# ========== Récupération des fichiers privés"

aws s3 cp  s3://appgrottocenter3/production.js /home/ec2-user/GrottoCenter3/config/env/production.js
aws s3 cp  s3://appgrottocenter3/env /home/ec2-user/GrottoCenter3/.env
aws s3 cp  s3://appgrottocenter3/transifexrc /home/ec2-user/GrottoCenter3/.transifexrc

echo "# ========== Transifex"
grunt transifex:grottocenter

echo "# ========== Lancement de l'application"
NODE_ENV=production sails_hooks__grunt=false pm2 start app.js -l gc3.log --time -- --prod --production
echo "# ========== Lancement terminé"
