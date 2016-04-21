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
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv 7F0CEB10
deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen
sudo apt-get update
sudo apt-get install mongodb-10gen
sudo service mongodb start
# setup mongodb.conf
subl /etc/init/mongodb.conf
## for remote connection, bind_ip need to be set 0.0.0.0. port must be open. (refer to the following)
## for secure, to add user:
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
