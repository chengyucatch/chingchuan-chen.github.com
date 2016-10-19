---
layout: post
cTitle: "unnest in R data.table"
title: "unnest in R data.table"
category: R
tagline:
tags: [R]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %} 

我們今天可能會遇到json parse出來的資料長下面這樣

``` R
library(data.table)
DT <- data.table(a = list(c(1:5), c(2:4), c(1:5)), b = 1:3, 
                 c = list(c(0:4), c(6:8), c(7:11)),  d = 2:4)
#         a b      c d
# 1: <list> 1 <list> 2
# 2: <list> 2 <list> 3
# 3: <list> 3 <list> 4
```

<!-- more -->

那在這種情況下，可以直接選擇用`tidyr`的`unnest`去做，如下面所示

``` R
library(tidyr)
unnest(DT, a, c)
#     b d a  c
#  1: 1 2 1  0
#  2: 1 2 2  1
#  3: 1 2 3  2
#  4: 1 2 4  3
#  5: 1 2 5  4
#  6: 2 3 2  6
#  7: 2 3 3  7
#  8: 2 3 4  8
#  9: 3 4 1  7
# 10: 3 4 2  8
# 11: 3 4 3  9
# 12: 3 4 4 10
# 13: 3 4 5 11
```

但是這時候我們很難的去自動解析這種表格，必須讓使用者自行處理

所以如果我們能用簡單的方式去自動辨別需要轉換就更好了

基於此，我就用data.table去開發了這樣想的程式，如下：

``` R
library(data.table)
library(pipeR)
autoFind <- function(DT){
  setdiff(names(DT), names(DT)[sapply(DT, function(x) any(class(x) %in% "list"))])
}
extendTbl <- function(DT, groupbyVar = autoFind(DT)){
  chkExpr <- paste0(groupbyVar, "=NULL", collapse = ",") %>>%
    (paste0("`:=`(", ., ")"))
  chkLenAllEqual <- DT[, lapply(.SD, function(x) sapply(x, length)), by = groupbyVar] %>>%
    `[`(j = eval(parse(text = chkExpr))) %>>% as.matrix %>>%
    apply(1, diff) %>>% `==`(0) %>>% all
  if(!chkLenAllEqual)
    stop("The length in each cell is not equal.")
  
  expr <- setdiff(names(DT), groupbyVar) %>>%
    (paste0(., "=unlist(",  ., ")")) %>>% 
    paste0(collapse = ",") %>>% (paste0(".(", ., ")"))
  return(DT[ , eval(parse(text = expr)), by = groupbyVar])
}
extendTbl(DT)
#     b d a  c
#  1: 1 2 1  0
#  2: 1 2 2  1
#  3: 1 2 3  2
#  4: 1 2 4  3
#  5: 1 2 5  4
#  6: 2 3 2  6
#  7: 2 3 3  7
#  8: 2 3 4  8
#  9: 3 4 1  7
# 10: 3 4 2  8
# 11: 3 4 3  9
# 12: 3 4 4 10
# 13: 3 4 5 11
extendTbl(DT, c("b", "d"))
#     b d a  c
#  1: 1 2 1  0
#  2: 1 2 2  1
#  3: 1 2 3  2
#  4: 1 2 4  3
#  5: 1 2 5  4
#  6: 2 3 2  6
#  7: 2 3 3  7
#  8: 2 3 4  8
#  9: 3 4 1  7
# 10: 3 4 2  8
# 11: 3 4 3  9
# 12: 3 4 4 10
# 13: 3 4 5 11
```

