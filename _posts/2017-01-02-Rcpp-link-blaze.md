---
layout: post
title: "Rcpp Link Blaze"
---

Blaze claim it is fast. [Link](https://bitbucket.org/blaze-lib/blaze/wiki/Benchmarks)

所以我就來試試看Rcpp去link玩玩看

看看有沒有大神會把它弄成一個套件，叫做RcppBlaze之類

我試了一下blaze-3.0，怎樣都無法編譯Orz

我就改用上一版的blaze-2.6，不過還是有些地方需要更動

要變動的地方有兩個，一個是`blaze/util/Memory.h`，另一個是`blaze/math/adaptors/hermitianmatrix/HermitianValue.h`

Memory.h:

``` c++
// 在57行增加下面幾行
#ifdef __MINGW32__ 
#define _aligned_malloc __mingw_aligned_malloc 
#define _aligned_free  __mingw_aligned_free 
#endif

// 84行跟112行原本是#if defined(_MSC_VER)改成：
#if defined(_MSC_VER) || defined(__MINGW32__)
```

HermitianValue.h:

``` c++
// 279, 299, 323, 347, 371, 395, 513行原本是 pos_->index() == index改成：
pos_->index() == index_
```

然後就可以快樂的開始玩blaze了

只是我還沒測試要怎麼樣把blaze輸出到R XDD

不過我想應該不是難事就是，找一下RcppEigen或是RcppArmadillo的輸出方式就好了~~

R code:

``` R
Sys.setenv("PKG_LIBS" = "-Iblaze $(LAPACK_LIBS) $(BLAS_LIBS) $(FLIBS)")
Rcpp::sourceCpp("test_blaze.cpp")
test_blaze1(1:5)
test_blaze1(rnorm(5))

test_blaze2(matrix(1:9, 3, 3))
test_blaze2(matrix(rnorm(9), 3, 3))
```

test_blaze.cpp:

``` c++
// [[Rcpp::depends(BH)]]
// [[Rcpp::plugins(cpp11)]]
#include <Rcpp.h>
#include <iostream>
#include <blaze/Math.h>

//[[Rcpp::export]]
Rcpp::NumericVector test_blaze1(Rcpp::NumericVector X){
  blaze::CustomVector<double, blaze::unaligned, blaze::unpadded> v( &X[0], X.size() );
  Rcpp::Rcout << v[0] << std::endl;
  Rcpp::Rcout << v[1] << std::endl;
  Rcpp::Rcout << v[2] << std::endl;
  Rcpp::Rcout << v[3] << std::endl;
  Rcpp::Rcout << v[4] << std::endl;
  return X;
}

//[[Rcpp::export]]
Rcpp::NumericMatrix test_blaze2(Rcpp::NumericMatrix X){
  blaze::CustomMatrix<double, blaze::unaligned, blaze::unpadded, blaze::columnMajor> v( &X[0], X.nrow(), X.ncol() );
  Rcpp::Rcout << v(0, 0) << std::endl;
  Rcpp::Rcout << v(0, 1) << std::endl;
  Rcpp::Rcout << v(0, 2) << std::endl;
  Rcpp::Rcout << v(1, 0) << std::endl;
  Rcpp::Rcout << v(1, 1) << std::endl;
  Rcpp::Rcout << v(1, 2) << std::endl;
  return X;
}
```
