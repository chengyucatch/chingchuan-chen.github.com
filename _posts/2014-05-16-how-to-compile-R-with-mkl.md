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

<!-- more -->

開始之前，先用Default R and R with Openblas來測試看看，I use testing script found in [Simon Urbanek’s](http://r.research.att.com/benchmarks/)，Openblas部份參考這個網站[For faster R use OpenBLAS instead: better than ATLAS, trivial to switch to on Ubuntu](http://www.stat.cmu.edu/~nmv/2013/07/09/for-faster-r-use-openblas-instead-better-than-atlas-trivial-to-switch-to-on-ubuntu/)。

PS: 運行測試前，記得打開R安裝SuppDists的套件。

測試結果如下：
Default R：

```
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
```

R with Openblas:

```
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
```

可以看到total time已經從38秒到10秒左右，改善幅度已經不少，接著來compile R:

1. 取得R與其開發包，並安裝需要的套件，在terminal use following commands:

```
sudo apt-get install R-base R-base-dev
apt-cache search readline xorg-dev sudo apt-get install libreadline6 libreadline6-dev texinfo texlive-binaries openjdk-7-jdk xorg-dev
```

有一個工具要另外安裝，方式如下：

```
wget http://ftp.gnu.org/pub/gnu/libiconv/libiconv-1.14.tar.gz
tar -xvzf libiconv-1.14.tar.gz
cd libiconv-1.14 && ./configure --prefix=/usr/local/libiconv
make && sudo make install
```

但是我在make過程中有出錯，我google之後找到的解法是修改libiconv-1.14/srclib/stdio.in.h的698列:
原本的script:

```
_GL_WARN_ON_USE (gets, "gets is a security hole - use fgets instead");
```

修改後的scipt:

```
#if defined(__GLIBC__) && !defined(__UCLIBC__) && !__GLIBC_PREREQ(2, 16)
 _GL_WARN_ON_USE (gets, "gets is a security hole - use fgets instead");
#endif
```

之後再重新make就成功了。

2. 取得R source code:

```
wget http://cran.csie.ntu.edu.tw/src/base/R-3/R-3.1.0.tar.gz
tar -xvzf R-3.1.0.tar.gz
```

3. 取得Intel C++ compiler and Intel MKL，你可以取得non-commercial license for this two software in intel website. 安裝前記得先取得需要的套件：

```
sudo apt-get install build-essential libstdc++6
```

另外，ubuntu 14.04不支援32 bits的compiler，安裝時記得取消掉IA32的安裝。

4. compilitation:

```
sudo -s
source /opt/intel/composer_xe_2013_sp1.3.174/mkl/bin/mklvars.sh intel64
source /opt/intel/composer_xe_2013_sp1.3.174/bin/compilervars.sh intel64
export LD="xild"
export CC="icc"
export CXX="icpc"
export AR="xiar"
export CFLAGS="-O3 -ipo -openmp -xHost"
export CXXFLAGS="-O3 -ipo -openmp -xHost"

MKL="-lmkl_gf_lp64 -lmkl_intel_thread -lmkl_core -liomp5 -lpthread"
MKL_path="/opt/intel/composer_xe_2013_sp1.3.174/mkl/lib/intel64"
./configure --with-blas="-L${MKL_path} ${MKL}" --with-lapack --enable-R-shlib --with-x
make
make install
```

然後他就會幫你把R安裝於usr/local/lib/R中，你之前如果有安裝過R，就記得把/usr/lib/R的目錄刪掉。

5. 測試結果

```
   R Benchmark 2.5
   ===============
Number of times each test is run__________________________:  3

   I. Matrix calculation
   ---------------------
Creation, transp., deformation of a 2500x2500 matrix (sec):  1.03666666666667
2400x2400 normal distributed random matrix ^1000____ (sec):  0.353666666666667
Sorting of 7,000,000 random values__________________ (sec):  0.699666666666666
2800x2800 cross-product matrix (b = a' * a)_________ (sec):  0.515
Linear regr. over a 3000x3000 matrix (c = a \ b')___ (sec):  0.431999999999999
                      --------------------------------------------
                 Trimmed geom. mean (2 extremes eliminated):  0.537932008193843

   II. Matrix functions
   --------------------
FFT over 2,400,000 random values____________________ (sec):  0.568666666666667
Eigenvalues of a 640x640 random matrix______________ (sec):  0.582333333333332
Determinant of a 2500x2500 random matrix____________ (sec):  0.408666666666668
Cholesky decomposition of a 3000x3000 matrix________ (sec):  0.238999999999997
Inverse of a 1600x1600 random matrix________________ (sec):  0.307999999999997
                      --------------------------------------------
                Trimmed geom. mean (2 extremes eliminated):  0.415201806764736

   III. Programmation
   ------------------
3,500,000 Fibonacci numbers calculation (vector calc)(sec):  0.357666666666667
Creation of a 3000x3000 Hilbert matrix (matrix calc) (sec):  0.278333333333334
Grand common divisors of 400,000 pairs (recursion)__ (sec):  0.933666666666667
Creation of a 500x500 Toeplitz matrix (loops)_______ (sec):  0.480000000000002
Escoufier's method on a 45x45 matrix (mixed)________ (sec):  0.618000000000002
                      --------------------------------------------
                Trimmed geom. mean (2 extremes eliminated):  0.473408509296706


Total time for all 15 tests_________________________ (sec):  7.81133333333333
Overall mean (sum of I, II and III trimmed means/3)_ (sec):  0.472869054369258
                      --- End of test ---

89.84 user 
4.00 system 
0:48.90 elapsed 
191% CPU
```

最後只需要用到7.8秒就可以完成了，可是complitation過程是滿麻煩的，雖然參考了4個網站，可是有些東西長的都不一樣，所以還是弄了很久才成功compile成功，如果沒有特別要求速度下，其實直接用openblas就可以省下很多麻煩。另外，若使用Rcpp的話，速度也會大幅提升(因為用intel C++ compiler)。

最後附上測試環境:

windows 7 64 bits

i7-3770K@4.3GHz

use VMware workstation 10: ubuntu 14.04 with 2 porccesor (4 cores)


