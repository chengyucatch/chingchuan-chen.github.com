---
layout: post
cTitle: installations of spyder2 and spyder3
title: "installations of spyder2 and spyder3"
category: python
tagline:
tags: [python]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %}

A simple log for installation of spyder2 and spyder3.

<!-- more -->


{% highlight bash %}
sudo apt-get install python-qt4 python-sphinx python-numpy python-scipy python-matplotlib
# recommended modules
sudo easy_install ipython rope pyflakes pylint pep8 psutil
sudo easy_install spyder
# python 3
sudo apt-get install python3-pyqt4 python3-sphinx python3-numpy python3-scipy python3-matplotlib
sudo easy_install3 ipython rope pylint pep8 pyflakes psutil
sudo easy_install3 spyder
{% endhighlight %}

{% highlight bash %}
# python 2.7
spyder
# python 3
spyder3
{% endhighlight %}
