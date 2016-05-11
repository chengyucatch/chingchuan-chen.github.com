---
layout: post
cTitle: "Some installations of centos"
title: "Some installations of centos"
category: linux
tagline:
tags: [linux]
cssdemo: 2014-spring
published: true
---
<!-- more -->

{% highlight bash %}
# update system
sudo yml update

# installation of sublime text
cd ~/Downloads
wget https://download.sublimetext.com/sublime_text_3_build_3103_x64.tar.bz2
sudo tar -vxjf sublime_text_3_build_3103_x64.tar.bz2 -C /opt
## make a symbolic link to the installed Sublime3
sudo ln -s /opt/sublime_text_3/sublime_text /usr/bin/subl
## create Gnome desktop launcher
sudo subl /usr/share/applications/subl.desktop
## add following lines into file
# [Desktop Entry]
# Name=Subl
# Exec=subl
# Terminal=false
# Icon=/opt/sublime_text_3/Icon/48x48/sublime-text.png
# Type=Application
# Categories=TextEditor;IDE;Development
# X-Ayatana-Desktop-Shortcuts=NewWindow
#
# [NewWindow Shortcut Group]
# Name=New Window
# Exec=subl -n
# TargetEnvironment=Unity

# installation of java 8
sudo wget --no-cookies --no-check-certificate --header "Cookie: gpw_e24=http%3A%2F%2Fwww.oracle.com%2F; oraclelicense=accept-securebackup-cookie" "http://download.oracle.com/otn-pub/java/jdk/8u66-b17/jdk-8u66-linux-x64.rpm"
sudo rpm -ivh jdk-8u66-linux-x64.rpm

## Setup JAVA Environment Variables
sudo nano ~/.bashrc
## add following lines into file
# JAVA_HOME="/usr/java/jdk1.8.0_66/bin/java"
# JRE_HOME="/usr/java/jdk1.8.0_66/jre/bin/java"
# PATH=$PATH:$HOME/bin:JAVA_HOME:JRE_HOME
source ~/.bashrc

# installation of required packages for building R
sudo yum install libxml2-devel libxml2-static tcl tcl-devel tk tk-devel libtiff-static libtiff-devel
libjpeg-turbo-devel libpng12-devel cairo-tools libicu-devel openssl-devel libcurl-devel freeglut
readline-static readline-devel cyrus-sasl-devel texlive texlive-xetex

# install R
su -c 'rpm -Uvh https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm'
sudo yum update
sudo yum install R R-devel R-java

## remove R
sudo rm -rf /usr/lib64/R

# install MRO
## Make sure the system repositories are up-to-date prior to installing Microsoft R Open.
sudo yum clean all
## get the installers
wget https://mran.microsoft.com/install/mro/3.2.4/MRO-3.2.4.el7.x86_64.rpm
wget https://mran.microsoft.com/install/mro/3.2.4/RevoMath-3.2.4.tar.gz
## install MRO
sudo yum install MRO-3.2.4.el7.x86_64.rpm
## install MKL
tar -xzf RevoMath-3.2.4.tar.gz
cd RevoMath
sudo bash ./RevoMath.sh
### Choose option 1 to install MKL and follow the onscreen prompts.

## change the right of folders makes owner can install packages in library
sudo chown -R celest.celest /usr/lib64/MRO-3.2.4/R-3.2.4/lib64/R
sudo chmod -R 775 /usr/lib64/MRO-3.2.4/R-3.2.4/lib64/R

# for ssh connection
sudo apt-get install rsync openssh-server-sysvinit
ssh-keygen -t rsa -P "" # generate SSH key
# Enable SSH Key
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
{% endhighlight %}

The installation of rstudio server is recorded:
{% highlight bash %}
wget https://download2.rstudio.org/rstudio-server-rhel-0.99.896-x86_64.rpm
sudo yum install --nogpgcheck rstudio-server-rhel-0.99.896-x86_64.rpm
## start the rstudio-server
sudo rstudio-server start
## start rstudio-server when booting
sudo cp /usr/lib/rstudio-server/extras/init.d/redhat/rstudio-server /etc/init.d/
sudo chmod 755 /etc/init.d/rstudio-server
sudo chkconfig --add rstudio-server
## open the firewall for rstudio-server
sudo firewall-cmd --zone=public --add-port=8787/tcp --permanent
sudo firewall-cmd --reload

## To browse localhost:8787 for using the rstudio-server
{% endhighlight %}

The installation of shiny server is recorded:
{% highlight bash %}
## install shiny-server
wget https://download3.rstudio.org/centos5.9/x86_64/shiny-server-1.4.2.786-rh5-x86_64.rpm
sudo yum install --nogpgcheck shiny-server-1.4.2.786-rh5-x86_64.rpm
## start the shiny-server
sudo systemctl start shiny-server
## start shiny-server when booting
sudo cp /opt/shiny-server/config/init.d/redhat/shiny-server /etc/init.d/
sudo chmod 755 /etc/init.d/shiny-server
sudo chkconfig --add shiny-server

## open the firewall for shiny-server
sudo firewall-cmd --zone=public --add-port=3838/tcp --permanent
sudo firewall-cmd --reload

## the server file is in /srv/shiny-server
## there are some examples, you can browser localhost:3838,
## localhost:3838/sample-apps/hello and localhost:3838/sample-apps/rmd
{% endhighlight %}

Also, the installation of mongoDB is recorded:

{% highlight bash %}
## Configure the package management system
sudo subl /etc/yum.repos.d/mongodb-org-3.2.repo
## add following lines into file
# [mongodb-org-3.2]
# name=MongoDB Repository
# baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/3.2/x86_64/
# gpgcheck=1
# enabled=1
# gpgkey=https://www.mongodb.org/static/pgp/server-3.2.asc
## install mongoDB
sudo yum install -y mongodb-org

## prevent updating version of mongodb
sudo subl /etc/yum.conf
## add following line into file
# exclude=mongodb-org,mongodb-org-server,mongodb-org-shell,mongodb-org-mongos,mongodb-org-tools

## start mongod when booting
sudo chkconfig mongod on
{% endhighlight %}
