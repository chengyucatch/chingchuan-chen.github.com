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

{% highlight html %}
   R Benchmark 2.5
   ===============
Number of times each test is run__________________________:  3

   I. Matrix calculation
   ---------------------
Creation, transp., deformation of a 2500x2500 matrix (sec):  1.12266666666667
2400x2400 normal distributed random matrix ^1000____ (sec):  0.727333333333333
Sorting of 7,000,000 random values__________________ (sec):  0.72
2800x2800 cross-product matrix (b = a' * a)_________ (sec):  10.9446666666667
Linear regr. over a 3000x3000 matrix (c = a \ b')___ (sec):  5.311
                      --------------------------------------------
                 Trimmed geom. mean (2 extremes eliminated):  1.6307480718093

   II. Matrix functions
   --------------------
FFT over 2,400,000 random values____________________ (sec):  0.531000000000006
Eigenvalues of a 640x640 random matrix______________ (sec):  1.11366666666667
Determinant of a 2500x2500 random matrix____________ (sec):  5.08300000000001
Cholesky decomposition of a 3000x3000 matrix________ (sec):  4.58633333333333
Inverse of a 1600x1600 random matrix________________ (sec):  4.62533333333334
                      --------------------------------------------
                Trimmed geom. mean (2 extremes eliminated):  2.86937927906332

   III. Programmation
   ------------------
3,500,000 Fibonacci numbers calculation (vector calc)(sec):  0.76133333333334
Creation of a 3000x3000 Hilbert matrix (matrix calc) (sec):  0.39433333333334
Grand common divisors of 400,000 pairs (recursion)__ (sec):  1.04766666666668
Creation of a 500x500 Toeplitz matrix (loops)_______ (sec):  0.976666666666659
Escoufier's method on a 45x45 matrix (mixed)________ (sec):  0.663000000000011
                      --------------------------------------------
                Trimmed geom. mean (2 extremes eliminated):  0.789971784140643


Total time for all 15 tests_________________________ (sec):  38.6080000000001
Overall mean (sum of I, II and III trimmed means/3)_ (sec):  1.5461874255574
                      --- End of test ---

180.72 user
2.77 system
3:05.43 elapsed
98% CPU
{% endhighlight %}

R with Openblas:

{% highlight html %}
   R Benchmark 2.5
   ===============
Number of times each test is run__________________________:  3

   I. Matrix calculation
   ---------------------
Creation, transp., deformation of a 2500x2500 matrix (sec):  1.10366666666667
2400x2400 normal distributed random matrix ^1000____ (sec):  0.740333333333333
Sorting of 7,000,000 random values__________________ (sec):  0.732999999999999
2800x2800 cross-product matrix (b = a' * a)_________ (sec):  0.538333333333333
Linear regr. over a 3000x3000 matrix (c = a \ b')___ (sec):  0.452666666666667
                      --------------------------------------------
                 Trimmed geom. mean (2 extremes eliminated):  0.663530438270739

   II. Matrix functions
   --------------------
FFT over 2,400,000 random values____________________ (sec):  0.564333333333335
Eigenvalues of a 640x640 random matrix______________ (sec):  1.53666666666667
Determinant of a 2500x2500 random matrix____________ (sec):  0.382666666666665
Cholesky decomposition of a 3000x3000 matrix________ (sec):  0.316666666666665
Inverse of a 1600x1600 random matrix________________ (sec):  0.406333333333334
                      --------------------------------------------
                Trimmed geom. mean (2 extremes eliminated):  0.444371566596793

   III. Programmation
   ------------------
3,500,000 Fibonacci numbers calculation (vector calc)(sec):  0.747666666666665
Creation of a 3000x3000 Hilbert matrix (matrix calc) (sec):  0.350999999999999
Grand common divisors of 400,000 pairs (recursion)__ (sec):  0.987666666666665
Creation of a 500x500 Toeplitz matrix (loops)_______ (sec):  0.902333333333334
Escoufier's method on a 45x45 matrix (mixed)________ (sec):  0.5
                      --------------------------------------------
                Trimmed geom. mean (2 extremes eliminated):  0.696116094179688


Total time for all 15 tests_________________________ (sec):  10.2633333333333
Overall mean (sum of I, II and III trimmed means/3)_ (sec):  0.589878991592286
                      --- End of test ---

81.28 user
21.99 system
0:59.59 elapsed
173% CPU
{% endhighlight %}

可以看到total time已經從38秒到10秒左右，改善幅度已經不少，接著來compile R:

1. 取得R與其開發包，並安裝需要的套件，在terminal use following commands:

{% highlight bash %}
sudo add-apt-repository ppa:webupd8team/java && sudo apt-get update && sudo apt-get install oracle-java8-installer && sudo apt-get install oracle-java8-set-default
apt-cache search readline xorg-dev && sudo apt-get install libreadline6 libreadline6-dev texinfo texlive-binaries texlive-latex-base texlive-latex-extra texlive-fonts-extra xorg-dev tcl8.6-dev tk8.6-dev libtiff5 libtiff5-dev libjpeg-dev libpng12-dev libcairo2-dev libglu1-mesa-dev libgsl0-dev libicu-dev R-base R-base-dev
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
wget http://cran.csie.ntu.edu.tw/src/base/R-3/R-3.1.1.tar.gz
tar -xvzf R-3.1.1.tar.gz
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
export CFLAGS="-wd188 -ip -std=gnu99 -g -O3 -openmp -xHost -ipo -fp-model precise -fp-model source"
export CXXFLAGS="-g -O3 -openmp -xHost -ipo -fp-model precise -fp-model source"
export F77=ifort
export FFLAGS="-g -O3 -openmp -xHost -ipo -fp-model source"
export FC=ifort
export FCFLAGS="-g -O3 -openmp -xHost -ipo -fp-model precise -fp-model source"
export CPPFLAGS="-no-gcc"
export ICC_LIBS=$ICC_path/lib/intel64
export IFC_LIBS=$ICC_path/lib/intel64
export LDFLAGS="-L$ICC_LIBS -L$IFC_LIBS -L$MKL_path/lib/intel64 -L/usr/lib -L/usr/local/lib -openmp"
export SHLIB_CXXLD=icpc
export SHLIB_LDFLAGS="-shared -fPIC"
export SHLIB_CXXLDFLAGS="-shared -fPIC"
MKL="-L$MKL_path/lib/intel64 -lmkl_intel_lp64 -lmkl_intel_thread -lmkl_core -liomp5 -lpthread -ldl -lm"
export JAVA_HOME=/usr/lib/jvm/java-8-oracle/jre
export R_JAVA_LD_LIBRARY_PATH=${JAVA_HOME}/lib/amd64/server

./configure --with-blas="$MKL" --with-lapack --with-x --enable-memory-profiling --with-tcl-config=/usr/lib/tcl8.6/tclConfig.sh --with-tk-config=/usr/lib/tk8.6/tkConfig.sh
make && make install
{% endhighlight %}

然後他就會幫你把R安裝於usr/local/lib/R中，你之前如果有安裝過R，就記得把/usr/lib/R的目錄刪掉。

5. 測試結果

{% highlight html %}
    R Benchmark 2.5
   ===============
Number of times each test is run__________________________:  3

   I. Matrix calculation
   ---------------------
Creation, transp., deformation of a 2500x2500 matrix (sec):  0.755
2400x2400 normal distributed random matrix ^1000____ (sec):  0.258666666666667
Sorting of 7,000,000 random values__________________ (sec):  0.562999999999999
2800x2800 cross-product matrix (b = a' * a)_________ (sec):  0.303333333333334
Linear regr. over a 3000x3000 matrix (c = a \ b')___ (sec):  0.174666666666666
                      --------------------------------------------
                 Trimmed geom. mean (2 extremes eliminated):  0.353500202023859

   II. Matrix functions
   --------------------
FFT over 2,400,000 random values____________________ (sec):  0.375666666666666
Eigenvalues of a 640x640 random matrix______________ (sec):  0.329666666666667
Determinant of a 2500x2500 random matrix____________ (sec):  0.172333333333332
Cholesky decomposition of a 3000x3000 matrix________ (sec):  0.221333333333334
Inverse of a 1600x1600 random matrix________________ (sec):  0.183333333333334
                      --------------------------------------------
                Trimmed geom. mean (2 extremes eliminated):  0.2373856335244

   III. Programmation
   ------------------
3,500,000 Fibonacci numbers calculation (vector calc)(sec):  0.292999999999999
Creation of a 3000x3000 Hilbert matrix (matrix calc) (sec):  0.223333333333333
Grand common divisors of 400,000 pairs (recursion)__ (sec):  0.706333333333332
Creation of a 500x500 Toeplitz matrix (loops)_______ (sec):  0.272333333333333
Escoufier's method on a 45x45 matrix (mixed)________ (sec):  0.286999999999999
                      --------------------------------------------
                Trimmed geom. mean (2 extremes eliminated):  0.283977178344242


Total time for all 15 tests_________________________ (sec):  5.119
Overall mean (sum of I, II and III trimmed means/3)_ (sec):  0.287768009441094
                      --- End of test ---

64.04 user
2.27 system
0:33.33 elapsed
198% CPU
{% endhighlight %}

最後只需要用到5.12秒就可以完成了，可是complitation過程是滿麻煩的，雖然參考了多個網站，可是參數的設定都不太一樣，linux又有權限的限制，而且就算編譯成功，Rcpp這個套件不見得能夠成功，因此花了很久才終於編譯成功，並且能夠直接開啟，只是要利用到c, cpp or fortran時還是需要source compilervars.sh才能夠運行，而且我安裝了三四十個套件都沒有問題了。最後，如果沒有特別要求速度下，其實直接用openblas就可以省下很多麻煩。另外，我做了一個小小的測試於Rcpp上，速度有不少的提昇(因為用intel C++ compiler，大概增加5~10倍)，測試結果就不放上來了。以上資訊供大家參考，轉載請註明來源，謝謝。

最後附上測試環境:

{% highlight bash %}
windows 7 64 bits
i7-3770K@4.3GHz
use VMware workstation 10: ubuntu 14.04 with 2 porccesor (4 cores)
{% endhighlight %}

5.18補充：為了每次運行不需要source兩個environment的shell script，修改運行的命令搞即可，以下列命令用sublime text開啟R的命令搞(subl可以替換成gedit or other editors)


{% highlight bash %}
sudo subl /usr/local/bin/R
{% endhighlight %}

在最上面加入這兩行即可：

{% highlight bash %}
. /opt/intel/composer_xe_2013_sp1.3.174/bin/compilervars.sh intel64
. /opt/intel/composer_xe_2013_sp1.3.174/mkl/bin/mklvars.sh intel64
{% endhighlight %}

