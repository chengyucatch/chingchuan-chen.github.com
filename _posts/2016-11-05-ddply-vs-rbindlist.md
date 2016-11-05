---
layout: post
cTitle: "plyr::ddply vs data.table::rbindlist"
title: "plyr::ddply vs data.table::rbindlist"
category: R
tagline:
tags: [R]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %} 

最近遇到在計算functinoal data的cross-covariance surface的時候

發現`plyr::ddply`裡面的`list_to_dataframe`有點慢

反而利用`plyr::dlply`加上`data.table`的`rbindlist`可以快上不少

而且`plyr::ddply`消耗的記憶體相對起`rbindlist`高上不少

會發現這些都要感謝rstudio新出的套件`profvis`提供了良好的performance視覺化

其中`profvis`可以在[github](https://github.com/rstudio/profvis)找到

<!-- more -->

下面是Benchmark的R script:

``` R
library(plyr)
library(data.table)
library(pipeR)

N <- 2000
nt <- 100
p <- 4
dataDT <- data.table(subId = rep(1:(N/nt), p, each = nt), variable = rep(1:p, each = N), 
                     timePnt = rep(seq(0, 10, length.out = nt), p*N/nt), value = rnorm(N*p))

getRawCrCov1 <- function(demeanDataDT){
  # geneerate the all combinations of t1,t2 and varaibles
  baseDT <- demeanDataDT[ , .(t1 = rep(timePnt, length(timePnt)), t2 = rep(timePnt, each=length(timePnt)),
                              value.var1 = rep(value, length(timePnt))), by = .(variable, subId)]
  # calculation of raw cross-covariance
  rawCrCovDT <- do.call("dlply", list(demeanDataDT, "variable", function(df){
    merge(baseDT[variable >= df$variable[1]], df, suffixes = c("1", "2"),
          by.x = c("subId", "t2"), by.y = c("subId", "timePnt"))
  })) %>>% rbindlist %>>% setnames("value", "value.var2") %>>%
    `[`(j = .(sse = sum(value.var1 * value.var2), cnt = .N), by = .(variable1, variable2, t1, t2)) %>>%
    setorder(variable1, variable2, t1, t2) %>>% `[`(j = weight := 1)
  return(rawCrCovDT)
}

getRawCrCov2 <- function(demeanDataDT){
  # geneerate the all combinations of t1,t2 and varaibles
  baseDT <- demeanDataDT[ , .(t1 = rep(timePnt, length(timePnt)), t2 = rep(timePnt, each=length(timePnt)),
                              value.var1 = rep(value, length(timePnt))), by = .(variable, subId)]
  # calculation of raw cross-covariance
  rawCrCovDT <- do.call("ddply", list(demeanDataDT, "variable", function(df){
    merge(baseDT[variable >= df$variable[1]], df, suffixes = c("1", "2"),
          by.x = c("subId", "t2"), by.y = c("subId", "timePnt"))
  })) %>>% setDT %>>% `[`(j = variable := NULL) %>>% setnames("value", "value.var2") %>>%
    `[`(j = .(sse = sum(value.var1 * value.var2), cnt = .N), by = .(variable1, variable2, t1, t2)) %>>%
    setorder(variable1, variable2, t1, t2) %>>% `[`(j = weight := 1)
  return(rawCrCovDT)
}

x1 <- getRawCrCov1(dataDT)
x2 <- getRawCrCov2(dataDT)
all.equal(x1, x2) # TRUE

library(microbenchmark)
microbenchmark(rbindlist = getRawCrCov1(dataDT), ddply = getRawCrCov2(dataDT), times = 50L)
# Unit: milliseconds
#       expr       min        lq      mean    median        uq       max neval
#  rbindlist  662.0191  687.6856  709.1266  707.0035  721.7942  794.4027    50
#      ddply 3048.7723 3249.6420 3347.8935 3335.5733 3458.5485 3629.5983    50
```

速度整整差了近5倍(3347 / 709 ~= 4.72)

因此，建議以後plyr系列，盡量避開`*dply`系列的函數

用到`plyr:::list_to_dataframe`這個函數的效能都不好

盡量去使用`data.table::rbindlist`
