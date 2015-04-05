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

This post is used to record some tips I can't categorize in ubuntu.

<!-- more -->

i. automatically load some shell scripts
In my system ubuntu 14.04, I can find the '.bashrc' file in my home directory.
Since I want ubuntu load intel complier and mkl parameter automatically, I add the two lines in the end of that file:

{% highlight bash %}
source /opt/intel/composer_xe_2013_sp1.3.174/mkl/bin/mklvars.sh intel64
source /opt/intel/composer_xe_2013_sp1.3.174/bin/compilervars.sh intel64
{% endhighlight %}

Then I success!!

ii. cannot install ubuntu or Mint
With the options - acpi=off nolapic noapic, I finally install ubuntu successfully.

iii. cannot boot without nolapic, however, it only recognize one cpu with nolapic
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

iv. to get the permission of ntfs disks, you can edit the fstab in /etc as following:

{% highlight bash %}
sudo gedit /etc/fstab
{% endhighlight %}

And you can find the uuid by using the command `ls -l /dev/disk/by-uuid`. To add the disk and set the permission in the file fstab like this:

{% highlight bash %}
UUID=1c712d26-7f9d-4efc-b796-65bee366c8aa / ext4    noatime,nodiratime,discard,errors=remount-ro 0       1
UUID=9298D0AB98D08EDB /media/Windows ntfs defaults,uid=1000,gid=1000,umask=002     0      0
UUID=08C2997EC29970A4 /media/Download ntfs defaults,uid=1000,gid=1000,umask=002      0      0
UUID=01CD524F3352C990 /media/Files ntfs defaults,uid=1000,gid=1000,umask=002      0      0
{% endhighlight %}

Then you can access your ntfs disk and set an alias for each disk.

v. use grub comstomer to edit the boot order. Installation:

{% highlight bash %}
sudo add-apt-repository ppa:danielrichter2007/grub-customizer
sudo apt-get update
sudo apt-get install grub-customizer
{% endhighlight %}

vi. Install font `Inconsolata`[Download Here](http://www.levien.com/type/myfonts/inconsolata.html) and unity tweak tool (`sudo apt-get install unity-tweak-tool`).

vii. Install the chinese input `fcitx` and language `Chinese Traditional`.

{% highlight bash %}
sudo apt-get install fcitx fcitx-chewing fcitx-config-gtk fcitx-frontend-all fcitx-module-cloudpinyin fcitx-ui-classic fcitx-qt5
{% endhighlight %}

viii. Install ruby, jekyll and git.
{% highlight bash %}
sudo apt-get install ruby ruby-dev git python-pip python3-pip
gem install jekyll
pip install pygments
{% endhighlight %}

(To be continued.)
