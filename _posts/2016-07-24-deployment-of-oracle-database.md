---
layout: post
cTitle: "deployment of Oracle database"
title: "deployment of Oracle database"
category: oracle
tagline:
tags: [oracle]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %} 

這一篇文章主要是在centos 7.2最小安裝下去部署Oracle database

我會建立Oracle database的主要原因是

為了下一篇測試從Oracle database拉資料到sqoop

<!-- more -->

1. 準備工作
    
這部分照著前一篇spark的布置即可

其中hosts改成這樣：

``` bash
sudo tee -a /etc/hosts << "EOF"
192.168.0.120 oracleServer
EOF
```

2. 安裝java

``` bash
# 下載並安裝java
curl -v -j -k -L -H "Cookie: oraclelicense=accept-securebackup-cookie" http://download.oracle.com/otn-pub/java/jdk/8u101-b13/jdk-8u101-linux-x64.rpm -o jdk-8u101-linux-x64.rpm
sudo yum install -y jdk-8u101-linux-x64.rpm
# setup environment
sudo tee -a /etc/bashrc << "EOF"
export JAVA_HOME=/usr/java/jdk1.8.0_101
EOF
source /etc/bashrc
```

3. 安裝Oracle database
    
a. set up hostname
    
用`sudo vi /etc/hostname`修改hostname

我這裡使用oracleTest.test.com

或是直接`sudo bash -c 'echo oracleTest.test.com > /etc/hostname'`

b. 創建Oracle database的group, user

``` bash
sudo groupadd oinstall
sudo groupadd dba
sudo useradd -g oinstall -G dba oracle
# 更改密碼
sudo passwd oracle
``` 

c. 設定系統變數
    
``` bash
sudo tee -a /etc/sysctl.conf << "EOF"
fs.aio-max-nr = 1048576
fs.file-max = 6815744
kernel.shmall = 2097152
kernel.shmmax = 1987162112
kernel.shmmni = 4096
kernel.sem = 250 32000 100 128
net.ipv4.ip_local_port_range = 9000 65500
net.core.rmem_default = 262144
net.core.rmem_max = 4194304
net.core.wmem_default = 262144
net.core.wmem_max = 1048586
EOF
```

可以用`sysctl -p`跟`sysctl -a`來確定是否設定成功

d. 設定系統安全性

``` bash
sudo tee -a /etc/security/limits.conf << "EOF"
oracle   soft   nproc    131072
oracle   hard   nproc    131072
oracle   soft   nofile   131072
oracle   hard   nofile   131072
oracle   soft   core     unlimited
oracle   hard   core     unlimited
oracle   soft   memlock  50000000
oracle   hard   memlock  50000000
EOF
```

e. 修改hosts
    
``` bash
sudo tee -a /etc/hosts << "EOF"
192.168.0.120 oracleTest oracleTest.test.com localhost localhost.localdomain
EOF
```

f. 安裝需要元件
    
``` bash
sudo yum install -y zip unzip binutils.x86_64 compat-libcap1.x86_64 gcc.x86_64 gcc-c++.x86_64 glibc.i686 glibc.x86_64 glibc-devel.i686 glibc-devel.x86_64 ksh compat-libstdc++-33 libaio.i686 libaio.x86_64 libaio-devel.i686 libaio-devel.x86_64 libgcc.i686 libgcc.x86_64 libstdc++.i686 libstdc++.x86_64 libstdc++-devel.i686 libstdc++-devel.x86_64 libXi.i686 libXi.x86_64 libXtst.i686 libXtst.x86_64 make.x86_64 sysstat.x86_64 unixODBC.x86_64 unixODBC-devel.x86_64 libaio.i386
# for installation
sudo yum groupinstall "X Window System" "Fonts" -y 
```

g. 下載安裝檔案

可以從oracle網站[點這](http://www.oracle.com/technetwork/database/enterprise-edition/downloads/index.html)下載下來，然後用sftp上傳到你的VM

上傳常見的工具是FileZilla，在google很容易找到

至於使用方法搜尋一下也能找的到

假設下載到目前最新版本：12c Release 1

那檔名應該是：linuxamd64_12102_database_1of2.zip跟linuxamd64_12102_database_2of2.zip

h. 解壓縮檔案
    
``` bash 
sudo unzip linux.x64_11gR2_database_1of2.zip -d /stage/
sudo unzip linux.x64_11gR2_database_2of2.zip -d /stage/
```

i. 建立需要的資料夾
    
``` bash 
sudo mkdir /u01
sudo mkdir /u02
sudo chown -R oracle:oinstall /u01
sudo chown -R oracle:oinstall /u02
sudo chmod -R 775 /u01
sudo chmod -R 775 /u02
sudo chmod g+s /u01
sudo chmod g+s /u02
```

j. 利用Xming安裝 (putty in windows，如果其他系統要再用別的方式)
    
    1. 下載Xming：https://sourceforge.net/projects/xming/
    1. 安裝Xming
    1. Putty設定中的Connection/SSH/X11的分頁裡面，啟用X11，並設定X display location為localhost:0
    1. 登入伺服器，使用者用oracle
    1. 使用`/stage/database/runInstaller`
    1. 細部的安裝設定可以參考 https://wiki.centos.org/zh-tw/HowTos/Oracle12onCentos7
        
k. 設定防火牆
    
``` bash 
sudo firewall-cmd --zone=public --add-port=1521/tcp --add-port=5500/tcp --add-port=5520/tcp --add-port=3938/tcp \ 
--permanent
sudo firewall-cmd --reload
# 確定有開啟port
sudo firewall-cmd --list-ports
# 輸出應該是長這樣：1521/tcp 3938/tcp 5500/tcp 5520/tcp
```

l. 設定環境變數
    
``` bash
tee -a ~/.bash_profile << "EOF"
export TMPDIR=$TMP
export ORACLE_BASE=/u01/app/oracle
export ORACLE_HOME=$ORACLE_BASE/product/12.1.0/dbhome_1
export ORACLE_HOSTNAME=oracleTest.test.com
export ORACLE_SID=orcl
export PATH=$PATH:$ORACLE_HOME/bin
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$ORACLE_HOME/lib
export CLASSPATH=$CLASSPATH:$ORACLE_HOME/jlib:$ORACLE_HOME/rdbms/jlib
EOF
source ~/.bash_profile
```

k. 設定自動啟動
    
用`sudo vi /etc/oratab`去修改restart flag: `ORA11G:/u01/app/oracle/product/12.1.0/dbhome_1:Y`

l. 確定database狀態
    
確定dbconsole：`emctl status dbconsole`
確定LISTENER：`lsnrctl status LISTENER`

4. Reference

    1. http://dbaora.com/install-oracle-11g-release-2-11-2-on-centos-linux-7/
    1. https://www.unixmen.com/how-to-install-oralce-11gr2-database-server-on-centos-6-3/
    1. http://www.linuxidc.com/Linux/2016-04/130559.htm
    1. http://superuser.com/questions/576006/linker-error-while-installing-oracle-11g-on-fedora-18
    1. https://dotblogs.com.tw/jamesfu/2016/02/02/oracle12c_install
