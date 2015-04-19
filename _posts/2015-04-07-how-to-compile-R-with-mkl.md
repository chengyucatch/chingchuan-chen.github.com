---
layout: post
cTitle: How to compile R with Intel C++ compiler and　Intel MKL
title: "how to compile R with Intel C++ compiler and　Intel MKL"
category: R
tagline:
tags: [R, MKL]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %}

I refer the following articles to compile R with intel compiler and mkl:

1. [Using Intel MKL with R](https://software.intel.com/en-us/articles/using-intel-mkl-with-r)
2. [Build R-3.0.1 with Intel C++ Compiler and Intel MKL on Linux](https://software.intel.com/en-us/articles/build-r-301-with-intel-c-compiler-and-intel-mkl-on-linux)
3. [Compiling R 3.0.1 with MKL support](http://www.r-bloggers.com/compiling-r-3-0-1-with-mkl-support/)
4. [R Installation and Administraction](http://cran.r-project.org/doc/manuals/r-devel/R-admin.html)
5. [Compile R with Intel Compiler](http://www.ansci.wisc.edu/morota/R/intel/intel-compiler.html)

<!-- more -->

At first, we test the default BLAS in R and the power of OpenBLAS. I use testing script found in [Simon Urbanek’s](http://r.research.att.com/benchmarks/) which the setup of OpenBLAS refer this website, [For faster R use OpenBLAS instead: better than ATLAS, trivial to switch to on Ubuntu](http://www.stat.cmu.edu/~nmv/2013/07/09/for-faster-r-use-openblas-instead-better-than-atlas-trivial-to-switch-to-on-ubuntu/). Before running the script, you should install the SuppDists package.

The test results are presented as following:

{% highlight R %}
Default R:

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


R with OpenBLAS:

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

We can find that the total time is decreasing from 31 seconds to 7.5 seconds, there is a big improvement. Now we try to build R with Intel C++ compiler and Intel MKL to see the power of intel MKL.

1. We need to install R and the related development packages. Use the commands in the terminal:

{% highlight bash %}
sudo add-apt-repository ppa:webupd8team/java && sudo apt-get update && sudo apt-get install oracle-java8-installer && sudo apt-get install oracle-java8-set-default
apt-cache search readline xorg-dev && sudo apt-get install libreadline6 libreadline6-dev texinfo texlive-binaries texlive-latex-base xorg-dev tcl8.6-dev tk8.6-dev libtiff5 libtiff5-dev libjpeg-dev libpng12-dev libcairo2-dev libglu1-mesa-dev libgsl0-dev libicu-dev R-base R-base-dev libnlopt-dev libstdc++6 build-essential libxml2-dev
# these two are optional and it is not needed.
# sudo apt-get install texlive-latex-extra texlive-fonts-extra
{% endhighlight %}

There is a tool which we need to install from source. To get the source code by `wget` and build it from source by following commands.

{% highlight bash %}
wget http://ftp.gnu.org/pub/gnu/libiconv/libiconv-1.14.tar.gz
tar -xvzf libiconv-1.14.tar.gz
cd libiconv-1.14 && ./configure --prefix=/usr/local/libiconv
make && sudo make install
{% endhighlight %}

However, there is an error during building, I have found the solution in google. We change the 698th line in the file libiconv-1.14/srclib/stdio.in.h.

{% highlight c %}
# original script:
_GL_WARN_ON_USE (gets, "gets is a security hole - use fgets instead");

# changed script:
#if defined(__GLIBC__) && !defined(__UCLIBC__) && !__GLIBC_PREREQ(2, 16)
 _GL_WARN_ON_USE (gets, "gets is a security hole - use fgets instead");
#endif
{% endhighlight %}

Then I successively install libiconv.

2. Download the source code of R:

The latest version of R is 3.2.0.

{% highlight bash %}
wget http://cran.rstudio.com/src/base/R-3/R-3.2.0.tar.gz
tar -xvzf R-3.2.0.tar.gz
{% endhighlight %}

Now get the environment ready and move on to build R with Intel C++ compiler and Intel MKL. Note that ubuntu 14.04 does not support 32bits compiler, you should cancel the installation of IA32 compiler when you install intel c++ compiler.

3. compilitation:

{% highlight bash %}
sudo -s
source /opt/intel/composer_xe_2015.1.133/mkl/bin/mklvars.sh intel64
source /opt/intel/composer_xe_2015.1.133/bin/compilervars.sh intel64
MKL_path=/opt/intel/composer_xe_2015.1.133/mkl
ICC_path=/opt/intel/composer_xe_2015.1.133/compiler
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
./configure --with-blas="$MKL" --with-lapack --with-x --enable-memory-profiling --with-tcl-config=/usr/lib/tcl8.6/tclConfig.sh --with-tk-config=/usr/lib/tk8.6/tkConfig.sh R_BROWSER="firefox" --enable-R-shlib --enable-BLAS-shlib --enable-prebuilt-html
make && make check
make install
exit
# remove the R installed previously
sudo rm /usr/lib/libR.so
sudo rm -r /usr/lib/R
sudo rm -r /usr/bin/R
sudo rm -r /usr/bin/Rscript
# optional to change the right to write the directory of R
# sudo chown -R celest /usr/local/lib/R
{% endhighlight %}

The new installation of R will be in the `usr/local/lib/R`.

4. test for Intel C++ compiler and Intel MKL

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

We only need 5.4 seconds to complete the test. It is faster than R with OpenBLAS. But it have taken a lot of time to compile and solve the problem of rights of user in the linux. It maybe is not worth to build with Intel MKL. I suggest that you can use RRO or R with OpenBLAS to save your time. Note that I have tested the performance of Rcpp between g++ and Intel C++ compiler, Intel C++ compiler is faster 5 to 10 times than g++. My environment is ubuntu 14.04, R 3.2.0 compiled by Intel c++, fortran compiler with MKL. My CPU is 3770K@4.3GHz.

5. Other settings about R:
To set that R use the html help page as default with `sudo subl ~/.Rprofile` and add following line to file:

{% highlight R %}
options("help_type"="html")
{% endhighlight %}

If you want to change the default language of R, you can do that:
{% highlight bash %}
subl ~/.Renviron
# Add following line into the file:
# LANGUAGE="en"
{% endhighlight %}
