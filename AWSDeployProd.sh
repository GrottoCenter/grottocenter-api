#!/usr/bin/env bash
# Author: Clément Roig - Godefroi Roussel - Wikicaves
# Contributors: Lucas Gonçalves
# Date: Jan 2019 (v2 Feb 2020)



. /home/ec2-user/.nvm/nvm.sh
. /home/ec2-user/.bashrc

nvm use 10.15.2

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
#   $ nvm install 10.15.2
#   $ sudo amazon-linux-extras install nginx1.12
#   $ npm install forever -g
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

echo "# ========== Lancement de l'application"
NODE_ENV=production sails_hooks__grunt=false nohup node app.js --production > gc3.log 2>&1 &
echo "# ========== Lancement terminé"
