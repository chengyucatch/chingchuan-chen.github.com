---
layout: post
cTitle: "Installation of MRO in ubuntu"
title: "Installation of MRO in ubuntu"
category: R
tagline:
tags: [R]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %}

Revolution R Open (Now named Microsoft R Open) provides Intel MKL multi-threaded BLAS.
This post is to record the installation of MRo in ubuntu 16.04.

<!-- more -->

First, go to the official website of MRO to check the download link ([Link](https://mran.revolutionanalytics.com/download/)).
The installation is refer to the manual at the website ([Link](https://mran.microsoft.com/documents/rro/installation/)).

{% highlight bash %}
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
{% endhighlight %}
