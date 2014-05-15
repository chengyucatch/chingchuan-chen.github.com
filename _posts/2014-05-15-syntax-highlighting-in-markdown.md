---
layout: post
cTitle: Markdown中程式語法高亮 -- Demo. by R
title: "syntax highlighting in markdown"
description: ""
category: jekyll
cssdemo: 2014-spring
tags: [markdown, R]
published: false
---
{% include JB/setup %}

blogger用來記錄關於程式的心得，少不了要讓你的程式上上水彩，語法高亮(syntax highlighting)方便閱讀者閱讀，以下參考[這裡](http://support.codebasehq.com/articles/tips-tricks/syntax-highlighting-in-markdown)

例如我想要對下面這段程式碼進行語法高亮：

```splus
system("cmd /k shutdown -s -t")
```

<!-- more -->

就要在markdown中這樣打

	```splus
	system("cmd /k shutdown -s -t")
	```
	
超簡單的，或是可以測試其他語言如下：

```python
numbers = []
count = 0
sum = 0
lowest = 0
highest = 0
while True:
	num = input("enter a number or Enter to finish: ")
	if num:
		try:
			num = int(num)
		except ValueError as err:
			print(err)
			continue
	else:
		break
	numbers += [num]
	sum += num
	count += 1
	if count == 2:
		lowest = num
		highest = num
	elif num < lowest:
		lowest = num
	elif num > highest:
		highest = num
	else:
		continue
mean = sum / count
print("numbers: ", numbers)
print("count = ", count, "sum = ", sum, "lowest = ", lowest, 
      "highest = ", highest, "mean = ", mean)
```

{% highlight ruby %}
def foo
  puts 'foo'
end
{% endhighlight %}

```ruby
def foo
  puts 'foo'
end
```

{% highlight python %}
def yourfunction():
     print "Hello World!"
{% endhighlight %}