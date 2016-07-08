---
layout: post
cTitle: "Pipe Operators in R"
title: "Pipe Operators in R"
category: R
tagline:
tags: [R]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %}

我在ptt分享過magrittr的文章([連結](https://www.ptt.cc/bbs/R_Language/M.1437452331.A.CD1.html))，做為資料處理系列文章的第一篇

後來有一些額外的心得([連結](https://www.ptt.cc/bbs/Statistics/M.1450534933.A.8A4.html))，所以又有一篇補充了一些觀念

一個大陸人Kun Ren(任堃)後來在2015年上傳了一個pipeR套件

<!-- more -->

宣稱比magrittr的pipe operator更好用，效能更佳，而且沒有模糊的界線(他的文章連結：[Blog Post](https://renkun.me/blog/2014/08/08/difference-between-magrittr-and-pipeR.html))

效能差異大概是快了近8倍，後面會在提及這方面


## magrittr
