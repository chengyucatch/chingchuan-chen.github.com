---
layout: post
cTitle: "Installation of mongodb in ubuntu"
title: "Installation of mongodb in ubuntu"
category: mongodb
tagline:
tags: [mongodb]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %}

mongodb is a noSQL database. I use it to construct the vd database.

<!-- more -->

{% highlight bash %}
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
{% endhighlight %}
