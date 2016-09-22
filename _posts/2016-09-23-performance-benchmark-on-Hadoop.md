---
layout: post
cTitle: "Performnace benchmark on SQL on Hadoop"
title: "Performnace benchmark on SQL on Hadoop"
category: hadoop
tagline:
tags: [hadoop,hbase,hive,drill,spark]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %} 

就我手上現有的SQL on Hadoop工具

我做了一個簡單的benchmark去看效能

資料量不大，一個998177列、11欄的數據

(1欄字串、2欄double、7欄整數、一欄邏輯值)

存成json檔案(178MB), csv檔案(63MB)放置於hdfs

我們分別用HBase, Hive, Spark SQL, Drill去測試幾個簡單case

<!-- more -->

配備：

VM: 2-core with 4G ram x 3

版本：

|      | Hadoop | HBase | Hive  | Drill | Spark |
|------|--------|-------|-------|-------|-------|
| 版本 | 2.7.3  | 1.2.2 | 2.1.0 | 1.8.0 | 2.0.0 |

設備疲乏，可能只能給出一個簡單的比較

如果有更多機器，當然希望可以給出更多的比較

Hive可以使用mapreduce, tez或是Spark，儲存媒介也可以選hdfs或是hbase

但是這裡沒想測試那麼多，所以只測試mapreduce + hdfs的模式

而Spark就直接用Hive上的資料做Spark SQL

至於Drill則分別使用hdfs的json, csv檔案，以及透過HBase, Hive等方式去做


先稍微看一下資料：

``` bash
head tw5_df.csv
# nfbVD-5S-9.063,30,2015,1,1,0,0,5,TRUE,row1
# nfbVD-5N-9.013,11,2015,1,1,0,0,5,TRUE,row2
# nfbVD-5S-9.063,30,2015,1,1,0,1,5,TRUE,row3
# nfbVD-5N-9.013,11,2015,1,1,0,1,5,TRUE,row4
# nfbVD-5S-9.063,18,2015,1,1,0,2,5,TRUE,row5
# nfbVD-5N-9.013,5,2015,1,1,0,2,5,TRUE,row6
# nfbVD-5S-9.063,24,2015,1,1,0,3,5,TRUE,row7
# nfbVD-5N-9.013,6,2015,1,1,0,3,5,TRUE,row8
# nfbVD-5S-9.063,24,2015,1,1,0,4,5,TRUE,row9
# nfbVD-5N-9.013,6,2015,1,1,0,4,5,TRUE,row10

head tw5_df_hbase.csv
# nfbVD-5S-9.063,30,2015,1,1,0,0,5,TRUE,row0000001
# nfbVD-5N-9.013,11,2015,1,1,0,0,5,TRUE,row0000002
# nfbVD-5S-9.063,30,2015,1,1,0,1,5,TRUE,row0000003
# nfbVD-5N-9.013,11,2015,1,1,0,1,5,TRUE,row0000004
# nfbVD-5S-9.063,18,2015,1,1,0,2,5,TRUE,row0000005
# nfbVD-5N-9.013,5,2015,1,1,0,2,5,TRUE,row0000006
# nfbVD-5S-9.063,24,2015,1,1,0,3,5,TRUE,row0000007
# nfbVD-5N-9.013,6,2015,1,1,0,3,5,TRUE,row0000008
# nfbVD-5S-9.063,24,2015,1,1,0,4,5,TRUE,row0000009
# nfbVD-5N-9.013,6,2015,1,1,0,4,5,TRUE,row0000010

head tw5_df.json
# [
# {"vdid":"nfbVD-5S-9.063","volume":30,"date_year":2015,"date_month":1,"date_day":1,"time_hour":0,"time_minute":0,
# "weekday":5,"holiday":true,"speed":"84.26666667","laneoccupy":"12.13333333"},
# {"vdid":"nfbVD-5N-9.013","volume":11,"date_year":2015,"date_month":1,"date_day":1,"time_hour":0,"time_minute":0,
# "weekday":5,"holiday":true,"speed":"87.36363636","laneoccupy":"4.00000000"},
# {"vdid":"nfbVD-5S-9.063","volume":30,"date_year":2015,"date_month":1,"date_day":1,"time_hour":0,"time_minute":1,
# "weekday":5,"holiday":true,"speed":"84.26666667","laneoccupy":"12.13333333"},
# {"vdid":"nfbVD-5N-9.013","volume":11,"date_year":2015,"date_month":1,"date_day":1,"time_hour":0,"time_minute":1,
# "weekday":5,"holiday":true,"speed":"87.36363636","laneoccupy":"4.00000000"},
# {"vdid":"nfbVD-5S-9.063","volume":18,"date_year":2015,"date_month":1,"date_day":1,"time_hour":0,"time_minute":2,

# 放到hdfs上
hdfs dfs -mkdir /drill
hdfs dfs -put tw5_df.csv /drill/tw5_df.csv
hdfs dfs -put tw5_df.csv /drill/tw5_df_hive.csv
hdfs dfs -put tw5_df_hbase.csv /drill/tw5_df_hbase.csv
hdfs dfs -put tw5_df.json /drill/tw5_df.json
```


HBase使用hbase shell，然後用下面的script去input資料以及做query：

`hbase shell >`是打開hbase shell跑的意思，不然請在console跑

``` bash
## hbase shell > create 'vddata','vdid','vd_info','datetime'
hbase org.apache.hadoop.hbase.mapreduce.ImportTsv -Dimporttsv.columns="vdid,vd_info:volume,datetime:year,datetime:month,datetime:day,datetime:hour,datetime:minute,datetime:weekday,datetime:holiday,vd_info:speed,vd_info:laneoccupy,HBASE_ROW_KEY" '-Dimporttsv.separator=,' vddata /drill/tw5_df_hbase.csv

## hbase shell > scan 'vddata', {LIMIT => 1}
# ROW                                          COLUMN+CELL
#  row0000001                                  column=datetime:day, timestamp=1474478950775, value=2015
#  row0000001                                  column=datetime:holiday, timestamp=1474478950775, value=0
#  row0000001                                  column=datetime:hour, timestamp=1474478950775, value=1
#  row0000001                                  column=datetime:minute, timestamp=1474478950775, value=1
#  row0000001                                  column=datetime:month, timestamp=1474478950775, value=30
#  row0000001                                  column=datetime:weekday, timestamp=1474478950775, value=0
#  row0000001                                  column=datetime:year, timestamp=1474478950775, value=1.21333333333333E1
#  row0000001                                  column=vd_info:laneoccupy, timestamp=1474478950775, value=TRUE
#  row0000001                                  column=vd_info:speed, timestamp=1474478950775, value=5
#  row0000001                                  column=vd_info:volume, timestamp=1474478950775, value=8.42666666666667E1
#  row0000001                                  column=vdid:, timestamp=1474478950775, value=nfbVD-5S-9.063
# 1 row(s) in 0.0260 seconds

# 結果發現group by要用JAVA API去寫...就只好放棄了，留給Drill用
```


Hive則用下面的SQL script：

``` SQL
CREATE TABLE vddata (vdid STRING, speed DOUBLE, laneoccupy DOUBLE, volume INT, 
date_year INT, date_month INT, date_day INT, time_hour INT, time_minute INT, 
weekday INT, holiday BOOLEAN)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS TEXTFILE;

LOAD DATA INPATH '/drill/tw5_df_hive.csv'
OVERWRITE INTO TABLE vddata;

select * from vddata limit 5;
# OK
# nfbVD-5S-9.063  30.0    2015    1       1       0       0       5       true
# nfbVD-5N-9.013  11.0    2015    1       1       0       0       5       true
# nfbVD-5S-9.063  30.0    2015    1       1       0       1       5       true
# nfbVD-5N-9.013  11.0    2015    1       1       0       1       5       true
# nfbVD-5S-9.063  18.0    2015    1       1       0       2       5       true
# Time taken: 0.86 seconds, Fetched: 5 row(s)

select count(vdid) from vddata;
# Total MapReduce CPU Time Spent: 4 seconds 590 msec
# OK
# Time taken: 27.214 seconds, Fetched: 1 row(s)

select date_month,count(vdid) from vddata group by date_month;
# Total MapReduce CPU Time Spent: 4 seconds 330 msec
# Time taken: 23.09 seconds, Fetched: 12 row(s)

select date_month,avg(speed),avg(laneoccupy),avg(volume) from vddata group by date_month;
# Total MapReduce CPU Time Spent: 4 seconds 100 msec
# Time taken: 19.655 seconds, Fetched: 12 row(s)

select date_month,date_day,avg(speed),avg(laneoccupy),avg(volume) from vddata group by date_month,date_day;
# Total MapReduce CPU Time Spent: 5 seconds 230 msec
# Time taken: 19.033 seconds, Fetched: 364 row(s)
```


再來是Spark SQL，要用Spark SQL就只能用

``` SQL
import org.apache.spark.sql.SparkSession
import java.util.Calendar._
import java.sql.Timestamp

val spark = SparkSession.builder().appName("spark on hive")
  .config("spark.sql.warehouse.dir", "hdfs://hc1/spark")
  .enableHiveSupport().getOrCreate()
 
val st = getInstance().getTime()
spark.sql("select count(vdid) from vddata").show()
println(getInstance().getTime().getTime() - st.getTime())
# 855 ms

val st = getInstance().getTime()
spark.sql("select date_month,count(vdid) from vddata group by date_month").show()
println(getInstance().getTime().getTime() - st.getTime())
# 1397 ms

val st = getInstance().getTime()
spark.sql("select date_month,avg(speed),avg(laneoccupy),avg(volume) from vddata group by date_month").show()
println(getInstance().getTime().getTime() - st.getTime())
# 1776 ms

val st = getInstance().getTime()
spark.sql("select date_month,date_day,avg(speed),avg(laneoccupy),avg(volume) from vddata group by date_month,date_day").show()
println(getInstance().getTime().getTime() - st.getTime())
# 1485 ms
```

最後是Drill：

```
# on HBase
select count(vdid) from hbase.vddata;
# 1.319s
select vddata.datetime.`month`,count(vddata.vdid) from hbase.vddata group by vddata.datetime.`month`;
# 11.125s	
select vddata.datetime.`month`,avg(vddata.vd_info.volume) from hbase.vddata group by vddata.datetime.`month`;
# datatype error
select datetime.month,date_day,avg(vd_info.speed),avg(vd_info.laneoccupy),avg(vd_info.volume) 
from hbase.vddata group by datetime.month,datetime.day;
# datatype error

# on Hive (with saving format csv)
select count(vdid) from hive_cassSpark1.vddata;
# in time
select date_month,count(vdid) from hive_cassSpark1.vddata group by date_month;
# 2.203s	
select date_month,avg(speed),avg(laneoccupy),avg(volume) from hive_cassSpark1.vddata group by date_month;
# 2.632s
select date_month,date_day,avg(speed),avg(laneoccupy),avg(volume) 
from hive_cassSpark1.vddata group by date_month,date_day;
# 3.167s

# on csv in hdfs
select count(columns[0]) from dfs.`/drill/tw5_df.csv`;
# 1.078s
select columns[5],count(columns[0]) from dfs.`/drill/tw5_df.csv` group by columns[5];
# 2.049s
select columns[5],avg(columns[1]),avg(columns[2]),avg(columns[3]) from dfs.`/drill/tw5_df.csv` group by columns[5];
# datatype error 
select columns[5],columns[6],avg(columns[1]),avg(columns[2]),avg(columns[3]) 
from dfs.`/drill/tw5_df.csv` group by columns[5],columns[6];
# datatype error 

# on json in hdfs
select count(vdid) from dfs.`/drill/tw5_df.json`;
# 2.834s
select date_month,count(vdid) from dfs.`/drill/tw5_df.json` group by date_month;
# 5.778s	
select date_month,avg(speed),avg(laneoccupy),avg(volume) from dfs.`/drill/tw5_df.json` group by date_month;
# datatype error 
select date_month,date_day,avg(speed),avg(laneoccupy),avg(volume) from dfs.`/drill/tw5_df.json` group by date_month,date_day;
# datatype error 
```

datatype error是因為裡面有int, double混在同一列，Drill現在還無法有效處理這種問題

因此，透過hive去做storage會是比較好的選擇


結論，在這樣的資料量(1M x 11)下，其實用Spark SQL綽綽有餘

因為資料就直接可以cache在記憶體之中，沒有用到什麼運算資源

所以如果分析資料量小的話，建議直接使用Spark SQL就好，減少很多麻煩

至於資料量夠大時，大到什麼程度會用其他比較好，待我有空來測試，這篇先到這裡

