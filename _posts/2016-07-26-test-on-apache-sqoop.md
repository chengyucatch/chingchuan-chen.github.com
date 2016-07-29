---
layout: post
cTitle: "test on apache sqoop"
title: "test on apache sqoop"
category: hadoop
tagline:
tags: [hadoop, sqoop]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %} 

前兩篇裝了Hadoop跟Oracle

接下來是安裝sqoop，試試看用sqoop從oracle DB把資料撈進HBase

<!-- more -->

1. 準備工作

基本上同Hadoop那篇，這裡就不贅述

我這裡是直接裝在Hadoop的master (sparkServer0)上

2. 安裝sqoop

從官網上下載下來，然後解壓縮，並加入環境變數：

``` bash
# 下載安裝sqoop
curl -v -j -k -L http://apache.stu.edu.tw/sqoop/1.4.6/sqoop-1.4.6.bin__hadoop-2.0.4-alpha.tar.gz -o sqoop-1.4.6.bin__hadoop-2.0.4-alpha.tar.gz
tar -zxvf sqoop-1.4.6.bin__hadoop-2.0.4-alpha.tar.gz
sudo mv sqoop-1.4.6.bin__hadoop-2.0.4-alpha /usr/local/sqoop
sudo chown -R tester /usr/local/sqoop

# 加入環境變數
sudo tee -a /etc/bashrc << "EOF"
export SQOOP_HOME=/usr/local/sqoop
export PATH=$PATH:$SQOOP_HOME/bin
export ZOOCFGDIR=$ZOOKEEPER_HOME/conf
EOF
source /etc/bashrc
```

3. 加入oracle連線jar

到[oracle官網](http://www.oracle.com/technetwork/apps-tech/jdbc-112010-090769.html)去下載oracle的ojdbc6.jar上傳到tester的home目錄中

執行`mv ~/ojdbc6.jar $SQOOP_HOME/lib`搬去sqoop下的lib

4. 開始執行

```
## 在sparkServer0開啟hadoop
start-dfs.sh & start-yarn.sh & zkServer.sh start & start-hbase.sh
## 把oracleServer開啟，他會自動開啟oracle database1

## 先列出所有的database看看
sqoop list-databases --connect jdbc:oracle:thin:@192.168.0.120:1521:orcl --username system --P
## 出現訊息如下：
# 16/07/29 21:13:11 INFO sqoop.Sqoop: Running Sqoop version: 1.4.6
# Enter password:
# 16/07/29 21:13:14 INFO oracle.OraOopManagerFactory: Data Connector for Oracle and Hadoop is disabled.
# 16/07/29 21:13:14 INFO manager.SqlManager: Using default fetchSize of 1000
# SLF4J: Class path contains multiple SLF4J bindings.
# SLF4J: Found binding in [jar:file:/usr/local/hadoop/share/hadoop/common/lib/slf4j-log4j12-1.7.5.jar!/org/slf4j/impl/StaticLoggerBinder.class]
# SLF4J: Found binding in [jar:file:/usr/local/hbase/lib/slf4j-log4j12-1.7.5.jar!/org/slf4j/impl/StaticLoggerBinder.class]
# SLF4J: See http://www.slf4j.org/codes.html#multiple_bindings for an explanation.
# SLF4J: Actual binding is of type [org.slf4j.impl.Log4jLoggerFactory]
# 16/07/29 21:13:52 INFO manager.OracleManager: Time zone has been set to GMT
# ORACLE_OCM
# OJVMSYS
# SYSKM
# XS$NULL
# GSMCATUSER
# MDDATA
# SYSBACKUP
# DIP
# SYSDG
# APEX_PUBLIC_USER
# SPATIAL_CSW_ADMIN_USR
# SPATIAL_WFS_ADMIN_USR
# GSMUSER
# AUDSYS
# FLOWS_FILES
# DVF
# MDSYS
# ORDSYS
# DBSNMP
# WMSYS
# APEX_040200
# APPQOSSYS
# GSMADMIN_INTERNAL
# ORDDATA
# CTXSYS
# ANONYMOUS
# XDB
# ORDPLUGINS
# DVSYS
# SI_INFORMTN_SCHEMA
# OLAPSYS
# LBACSYS
# OUTLN
# SYSTEM
# SYS

## 再來測試看看拉oracle中的表格 all_tables
sqoop import \
--connect jdbc:oracle:thin:@192.168.0.120:1521:orcl \
--username system --password qscf12356 \
--table all_tables \
--hbase-row-key id --hbase-table all_tables --hbase-create-table \
--split-by OWNER -m 10 --column-family OWNER,TABLE_NAME

## 結果訊息如下：



export CONDITIONS=OWNER=\'SYS\'
sqoop import \
--connect jdbc:oracle:thin:@192.168.0.120:1521:orcl \
--username system --password qscf12356 \
--query "SELECT OWNER,TABLE_NAME FROM SYSMAN.TESTDATASET WHERE 1=1 AND \$CONDITIONS" \
--hbase-table TESTDATASET --hbase-create-table \
--hbase-row-key id \
--split-by OWNER -m 10 --column-family OWNER,TABLE_NAME



```

待續

