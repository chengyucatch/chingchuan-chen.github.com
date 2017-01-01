---
layout: post
title: "Rcpp call F77 blas/lapack"
---

剛好有點時間來研究一下Rcpp怎樣直接使用底層Fortran 77的BLAS跟LAPACK函數

我覺得最難的還是要去讀BLAS或LAPACK的文件，然後配置適當的input餵進去

我這裡就簡單demo一下怎麼樣用LAPACK的dsyevr去計算symmetric matrix的eigenvalues跟eigenvectors

裡面還是有不少配置，我沒有好好活用，不過我覺得就先這樣吧，等到有需要再慢慢深入去寫

畢竟我現在直接使用BLAS/LAPACK的場合真的不多，寫那麼底層對我真的有點困難Orz

我還是乖乖去用RcppEigen跟RcppArmadillo好了~"~

R code:

``` R
Sys.setenv("PKG_LIBS" = "$(LAPACK_LIBS) $(BLAS_LIBS) $(FLIBS)")
Rcpp::sourceCpp("eigen_sym_cpp.cpp")

n_row <- 1e4L
n_col <- 5e1L
A <- matrix(rnorm(n_row * n_col), n_row, n_col)
S <- cov(A)
out1 <- eigen_sym_cpp(S)
out2 <- eigen(S)
```

C++ code:

``` C++
#include <Rcpp.h>
#include <R_ext/Lapack.h>
#include <R_ext/BLAS.h>
 
//[[Rcpp::export]]
Rcpp::List eigen_sym_cpp(Rcpp::NumericMatrix X, int num_eig = -1, bool eigenvalues_only = false, double tol = 1.5e-8)
{
  Rcpp::NumericMatrix A = Rcpp::clone(X); // perform deep copy of input
  char jobz = eigenvalues_only?'N':'V', range = (num_eig == -1)?'A':'I', uplo = 'U';
  int N = A.nrow(), lda = std::max(1, N), il = 1, iu = (num_eig == -1)?N:num_eig;
  int m = (range == 'A')?N:(iu-il+1), ldz = std::max(1, N), lwork = std::max(1, 26*N), liwork = std::max(1, 10*N), info = 0;
  double abstol = tol, vl = 0.0, vu = 0.0;
  Rcpp::IntegerVector isuppz(2 * std::max(1, m)), iwork(std::max(1, lwork));
  Rcpp::NumericVector work(std::max(1, lwork)), W(N);
  Rcpp::NumericMatrix Z(ldz, std::max(1, m));
  F77_CALL(dsyevr)(&jobz, &range, &uplo, &N, A.begin(), &lda, &vl, &vu, &il, &iu, &abstol,
           &m, W.begin(), Z.begin(), &ldz, isuppz.begin(), work.begin(), &lwork, iwork.begin(), &liwork, &info);
  return Rcpp::List::create(Rcpp::Named("info") = info,
                            Rcpp::Named("vectors") = Z,
                            Rcpp::Named("values") = W);
}
```

後記：歡迎留言，我最近才剛把DISQUS，改成可以guest留言，加上不用審查

之前設定錯誤，造成一些問題，害我PTT信箱收了不少信Orz

希望大家新的一年，能夠善用DISQUS留言，不要再塞爆我信箱了XDD

新的一年第一篇部落格，請大家多多指教
