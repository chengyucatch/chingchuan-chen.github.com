---
layout: post
cTitle: Rcpp Attributes
title: "Rcpp Attributes"
category: R
tagline:
tags: [R]
cssdemo: 2014-spring
published: true
---

Recently, I went to the 23th STSC, I got some information about the new API of Rcpp, Rcpp attributes. I had tried some examples and it worked well. Here I demonstrate some examples.

{% include JB/setup %}

First example: call the pnorm function in Rcpp:

{% highlight R %}
require(Rcpp)
sourceCpp(code = '#include <Rcpp.h>
using namespace Rcpp;

// [[Rcpp::export]]
DataFrame mypnorm(NumericVector x){
  int n = x.size();
  NumericVector y1(n), y2(n), y3(n);

  for (int i=0; i<n; i++){
    y1[i] = ::Rf_pnorm5(x[i], 0.0, 1.0, 1, 0);
    y2[i] = R::pnorm(x[i], 0.0, 1.0, 1, 0);
  }
  y3 = pnorm(x);
  return DataFrame::create(Named("R") = y1,
               Named("Rf_") = y2,
               Named("sugar") = y3);
}', showOutput = TRUE)
mypnorm(runif(10, -3, 3))
{% endhighlight %}

Rcpp attributes allows user to write Rcpp in a simple way. User does not need to learn about how to write R extension. Just write a cpp script and add the line `// [[Rcpp::export]]`, then user can use the function in R.

Next two example is about the two extension packages of Rcpp, RcppArmadillo and RcppEigen. The two packages provide Rcpp to link the C++ linear algebra libraries, armadillo and Eigen.

{% highlight R %}
sourceCpp(code = '
// [[Rcpp::depends(RcppArmadillo)]]
#include <RcppArmadillo.h>
using namespace Rcpp;
// [[Rcpp::export]]

List fastLm_RcppArma(NumericVector yr, NumericMatrix Xr) {
  int n = Xr.nrow(), k = Xr.ncol();
  arma::mat X(Xr.begin(), n, k, false);
  arma::colvec y(yr.begin(), yr.size(), false);
  arma::colvec coef = arma::solve(X, y);
  arma::colvec resid = y - X*coef;
  double sig2 = arma::as_scalar(arma::trans(resid)*resid/(n-k));
  arma::colvec stderrest = arma::sqrt(sig2 * arma::diagvec( arma::inv(arma::trans(X)*X)));
  return List::create(Named("coefficients") = coef,
              Named("stderr") = stderrest);
}')

sourceCpp(code = '
    // [[Rcpp::depends(RcppEigen)]]
#include <RcppEigen.h>
using namespace Rcpp;
using Eigen::Map;
using Eigen::MatrixXd;
using Eigen::VectorXd;
// [[Rcpp::export]]

List fastLm_RcppEigen(NumericVector yr, NumericMatrix Xr) {
  const Map<MatrixXd> X(as<Map<MatrixXd> >(Xr));
  const Map<VectorXd> y(as<Map<VectorXd> >(yr));
  int n = Xr.nrow(), k = Xr.ncol();
  VectorXd coef = (X.transpose() * X).llt().solve(X.transpose() * y.col(0));
  VectorXd resid = y - X*coef;
  double sig2 = resid.squaredNorm() / (n - k);
  VectorXd stderrest = (sig2 * ((X.transpose() * X).inverse()).diagonal()).array().sqrt();
  return List::create(Named("coefficients") = coef,
            Named("stderr") = stderrest);
}')
N = 10000
p = 100
X = matrix(rnorm(N*p), ncol = p)
y = X %*% 10**(sample(seq(-5, 1, length = N+p), p)) + rnorm(100)

t_arma = Sys.time()
temp_arma = fastLm_RcppArma(y, X)
t_arma = Sys.time() - t_arma

t_eigen = Sys.time()
temp_eigen = fastLm_RcppEigen(y, X)
t_eigen = Sys.time() - t_eigen

t_lm = Sys.time()
temp_lm = lm(y~X - 1)
t_lm = Sys.time() - t_lm

c(t_arma, t_eigen, t_lm)
# [1] 0.02414227 0.02660918 0.27163768
{% endhighlight %}

The cpp functions are faster 10 times than R function, lm. My environment is ubuntu 14.04, R 3.1.1 compiled by intel c++, fortran compiler with MKL. My CPU is 3770K@4.3GHz. I think that Rcpp attributes is the package worthiest to learn if you want to use R to do statistical computing or machine learning.


