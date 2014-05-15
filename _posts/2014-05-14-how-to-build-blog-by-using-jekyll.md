---
layout: post
cTitle: 如何利用jekyll建立你的blogger
title: "how to build blog by using jekyll"
category: jekyll
tagline:
tags: [jekyll]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %}

以下詳細介紹如何在windows環境下使用sublime text在github上建立屬於你自己的部落格

以下教學來自下列兩個網站
1. http://yizeng.me/2013/05/10/setup-jekyll-on-windows/
2. http://www.madhur.co.in/blog/2011/09/01/runningjekyllwindows.html

<!-- more -->

## 安裝步驟如下：

A. 下載我壓縮的工具包：[Dropbox](https://www.dropbox.com/s/pphmfw6gfk8p9ma/blogger_toolbox.rar)
解壓縮之後，裡面包含六個檔案：

    1. rubyinstaller-2.0.0-p481-x64.exe
    2. DevKit-mingw64-64-4.7.2-20130224-1432-sfx.exe
    3. python-2.7.6.amd64.msi
    4. get-pip.py
    5. Git-1.9.2-preview20140411.exe
    6. RedmondPathzip.rar

這六個檔案分別為ruby安裝檔、ruby環境的檔案、python安裝檔案、python-pip安裝檔案、Git安裝檔案以及path修改的軟體，請依順序安裝。

    1. ruby預設安裝到C:\Ruby200-x64，中間記得勾選"Add Ruby executables to your PATH"。
    ![](/images/ruby_install.png)
	2. 解壓縮ruby環境，方便說明，我設定解壓縮到C:\rubydevkit
	3. 安裝python，預設安裝到C:\Python27，然後點擊兩下get-pip.py，便完成python安裝。
	4. 安裝Git，中間要注意，勾選Use Git from the Windows Command Prompt
	![](/images/git_install.png)
	5. 把RedmondPathzip.rar解壓縮，打開Redmond Path.exe，在任意視窗中下方加入; C:\Python27; C:\Python27\Scripts，(你安裝路徑有更動，請跟著更改)，如下圖下示：
	![](/images/path_setup.png)
	
B. 為了工作方便，請先按下windows鍵(在Ctr跟Alt之間)+R，開啟執行視窗，鍵入cmd，打開Windows Command Prompt，為了解釋方便，以後稱這個視窗為cmd。
    ![](/images/cmd_1.png)
	![](/images/cmd_2.png)
	
打開cmd，他的預設目錄是在你的使用者下，請先輸入cd ../..，退到C:\>，如圖：
    ![](/images/cmd_3.png)
	
鍵入指令`pip install pygments`，會幫你安裝python的pygments的package
	![](/images/python_install_pygments.png)

然後在cmd中輸入下列指令：

	cd rubydevkit
	ruby dk.rb init
	notepad config.yml
	
輸入完以上三行指令後，將會用記事本打開一個名為config.yml的檔案，最後一行改成 `- C:\Ruby200-x64`。
    ![](/images/dk_rb_edit.png)
	
回到cmd，鍵入`ruby dk.rb install`，如果成功會出現下面的訊息：
    ![](/images/dk_rb_edit_2.png)

然後回到cmd，鍵入`gem install jekyll`，然後等待一下之後，他會安裝數個gems(不一定是27)，如圖：
	![](/images/ruby_install_jekyll_1.png)
	![](/images/ruby_install_jekyll_2.png)

C. 申請git，並且clone我的庫當作基底。請到 [Github](https://github.com/)申請一個帳號，假設你的使用者名稱(username)為USERNAME，在你的github中建立一個新的repository，repository的名稱請設定為USERNAME.github.com，這樣就完成github初步的設定。

D. 接下來就是重頭戲了，請先建立好你的工作目錄，例如我設定在E:\website中，那我可以利用這個指令`cd /d E:\website`到該目錄下，你可以自行更改工作目錄，假設clone我的庫做為基底，輸入下方指令：

	mkdir USERNAME.github.com
	git clone https://github.com/ChingChuan-Chen/chingchuan-chen.github.com USERNAME.github.com
	
記得當中的USERNAME要改成你在github的username。例如我的username叫做imstupid，預期output如下圖：
![](/images/cmd_3.png)

再來就是init github的本地倉庫，以及設定你的github遠端帳號，指令如下：
	
	cd USERNAME.github.com
	git init
	git remote set-url origin https://github.com/USERNAME/USERNAME.github.com.git
    git push origin master
	
過程中會要求輸入你的github的帳號(username)以及其密碼(password)，之後你就可以在你的github上看到你上傳的檔案了！最後就是一些簡單的修改，例如記事本去修改_config.yml (簡單的指令是notepad _config.yml，或是用記事本把它打開)：
![](/images/config.png)
![](/images/config2.png)

檔案中，#是註解，程式不會去閱讀的部分可以寫在#後面，其他前面沒有#的部分就是你可以更改的部分，當然更進階的話，你還可以添加一些選項進去，像是更動`title :`後面的文字就是在更改你主題頁的名稱。修改之後存檔，在cmd中輸入`git commit -am "message"`這個目的是儲存你所有的修改，以及添加修改的相關訊息message (這個可以自己改)，



### 下載git
請到 [msysgit](http://msysgit.github.io/)點選`Download`，然後安裝，依照初始值安裝即可。確認是否正確安裝的方式為按下`windows+R`鍵，並鍵入cmd打開命令提示列，輸入指令`git version`，如果有出現git version X.X.X.XXXXXXX.X便是安裝成功。

## 安裝ruby and jekyll
- 請到[Ruby官方網站](http://rubyinstaller.org/downloads/)下載Ruby跟Ruby Development Kit，我自己是下載Ruby 2.0.0-p451跟DevKit-mingw64-64-4.7.2-20130224-1432-sfx，依照預設進行安裝，會分別安裝到C:\Ruby200-x64跟C:\DevKit中。
- 按下`windows+R`鍵，並鍵入cmd打開命令提示列，輸入以下指令

    $ cd /d C:\DevKit
    $ ruby dk.rb init

將會生成config.yml這個檔案，請確認最後一行為你的Ruby安裝目錄，如C:\Ruby200-x64。
- 在命令提示列中鍵入下列指令

    $ ruby dk.rb install
    $ gem install jekyll
	
以上便完成了jekyll的安裝。

## blogger模板下載以及建立
我自己是使用[jekyll-bootstrap](http://jekyllbootstrap.com/)來找尋我喜歡的模板，你可以在[Jekyll Bootstrap QuickStart](http://jekyllbootstrap.com/usage/jekyll-quick-start.html)找到相關的教學，簡述如下：

打開cmd，使用cd指令切換到你的工作目錄，例如：cd /d C:\myblog，然後cmd下輸入

    $ git clone https://github.com/plusjade/jekyll-bootstrap.git USERNAME.github.com
    $ cd USERNAME.github.com
    $ git remote set-url origin https://github.com/USERNAME/USERNAME.github.com.git
    $ git push origin master
	$ git clone https://github.com/ChingChuan-Chen/chingchuan-chen.github.com reference.github.com
	
第一個指令是下載jekyll-bootstrap的範本到USERNAME.github.com (USERNAME換上你的github的username)這個資料夾，第二個指令就是前往該資料夾，第三個指令是設定連接到你的github，第四個是把該目錄下的檔案上傳到你的github。如果想在本地瀏覽你的blog就執行：

    $ jekyll serve

剩下可以自己到Jekyll Bootstrap QuickStart做瀏覽，不再贅述。

## 在sublime text上安裝git plugin
按下`Ctr+Shift+P`打開package control，鍵入`install package`選`package control: install package`，輸入git再按下Enter確認即可安裝。利用open folder打開你的blog資料夾，然後可以在你的sublime text中的Tools - Git 找到相關操作，或是直接按下`Ctr+Shift+P`直接輸入指令進行操作。使用方式如下


1. 按下`Ctr+Shift+P`輸入git init，貼上你的工作目錄：如C:\myblog\USERNAME.github.com。
2. 按下`Ctr+Shift+P`輸入git diff，可以查看檔案的更改狀態。
3. 按下`Ctr+Shift+P`輸入git status，可以查看git當前狀態。
4. 按下`Ctr+Shift+P`輸入git commit，可以commit你現在的修改。
5. 按下`Ctr+Shift+P`輸入git push，可以將你的file上傳到你的github上。
6. 按下`Ctr+Shift+P`輸入git add current file，新增現在的file。

剩下的就是編輯你自己的blogger。
