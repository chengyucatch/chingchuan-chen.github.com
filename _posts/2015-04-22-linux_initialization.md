---
layout: post
cTitle: "Initialization of ubuntu"
title: "Initialization of ubuntu"
category: linux
tagline:
tags: [linux]
cssdemo: 2014-spring
published: true
---
sudo add-apt-repository ppa:webupd8team/sublime-text-3
sudo apt-get update
sudo apt-get install sublime-text-installer
sudo add-apt-repository ppa:webupd8team/java && sudo apt-get update && sudo apt-get install oracle-java8-installer && sudo apt-get install oracle-java8-set-default
apt-cache search readline xorg-dev && sudo apt-get install libreadline6 libreadline6-dev xorg-dev tcl8.6-dev tk8.6-dev libtiff5 libtiff5-dev libjpeg-dev libpng12-dev libcairo2-dev libglu1-mesa-dev libgsl0-dev libicu-dev R-base R-base-dev libnlopt-dev libstdc++6 build-essential libcurl4-openssl-dev libxml2-dev aptitude r-base r-base-dev libnlopt-dev libstdc++6 build-essential libcurl4-openssl-dev libxml2-dev libssl-dev

# installation of rstudio-server
sudo apt-get install gdebi-core
wget https://download2.rstudio.org/rstudio-server-0.99.896-amd64.deb
sudo gdebi rstudio-server-0.99.896-amd64.deb
sudo cp /usr/lib/rstudio-server/extras/init.d/debian/rstudio-server /etc/init.d/
sudo apt-get install sysv-rc-conf
sudo sysv-rc-conf rstudio-server on
# check whether rstudio-server open when boot
sysv-rc-conf --list rstudio-server

# remove R
rm -r /usr/local/lib/R

# download the installation file
wget https://mran.revolutionanalytics.com/install/mro/3.2.4/MRO-3.2.4-Ubuntu-15.4.x86_64.deb
wget https://mran.revolutionanalytics.com/install/mro/3.2.4/RevoMath-3.2.4.tar.gz
# install MRO
sudo dpkg -i MRO-3.2.4-Ubuntu-15.4.x86_64.deb
# unpack MKL
tar -xzf RevoMath-3.2.4.tar.gz
cd RevoMath
# install MKL
sudo bash ./RevoMath.sh

sudo chown -R celest.celest /usr/lib64/MRO-3.2.4/R-3.2.4/lib/R
sudo chmod -R 775 /usr/lib64/MRO-3.2.4/R-3.2.4/lib/R

# install texlive
sudo apt-get install texinfo texlive texlive-binaries texlive-latex-base texlive-latex-extra texlive-fonts-extra

# for server
sudo apt-get install ssh rsync openssh-server
ssh-keygen -t rsa -P "" # generate SSH key
# Enable SSH Key
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys


# install mongodb
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo service mongod start
# # to new file 'mongod.service' in /lib/systemd/system with content:
# [Unit]
# Description=High-performance, schema-free document-oriented database
# Documentation=man:mongod(1)
# After=network.target
#
# [Service]
# Type=forking
# User=mongodb
# Group=mongodb
# RuntimeDirectory=mongod
# PIDFile=/var/run/mongod/mongod.pid
# ExecStart=/usr/bin/mongod -f /etc/mongod.conf --pidfilepath /var/run/mongod/mongod.pid --fork
# TimeoutStopSec=5
# KillMode=mixed
#
# [Install]
# WantedBy=multi-user.target
# # Reference:
# http://askubuntu.com/questions/690993/mongodb-3-0-2-wont-start-after-upgrading-to-ubuntu-15-10

# check whether it success
cat /var/log/mongodb/mongod.log
# setup mongodb.conf
subl /etc/init/mongodb.conf
## for remote connection, bind_ip need to be set 0.0.0.0.  port must be open. (refer to the following)
## for secure, to add admin user and create users:
# use admin
# # the user managing users
# db.createUser(
#   {
#     user: "adminname",
#     pwd: "password",
#     roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
#   }
# )
# # dbOwner
# # read/write all databases user
# db.createUser(
#   {
#     user: "adminname",
#     pwd: "password",
#     roles: [ { role: "dbOwner", db: "admin" } ]
#   }
# )
# # read/write all databases user
# db.createUser(
#   {
#     user: "adminname",
#     pwd: "password",
#     roles: [ { role: "readWriteAnyDatabase", db: "admin" } ]
#   }
# )
# # general users
# db.createUser(
#     {
#       user: "adminname",
#       pwd: "password",
#       roles: [
#          { role: "read", db: "reporting" },
#          { role: "read", db: "products" },
#          { role: "read", db: "sales" },
#          { role: "readWrite", db: "accounts" }
#       ]
#     }
# )

subl /etc/init/mongodb.conf
# set auth = true

# port to rstudio-server
iptables -A INPUT -p tcp --dport 8787 -j ACCEPT
# port to mongodb
iptables -A INPUT -p tcp --dport 27017 -j ACCEPT

# for VM, to use unity mode
sudo apt-get install gnome-shell

