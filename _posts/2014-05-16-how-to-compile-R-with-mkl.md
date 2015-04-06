---
layout: post
cTitle: 如何compile R with Intel C++ compiler and　Intel MKL
title: "how to compile R with mkl"
category: R
tagline:
tags: [R, MKL]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %}

以下文章參考下列四個網址：

1. [Using Intel MKL with R](https://software.intel.com/en-us/articles/using-intel-mkl-with-r)
2. [Build R-3.0.1 with Intel C++ Compiler and Intel MKL on Linux](https://software.intel.com/en-us/articles/build-r-301-with-intel-c-compiler-and-intel-mkl-on-linux)
3. [Compiling R 3.0.1 with MKL support](http://www.r-bloggers.com/compiling-r-3-0-1-with-mkl-support/)
4. [R Installation and Administraction](http://cran.r-project.org/doc/manuals/r-devel/R-admin.html)
5. [Compile R with Intel Compiler](http://www.ansci.wisc.edu/morota/R/intel/intel-compiler.html)

<!-- more -->

開始之前，先用Default R and R with Openblas來測試看看，I use testing script found in [Simon Urbanek’s](http://r.research.att.com/benchmarks/)，Openblas部份參考這個網站[For faster R use OpenBLAS instead: better than ATLAS, trivial to switch to on Ubuntu](http://www.stat.cmu.edu/~nmv/2013/07/09/for-faster-r-use-openblas-instead-better-than-atlas-trivial-to-switch-to-on-ubuntu/)。

PS: 運行測試前，記得打開R安裝SuppDists的套件。

測試結果如下：
Default R：

{% highlight R %}
   R Benchmark 2.5
   ===============
Number of times each test is run__________________________:  3

   I. Matrix calculation
   ---------------------
Creation, transp., deformation of a 2500x2500 matrix (sec):  0.901666666666667
2400x2400 normal distributed random matrix ^1000____ (sec):  0.664333333333334
Sorting of 7,000,000 random values__________________ (sec):  0.632
2800x2800 cross-product matrix (b = a' * a)_________ (sec):  8.92166666666667
Linear regr. over a 3000x3000 matrix (c = a \ b')___ (sec):  4.34133333333333
                      --------------------------------------------
                 Trimmed geom. mean (2 extremes eliminated):  1.37515524783545

   II. Matrix functions
   --------------------
FFT over 2,400,000 random values____________________ (sec):  0.273000000000001
Eigenvalues of a 640x640 random matrix______________ (sec):  0.960999999999999
Determinant of a 2500x2500 random matrix____________ (sec):  4.576
Cholesky decomposition of a 3000x3000 matrix________ (sec):  3.62266666666667
Inverse of a 1600x1600 random matrix________________ (sec):  3.28933333333333
                      --------------------------------------------
                Trimmed geom. mean (2 extremes eliminated):  2.25399639062039

   III. Programmation
   ------------------
3,500,000 Fibonacci numbers calculation (vector calc)(sec):  0.666000000000006
Creation of a 3000x3000 Hilbert matrix (matrix calc) (sec):  0.194666666666668
Grand common divisors of 400,000 pairs (recursion)__ (sec):  0.805666666666667
Creation of a 500x500 Toeplitz matrix (loops)_______ (sec):  0.74599999999999
Escoufier's method on a 45x45 matrix (mixed)________ (sec):  0.473000000000013
                      --------------------------------------------
                Trimmed geom. mean (2 extremes eliminated):  0.617103579859946


Total time for all 15 tests_________________________ (sec):  31.0683333333333
Overall mean (sum of I, II and III trimmed means/3)_ (sec):  1.24133119896421
                      --- End of test ---
{% endhighlight %}

R with Openblas:

{% highlight R %}
   R Benchmark 2.5
   ===============
Number of times each test is run__________________________:  3

   I. Matrix calculation
   ---------------------
Creation, transp., deformation of a 2500x2500 matrix (sec):  0.898666666666667
2400x2400 normal distributed random matrix ^1000____ (sec):  0.664666666666667
Sorting of 7,000,000 random values__________________ (sec):  0.637
2800x2800 cross-product matrix (b = a' * a)_________ (sec):  0.233666666666668
Linear regr. over a 3000x3000 matrix (c = a \ b')___ (sec):  0.155333333333334
                      --------------------------------------------
                 Trimmed geom. mean (2 extremes eliminated):  0.462501733597377

   II. Matrix functions
   --------------------
FFT over 2,400,000 random values____________________ (sec):  0.274000000000001
Eigenvalues of a 640x640 random matrix______________ (sec):  1.132
Determinant of a 2500x2500 random matrix____________ (sec):  0.201333333333335
Cholesky decomposition of a 3000x3000 matrix________ (sec):  0.168333333333332
Inverse of a 1600x1600 random matrix________________ (sec):  0.186
                      --------------------------------------------
                Trimmed geom. mean (2 extremes eliminated):  0.217300001997772

   III. Programmation
   ------------------
3,500,000 Fibonacci numbers calculation (vector calc)(sec):  0.665666666666664
Creation of a 3000x3000 Hilbert matrix (matrix calc) (sec):  0.19433333333333
Grand common divisors of 400,000 pairs (recursion)__ (sec):  0.895333333333331
Creation of a 500x500 Toeplitz matrix (loops)_______ (sec):  0.764000000000003
Escoufier's method on a 45x45 matrix (mixed)________ (sec):  0.423999999999999
                      --------------------------------------------
                Trimmed geom. mean (2 extremes eliminated):  0.599660360864793


Total time for all 15 tests_________________________ (sec):  7.49433333333333
Overall mean (sum of I, II and III trimmed means/3)_ (sec):  0.39206626824379
                      --- End of test ---
{% endhighlight %}

可以看到total time已經從31秒到7.5秒左右，改善幅度已經不少，接著來compile R:

1. 取得R與其開發包，並安裝需要的套件，在terminal use following commands:

{% highlight bash %}
sudo add-apt-repository ppa:webupd8team/java && sudo apt-get update && sudo apt-get install oracle-java8-installer && sudo apt-get install oracle-java8-set-default
apt-cache search readline xorg-dev && sudo apt-get install libreadline6 libreadline6-dev texinfo texlive-binaries texlive-latex-base texlive-latex-extra texlive-fonts-extra xorg-dev tcl8.6-dev tk8.6-dev libtiff5 libtiff5-dev libjpeg-dev libpng12-dev libcairo2-dev libglu1-mesa-dev libgsl0-dev libicu-dev R-base R-base-dev libnlopt-dev
{% endhighlight %}

有一個工具要另外安裝，方式如下：

{% highlight bash %}
wget http://ftp.gnu.org/pub/gnu/libiconv/libiconv-1.14.tar.gz
tar -xvzf libiconv-1.14.tar.gz
cd libiconv-1.14 && ./configure --prefix=/usr/local/libiconv
make && sudo make install
{% endhighlight %}

但是我在make過程中有出錯，我google之後找到的解法是修改libiconv-1.14/srclib/stdio.in.h的698列:
原本的script:

{% highlight c %}
_GL_WARN_ON_USE (gets, "gets is a security hole - use fgets instead");
{% endhighlight %}

修改後的scipt:

{% highlight c %}
#if defined(__GLIBC__) && !defined(__UCLIBC__) && !__GLIBC_PREREQ(2, 16)
 _GL_WARN_ON_USE (gets, "gets is a security hole - use fgets instead");
#endif
{% endhighlight %}

之後再重新make就成功了。

2. 取得R source code:

{% highlight bash %}
wget http://cran.csie.ntu.edu.tw/src/base/R-3/R-3.1.3.tar.gz
tar -xvzf R-3.1.3.tar.gz
{% endhighlight %}

3. 取得Intel C++ compiler and Intel MKL，你可以取得non-commercial license for this two software in intel website. 安裝前記得先取得需要的套件：

{% highlight bash %}
sudo apt-get install build-essential libstdc++6
{% endhighlight %}

另外，ubuntu 14.04不支援32 bits的compiler，安裝時記得取消掉IA32的安裝。

4. compilitation:

{% highlight bash %}
sudo -s
source /opt/intel/composer_xe_2013_sp1.3.174/mkl/bin/mklvars.sh intel64
source /opt/intel/composer_xe_2013_sp1.3.174/bin/compilervars.sh intel64
MKL_path=/opt/intel/composer_xe_2013_sp1.3.174/mkl
ICC_path=/opt/intel/composer_xe_2013_sp1.3.174/compiler
export LD="xild"
export AR="xiar"
export CC="icc"
export CXX="icpc"
export CFLAGS="-wd188 -ip -std=gnu99 -g -O3 -openmp -parallel -xHost -ipo -fp-model precise -fp-model source"
export CXXFLAGS="-g -O3 -openmp -parallel -xHost -ipo -fp-model precise -fp-model source"
export F77=ifort
export FFLAGS="-g -O3 -openmp -parallel -xHost -ipo -fp-model source"
export FC=ifort
export FCFLAGS="-g -O3 -openmp -parallel -xHost -ipo -fp-model source"
export ICC_LIBS=$ICC_path/lib/intel64
export IFC_LIBS=$ICC_path/lib/intel64
export LDFLAGS="-L$ICC_LIBS -L$IFC_LIBS -L$MKL_path/lib/intel64 -L/usr/lib -L/usr/local/lib -openmp"
export SHLIB_CXXLD=icpc
export SHLIB_LDFLAGS="-shared -fPIC"
export SHLIB_CXXLDFLAGS="-shared -fPIC"
MKL="-L$MKL_path/lib/intel64 -lmkl_intel_lp64 -lmkl_intel_thread -lmkl_core -liomp5 -lpthread -ldl -lm"

./configure --with-blas="$MKL" --with-lapack --with-x --enable-memory-profiling --with-tcl-config=/usr/lib/tcl8.6/tclConfig.sh --with-tk-config=/usr/lib/tk8.6/tkConfig.sh R_BROWSER="firefox" --enable-R-shlib --enable-BLAS-shlib
make && make check
make install
exit
sudo chown -R yourUserName /usr/local/lib/R
{% endhighlight %}

然後他就會幫你把R安裝於usr/local/lib/R中，你之前如果有安裝過R，就記得把/usr/lib/R的目錄刪掉。

5. 測試結果

{% highlight R %}
   R Benchmark 2.5
   ===============
Number of times each test is run__________________________:  3

   I. Matrix calculation
   ---------------------
Creation, transp., deformation of a 2500x2500 matrix (sec):  0.841333333333333
2400x2400 normal distributed random matrix ^1000____ (sec):  0.370666666666667
Sorting of 7,000,000 random values__________________ (sec):  0.641666666666666
2800x2800 cross-product matrix (b = a' * a)_________ (sec):  0.295666666666666
Linear regr. over a 3000x3000 matrix (c = a \ b')___ (sec):  0.173333333333333
                      --------------------------------------------
                 Trimmed geom. mean (2 extremes eliminated):  0.412760812738327

   II. Matrix functions
   --------------------
FFT over 2,400,000 random values____________________ (sec):  0.256333333333335
Eigenvalues of a 640x640 random matrix______________ (sec):  0.311000000000001
Determinant of a 2500x2500 random matrix____________ (sec):  0.175666666666667
Cholesky decomposition of a 3000x3000 matrix________ (sec):  0.190666666666668
Inverse of a 1600x1600 random matrix________________ (sec):  0.153333333333334
                      --------------------------------------------
                Trimmed geom. mean (2 extremes eliminated):  0.204765321007157

   III. Programmation
   ------------------
3,500,000 Fibonacci numbers calculation (vector calc)(sec):  0.343666666666666
Creation of a 3000x3000 Hilbert matrix (matrix calc) (sec):  0.136333333333333
Grand common divisors of 400,000 pairs (recursion)__ (sec):  0.769000000000001
Creation of a 500x500 Toeplitz matrix (loops)_______ (sec):  0.424333333333334
Escoufier's method on a 45x45 matrix (mixed)________ (sec):  0.330999999999996
                      --------------------------------------------
                Trimmed geom. mean (2 extremes eliminated):  0.364102938914316


Total time for all 15 tests_________________________ (sec):  5.414
Overall mean (sum of I, II and III trimmed means/3)_ (sec):  0.313371634843041
                      --- End of test ---
{% endhighlight %}

最後只需要用到5.4秒就可以完成了，可是complitation過程是滿麻煩的，雖然參考了多個網站，可是參數的設定都不太一樣，linux又有權限的限制，而且就算編譯成功，Rcpp這個套件不見得能夠成功，因此花了很久才終於編譯成功，並且能夠直接開啟，只是要利用到c, cpp or fortran時還是需要source compilervars.sh才能夠運行，而且我安裝了三四十個套件都沒有問題了。最後，如果沒有特別要求速度下，其實直接用openblas就可以省下很多麻煩。另外，我做了一個小小的測試於Rcpp上，速度有不少的提昇(因為用intel C++ compiler，大概增加5~10倍)，測試結果就不放上來了。以上資訊供大家參考，轉載請註明來源，謝謝。

最後附上測試環境: My environment is ubuntu 14.04, R 3.1.3 compiled by Intel c++, fortran compiler with MKL. My CPU is 3770K@4.3GHz.

To use the html help page with `sudo gedit ~/.Rprofile` and add following to file:

{% highlight R %}
options("help_type"="html")
options("browser"="chromium-browser")
{% endhighlight %}{% endhighlight %}

If you want to change the default language of R, you can do that:
{% highlight bash %}
cp /usr/local/lib/R/etc/Renviron
subl ~/.Renviron
{% endhighlight %}{% endhighlight %}

Add following line into the file:
{% highlight bash %}
LANGUAGE="en"
{% endhighlight %}{% endhighlight %}
