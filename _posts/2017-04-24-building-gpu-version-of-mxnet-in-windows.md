---
layout: post
title: "在Windows環境下編譯GPU版本的mxnet"
---

需要的components有：

1. Visual Studio 2015 Update 3以上
2. OpenBLAS或是Intel MKL 2017 (我這用Intel MKL 2017)
3. [CUDA Toolkit 8.0](https://developer.nvidia.com/cuda-toolkit) 下載安裝
4. [cuDNN](https://developer.nvidia.com/cudnn) 需要登入會員
5. [CMake](https://cmake.org/download/) 下載Windows win64-x64 ZIP，然後解壓縮
5. [OpenCV](http://opencv.org/releases.html) 下載最新版本的3.2.0 win pack，然後解壓縮

為了說明方便，假設在D槽開一個資料夾，叫做mxnet

先把整個mxnet repository clone到`D:\mxnet\mxnet`，然後開啟`CMake\bin\cmake-gui.exe`

(可能開啟會錯誤，先檢查一下bin下面所有檔案，右鍵內容，右下角是否有`解除鎖定`的按鈕)

然後where is the source code選`D:\mxnet\mxnet`，然後按下configure

他會先問你要用什麼編譯，選VS 2015 Win64，然後問是否要開一個新資料夾for build，按下Yes繼續

接下來會說找不到BLAS，那我這裡要用MKL，所以BLAS那個選項選MKL，然後再按一次configure

(如果要用OpenBLAS就直接把`OpenBLAS_INCLUDE_DIR`跟`OpenBLAS_LIB`修改上去即可)

然後會跳出INTEL_ROOT, MKL_INCLUDE, MKL_ROOT這三個選項，設定好相對的路徑後按下configure

接下來會問OpenCV的位置，一樣設定路徑之後再按一次configure，最後應該會看到下面這樣的配置

![](/images/cmake-setup.PNG)

然後再按一次configure不會跳出任何錯誤後，按下Generate，下方出現`Generate Done`之後

按下`Open Project`就會打開Visual Studio 2015，接下來點`方案'mxnet'`右鍵選擇`建置方案`

大概等個一小時之後就build完了


再來是安裝R套件，請先在`D:\mxnet\mxnet\R-package\inst`建一個`libs`資料夾，裡面再建一個`x64`資料夾

然後把`D:\mxnet\mxnet\Debug\libmxnet.dll`, CUDA路徑下bin的`cublas64_80.dll`, `cudart64_80.dll`, 

`cudnn64_5.dll`, `curand64_80.dll`跟`nvrtc64_80.dll`以及opencv路徑下的`bin\opencv_ffmpeg320_64.dll`,

`x64\vc14\bin\opencv_world320.dll`跟`x64\vc14\bin\opencv_world320d.dll`複製到剛剛建立的`R-package\inst\x64`裡面

然後把INTEL ROOT下面的`redist\intel64_win\mkl\mkl_rt.dll`, `redist\intel64_win\mkl\mkl_intel_thread.dll`,

`redist\intel64_win\mkl\mkl_avx.dll` (不同電腦用的指令集不同，不一定是用這個DLL)

以及`redist\intel64_win\mkl\libimalloc.dll`放到R目錄下的`bin\x64`裡面

(要抓哪些DLL是根據`dependencywalker`找的，請查看[dependencywalker](http://dependencywalker.com/)，不過MKL部分是我自己試出來的)

然後跑下面這個script

``` bash
echo import(Rcpp) > R-package/NAMESPACE
echo import(methods) >> R-package/NAMESPACE
R CMD INSTALL R-package
Rscript -e "require(mxnet); mxnet:::mxnet.export(\"R-package\")"
rm -rf R-package/NAMESPACE
Rscript -e "require(roxygen2); roxygen2::roxygenise(\"R-package\")"
R CMD INSTALL R-package
```

安裝之後就到`D:\mxnet\mxnet\example\image-classification`試跑看看`train_mnist.R --network mlp --gpus 0`


至於Python套件部分，請把上面所說的`mkl_rt.dll`, `mkl_core.dll`, `mkl_intel_thread.dll`, `opencv_ffmpeg320_64.dll`, 

`opencv_world320.dll`以及`opencv_world320d.dll`放到Python的根目錄，然後到`D:\mxnet\mxnet\example\image-classification`

試跑下面的命令驗證看看GPU是否正常安裝：

``` python
python train_cifar10.py --network mlp --gpus 0
```

![](/image/mxnet-gpu.PNG)

