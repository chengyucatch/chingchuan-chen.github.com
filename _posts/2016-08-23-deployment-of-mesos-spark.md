---
layout: post
cTitle: "部署Spark on Mesos and Cassandra環境"
title: "deployment of Spark on Mesos and Cassandra"
category: Spark
tagline:
tags: [Spark, Mesos]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %} 

(undone)

本篇主要在部署spark on mesos的環境

目標是Spark跟Mesos的master配上兩台Mesos standby(同時為Zookeeper)

以及兩台Mesos slave with Spark的環境 (共五台)

mesos-01為Mesos master跟Spark master，mesos-02以及mesos-03為mesos standby

mesos-04以及mesos-05為Mesos slaves跟Spark slaves

<!-- more -->

1. 準備工作
  這裡基本上跟[前篇](http://chingchuan-chen.github.io/cassandra/2016/08/05/deployment-of-spark-based-on-cassandra.html)一樣，就不贅述了

2. 開始部署

i. 下載檔案並移到適當位置

{% highlight bash %}
# 建立放置資料夾
sudo mkdir /usr/local/bigdata
sudo chown -R tester /usr/local/bigdata

# 下載並安裝java
curl -v -j -k -L -H "Cookie: oraclelicense=accept-securebackup-cookie" http://download.oracle.com/otn-pub/java/jdk/8u101-b13/jdk-8u101-linux-x64.rpm -o jdk-8u101-linux-x64.rpm
sudo yum install -y jdk-8u101-linux-x64.rpm
# 下載並部署Hadoop
curl -v -j -k -L http://apache.stu.edu.tw/hadoop/common/hadoop-2.6.4/hadoop-2.6.4.tar.gz -o hadoop-2.6.4.tar.gz
tar -zxvf hadoop-2.6.4.tar.gz
sudo mv hadoop-2.6.4 /usr/local/bigdata/hadoop
sudo chown -R tester /usr/local/bigdata/hadoop
# 下載並部署zookeeper
curl -v -j -k -L http://apache.stu.edu.tw/zookeeper/zookeeper-3.4.8/zookeeper-3.4.8.tar.gz -o zookeeper-3.4.8.tar.gz
tar -zxvf zookeeper-3.4.8.tar.gz
sudo mv zookeeper-3.4.8 /usr/local/bigdata/zookeeper
sudo chown -R tester /usr/local/bigdata/zookeeper
# 下載並部署mesos
curl -v -j -k -L http://repos.mesosphere.com/el/7/x86_64/RPMS/mesos-1.0.0-2.0.89.centos701406.x86_64.rpm -o mesos-1.0.0-2.0.89.centos701406.x86_64.rpm
sudo yum install -y mesos-1.0.0-2.0.89.centos701406.x86_64.rpm
# 下載並部署scala
curl -v -j -k -L http://downloads.lightbend.com/scala/2.11.8/scala-2.11.8.tgz -o scala-2.11.8.tgz
tar -zxvf scala-2.11.8.tgz
mv scala-2.11.8 /usr/local/bigdata/scala
# 下載並部署spark
curl -v -j -k -L http://d3kbcqa49mib13.cloudfront.net/spark-2.0.0-bin-hadoop2.6.tgz -o spark-2.0.0-bin-hadoop2.6.tgz
tar -zxvf spark-2.0.0-bin-hadoop2.6.tgz
mv spark-2.0.0-bin-hadoop2.6 /usr/local/bigdata/spark
# 下載並部署cassandra
curl -v -j -k -L http://apache.stu.edu.tw/cassandra/2.2.7/apache-cassandra-2.2.7-bin.tar.gz -o apache-cassandra-2.2.7-bin.tar.gz
tar -zxvf apache-cassandra-2.2.7-bin.tar.gz
mv apache-cassandra-2.2.7 /usr/local/bigdata/cassandra
{% endhighlight %}

ii. 環境變數設置

{% highlight bash %}
sudo tee -a /etc/bashrc << "EOF"
# JAVA
export JAVA_HOME=/usr/java/jdk1.8.0_101
# ZOOKEEPER
export ZOOKEEPER_HOME=/usr/local/bigdata/zookeeper
# SCALA
export SCALA_HOME=/usr/local/bigdata/scala
# SPARK
export SPARK_HOME=/usr/local/bigdata/spark
# CASSANDRA
export CASSANDRA_HOME=/usr/local/bigdata/cassandra
# PATH
export PATH=$PATH:$JAVA_HOME:$ZOOKEEPER_HOME/bin:$SPARK_HOME/bin:$CASSANDRA_HOME/bin
{% endhighlight %}

iv. 配置Zookeeper
先用`cp $ZOOKEEPER_HOME/conf/zoo_sample.cfg $ZOOKEEPER_HOME/conf/zoo.cfg`，然後用`vi $ZOOKEEPER_HOME/conf/zoo.cfg`編輯，改成下面這樣：

{% highlight bash %}
dataDir=/usr/local/bigdata/zookeeper/data
server.1=cassSpark1:2888:3888
server.2=cassSpark2:2888:3888
server.3=cassSpark3:2888:3888
{% endhighlight %}

接著創立需要的資料夾，並新增檔案
{% highlight bash %}
mkdir $ZOOKEEPER_HOME/data
tee $ZOOKEEPER_HOME/data/myid << "EOF"
1
EOF
{% endhighlight %}

在mesos-02跟mesos-03分別設定為2跟3。

啟動zookeeper: 

{% highlight bash %}
# 啟動zookeeper server
zkServer.sh start
ssh tester@cassSpark2 "zkServer.sh start"
ssh tester@cassSpark3 "zkServer.sh start"
{% endhighlight %}

再來是測試看看是否有部署成功，先輸入`zkCli.sh -server cassSpark1:2181,cassSpark2:2181,cassSpark3:2181`可以登錄到zookeeper的server上，如果是正常運作會看到下面的訊息：

{% highlight bash %}
[zk: cassSpark1:2181,cassSpark2:2181,cassSpark3:2181(CONNECTED) 0]
{% endhighlight %}

此時試著輸入看看`create /test01 abcd`，然後輸入`ls /`看看是否會出現`[test01, zookeeper]`

如果是，zookeeper就是設定成功，如果中間有出現任何錯誤，則否

最後用`delete /test01`做刪除即可，然後用`quit`離開。


最後是設定開機自動啟動zookeeper server(用`sudo vi /etc/init.d/zookeeper`去create):

{% highlight bash %}
#!/bin/bash
#
# ZooKeeper
# 
# chkconfig: 2345 89 9 
# description: zookeeper

# ZooKeeper install path (where you extracted the tarball)
ZOOKEEPER=/usr/local/bigdata/zookeeper

source /etc/rc.d/init.d/functions
source $ZOOKEEPER/bin/zkEnv.sh

RETVAL=0
PIDFILE=/var/lib/zookeeper/data/zookeeper_server.pid
desc="ZooKeeper daemon"

start() {
  echo -n $"Starting $desc (zookeeper): "
  daemon $ZOOKEEPER/bin/zkServer.sh start
  RETVAL=$?
  echo
  [ $RETVAL -eq 0 ] && touch /var/lock/subsys/zookeeper
  return $RETVAL
}

stop() {
  echo -n $"Stopping $desc (zookeeper): "
  daemon $ZOOKEEPER/bin/zkServer.sh stop
  RETVAL=$?
  sleep 5
  echo
  [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/zookeeper $PIDFILE
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
  [ -e /var/lock/subsys/zookeeper ] && restart || :
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
{% endhighlight %}

然後使用下面指令讓這個script能夠自動跑：

``` bash 
sudo chmod +x /etc/init.d/zookeeper
sudo chkconfig --add zookeeper
sudo service zookeeper start
```

v. 配置mesos

{% highlight bash %}


# 設定masters
sudo tee /usr/etc/mesos/masters << "EOF"
mesos-01 192.168.0.121
mesos-02 192.168.0.122
mesos-03 192.168.0.123
EOF

# 設定slaves
sudo tee /usr/etc/mesos/slaves << "EOF"
mesos-04 192.168.0.124
mesos-05 192.168.0.125
EOF

# 設定master-env
sudo cp /usr/etc/mesos/mesos-master-env.sh.template /usr/etc/mesos/mesos-master-env.sh
sudo tee -a /usr/etc/mesos/mesos-slave-env.sh << "EOF"
export MESOS_log_dir=/home/*/disk/mesos/master/log
export MESOS_work_dir=/home/*/disk/mesos/master/work
export MESOS_ZK=zk://192.168.0.121:2181,192.168.0.122:2181,192.168.0.123:2181/mesos
export MESOS_quorum=2
EOF

# 設定slave-env
sudo cp /usr/etc/mesos/mesos-slave-env.sh.template /usr/etc/mesos/mesos-slave-env.sh
sudo tee -a /usr/etc/mesos/mesos-slave-env.sh << "EOF"
export MESOS_log_dir=/home/zhy/disk/mesos/slave/log
export MESOS_work_dir=/home/zhy/disk/mesos/slave/work
export MESOS_isolation=cgroups
EOF

# 修改zookeeper
sudo tee /etc/mesos/zk << "EOF"
zk://192.168.0.121:2181,192.168.0.122:2181,192.168.0.123:2181/mesos
EOF
# 配置quorum
sudo tee /etc/mesos-master/quorum << "EOF"
2
EOF
# 修改master ip
sudo tee /etc/mesos-master/ip 
192.168.0.121
EOF
# 修改master hostname
sudo tee /etc/mesos-master/hostname << "EOF"
mesos-01
EOF
{% endhighlight %}

mesos-02跟mesos-03分別設定上該台的ip跟hostname

然後slave部分則是在`/etc/mesos-slave/ip`跟`/etc/mesos-slave/hostname`設置該台電腦ip跟hostname

mesos-01, mesos-02, mesos-03上：

{% highlight bash %}
# 啟動zookeeper server
zkServer.sh start
ssh tester@cassSpark2 "zkServer.sh start"
ssh tester@cassSpark3 "zkServer.sh start"
# 讓mesos重讀config
initctl reload-configuration
# 啟動mesos
service mesos-master start
service mesos-slave start
{% endhighlight %}

mesos-04, mesos-05上：
{% highlight bash %}
sudo start mesos-slave
{% endhighlight %}


iii. 配置scala and spark
      
{% highlight bash %}
tee $SPARK_HOME/conf/slaves << "EOF"
mesos-04
mesos-05
EOF

# 複製檔案
cp $SPARK_HOME/conf/spark-env.sh.template $SPARK_HOME/conf/spark-env.sh
cp $SPARK_HOME/conf/log4j.properties.template $SPARK_HOME/conf/log4j.properties
cp $SPARK_HOME/conf/spark-defaults.conf.template $SPARK_HOME/conf/spark-defaults.conf

# 傳入設定
tee -a $SPARK_HOME/conf/spark-env.sh << "EOF"
SPARK_MASTER_IP=mesos-01
SPARK_LOCAL_DIRS=/usr/local/bigdata/spark
MESOS_NATIVE_LIBRARY=/usr/local/lib/libmesos.so
EOF

# install sbt and git 
sudo yum install sbt git-core

# clone spark-cassandra-connector
git clone git@github.com:datastax/spark-cassandra-connector.git

# compile assembly jar
cd spark-cassandra-connector
rm -r spark-cassandra-connector-perf
sbt -Dscala-2.11=true assembly

# copy jar to spark
mkdir $SPARK_HOME/extraClass
cp spark-cassandra-connector/target/scala-2.11/spark-cassandra-connector-assembly-2.0.0-M1-2-g70018a6.jar $SPARK_HOME/extraClass

tee -a $SPARK_HOME/conf/spark-defaults.conf << "EOF"
spark.driver.extraClassPath /usr/local/bigdata/spark/extraClass/spark-cassandra-connector-assembly-2.0.0-M1.jar
spark.driver.extraLibraryPath /usr/local/bigdata/spark/extraClass
spark.executor.extraClassPath /usr/local/bigdata/spark/extraClass/spark-cassandra-connector-assembly-2.0.0-M1.jar
spark.executor.extraLibraryPath /usr/local/bigdata/spark/extraClass
spark.jars /usr/local/bigdata/spark/extraClass/spark-cassandra-connector-assembly-2.0.0-M1.jar
spark.scheduler.mode FAIR
spark.deploy.defaultCores 2
spark.cores.max 2
spark.driver.memory 2g
spark.executor.memory 2g
EOF
{% endhighlight %}

slaves的部署、cassandra的設置跟自動啟動部分就都一樣，此處也跳過，直接進測試

3. 安裝

  