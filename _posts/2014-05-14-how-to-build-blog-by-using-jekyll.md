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

## 申請account of github
請到 [Github](https://github.com/)申請一個帳號，假設你的使用者名稱(username)為USERNAME，在你的github中建立一個新的repository，repository的名稱請設定為USERNAME.github.com，這樣就完成初步的設定。
<!-- more -->

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
