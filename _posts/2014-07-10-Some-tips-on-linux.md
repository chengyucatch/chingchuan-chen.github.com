---
layout: post
cTitle: Some tips on Linux
title: "Some tips on Linux"
category: linux
tagline:
tags: [Linux]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %}

這篇用來紀錄一堆不知道如何分類的小tips...

<!-- more -->

1. automatically load some shell scripts
In my system ubuntu 14.04, I can find the '.bashrc' file in my home directory.
Since I want ubuntu load intel complier and mkl parameter automatically, I add the two lines in the end of that file:

{% highlight bash %}
source /opt/intel/composer_xe_2013_sp1.3.174/mkl/bin/mklvars.sh intel64
source /opt/intel/composer_xe_2013_sp1.3.174/bin/compilervars.sh intel64
{% endhighlight %}

Then I success!!

2. cannot install ubuntu or Mint
With the options - acpi=off nolapic noapic, I finally install ubuntu successfully.

3. cannot boot without nolapic, however, it only recognize one cpu with nolapic
I solved this problem by [Dual core recognized as single core because of nolapic?](http://ubuntuforums.org/showthread.php?t=1084622).
I edited the grub file with following commands:

{% highlight bash %}
sudo bash
gedit /etc/default/grub
{% endhighlight %}

And replace `nolapic` with `pci=assign-busses apicmaintimer idle=poll reboot=cold,hard`, the grub file would be contain this two lines:

{% highlight bash %}
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash acpi_osi=linux"
GRUB_CMDLINE_LINUX="noapic pci=assign-busses apicmaintimer idle=poll reboot=cold,hard"
{% endhighlight %}

Then use following command to update grub. And the problem is fixed.

{% highlight bash %}
sudo update-grub
{% endhighlight %}

(To be continued.)
