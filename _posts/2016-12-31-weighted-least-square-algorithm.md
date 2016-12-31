---
layout: post
title: "Weighted Least-Square Algorithm"
---

最近一直work on locally weighted least-square

結果發現使用`gausvar`這個kernel的時候，weight會出現負的

我原本的解法是直接在input跟output都乘上根號的weight

結果這招就行不通了

另外還有再一些case下，解不是穩健的，有可能跑出虛數，但是虛數的係數其實很小...

所以就下定決心來研究一下各種WLS的解法


稍微GOOGLE了一下，發現不外乎下面四種解法：

1. 直接解，就是利用`(X^T * W * X)^(-1) * X^T * W * y`去解出迴歸係數
1. 再來就是把inverse部分用pseudo inverse代替，以避免rank不足的問題出現
1. Cholesky Decomposition (LDL Decomposition)
1. QR Decomposition

效率的話，`4 > 3 > 1 > 2`，但是QR在一些情況下會跑出虛數

所以我這裡會偏向以3為主


下面是用程式去實作各種解法：

R code:

``` R
Rcpp::sourceCpp("wls.cpp")
n <- 3e3
p <- 150
X <- matrix(rnorm(n * p), n , p)
beta <- rnorm(p)
w <- sqrt(rowMeans(X**2) - (n / (n-1)) * rowMeans(X)**2)
y <- 3 + X %*% beta + rnorm(n)

library(microbenchmark)
microbenchmark(
  eigen_llt = eigen_llt(X, w, y),
  eigen_ldlt = eigen_ldlt(X, w, y),
  eigen_fullLU = eigen_fullLU(X, w, y),
  eigen_HHQR = eigen_HHQR(X, w, y),
  eigen_colPivHHQR = eigen_colPivHHQR(X, w, y),
  eigen_fullPivHHQR = eigen_fullPivHHQR(X, w, y),
  eigen_chol_llt = eigen_chol_llt(X, w, y),
  arma_qr = arma_qr(X, w, y), # can't run if n is too big
  arma_pinv = arma_pinv(X, w, y),
  arma_chol = arma_chol(X, w, y),
  arma_direct = arma_direct(X, w, y),
  r_lm = coef(lm(y ~ -1 + X, weights = w)),
  times = 30L
)
#Unit: milliseconds
#              expr        min         lq       mean     median         uq        max neval
#         eigen_llt  11.058238  12.689018  14.149124  13.982906  15.355786  17.817171    30
#        eigen_ldlt  11.159174  11.885624  13.437352  12.940628  14.562046  17.304883    30
#      eigen_fullLU  12.250750  12.667661  14.849008  14.778841  16.804589  19.108864    30
#        eigen_HHQR  11.486851  12.342032  13.821047  14.068336  14.757776  17.555322    30
#  eigen_colPivHHQR  11.635769  12.906982  14.416562  13.775475  16.215648  18.840285    30
# eigen_fullPivHHQR  12.553851  13.307803  15.403671  14.655083  17.562929  19.163867    30
#    eigen_chol_llt  13.737879  14.170297  16.367413  15.978666  18.294937  20.462289    30
#           arma_qr 266.718062 288.134711 293.853288 293.809090 300.613079 311.078572    30
#         arma_pinv   8.234946   9.832958  10.322982  10.146301  10.730268  13.186678    30
#         arma_chol   3.189005   4.528679   4.591776   4.730990   5.020780   5.459342    30
#       arma_direct   3.052960   4.376543   4.372905   4.494302   4.703635   5.453197    30
#              r_lm  45.051851  51.599549  74.144940  55.085365 116.950143 147.734857    30
```

C++ code:

``` C++
// [[Rcpp::depends(RcppArmadillo, RcppEigen)]]
#include <RcppArmadillo.h>
#include <RcppEigen.h>
using namespace arma;

// [[Rcpp::export]]
Eigen::VectorXd eigen_fullPivHHQR(const Eigen::Map<Eigen::MatrixXd> & X,
                                  const Eigen::Map<Eigen::VectorXd> & w,
                                  const Eigen::Map<Eigen::VectorXd> & y) {
  Eigen::VectorXd beta = (X.transpose() * w.asDiagonal() * X).fullPivHouseholderQr().solve(X.transpose() * w.asDiagonal() * y);;
  return beta;
}

// [[Rcpp::export]]
Eigen::VectorXd eigen_colPivHHQR(const Eigen::Map<Eigen::MatrixXd> & X,
                                 const Eigen::Map<Eigen::VectorXd> & w,
                                 const Eigen::Map<Eigen::VectorXd> & y) {
  Eigen::VectorXd beta = (X.transpose() * w.asDiagonal() * X).colPivHouseholderQr().solve(X.transpose() * w.asDiagonal() * y);;
  return beta;
}

// [[Rcpp::export]]
Eigen::VectorXd eigen_HHQR(const Eigen::Map<Eigen::MatrixXd> & X,
                           const Eigen::Map<Eigen::VectorXd> & w,
                           const Eigen::Map<Eigen::VectorXd> & y) {
  Eigen::VectorXd beta = (X.transpose() * w.asDiagonal() * X).householderQr().solve(X.transpose() * w.asDiagonal() * y);
  return beta;
}

// [[Rcpp::export]]
Eigen::VectorXd eigen_fullLU(const Eigen::Map<Eigen::MatrixXd> & X, 
                             const Eigen::Map<Eigen::VectorXd> & w, 
                             const Eigen::Map<Eigen::VectorXd> & y) {
  Eigen::VectorXd beta = (X.transpose() * w.asDiagonal() * X).fullPivLu().solve(X.transpose() * w.asDiagonal() * y);
  return beta;
}
  
// [[Rcpp::export]]
Eigen::VectorXd eigen_llt(const Eigen::Map<Eigen::MatrixXd> & X, 
                          const Eigen::Map<Eigen::VectorXd> & w, 
                          const Eigen::Map<Eigen::VectorXd> & y) {
  Eigen::VectorXd beta = (X.transpose() * w.asDiagonal() * X).llt().solve(X.transpose() * w.asDiagonal() * y);
  return beta;
}

// [[Rcpp::export]]
Eigen::VectorXd eigen_ldlt(const Eigen::Map<Eigen::MatrixXd> & X, 
                           const Eigen::Map<Eigen::VectorXd> & w, 
                           const Eigen::Map<Eigen::VectorXd> & y) {
  Eigen::VectorXd beta = (X.transpose() * w.asDiagonal() * X).ldlt().solve(X.transpose() * w.asDiagonal() * y);
  return beta;
}

// [[Rcpp::export]]
Eigen::VectorXd eigen_chol_llt1(const Eigen::Map<Eigen::MatrixXd> & X,
                                const Eigen::Map<Eigen::VectorXd> & w,
                                const Eigen::Map<Eigen::VectorXd> & y) {
  Eigen::MatrixXd XWX = X.transpose() * w.asDiagonal() * X;
  Eigen::MatrixXd R = XWX.llt().matrixU();
  Eigen::VectorXd XWY = X.transpose() * (w.array() * y.array()).matrix();
  Eigen::VectorXd beta = R.householderQr().solve(R.transpose().householderQr().solve(XWY));
  return beta;
}

// [[Rcpp::export]]
Eigen::VectorXd eigen_chol_llt2(const Eigen::Map<Eigen::MatrixXd> & X,
                                const Eigen::Map<Eigen::VectorXd> & w,
                                const Eigen::Map<Eigen::VectorXd> & y) {
  Eigen::MatrixXd XW = X.transpose() * w.asDiagonal();
  Eigen::MatrixXd R = (XW * X).llt().matrixU();
  Eigen::VectorXd beta = R.householderQr().solve(R.transpose().householderQr().solve(XW * y));
  return beta;
}

// [[Rcpp::export]]
Eigen::VectorXd eigen_chol_llt3(const Eigen::Map<Eigen::MatrixXd> & X,
                                const Eigen::Map<Eigen::VectorXd> & w,
                                const Eigen::Map<Eigen::VectorXd> & y) {
  Eigen::MatrixXd XW(X.cols(), X.rows());
  for (unsigned int i = 0; i < X.cols(); ++i)
    XW.row(i) = X.col(i).array() * w.array();
  Eigen::MatrixXd R = (XW * X).llt().matrixU();
  Eigen::VectorXd beta = R.householderQr().solve(R.transpose().householderQr().solve(XW * y));
  return beta;
}

// [[Rcpp::export]]
Eigen::VectorXd eigen_colPivHHQR2(const Eigen::Map<Eigen::MatrixXd> & X,
                                  const Eigen::Map<Eigen::VectorXd> & w,
                                  const Eigen::Map<Eigen::VectorXd> & y) {
  Eigen::VectorXd sw = w.cwiseSqrt();
  Eigen::MatrixXd XW(X.rows(), X.cols());
  for (unsigned int i = 0; i < X.cols(); ++i)
    XW.col(i) = X.col(i).array() * sw.array();
  Eigen::VectorXd beta = XW.colPivHouseholderQr().solve(y.cwiseProduct(sw));
  return beta;
}

// [[Rcpp::export]]
arma::vec arma_qr(const arma::mat& X, const arma::vec& w, const arma::vec& y) {
  mat Q, R;
  qr(Q, R, X.each_col() % sqrt(w));
  vec p = solve(R.head_rows(X.n_cols), Q.head_cols(X.n_cols).t() * (y % sqrt(w)));
  return p;
}

// [[Rcpp::export]]
arma::vec arma_pinv(const arma::mat& X, const arma::vec& w, const arma::vec& y) {
  vec p = pinv(X.t() * (repmat(w, 1, X.n_cols) % X)) * X.t() * (w % y);
  return p;
}

// [[Rcpp::export]]
arma::vec arma_chol1(const arma::mat& X, const arma::vec& w, const arma::vec& y) {
  mat R = chol((X.each_col() % w).t() * X);
  vec p = solve(R, solve(R.t(), X.t() * (w % y), solve_opts::fast), solve_opts::fast);
  return p;
}

// [[Rcpp::export]]
arma::vec arma_chol2(const arma::mat& X, const arma::vec& w, const arma::vec& y) {
  mat XW = (X.each_col() % w).t();
  mat R = chol(XW * X);
  vec p = solve(R, solve(R.t(), XW * y, solve_opts::fast), solve_opts::fast);
  return p;
}

// [[Rcpp::export]]
arma::vec arma_direct1(const arma::mat& X, const arma::vec& w, const arma::vec& y) {
  vec sw = sqrt(w);
  vec p = solve(X.each_col() % sw, y % sw);
  return p;
}

// [[Rcpp::export]]
arma::vec arma_direct2(const arma::mat& X, const arma::vec& w, const arma::vec& y) {
  vec p = solve((X.each_col() % w).t() * X, X.t() * (w % y));
  return p;
}
```

這裡的QR解得很慢，我不知道要怎麼樣讓armadillo只輸出跟rank一樣多的Q，R矩陣就好

而直接解會是最快的，我猜這原因是裡面某部分有被優化過了...

不然以程式來看，Cholesky Decomposition的performance是最好的

只是我也不解的是Eigen也用一樣的方法去做

卻比Armadillo手動去寫慢了好幾倍 (eigen_chol_llt vs arma_chol)

不確定是不是Eigen在solve linear system時用不一樣的LAPACK函數

或是Eigen在這做了比較多check

這裡就留給後人慢慢玩賞QQ
