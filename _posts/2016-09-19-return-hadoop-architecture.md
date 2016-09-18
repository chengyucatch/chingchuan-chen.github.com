---
layout: post
cTitle: "重返Hadoop Architecture (設定HA群集)"
title: "Return Hadoop Architecture with setting HA cluster"
category: Hadoop
tagline:
tags: [Spark, Mesos, Hadoop, Pheonix, HBase]
cssdemo: 2014-spring
published: false
---
{% include JB/setup %} 

(Ongoing)

用完Cassandra的primary key跟secondary index之後

覺得Cassandra再怎麼宣稱他們的東西多好也沒意義

現在連query某段時間的rows都無法做到，我不知道這樣的CQL到底能幹嘛用

看到Pheonix能夠直接提供standalone query server就很想試試看

這樣可以連用web service的功都省下來，只是query server的loading就很難講了

<!-- more -->

這一篇會非常的長，因為Hadoop之前沒有完全的建好

讓他能夠開機自動啟動，並且有HA的能力

所以會花很多篇幅在設定跟建立on boot的script

我這一篇斷斷續續寫了兩週，一直提不太起勁一口氣完成他


重新佈署：

0. 部署之前的環境設定

ssh部分要實現全部都能互相連接，不能只有master能夠連到slaves

因此，這裡給一個簡單的script去做key的傳遞

``` bash
# 每一台都執行完下面兩個指令後
ssh-keygen -t rsa -P ""
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
# 在master上跑

tee ~/all_hosts << "EOF"
cassSpark1
cassSpark2
cassSpark3
EOF
scp ~/all_hosts tester@cassSpark2:~/
scp ~/all_hosts tester@cassSpark2:~/

# 然後在每一台都跑下面這個指令(要打很多次密碼)
for hostname in `cat all_hosts`; do
  ssh-copy-id -i ~/.ssh/id_rsa.pub $hostname
done
```

1. 下載檔案

``` bash
# 建立放置資料夾
sudo mkdir /usr/local/bigdata
sudo chown -R tester /usr/local/bigdata
# 下載並安裝java
curl -v -j -k -L -H "Cookie: oraclelicense=accept-securebackup-cookie" http://download.oracle.com/otn-pub/java/jdk/8u101-b13/jdk-8u101-linux-x64.rpm -o jdk-8u101-linux-x64.rpm
sudo yum install -y jdk-8u101-linux-x64.rpm
# 下載並部署Hadoop
curl -v -j -k -L http://apache.stu.edu.tw/hadoop/common/hadoop-2.7.3/hadoop-2.7.3.tar.gz -o hadoop-2.7.3.tar.gz
tar -zxvf hadoop-2.7.3.tar.gz
mv hadoop-2.7.3 /usr/local/bigdata/hadoop
# 下載並部署zookeeper
curl -v -j -k -L http://apache.stu.edu.tw/zookeeper/zookeeper-3.4.8/zookeeper-3.4.8.tar.gz -o zookeeper-3.4.8.tar.gz
tar -zxvf zookeeper-3.4.8.tar.gz
mv zookeeper-3.4.8 /usr/local/bigdata/zookeeper
# 下載並部署HBase
curl -v -j -k -L http://apache.stu.edu.tw/hbase/stable/hbase-1.2.2-bin.tar.gz -o hbase-1.2.2-bin.tar.gz
tar -zxvf hbase-1.2.2-bin.tar.gz
mv hbase-1.2.2 /usr/local/bigdata/hbase
# 下載並部署phoenix
curl -v -j -k -L  http://apache.stu.edu.tw/phoenix/apache-phoenix-4.8.0-HBase-1.2/bin/apache-phoenix-4.8.0-HBase-1.2-bin.tar.gz -o apache-phoenix-4.8.0-HBase-1.2-bin.tar.gz
tar -zxvf apache-phoenix-4.8.0-HBase-1.2-bin.tar.gz
# 下載並部署mesos
curl -v -j -k -L http://repos.mesosphere.com/el/7/x86_64/RPMS/mesos-1.0.0-2.0.89.centos701406.x86_64.rpm -o mesos-1.0.0-2.0.89.centos701406.x86_64.rpm
sudo yum install mesos-1.0.0-2.0.89.centos701406.x86_64.rpm
# 下載並部署scala
curl -v -j -k -L http://downloads.lightbend.com/scala/2.11.8/scala-2.11.8.tgz -o scala-2.11.8.tgz
tar -zxvf scala-2.11.8.tgz
mv scala-2.11.8 /usr/local/bigdata/scala
# 下載並部署spark
curl -v -j -k -L http://apache.stu.edu.tw/spark/spark-2.0.0/spark-2.0.0-bin-hadoop2.7.tgz -o spark-2.0.0-bin-hadoop2.7.tgz
tar -zxvf spark-2.0.0-bin-hadoop2.7.tgz
mv spark-2.0.0-bin-hadoop2.7 /usr/local/bigdata/spark
```

2. 環境變數設置：

{% highlight bash %}
sudo tee -a /etc/bashrc << "EOF"
# JAVA
export JAVA_HOME=/usr/java/jdk1.8.0_101
# HADOOP
export HADOOP_HOME=/usr/local/bigdata/hadoop
export HADOOP_COMMON_HOME=$HADOOP_HOME
export HADOOP_CONF_DIR=$HADOOP_HOME/etc/hadoop
export HADOOP_COMMON_LIB_NATIVE_DIR=$HADOOP_HOME/lib/native
export HADOOP_OPTS="$HADOOP_OPTS -Djava.library.path=$HADOOP_HOME/lib/native"
# ZOOKEEPER
export ZOOKEEPER_HOME=/usr/local/bigdata/zookeeper
# HBASE
export HBASE_HOME=/usr/local/bigdata/hbase
export HBASE_MANAGES_ZK=false
export HBASE_CLASSPATH=$HBASE_CLASSPATH:$HADOOP_CONF_DIR
export HBASE_CONF_DIR=$HBASE_HOME/conf
# PHOENIX
export PHOENIX_HOME=/usr/local/bigdata/phoenix
export PHOENIX_CLASSPATH=$PHOENIX_HOME/lib
export PHOENIX_LIB_DIR=$PHOENIX_HOME/lib
# SCALA
export SCALA_HOME=/usr/local/bigdata/scala
# SPARK
export SPARK_HOME=/usr/local/bigdata/spark
# PATH
export PATH=$PATH:$JAVA_HOME:$HADOOP_HOME/bin:$HADOOP_HOME/sbin:$ZOOKEEPER_HOME/bin:$HBASE_HOME/bin:$SCALA_HOME/bin:$SPARK_HOME/bin:$PHOENIX_HOME/bin
EOF
source /etc/bashrc
{% endhighlight %}

3. 開始設定

a. Zookeeper, Mesos設定

``` bash
## Zookeeper
# 複製zoo.cfg
cp $ZOOKEEPER_HOME/conf/zoo_sample.cfg $ZOOKEEPER_HOME/conf/zoo.cfg
# 傳入設定
tee $ZOOKEEPER_HOME/conf/zoo.cfg << "EOF"
dataDir=/usr/local/bigdata/zookeeper/data
server.1=cassSpark1:2888:3888
server.2=cassSpark2:2888:3888
server.3=cassSpark3:2888:3888
EOF

# 接著創立需要的資料夾，並新增檔案
mkdir $ZOOKEEPER_HOME/data
tee $ZOOKEEPER_HOME/data/myid << "EOF"
1
EOF

# 佈置到其他台
scp -r /usr/local/bigdata/zookeeper tester@cassSpark2:/usr/local/bigdata
scp -r /usr/local/bigdata/zookeeper tester@cassSpark3:/usr/local/bigdata
ssh tester@cassSpark2 "sed -i -e 's/1/2/g' $ZOOKEEPER_HOME/data/myid"
ssh tester@cassSpark2 "sed -i -e 's/1/3/g' $ZOOKEEPER_HOME/data/myid"

## Mesos
# 修改zookeeper
sudo tee /etc/mesos/zk << "EOF"
zk://192.168.0.121:2181,192.168.0.122:2181,192.168.0.123:2181/mesos
EOF

# 配置quorum
sudo tee /etc/mesos-master/quorum << "EOF"
2
EOF
```

其中，Zookeeper跟Mesos自動啟動請參考[這篇](http://chingchuan-chen.github.io/spark/2016/08/23/deployment-of-mesos-spark.html)

b. Hadoop設定

``` bash
# slaves
tee $HADOOP_CONF_DIR/slaves << "EOF"
cassSpark1
cassSpark2
cassSpark3
EOF

# core-site.xml
sed -i -e 's/<\/configuration>//g' $HADOOP_CONF_DIR/core-site.xml
tee -a $HADOOP_CONF_DIR/core-site.xml << "EOF"
  <property>
    <name>fs.default.name</name>
    <value>hdfs://hc1</value>
  </property>
  <property>
    <name>hadoop.tmp.dir</name>
    <value>/usr/local/bigdata/hadoop/tmp</value>
  </property>
   <property>
  <name>ha.zookeeper.quorum</name>
  <value>cassSpark1:2181,cassSpark2:2181,cassSpark3:2181</value>
  </property>
</configuration>
EOF

mkdir -p $HADOOP_HOME/tmp

# hdfs-site.xml
sed -i -e 's/<\/configuration>//g' $HADOOP_CONF_DIR/hdfs-site.xml
tee -a $HADOOP_CONF_DIR/hdfs-site.xml << "EOF"
  <property>
    <name>dfs.replication</name>
    <value>3</value>
  </property>
  <property>
    <name>dfs.permissions</name>
    <value>false</value>
  </property>
  <property>
    <name>dfs.webhdfs.enabled</name>
    <value>true</value>
  </property>
  <property>
    <name>dfs.name.dir</name>
    <value>file:///usr/local/bigdata/hadoop/tmp/name</value>
  </property>
  <property>
    <name>dfs.data.dir</name>
    <value>file:///usr/local/bigdata/hadoop/tmp/data</value>
  </property>
  <property>
    <name>dfs.namenode.checkpoint.dir</name>
    <value>file:///usr/local/bigdata/hadoop/tmp/name/chkpt</value>
  </property>
  <property>
    <name>dfs.nameservices</name>
    <value>hc1</value>     
  </property>
  <property>
    <name>dfs.namenode.shared.edits.dir</name>    
    <value>qjournal://192.168.0.121:8485;192.168.0.122:8485;192.168.0.123:8485/hc1</value>
  </property>
  <property>
    <name>dfs.journalnode.edits.dir</name>
    <value>/home/hadoop/tmp/journal</value>
  </property>
  <property>
    <name>dfs.ha.namenodes.hc1</name>
    <value>nn1,nn2</value>
  </property>
  <property>
    <name>dfs.namenode.rpc-address.hc1.nn1</name>
    <value>cassSpark1:9000</value>
  </property>
  <property>
    <name>dfs.namenode.rpc-address.hc1.nn2</name>
    <value>cassSpark2:9000</value>
  </property>
  <property>
    <name>dfs.namenode.http-address.hc1.nn1</name>
    <value>cassSpark1:50070</value>
  </property>
  <property>
    <name>dfs.namenode.http-address.hc1.nn2</name>
    <value>cassSpark2:50070</value>
  </property>
  <property>
    <name>dfs.namenode.shared.edits.dir</name>    
    <value>file:///usr/local/bigdata/hadoop/tmp/ha-name-dir-shared</value>
  </property>
  <property>
    <name>dfs.client.failover.proxy.provider.hc1</name> 
    <value>org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider</value>
  </property>
  <property>
    <name>dfs.ha.fencing.methods</name>
    <value>sshfence</value>
  </property>
  <property>
    <name>dfs.ha.fencing.ssh.private-key-files</name>
    <value>/home/tester/.ssh/id_rsa</value>
  </property>
  <property>
    <name>dfs.ha.automatic-failover.enabled</name>
    <value>true</value>
  </property>
</configuration>
EOF

mkdir -p $HADOOP_HOME/tmp/data
mkdir -p $HADOOP_HOME/tmp/name
mkdir -p $HADOOP_HOME/tmp/journal
mkdir -p $HADOOP_HOME/tmp/name/chkpt
mkdir -p $HADOOP_HOME/tmp/ha-name-dir-shared

# mapred-site.xml
cp $HADOOP_CONF_DIR/mapred-site.xml.template $HADOOP_CONF_DIR/mapred-site.xml
sed -i -e 's/<\/configuration>//g' $HADOOP_CONF_DIR/mapred-site.xml
tee -a $HADOOP_CONF_DIR/mapred-site.xml << "EOF"
  <property>
    <name>mapreduce.framework.name</name>
    <value>yarn</value>
  </property>
</configuration>
EOF

# yarn-site.xml
sed -i -e 's/<\/configuration>//g' $HADOOP_CONF_DIR/yarn-site.xml
tee -a $HADOOP_CONF_DIR/yarn-site.xml << "EOF"
  <property>
    <name>yarn.nodemanager.aux-services</name>
    <value>mapreduce_shuffle</value>
  </property>
  <property>
    <name>yarn.nodemanager.aux-services.mapreduce.shuffle.class</name>
    <value>org.apache.hadoop.mapred.ShuffleHandler</value>
  </property>
  <property>
    <name>yarn.resourcemanager.zk-address</name>
    <value>cassSpark1:2181,cassSpark2:2181,cassSpark3:2181</value>
  </property>
  <property>
    <name>yarn.resourcemanager.cluster-id</name>
    <value>yarn-ha</value>
  </property>
  <property>
    <name>yarn.resourcemanager.ha.enabled</name>
    <value>true</value>
  </property>
  <property>
    <name>yarn.resourcemanager.ha.rm-ids</name>
    <value>rm1,rm2</value>
  </property>
  <property>
    <name>yarn.resourcemanager.hostname.rm1</name>
    <value>cassSpark1</value>
  </property>
  <property>
    <name>yarn.resourcemanager.hostname.rm2</name>
    <value>cassSpark2</value>
  </property>
  <property>
    <name>yarn.resourcemanager.recovery.enabled</name>
    <value>true</value>
  </property>
  <property>
    <name>yarn.resourcemanager.ha.automatic-failover.enabled</name>
    <value>true</value>
  </property>
  <property>
    <name>yarn.client.failover-proxy-provider</name>
    <value>org.apache.hadoop.yarn.client.ConfiguredRMFailoverProxyProvider</value>
  </property>
  <property>
    <name>yarn.resourcemanager.store.class</name>
    <value>org.apache.hadoop.yarn.server.resourcemanager.recovery.ZKRMStateStore</value>
  </property>
</configuration>
EOF

# 複製到各台
scp -r /usr/local/bigdata/hadoop tester@cassSpark2:/usr/local/bigdata
scp -r /usr/local/bigdata/hadoop tester@cassSpark3:/usr/local/bigdata
```

c. HBase設定

``` bash 
sed -i -e 's/<\/configuration>//g' $HBASE_HOME/conf/hbase-site.xml
tee -a $HBASE_HOME/conf/hbase-site.xml << "EOF"
  <property>
    <name>hbase.rootdir</name>
    <value>hdfs://hc1/hbase</value>
  </property>
  <property>
    <name>hbase.cluster.distributed</name>
    <value>true</value>
  </property>
  <property>
    <name>dfs.replication</name>
    <value>3</value>
  </property>
  <property>
    <name>hbase.zookeeper.quorum</name>
    <value>cassSpark1,cassSpark2,cassSpark3</value>
  </property>
  <property>
    <name>hbase.zookeeper.property.clientPort</name>
    <value>2181</value>
  </property>
  <property>
    <name>hbase.zookeeper.property.dataDir</name>
    <value>file:///usr/local/bigdata/zookeeper/data</value>
  </property>
  <property>
    <name>hbase.master.port</name>
    <value>60000</value>
  </property>
</configuration>
EOF

# 複製slaves
cp $HADOOP_CONF_DIR/slaves $HBASE_HOME/conf/regionservers

# 複製到各台
scp -r /usr/local/bigdata/hbase tester@cassSpark2:/usr/local/bigdata
scp -r /usr/local/bigdata/hbase tester@cassSpark3:/usr/local/bigdata
```

d. 配置Pheonix

``` bash
# 縮短名稱
mv apache-phoenix-4.8.0-HBase-1.2-bin phoenix-4.8.0
# 複製lib檔案到HBase/lib下
sudo cp phoenix-4.8.0/phoenix-4.8.0-HBase-1.2-server.jar $HBASE_HOME/lib
# 複製hbase設定到phoenix下
mkdir $PHOENIX_HOME
mkdir $PHOENIX_HOME/bin
cp $HBASE_HOME/conf/hbase-site.xml $PHOENIX_HOME/bin
cp $HBASE_HOME/conf/hbase-env.sh $PHOENIX_HOME/bin
cp -R phoenix-4.8.0/bin $PHOENIX_HOME
cp -R phoenix-4.8.0/examples $PHOENIX_HOME
# 複製lib檔, bin
mkdir $PHOENIX_HOME/lib
cp phoenix-4.8.0/*.jar $PHOENIX_HOME/lib
cp phoenix-4.8.0/LICENSE $PHOENIX_HOME/LICENSE
chmod +x $PHOENIX_HOME/bin/*.py
chmod +x $PHOENIX_HOME/bin/*.sh
rm -r phoenix-4.8.0
```

4. 啟動

``` bash
# 啟動zookeeper server (設定自動啟動可以跳過)
zkServer.sh start
ssh tester@cassSpark2 "zkServer.sh start"
ssh tester@cassSpark3 "zkServer.sh start"
# 格式化zkfc
hdfs zkfc -formatZK
ssh tester@cassSpark2 "hdfs zkfc -formatZK"
# 開啟journalnode
hadoop-daemon.sh start journalnode
ssh tester@cassSpark2 "hadoop-daemon.sh start journalnode"
ssh tester@cassSpark3 "hadoop-daemon.sh start journalnode"
# 格式化namenode，並啟動namenode (nn1)
hadoop namenode -format hc1
hadoop-daemon.sh start namenode
# 備用namenode啟動 (nn2)
ssh tester@cassSpark2 "hadoop namenode -format hc1"
ssh tester@cassSpark2 "hdfs namenode –bootstrapStandby"
ssh tester@cassSpark2 "hadoop-daemon.sh start namenode"
# 啟動zkfc
hadoop-daemon.sh start zkfc
ssh tester@cassSpark2 "hadoop-daemon.sh start zkfc"
# 啟動datanode
hadoop-daemon.sh start datanode
ssh tester@cassSpark2 "hadoop-daemon.sh start datanode"
ssh tester@cassSpark3 "hadoop-daemon.sh start datanode"
# 啟動yarn
yarn-daemon.sh start resourcemanager
yarn-daemon.sh start nodemanager
ssh tester@cassSpark2 "yarn-daemon.sh start resourcemanager"
ssh tester@cassSpark2 "yarn-daemon.sh start nodemanager"
ssh tester@cassSpark3 "yarn-daemon.sh start resourcemanager"
ssh tester@cassSpark3 "yarn-daemon.sh start nodemanager"
# 啟動HBase
hbase-daemon.sh start master
hbase-daemon.sh start regionserver
ssh tester@cassSpark2 "hbase-daemon.sh start master"
ssh tester@cassSpark2 "hbase-daemon.sh start regionserver"
ssh tester@cassSpark3 "hbase-daemon.sh start master"
ssh tester@cassSpark3 "hbase-daemon.sh start regionserver"
```

開啟之後就可以用jps去看各台開啟狀況，如果確定都沒問題之後

接下來就可以往下去設定自動啟動的部分了


這裡採用python的supervisord去協助監控service的進程，並做自動啟動的動作

先安裝supervisor:

``` bash
sudo yum install python-setuptools
sudo easy_install pip
sudo pip install supervisor
# echo default config
sudo mkdir /etc/supervisor
sudo bash -c 'echo_supervisord_conf > /etc/supervisor/supervisord.conf'
```

使用`sudo vi /etc/supervisor/supervisord.conf`編輯，更動下面的設定：

```
[inet_http_server]         ; inet (TCP) server disabled by default
port=192.168.0.121:10088   ; (ip_address:port specifier, *:port for all iface)
username=tester            ; (default is no username (open server))
password=qscf12356         ; (default is no password (open server))

[supervisorctl]
serverurl=unix:///tmp/supervisor.sock ; use a unix:// URL  for a unix socket
serverurl=http://192.168.0.121:10088 ; use an http:// url to specify an inet socket
username=tester              ; should be same as http_username if set
password=qscf12356          ; should be same as http_password if set

[supervisord]
environment=
  JAVA_HOME=/usr/java/jdk1.8.0_101,
  SCALA_HOME=/usr/local/scala/scala-2.11,
  SPARK_HOME=/usr/local/bigdata/spark,
  ZOOKEEPER_HOME=/usr/local/bigdata/zookeeper,
  HADOOP_HOME=/usr/local/bigdata/hadoop,
  HADOOP_COMMON_HOME="$HADOOP_HOME",
  HADOOP_CONF_DIR="$HADOOP_HOME/etc/hadoop",
  HADOOP_COMMON_LIB_NATIVE_DIR="$HADOOP_HOME/lib/native",
  HADOOP_OPTS="$HADOOP_OPTS -Djava.library.path=$HADOOP_HOME/lib/native",
  HBASE_HOME=/usr/local/bigdata/hbase,
  HBASE_MANAGES_ZK=false,
  HBASE_CLASSPATH="$HBASE_CLASSPATH:$HADOOP_CONF_DIR",
  HBASE_CONF_DIR="$HBASE_HOME/conf",
  PHOENIX_HOME=/usr/local/bigdata/phoenix,
  PHOENIX_CLASSPATH="$PHOENIX_HOME/lib",
  PHOENIX_LIB_DIR="$PHOENIX_HOME/lib"
```


先設定啟動好Zookeeper之後，就可以設定自動啟動Hadoop

這裡先記錄一下chkconfig設定，第一個數字不知道什麼意思(全部設定-)

第二個是開啟順序，第三個是關閉順序

```
zookeeper - 80 99
hadoop-hdfs-namenode - 81 98
hadoop-hdfs-zkfc - 83 96
hadoop-hdfs-datanode - 82 97
hadoop-yarn-resourcemanager - 84 96
hadoop-yarn-nodemanager - 85 95
hbase-master - 88 93
hbase-regionserver - 89 94
```

``` bash
## 在兩台namenode設定自動啟動namenode
sudo tee /etc/init.d/hadoop-hdfs-namenode << "EOF"
#!/bin/bash
#
# hadoop-hdfs-namenode
# 
# chkconfig: - 81 98
# description: hadoop-hdfs-namenode

# hadoop install path (where you extracted the tarball)
export JAVA_HOME=/usr/java/jdk1.8.0_101
HADOOP_HOME=/usr/local/bigdata/hadoop
source /etc/rc.d/init.d/functions

RETVAL=0
PIDFILE=/var/run/hadoop-hdfs-namenode.pid
desc="hadoop-hdfs-namenode daemon"

start() {
  echo -n $"Starting $desc (hadoop-hdfs-namenode): "
  daemon $HADOOP_HOME/sbin/hadoop-daemon.sh start namenode
  RETVAL=$?
  echo
  [ $RETVAL -eq 0 ] && touch /var/lock/subsys/hadoop-hdfs-namenode
  return $RETVAL
}

stop() {
  echo -n $"Stopping $desc (hadoop-hdfs-namenode): "
  daemon $HADOOP_HOME/sbin/hadoop-daemon.sh stop namenode
  RETVAL=$?
  sleep 5
  echo
  [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/hadoop-hdfs-namenode $PIDFILE
}

restart() {
  stop
  start
}

get_pid() {
  cat "$PIDFILE"
}

checkstatus(){
  status -p $PIDFILE ${JAVA_HOME}/bin/java
  RETVAL=$?
}

condrestart(){
  [ -e /var/lock/subsys/hadoop ] && restart || :
}

case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  status)
    checkstatus
    ;;
  restart)
    restart
    ;;
  condrestart)
    condrestart
    ;;
  *)
    echo $"Usage: $0 {start|stop|status|restart|condrestart}"
    exit 1
esac

exit $RETVAL
EOF

# 然後使用下面指令讓這個script能夠自動跑：
sudo chmod +x /etc/init.d/hadoop-hdfs-namenode
sudo chkconfig --add hadoop-hdfs-namenode
sudo service hadoop-hdfs-namenode start

## 在兩台namenode設定自動啟動zkfc
sudo tee /etc/init.d/hadoop-hdfs-zkfc << "EOF"
#!/bin/bash
#
# hadoop-hdfs-zkfc
# 
# chkconfig: - 83 96
# description: hadoop-hdfs-zkfc

# hadoop install path (where you extracted the tarball)
export JAVA_HOME=/usr/java/jdk1.8.0_101
HADOOP_HOME=/usr/local/bigdata/hadoop

source /etc/rc.d/init.d/functions

RETVAL=0
PIDFILE=/var/run/hadoop-hdfs-zkfc.pid
desc="hadoop-hdfs-zkfc daemon"

start() {
  echo -n $"Starting $desc (hadoop-hdfs-zkfc): "
  daemon $HADOOP_HOME/sbin/hadoop-daemon.sh start zkfc
  RETVAL=$?
  echo
  [ $RETVAL -eq 0 ] && touch /var/lock/subsys/hadoop-hdfs-zkfc
  return $RETVAL
}

stop() {
  echo -n $"Stopping $desc (hadoop-hdfs-zkfc): "
  daemon $HADOOP_HOME/sbin/hadoop-daemon.sh stop zkfc
  RETVAL=$?
  sleep 5
  echo
  [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/hadoop-hdfs-zkfc $PIDFILE
}

restart() {
  stop
  start
}

get_pid() {
  cat "$PIDFILE"
}

checkstatus(){
  status -p $PIDFILE ${JAVA_HOME}/bin/java
  RETVAL=$?
}

condrestart(){
  [ -e /var/lock/subsys/hadoop ] && restart || :
}

case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  status)
    checkstatus
    ;;
  restart)
    restart
    ;;
  condrestart)
    condrestart
    ;;
  *)
    echo $"Usage: $0 {start|stop|status|restart|condrestart}"
    exit 1
esac

exit $RETVAL
EOF

# 然後使用下面指令讓這個script能夠自動跑：
sudo chmod +x /etc/init.d/hadoop-hdfs-zkfc
sudo chkconfig --add hadoop-hdfs-zkfc
sudo service hadoop-hdfs-zkfc start

## 在datanode上設定自動啟動datanode
sudo tee /etc/init.d/hadoop-hdfs-datanode << "EOF"
#!/bin/bash
#
# hadoop-hdfs-datanode
# 
# chkconfig: - 82 97
# description: hadoop-hdfs-datanode

# hadoop install path (where you extracted the tarball)
export JAVA_HOME=/usr/java/jdk1.8.0_101
HADOOP_HOME=/usr/local/bigdata/hadoop

source /etc/rc.d/init.d/functions

RETVAL=0
PIDFILE=/var/run/hadoop-hdfs-datanode.pid
desc="hadoop-hdfs-datanode daemon"

start() {
  echo -n $"Starting $desc (hadoop-hdfs-datanode): "
  daemon $HADOOP_HOME/sbin/hadoop-daemon.sh start datanode
  RETVAL=$?
  echo
  [ $RETVAL -eq 0 ] && touch /var/lock/subsys/hadoop-hdfs-datanode
  return $RETVAL
}

stop() {
  echo -n $"Stopping $desc (hadoop-hdfs-datanode): "
  daemon $HADOOP_HOME/sbin/hadoop-daemon.sh stop datanode
  RETVAL=$?
  sleep 5
  echo
  [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/hadoop-hdfs-datanode $PIDFILE
}

restart() {
  stop
  start
}

get_pid() {
  cat "$PIDFILE"
}

checkstatus(){
  status -p $PIDFILE ${JAVA_HOME}/bin/java
  RETVAL=$?
}

condrestart(){
  [ -e /var/lock/subsys/hadoop ] && restart || :
}

case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  status)
    checkstatus
    ;;
  restart)
    restart
    ;;
  condrestart)
    condrestart
    ;;
  *)
    echo $"Usage: $0 {start|stop|status|restart|condrestart}"
    exit 1
esac

exit $RETVAL
EOF

# 然後使用下面指令讓這個script能夠自動跑：
sudo chmod +x /etc/init.d/hadoop-hdfs-datanode
sudo chkconfig --add hadoop-hdfs-datanode
sudo service hadoop-hdfs-datanode start

## 在兩台namenode上設定自動啟動yarn resourcemanager
sudo tee /etc/init.d/hadoop-yarn-resourcemanager << "EOF"
#!/bin/bash
#
# hadoop-yarn-resourcemanager
# 
# chkconfig: - 84 96
# description: hadoop-yarn-resourcemanager

# hadoop install path (where you extracted the tarball)
export JAVA_HOME=/usr/java/jdk1.8.0_101
HADOOP_HOME=/usr/local/bigdata/hadoop

source /etc/rc.d/init.d/functions

RETVAL=0
PIDFILE=/var/run/hadoop-yarn-resourcemanager.pid
desc="hadoop-yarn-resourcemanager daemon"

start() {
  echo -n $"Starting $desc (hadoop-yarn-resourcemanager): "
  daemon $HADOOP_HOME/sbin/yarn-daemon.sh start resourcemanager
  RETVAL=$?
  echo
  [ $RETVAL -eq 0 ] && touch /var/lock/subsys/hadoop-yarn-resourcemanager
  return $RETVAL
}

stop() {
  echo -n $"Stopping $desc (hadoop-yarn-resourcemanager): "
  daemon $HADOOP_HOME/sbin/yarn-daemon.sh stop resourcemanager
  RETVAL=$?
  sleep 5
  echo
  [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/hadoop-yarn-resourcemanager $PIDFILE
}

restart() {
  stop
  start
}

get_pid() {
  cat "$PIDFILE"
}

checkstatus(){
  status -p $PIDFILE ${JAVA_HOME}/bin/java
  RETVAL=$?
}

condrestart(){
  [ -e /var/lock/subsys/hadoop ] && restart || :
}

case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  status)
    checkstatus
    ;;
  restart)
    restart
    ;;
  condrestart)
    condrestart
    ;;
  *)
    echo $"Usage: $0 {start|stop|status|restart|condrestart}"
    exit 1
esac

exit $RETVAL
EOF

# 然後使用下面指令讓這個script能夠自動跑：
sudo chmod +x /etc/init.d/hadoop-yarn-resourcemanager
sudo chkconfig --add hadoop-yarn-resourcemanager
sudo service hadoop-yarn-resourcemanager start

## 在datanode上設定自動啟動nodemanager
sudo tee /etc/init.d/hadoop-yarn-nodemanager << "EOF"
#!/bin/bash
#
# hadoop-yarn-nodemanager
# 
# chkconfig: - 85 95
# description: hadoop-yarn-nodemanager

# hadoop install path (where you extracted the tarball)
export JAVA_HOME=/usr/java/jdk1.8.0_101
HADOOP_HOME=/usr/local/bigdata/hadoop

source /etc/rc.d/init.d/functions

RETVAL=0
PIDFILE=/var/run/hadoop-yarn-nodemanager.pid
desc="hadoop-yarn-nodemanager daemon"

start() {
  echo -n $"Starting $desc (hadoop-yarn-nodemanager): "
  daemon $HADOOP_HOME/sbin/yarn-daemon.sh start nodemanager
  RETVAL=$?
  echo
  [ $RETVAL -eq 0 ] && touch /var/lock/subsys/hadoop-yarn-nodemanager
  return $RETVAL
}

stop() {
  echo -n $"Stopping $desc (hadoop-yarn-nodemanager): "
  daemon $HADOOP_HOME/sbin/yarn-daemon.sh stop nodemanager
  RETVAL=$?
  sleep 5
  echo
  [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/hadoop-yarn-nodemanager $PIDFILE
}

restart() {
  stop
  start
}

get_pid() {
  cat "$PIDFILE"
}

checkstatus(){
  status -p $PIDFILE ${JAVA_HOME}/bin/java
  RETVAL=$?
}

condrestart(){
  [ -e /var/lock/subsys/hadoop ] && restart || :
}

case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  status)
    checkstatus
    ;;
  restart)
    restart
    ;;
  condrestart)
    condrestart
    ;;
  *)
    echo $"Usage: $0 {start|stop|status|restart|condrestart}"
    exit 1
esac

exit $RETVAL
EOF

# 然後使用下面指令讓這個script能夠自動跑：
sudo chmod +x /etc/init.d/hadoop-yarn-nodemanager
sudo chkconfig --add hadoop-yarn-nodemanager
sudo service hadoop-yarn-nodemanager start
```

用`hbase shell`可以開啟hbase的互動式指令介面，其訊息會是這樣(基本上跟沒有用HA長一樣)：

```
SLF4J: Class path contains multiple SLF4J bindings.
SLF4J: Found binding in [jar:file:/usr/local/bigdata/hbase/lib/slf4j-log4j12-1.7.5.jar!/org/slf4j/impl/StaticLoggerBinder.class]
SLF4J: Found binding in [jar:file:/usr/local/bigdata/hadoop/share/hadoop/common/lib/slf4j-log4j12-1.7.10.jar!/org/slf4j/impl/StaticLoggerBinder.class]
SLF4J: See http://www.slf4j.org/codes.html#multiple_bindings for an explanation.
SLF4J: Actual binding is of type [org.slf4j.impl.Log4jLoggerFactory]
HBase Shell; enter 'help<RETURN>' for list of supported commands.
Type "exit<RETURN>" to leave the HBase Shell
Version 1.2.2, r3f671c1ead70d249ea4598f1bbcc5151322b3a13, Fri Jul  1 08:28:55 CDT 2016

hbase(main):001:0>
```

再來是自動啟動HBase服務：

``` bash
# 三台都配置hbase-master
sudo tee /etc/init.d/hbase-master << "EOF"
#!/bin/bash
#
# hbase-master
# 
# chkconfig: - 99 80
# description: hbase-master

# hbase install path (where you extracted the tarball)
export JAVA_HOME=/usr/java/jdk1.8.0_101
export HBASE_MANAGES_ZK=false
export HADOOP_HOME=/usr/local/bigdata/hadoop
HBASE_HOME=/usr/local/bigdata/hbase

source /etc/rc.d/init.d/functions

RETVAL=0
PIDFILE=/var/run/hbase-master.pid
desc="hbase-master daemon"

start() {
  echo -n $"Starting $desc (hbase-master): "
  daemon $HBASE_HOME/bin/hbase-daemon.sh start master
  RETVAL=$?
  echo
  [ $RETVAL -eq 0 ] && touch /var/lock/subsys/hbase-master
  return $RETVAL
}

stop() {
  echo -n $"Stopping $desc (hbase-master): "
  daemon $HBASE_HOME/bin/hbase-daemon.sh stop master
  RETVAL=$?
  sleep 5
  echo
  [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/hbase-master $PIDFILE
}

restart() {
  stop
  start
}

get_pid() {
  cat "$PIDFILE"
}

checkstatus(){
  status -p $PIDFILE ${JAVA_HOME}/bin/java
  RETVAL=$?
}

condrestart(){
  [ -e /var/lock/subsys/hadoop ] && restart || :
}

case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  status)
    checkstatus
    ;;
  restart)
    restart
    ;;
  condrestart)
    condrestart
    ;;
  *)
    echo $"Usage: $0 {start|stop|status|restart|condrestart}"
    exit 1
esac

exit $RETVAL
EOF

# 然後使用下面指令讓這個script能夠自動跑：
sudo chmod +x /etc/init.d/hbase-master
sudo chkconfig --add hbase-master
sudo service hbase-master start

# 三台都配置regionservers
sudo tee /etc/init.d/hbase-regionserver << "EOF"
#!/bin/bash
#
# hbase-regionserver
# 
# chkconfig: - 99 80
# description: hbase-regionserver

# hbase install path (where you extracted the tarball)
export JAVA_HOME=/usr/java/jdk1.8.0_101
export HBASE_MANAGES_ZK=false
export HADOOP_HOME=/usr/local/bigdata/hadoop
HBASE_HOME=/usr/local/bigdata/hbase

source /etc/rc.d/init.d/functions

RETVAL=0
PIDFILE=/var/run/hbase-regionserver.pid
desc="hbase-regionserver daemon"

start() {
  echo -n $"Starting $desc (hbase-regionserver): "
  daemon $HBASE_HOME/bin/hbase-daemon.sh start regionserver
  RETVAL=$?
  echo
  [ $RETVAL -eq 0 ] && touch /var/lock/subsys/hbase-regionserver
  return $RETVAL
}

stop() {
  echo -n $"Stopping $desc (hbase-regionserver): "
  daemon $HBASE_HOME/bin/hbase-daemon.sh stop regionserver
  RETVAL=$?
  sleep 5
  echo
  [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/hbase-regionserver $PIDFILE
}

restart() {
  stop
  start
}

get_pid() {
  cat "$PIDFILE"
}

checkstatus(){
  status -p $PIDFILE ${JAVA_HOME}/bin/java
  RETVAL=$?
}

condrestart(){
  [ -e /var/lock/subsys/hadoop ] && restart || :
}

case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  status)
    checkstatus
    ;;
  restart)
    restart
    ;;
  condrestart)
    condrestart
    ;;
  *)
    echo $"Usage: $0 {start|stop|status|restart|condrestart}"
    exit 1
esac

exit $RETVAL
EOF

# 然後使用下面指令讓這個script能夠自動跑：
sudo chmod +x /etc/init.d/hbase-regionserver
sudo chkconfig --add hbase-regionserver
sudo service hbase-regionserver start
``` 

最後是自動啟動Phoenix的queryserver

``` bash
sudo tee /etc/init.d/phonixqueryserver << "EOF"
#!/bin/bash
#
# phonixqueryserver
# 
# chkconfig: 2345 89 9 
# description: phonixqueryserver

# hbase install path (where you extracted the tarball)
PHOENIX_HOME=/usr/local/bigdata/phoenix

source /etc/rc.d/init.d/functions

RETVAL=0
PIDFILE=/var/run/phonixqueryserver.pid
desc="phonix query server daemon"

start() {
  echo -n $"Starting $desc (phonixqueryserver): "
  daemon $PHOENIX_HOME/bin/queryserver.py start
  RETVAL=$?
  echo
  [ $RETVAL -eq 0 ] && touch /var/lock/subsys/phonixqueryserver
  return $RETVAL
}

stop() {
  echo -n $"Stopping $desc (phonixqueryserver): "
  daemon $PHOENIX_HOME/bin/queryserver.py stop
  RETVAL=$?
  sleep 5
  echo
  [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/phonixqueryserver $PIDFILE
}

restart() {
  stop
  start
}

get_pid() {
  cat "$PIDFILE"
}

checkstatus(){
  status -p $PIDFILE ${JAVA_HOME}/bin/java
  RETVAL=$?
}

condrestart(){
  [ -e /var/lock/subsys/hadoop ] && restart || :
}

case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  status)
    checkstatus
    ;;
  restart)
    restart
    ;;
  condrestart)
    condrestart
    ;;
  *)
    echo $"Usage: $0 {start|stop|status|restart|condrestart}"
    exit 1
esac

exit $RETVAL
EOF

# 然後使用下面指令讓這個script能夠自動跑：
sudo chmod +x /etc/init.d/phonixqueryserver
sudo chkconfig --add phonixqueryserver
sudo service phonixqueryserver start
``` 

5. 測試

用網頁連到cassSpark1:50070跟cassSpark2:50070

cassSpark1:50070應該會顯示是active node

cassSpark2:50070則會顯示是standby node

(根據啟動順序不同，active的node不一定就是cassSpark1)

在active node上，輸入`sudo service hadoop-hdfs-namenode stop`停掉Hadoop namenode試試看

等一下下，就可以看到cassSpark2:50070會變成active node，這樣hadoop的HA就完成了

然後在datanode分頁可以看到啟動的datanode

而YARN就連到8081，HBase則是16010，用一樣方式都可以測試到HA是否有成功

至於zookeeper, hadoop其他測試就看我之前發的那篇文章即可[點這](http://chingchuan-chen.github.io/hadoop/2016/07/23/deployment-spark-phoenix-hbase-yarn-zookeeper-hadoop.html)就好

備註：版本記得改成這裡的2.7.3即可，一定要測試，不然後面出問題很難抓

而且記得要重開，看看是否全部服務都如同預期一樣啟動了

Reference:

1. http://debugo.com/yarn-rm-ha/
2. http://www.cnblogs.com/junrong624/p/3580477.html
3. http://www.cnblogs.com/captainlucky/p/4710642.html
4. https://phoenix.apache.org/server.html

