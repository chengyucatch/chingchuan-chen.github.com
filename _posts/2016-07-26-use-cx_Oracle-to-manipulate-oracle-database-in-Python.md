---
layout: post
cTitle: "在Python用cx_Oracle去操作Oracle資料庫"
title: "use cx_Oracle to manipulate Oracle database in Python"
category: Oracle
tagline:
tags: [Python, Oracle]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %} 

前一篇用R去操作了Oracle資料庫

結果不幸發現兩件事情：

1. 表的名字會自動有quote，你預期的表明應該是airlines，會變成"airlines"
1. column name也會自動有quote，你預期的表明應該是name，會變成"name"

這一篇實現用Python去操作Oracle資料庫的部分

<!-- more -->

1. 準備工作

基本上同R那篇，這裡不贅述

2. 安裝cx_Oracle

其實跟R那篇一樣，都要安裝Oracle instant client

差別只在python使用`pip install cx_Oracle`去做安裝套件的動作而已

這裡推薦大家直接使用Anaconda，並用`conda install cx_Oracle`去安裝

conda會幫你把Oracle instant client下載好，並放在適當目錄中

3. 使用cx_Oracle去上傳資料

使用的資料都是來自[UC Irvine Machine Learning Repository](http://archive.ics.uci.edu/ml/)

我分別去抓了iris, forest fires, Car Evaluation跟default of credit card clients這四個資料集

放在下方程式目錄下的testData資料夾中

資料都是csv檔案，含有表頭(從UCI下載之後要自己做一點更動)

完整程式如下：

``` python
# -*- coding: utf-8 -*-

import StringIO, csv, cx_Oracle, sys, os, re

#%% functions to read the csv file with auto type convertion
def getFieldnames(csvFile):
    """
    Read the first row and store values in a tuple
    """
    with open(csvFile) as csvfile:
        firstRow = csvfile.readlines(1)
        fieldnames = tuple(firstRow[0].strip('\n').split(","))
    return fieldnames

def readCsvWithTypeConv(csvFile):
    """
    Convert csv rows into an array of dictionaries
    All data types are automatically checked and converted
    """
    from ast import literal_eval
    from itertools import islice
    fieldnames = getFieldnames(csvFile)
    cursor = []  # Placeholder for the dictionaries/documents
    regxpPattern = re.compile('\d+[^.\d]+')    
    with open(csvFile) as csvFile:
        for row in islice(csvFile, 1, None):
            values = row.strip('\n').split(",")
            for i, value in enumerate(values):
                try:
                    if regxpPattern.findall(value) is []:
                        nValue = literal_eval(value)
                        values[i] = nValue
                    else:
                        pass
                except ValueError:
                    pass
            cursor.append(dict(zip(fieldnames, values)))
    return cursor
    
#%% main function    
if __name__ == "__main__":
    # set working directory
    
    # information for connecting to oracle 
    oracleSystemLoginInfo = u'system/qscf12356@192.168.0.120:1521/orcl'
    # create a dict to map the data type of python to the one in Oracle DB
    pthonOracleTypeMap = dict([["str", "VARCHAR(255)"], ["int", "NUMBER"], ["float", "FLOAT"]])
    
    
    # Read list of data table
    tableList = """dataName,path,uploadShema,uploadTblName
iris,testData/iris.csv,datasets_1,iris
forestfires,testData/forestfires.csv,datasets_1,forestfires
car,testData/car.csv,datasets_1,car
credit,testData/credit.csv,datasets_2,credit"""
    
    fid = StringIO.StringIO(tableList)
    reader = csv.reader(fid, delimiter=',')
    dataTableList = list();
    for i,row in enumerate(reader):
        if i > 0:
            dataTableList.append(row)
    
    # create connection
    oracleConn = cx_Oracle.connect(oracleSystemLoginInfo)
    # activate cursor
    oracleCursor = oracleConn.cursor()
    
    # find the all users in oracle
    oracleCursor.execute("SELECT USERNAME FROM all_users")
    orclUserNames = [x[0] for x in oracleCursor.fetchall()]
    uniqueUserNames = list(set([x for x in ['C##' + y[2].upper() for y in dataTableList]]))
    nonexistOrcl = [x not in orclUserNames for x in uniqueUserNames]
    
    # find the all tables in oracle
    oracleCursor.execute('''SELECT t.TABLE_NAME FROM all_tables t 
                            WHERE t.OWNER NOT IN ('SYSTEM', 'SYS', 'MDSYS', 'LBACSYS', 'CTXSYS', 
                              'WMSYS', 'XDB', 'APPQOSSYS', 'ORDSYS', 'OJVMSYS', 'DVSYS')''')
    oracleAllTables = [x[0] for x in oracleCursor.fetchall()]
    
    # if the schema is not existent, then print out the SQL to create
    if any(nonexistOrcl):
        print 'Please create users first with following SQL:'
        for x in uniqueUserNames:
            if nonexistOrcl:
                print '''
                CREATE TABLESPACE userNameVar
                  DATAFILE 'userNameVar.dat'
                  SIZE 40M REUSE AUTOEXTEND ON;
                
                CREATE TEMPORARY TABLESPACE userNameVar_tmp
                  TEMPFILE 'userNameVar_tmp.dbf'
                  SIZE 10M REUSE AUTOEXTEND ON;
                  
                CREATE USER C##userNameVar
                IDENTIFIED BY userNameVar
                DEFAULT TABLESPACE userNameVar
                TEMPORARY TABLESPACE userNameVar_tmp
                quota unlimited on userNameVar;
                
                GRANT CREATE SESSION,
                      CREATE TABLE,
                      CREATE VIEW,
                      CREATE PROCEDURE
                TO C##userNameVar;'''.replace('userNameVar', x)
            sys.exit(0)
    
    # clost the connection to Oracle
    oracleCursor.close()
    oracleConn.close()
    
    for row in dataTableList:
        if os.path.isfile(row[1]):
            # read the data
            dataTable = readCsvWithTypeConv(row[1])
            colNames = [name.replace(' ', '_').upper() for name in dataTable[0].keys()]
            colDataType = [type(r).__name__ for r in dataTable[0].values()]
            oracleType = [pthonOracleTypeMap[dataType] for dataType in colDataType]
    
        orclLogin = oracleSystemLoginInfo.replace('system', 'C##' + row[2].upper())\
          .replace('qscf12356', row[2])
        # create connection
        oracleConn = cx_Oracle.connect(orclLogin)
        # activate cursor
        oracleCursor = oracleConn.cursor()       
        
        # create table
        if row[3].upper() not in oracleAllTables:
            oracleCursor.execute('''CREATE TABLE {}({})'''.format(row[3].upper(), \
                ','.join([x + ' ' + y for (x,y) in zip(colNames, oracleType)])))
        
        # insert data
        oracleCursor.executemany(
            '''INSERT INTO {}({}) values ({})'''.format(row[3], ','.join(colNames), \
                ','.join([':{}'.format(i) for i in range(len(colNames))])), \
                [d.values() for d in dataTable])
        # commit change           
        oracleConn.commit()
        
        # clost the connection to Oracle
        oracleCursor.close()
        oracleConn.close()
```

刪除全部測試資料的程式碼：

``` python
# -*- coding: utf-8 -*-

import StringIO, csv, cx_Oracle
   
if __name__ == "__main__":    
    oracleSystemLoginInfo = u'system/qscf12356@192.168.0.120:1521/orcl'
    
    # Read list of data table
    tableList = """dataName,path,uploadShema,uploadTblName
    iris,testData/iris.csv,datasets_1,iris
    forestfires,testData/forestfires.csv,datasets_1,forestfires
    car,testData/car.csv,datasets_1,car
    credit,testData/credit.csv,datasets_2,credit"""
    
    fid = StringIO.StringIO(tableList)
    reader = csv.reader(fid, delimiter=',')
    dataTableList = list();
    for i,row in enumerate(reader):
        if i > 0:
            dataTableList.append(row) 

    # create connection
    oracleConn = cx_Oracle.connect(oracleSystemLoginInfo)
    # activate cursor
    oracleCursor = oracleConn.cursor()
    
    for row in dataTableList:
        try:
            oracleCursor.execute("DROP TABLE {}".format('C##' + row[2].upper() + '.' + row[3].upper()))
        except cx_Oracle.DatabaseError:
            pass
    
    # clost the connection to Oracle                
    oracleCursor.close()
    oracleConn.close()    
```