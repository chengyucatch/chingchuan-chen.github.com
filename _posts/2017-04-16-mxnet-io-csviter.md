---
layout: post
title: MxNet所提供的data iterator: mx.io.CSVIter
---

這篇是參考mxnet的一個example來的[來源](https://github.com/dmlc/mxnet/tree/e7514fe1b3265aaf15870b124bb6ed0edd82fa76/example/kaggle-ndsb2)

而該篇所使用的資料是這一個比賽NDSB-II所提供的，[請點我](https://www.kaggle.com/c/second-annual-data-science-bowl/data)

登入Kaggle把Data裡面的四個zip下載下來

1. `sample_submission_validate.csv.zip`
1. `train.csv.zip`
1. `train.zip`
1. `validate.zip`

MxNet提供了一個Python去做Preprocessing

因為MxNet沒有提供R版本，所以我就寫了一版R的processing放在github上[Repo連結](https://github.com/ChingChuan-Chen/mxnet-kaggle-ndsb2-example)

從Kaggle下載zip下來之後，放到一個資料夾(為了說明方便，這個資料夾就叫做root path)裡面

然後在root path下開一個cpp資料夾，裡面放下面七個檔案(或是直接從我的github clone下來)：

chkValue.Cpp:

``` cpp
#include <string>
#include <sstream>
#include <Rcpp.h>

template <typename T>
std::string num2str(T Number) {
  std::ostringstream ss;
  ss << Number;
  return ss.str();
}

// [[Rcpp::export]]
void checkValue(SEXP x, const std::string varName = "x", const int RTYPE = 14, const int len = -1) {
  int n = LENGTH(x);
  if (len > 0) {
    if (n != len)
      Rcpp::stop("The length of " + varName + " must be " + num2str(len) + "!\n");
  }
  if (TYPEOF(x) != RTYPE) {
    switch(RTYPE) {
    case LGLSXP:
      Rcpp::stop(varName + " must be logical type!\n");
    case INTSXP:
      Rcpp::stop(varName + " must be integer type!\n");
    case REALSXP:
      Rcpp::stop(varName + " must be double type!\n");
    case STRSXP:
      Rcpp::stop(varName + " must be string type!\n");
    case CPLXSXP:
      Rcpp::stop(varName + " must be complex type!\n");
    default:
      Rcpp::stop("Not supported type!\n");
    }
  }
  for (int i = 0; i < n; i++) {
    switch(TYPEOF(x)) {
    case LGLSXP:
      if (LOGICAL(x)[i] == NA_LOGICAL)
        Rcpp::stop(varName + " must not contain NA!\n");
      break;
    case INTSXP:
      if (INTEGER(x)[i] == NA_INTEGER)
        Rcpp::stop(varName + " must not contain NA!\n");
      break;
    case REALSXP:
      if (ISNA(REAL(x)[i]) || ISNAN(REAL(x)[i]) || !R_FINITE(REAL(x)[i]))
        Rcpp::stop(varName + " must not contain NA, NaN or Inf!\n");
      break;
    case STRSXP:
      if (STRING_ELT(x, i) == NA_STRING)
        Rcpp::stop(varName + " must not contain NA!\n");
      break;
    case CPLXSXP:
      if (ISNA(COMPLEX(x)[i].r) || ISNAN(COMPLEX(x)[i].r) || !R_FINITE(COMPLEX(x)[i].r) ||
          ISNA(COMPLEX(x)[i].i) || ISNAN(COMPLEX(x)[i].i) || !R_FINITE(COMPLEX(x)[i].i))
        Rcpp::stop(varName + " must not contain NA, NaN or Inf!\n");
      break;
    default:
      Rcpp::stop("Not supported type!\n");
    }
  }
}

// [[Rcpp::export]]
void checkValueNum(SEXP x, const std::string varName = "x", const int len = -1) {
  if (TYPEOF(x) == INTSXP) {
    checkValue(x, varName, INTSXP, len);
  } else if (TYPEOF(x) == REALSXP) {
    checkValue(x, varName, REALSXP, len);
  }
}

// [[Rcpp::export]]
void checkValueInt(const double& x, const std::string varName = "x", bool positive = false, bool zero = true) {
  if (ISNA(x) || ISNAN(x) || !R_FINITE(x) || std::abs(x - std::floor(x)) > 1e-6)
    Rcpp::stop(varName + " cannot be NA, NaN or Inf and must be a integer!\n");

  if (positive && zero && x < 0) {
    Rcpp::stop(varName + " must be a positive integer.\n");
  } else if (positive && !zero && x <= 0) {
    Rcpp::stop(varName + " must be a non-negative integer.\n");
  }
}
```

checkValue.h:

``` cpp
#ifndef CHECK_H_
#define CHECK_H_

#include <RcppArmadillo.h>
// [[Rcpp::depends(RcppArmadillo)]]

void checkValue(SEXP x, const std::string varName = "x", const int RTYPE = 14, const int len = -1);
void checkValueNum(SEXP x, const std::string varName = "x", const int len = -1);
void checkValueInt(const double& x, const std::string varName = "x", bool positive = false, bool zero = true);

#endif
```

common.cpp:

``` cpp
#include "common.h"
#include <RcppArmadillo.h>
// [[Rcpp::depends(RcppArmadillo)]]

void RMessage(const std::string& msg) {
  Rcpp::Function messageFunc("message");
  messageFunc(msg);
}

SEXP asMatrix(SEXP x) {
  SEXP xDim = Rf_getAttrib(x, R_DimSymbol);
  if (Rf_isNull(xDim)) {
    SEXP x2 = PROTECT(Rf_duplicate(x));
    UNPROTECT(1);
    arma::Col<int> dim(2);
    dim << LENGTH(x) << 1 << arma::endr;
    Rf_setAttrib(x2, R_DimSymbol, Rcpp::wrap(dim));
    return(x2);
  } else {
    return(x);
  }
}

SEXP asVector(arma::mat x) {
  if (x.n_cols == 1 || x.n_rows == 1) {
    SEXP out = Rcpp::wrap(x);
    Rf_setAttrib(out, R_DimSymbol, R_NilValue);
    return out;
  } else {
    return Rcpp::wrap(x);
  }
}

arma::umat lookup(const arma::vec& edges, const arma::mat& x) {
  if (!edges.is_sorted())
    Rcpp::stop("edges is not strictly monotonic increasing.");

  arma::umat idx(size(x));
  const double* pos;
  for (arma::uword i = 0; i < x.n_elem; ++i) {
    pos = std::upper_bound(edges.begin(), edges.end(), x(i));
    idx(i) = std::distance(edges.begin(), pos);
  }
  return idx;
}
```

common.h:

``` cpp
#ifndef COMMON_H_
#define COMMON_H_

#include <RcppArmadillo.h>
// [[Rcpp::depends(RcppArmadillo)]]

void RMessage(const std::string& msg);
SEXP asMatrix(SEXP x);
SEXP asVector(arma::mat x);
arma::umat lookup(const arma::vec& edges, const arma::mat& x);

#endif
```

interp.cpp:

``` cpp
#include "common.h"
#include "checkValue.h"
#include <RcppArmadillo.h>
#include <string>
// [[Rcpp::depends(RcppArmadillo)]]

arma::mat splineFunc(const arma::vec& x, const arma::mat& y, const arma::vec& xi) {
  arma::uword n = x.n_elem;
  if (n < 2)
    Rcpp::stop("spline: requires at least two non-NA values.");

  arma::mat a = y;
  arma::uvec szy(2);
  szy << y.n_rows << y.n_cols << arma::endr;
  if (szy(1) == n && szy(0) != n+2 && szy(0) != n && szy(0) >= 1)
    arma::inplace_trans(a);
  if (szy(1) == n+2 && szy(0) != n+2 && szy(0) != n && szy(0) >= 1)
    arma::inplace_trans(a);
  if (x.n_elem != a.n_rows && a.n_rows != x.n_elem+2)
    Rcpp::stop("The number of rows of y must be equal to the length of x.\n");

  bool complete = false;
  arma::rowvec dfs, dfe;
  if (a.n_rows == n+2) {
    complete = true;
    dfs = a.row(0);
    dfe = a.row(a.n_rows-1);
    a = a.rows(1, a.n_rows-2);
  }

  if (!x.is_sorted())
    RMessage("x are not strictly monotonic increasing.\nx will be sorted.");
  arma::uvec xu_idx = arma::find_unique(x);
  arma::vec xu = x(xu_idx);
  arma::mat au = a.rows(xu_idx);
  if (xu.n_elem != x.n_elem) {
    RMessage("The grid vectors are not strictly monotonic increasing.");
    RMessage("The values of y for duplicated values of x will be averaged.");
    for (arma::uword k = 0; k < xu.n_elem; ++k)
      au.row(k) = arma::mean(a.rows(arma::find(x == xu(k))));
    n = xu_idx.n_elem;
  }
  if (!xu.is_sorted()) {
    arma::uvec si = arma::sort_index(xu);
    xu = xu(si);
    au = au.rows(si);
  }

  arma::mat ca, cb, cc, cd;
  arma::vec xou = xu, h = arma::diff(xu);
  if (complete) {
    if (n == 2) {
      cd = (dfs + dfe) / std::pow(xu(1) - xu(0), 2.0) +
        2.0 * (au.row(0) - au.row(1)) / std::pow(xu(1) - xu(0), 3.0);
      cc = (-2.0 * dfs - dfe) / (xu(1) - xu(0)) -
        3.0 * (au.row(0) - au.row(1)) / std::pow(xu(1) - xu(0), 2.0);
      cb = dfs;
      ca = au.row(0);
    } else {
      arma::mat g = arma::zeros<arma::mat>(n, au.n_cols);
      g.row(0) = (au.row(1) - au.row(0)) / h(0) - dfs;
      g.rows(1, n-2) = (au.rows(2, n-1) - au.rows(1, n-2)) / repmat(h.subvec(1, n-2), 1, au.n_cols) -
        (au.rows(1, n-2) - a.rows(0, n-3)) / repmat(h.subvec(0, n-3), 1, au.n_cols);
      g.row(n-1) = dfe-(au.row(n-1) - au.row(n-2)) / h(n-2);

      ca = au;
      cc = arma::solve(arma::diagmat(h/6.0, -1) +
        arma::diagmat(arma::join_cols(arma::join_cols(h(0)/3 * arma::ones<arma::vec>(1), (h.head(n-2) + h.tail(n-2))/3),
                                      h(n-2)/3.0*arma::ones<arma::vec>(1))) + arma::diagmat(h/6.0, 1), 0.5 * g);
      cb = arma::diff(au) / arma::repmat(h.head(n-1), 1, au.n_cols) -
        arma::repmat(h.head(n-1), 1, au.n_cols) / 3.0 % (cc.rows(1, n-1) + 2 * cc.rows(0, n-2));
      cd = arma::diff(cc) / (3.0 * arma::repmat(h.head(n-1), 1, au.n_cols));
      ca = ca.head_rows(n-1);
      cb = cb.head_rows(n-1);
      cc = cc.head_rows(n-1);
      cd = cd.head_rows(n-1);
    }
  } else {
    if (n == 2) {
      cd.zeros(1, au.n_cols);
      cc.zeros(1, au.n_cols);
      cb = (au.row(1) - au.row(0)) / (xu(1) - xu(0));
      ca = au.row(0);
    } else if (n == 3) {
      n = 2;
      cd.zeros(1, au.n_cols);
      cc = (au.row(0) - au.row(2)) / ((xu(2) - xu(0)) * (xu(1) - xu(2))) +
        (au.row(1) - au.row(0)) / ((xu(1) - xu(0)) * (xu(1) - xu(2)));
      cb = (au.row(1) - au.row(0)) * (xu(2) - xu(0)) /  ((xu(1) - xu(0)) * (xu(2) - xu(1))) +
        (au.row(0) - au.row(2)) * (xu(1) - xu(0)) /  ((xu(2) - xu(0)) * (xu(2) - xu(1)));
      ca = au.row(0);
      xou << arma::min(x) << arma::max(x) << arma::endr;
    } else {
      arma::mat g = arma::zeros<arma::mat>(n-2, au.n_cols);
      g.row(0) = 3.0 / (h(0) + h(1)) *
        (au.row(2) - au.row(1) - h(1) / h(0) * (au.row(1) - au.row(0)));
      g.row(n-3) = 3.0 / (h(n-2) + h(n-3)) *
        (h(n-3) / h(n-2) * (au.row(n-1) - au.row(n-2)) - (au.row(n-2) - au.row(n-3)));

      if (n > 4) {
        cc.zeros(n, au.n_cols);
        g.rows(1, n-4) = 3.0 * arma::diff(au.rows(2, n-2)) / arma::repmat(h.subvec(2, n-3), 1, au.n_cols) -
          3.0 * diff(au.rows(1, n-3)) / arma::repmat(h.subvec(1, n-4), 1, au.n_cols);

        arma::vec dg = 2.0 * (h.head(n-2) + h.tail(n-2)),
          ldg = h.subvec(1, n-3), udg = h.subvec(1, n-3);
        dg(0) = dg(0) - h(0);
        dg(n-3) = dg(n-3) - h(n-2);
        udg(0) = udg(0) - h(0);
        ldg(n-4) = ldg(n-4) - h(n-2);
        cc.rows(1, n-2) = solve(diagmat(ldg, -1) + diagmat(dg) + diagmat(udg, 1), g);
      } else {
        cc.zeros(n, au.n_cols);
        arma::mat tmp(2, 2);
        tmp << h(0) + 2.0 * h(1) << h(1) - h(0) << arma::endr
            << h(1) - h(2) << 2.0 * h(1) + h(2) << arma::endr;
        cc.rows(1, 2) = solve(tmp, g);
      }

      ca = au;
      cc.row(0) = cc.row(1) + h(0) / h(1) * (cc.row(1) - cc.row(2));
      cc.row(n-1) = cc.row(n-2) + h(n-2) / h(n-3) * (cc.row(n-2) - cc.row(n-3));
      cb = arma::diff(ca);
      cb.each_col() /= h.head(n-1);
      cb -= arma::repmat(h.head(n-1), 1, au.n_cols) / 3.0 % (cc.rows(1, n-1) + 2.0 * cc.rows(0, n-2));
      cd = arma::diff(cc) / 3.0;
      cd.each_col() /= h.head(n-1);
      ca = ca.head_rows(n-1);
      cb = cb.head_rows(n-1);
      cc = cc.head_rows(n-1);
      cd = cd.head_rows(n-1);
    }
  }

  arma::uvec idx = arma::zeros<arma::uvec>(xi.n_elem);
  for (arma::uword i = 1; i < xou.n_elem-1; ++i)
    idx.elem(find(xou(i) <= xi)).fill(i);
  arma::mat s_mat = repmat(xi - xou.elem(idx), 1, au.n_cols);
  arma::mat ret = ca.rows(idx) + s_mat % cb.rows(idx) + square(s_mat) % cc.rows(idx) +
    pow(s_mat, 3) % cd.rows(idx);
  return ret;
}

arma::mat interp1Func(const arma::vec& x, const arma::mat& y, const arma::vec& xi, const std::string& method) {
  arma::uword n = x.n_elem;
  arma::mat a = y;
  arma::uvec szy(2);
  szy << y.n_rows << y.n_cols << arma::endr;
  if (szy(1) == n && szy(0) != n+2 && szy(0) != n && szy(0) != 1)
    inplace_trans(a);
  if (x.n_elem != a.n_rows)
    Rcpp::stop("The number of rows of y must be equal to the length of x.\n");

  if (!x.is_sorted())
    RMessage("x are not strictly monotonic increasing.\nx will be sorted.");
  arma::uvec xu_idx = find_unique(x);
  arma::vec xu = x(xu_idx);
  arma::mat au = a.rows(xu_idx);
  if (xu.n_elem != x.n_elem) {
    RMessage("The grid vectors are not strictly monotonic increasing.");
    RMessage("The values of y for duplicated values of x will be averaged.");
    for (arma::uword k = 0; k < xu.n_elem; ++k)
      au.row(k) = arma::mean(a.rows(arma::find(x == xu(k))));
  }
  if (!xu.is_sorted()) {
    arma::uvec si = arma::sort_index(xu);
    xu = xu(si);
    au = au.rows(si);
  }

  arma::mat yi;
  if (method == "linear") {
    if (x.n_elem <= 1)
      Rcpp::stop("interp1 - linear: requires at least two non-NA values.\n");
    arma::mat cb = arma::diff(au) / arma::repmat(diff(xu), 1, au.n_cols);
    arma::mat ca = au.rows(0, xu.n_elem-2);
    arma::uvec idx = arma::zeros<arma::uvec>(xi.n_elem);
    for (arma::uword i = 1; i < xu.n_elem-1; ++i)
      idx.elem(arma::find(xu(i) <= xi)).fill(i);
    arma::mat s_mat = arma::repmat(xi - xu.elem(idx), 1, au.n_cols);
    yi = ca.rows(idx) + s_mat % cb.rows(idx);
  } else if (method ==  "spline") {
    yi = splineFunc(xu, au, xi);
  } else {
    Rcpp::stop("Method only support linear and spline.\n");
  }
  return yi;
}

arma::mat interp2Func(const arma::vec& x, const arma::vec& y, const arma::mat& v,
                      const arma::vec& xi, const arma::vec& yi, const std::string& method) {
  if (x.n_elem != v.n_cols)
    Rcpp::stop("The number of columns of v must be equal to the length of x.");
  if (y.n_elem != v.n_rows)
    Rcpp::stop("The number of rows of v must be equal to the length of y.");
  if (!x.is_sorted())
    RMessage("x are not strictly monotonic increasing.\nx will be sorted.");
  if (method != "linear" && method != "spline")
    Rcpp::stop("Method only support linear and spline.\n");

  arma::uvec xu_idx = find_unique(x);
  arma::vec xu = x(xu_idx);
  arma::mat v_tmp = v.cols(xu_idx);
  if (!xu.is_sorted()) {
    arma::uvec si = sort_index(xu);
    xu = xu(si);
    v_tmp = v_tmp.cols(si);
  }
  if (xu.n_elem != x.n_elem) {
    RMessage("The grid vectors are not strictly monotonic increasing.");
    RMessage("The values of v for duplicated values of x will be averaged.");
    for (arma::uword k = 0; k < xu.n_elem; ++k)
      v_tmp.col(k) = mean(v.cols(arma::find(x == xu(k))), 1);
  }

  if (!y.is_sorted())
    RMessage("y are not strictly monotonic increasing.\ny will be sorted.");
  arma::uvec yu_idx = find_unique(y);
  arma::vec yu = y(yu_idx);
  arma::mat vu = v_tmp.rows(yu_idx);
  if (!yu.is_sorted()) {
    arma::uvec si = arma::sort_index(yu);
    yu = yu(si);
    vu = vu.rows(si);
  }
  if (yu.n_elem != y.n_elem) {
    RMessage("The grid vectors are not strictly monotonic increasing.");
    RMessage("The values of v for duplicated values of y will be averaged.");
    for (arma::uword k = 0; k < yu.n_elem; ++k)
      vu.row(k) = arma::mean(v_tmp.rows(arma::find(y == yu(k))));
  }

  arma::mat vi(xi.n_elem, yi.n_elem);
  if (method == "linear") {
    arma::uvec xidx_tmp = lookup(xu, xi), yidx_tmp = lookup(yu, yi);
    xidx_tmp(arma::find(xidx_tmp == xu.n_elem)).fill(xu.n_elem - 1);
    yidx_tmp(arma::find(yidx_tmp == yu.n_elem)).fill(yu.n_elem - 1);
    xidx_tmp--;
    yidx_tmp--;

    arma::uvec xidx = arma::vectorise(arma::repmat(xidx_tmp.t(), yi.n_elem, 1)),
      yidx = arma::vectorise(arma::repmat(yidx_tmp, 1, xi.n_elem));

    arma::uword nvr = vu.n_rows, nvc = vu.n_cols;
    arma::mat a = vu.submat(0, 0, nvr-2, nvc-2),
      b = vu.submat(0, 1, nvr-2, nvc-1) - a,
      c = vu.submat(1, 0, nvr-1, nvc-2) - a,
      d = vu.submat(1, 1, nvr-1, nvc-1) - a - b - c;

    arma::vec dx = arma::diff(xu), dy = arma::diff(yu);
    arma::vec xsc = (vectorise(repmat(xi.t(), yi.n_elem, 1)) - xu.elem(xidx)) / dx.elem(xidx),
      ysc = (arma::repmat(yi, xi.n_elem, 1) - yu.elem(yidx)) / dy.elem(yidx);
    arma::uvec idx = yidx + a.n_rows* xidx;
    vi = reshape(a(idx) + b(idx) % xsc + c(idx) % ysc + d(idx) % xsc % ysc, yi.n_elem, xi.n_elem);
  } else if (method == "spline") {
    vi = splineFunc(yu, vu, yi);
    vi = splineFunc(xu, vi.t(), xi).t();
  }
  return vi;
}
```

interp.h:

``` cpp
#ifndef INTERP_H_
#define INTERP_H_

#include <RcppArmadillo.h>
// [[Rcpp::depends(RcppArmadillo)]]

arma::mat splineFunc(const arma::vec& x, const arma::mat& y, const arma::vec& xi);
arma::mat interp1Func(const arma::vec& x, const arma::mat& y, const arma::vec& xi, const std::string& method);
arma::mat interp2Func(const arma::vec& x, const arma::vec& y, const arma::mat& v,
                      const arma::vec& xi, const arma::vec& yi, const std::string& method);
#endif
```

exportFuncs.cpp:

``` cpp
#include "common.h"
#include "interp.h"
#include "checkValue.h"
#include <RcppArmadillo.h>
#include <string>
#include <Rinternals.h>
// [[Rcpp::depends(RcppArmadillo)]]

//' 1-D data interpolation.
//'
//' Returns interpolated values of a 1-D function at specific query points using linear interpolation.
//' The extrapolation is used, please be caution in using the values which \code{xi} is larger than
//' \code{max(x)} and smaller than \code{min(x)}.
//'
//' @param x A vector with n elements, \code{x[i]} is a support, \code{i = 1, ..., n}.
//'   If \code{x} is not sorted, it will be sorted. If \code{x} is not unique, the corresponding \code{y} values
//'   will be averaged.
//' @param y If \code{y} is vector, the length of \code{y} must be equal to the lenght of \code{x}.
//'   If \code{y} is matrix, the number of rows or the number of columns must be equal to the lenght of \code{x}.
//'   If the number of rows is equal to the lenght of \code{x, y[i, j]} is jth values on corresponding
//'   value of \code{x[i], i = 1, ..., n}.
//' @param xi A vector with m elements, \code{xi[k]} is the point which you want to interpolate,
//'   \code{k = 1, ..., m}.
//' @param method A string "linear" or "spline", the method of interpolation.
//' @return A vector or matrix (depends on \code{y}) with the interpolated values corresponding to
//'   \code{xi}.
//' @section Reference:
//' Cleve Moler, Numerical Computing with MATLAB, chapter 3,
//'   \url{http://www.mathworks.com/moler/index_ncm.html}. \cr
//' Nir Krakauer, Paul Kienzle, VZLU Prague, interp1, Octave.
//' @examples
//' library(lattice)
//' plot_res <- function(x, y, xi, yl, ys){
//'   xyplot(y ~ x, data.frame(x, y), pch = 16, col = "black", cex = 1.2,
//'          xlab = "", ylab = "", main = "Results of Interpolation",
//'          panel = function(x, y, ...){
//'            panel.xyplot(x, y, ...)
//'            panel.xyplot(xi, yl, "l", col = "red")
//'            panel.xyplot(xi, ys, "l", col = "blue")
//'          }, key = simpleKey(c("linear", "spline"), points = FALSE,
//'                             lines = TRUE, columns = 2))
//' }
//' x <- c(0.8, 0.3, 0.1, 0.6, 0.9, 0.5, 0.2, 0.0, 0.7, 1.0, 0.4)
//' y <- matrix(c(x**2 - 0.6*x, 0.2*x**3 - 0.6*x**2 + 0.5*x), length(x))
//' xi <- seq(0, 1, len=81)
//' yl <- interp1(x, y, xi, 'linear')
//' ys <- interp1(x, y, xi, 'spline')
//' plot_res(x, y[,1], xi, yl[,1], ys[,1])
//' plot_res(x, y[,2], xi, yl[,2], ys[,2])
//'
//' x <- seq(0, 2*pi, pi/4)
//' y <- sin(x)
//' xi <- seq(0, 2*pi, pi/16)
//' yl <- interp1(x, as.matrix(y), xi, 'linear')
//' ys <- interp1(x, as.matrix(y), xi, 'spline')
//' plot_res(x, y, xi, yl, ys)
//' @export
// [[Rcpp::export]]
SEXP interp1(SEXP xr, SEXP yr, SEXP xir, std::string method = "linear") {
  // check data
  checkValueNum(xr, "x");
  checkValueNum(yr, "y");
  checkValueNum(xir, "xi");

  arma::vec x = Rcpp::as<arma::vec>(xr);
  arma::mat y = Rcpp::as<arma::mat>(asMatrix(yr));
  arma::vec xi = Rcpp::as<arma::vec>(xir);
  return asVector(interp1Func(x, y, xi, method));
}

//' 2-D data interpolation.
//'
//' Returns interpolated values of a 2-D function at specific query points using
//' linear interpolation. The extrapolation is used, please be caution in using the
//' values which \code{xi} is larger than \code{max(x)/max(y)} and smaller than \code{min(x)/min(y)}.
//'
//' @param x A vector with n1 elements, \code{x[i]} is a support, \code{i = 1, ..., n1}.
//'   If \code{x} is not sorted, it will be sorted. If \code{x} is not unique, the corresponding \code{v} values
//'   will be averaged.
//' @param y A vector with n2 elements, \code{y[j]} is a support, \code{j = 1, ..., n2}.
//'   If \code{y} is not sorted, it will be sorted. If \code{y} is not unique, the corresponding \code{v} values
//'   will be averaged.
//' @param v A matrix with size n1 by n2, \code{v[i, j]} is the corresponding value at grid \code{(x[i], y[j])}.
//' @param xi A vector with m elements, \code{xi[k]} is the point which you want to interpolate,
//'   \code{k = 1, ..., m1}.
//' @param yi A vector with m elements, \code{yi[l]} is the point which you want to interpolate,
//'   \code{l = 1, ..., m2}.
//' @param method A string "linear" or "spline", the method of interpolation.
//' @return A matrix with the interpolated values corresponding to \code{xi} and \code{yi}.
//' @section Reference:
//' Cleve Moler, Numerical Computing with MATLAB, chapter 3,
//'   \url{http://www.mathworks.com/moler/index_ncm.html}. \cr
//' Kai Habel, Jaroslav Hajek, interp2, Octave.
//' @examples
//' # example in MatLab
//' library(lattice)
//' # data generation
//' x <- seq(-3, 3, 1)
//' xm <- expand.grid(x, x)
//' z <- 3*(1-xm[,1])^2.*exp(-(xm[,1]^2) - (xm[,2]+1)^2) -
//'   10*(xm[,1]/5 - xm[,1]^3 - xm[,2]^5)*exp(-xm[,1]^2-xm[,2]^2) -
//'   1/3*exp(-(xm[,1]+1)^2 - xm[,2]^2)
//' dat <- data.frame(xm, z)
//' # graph of original data
//' wireframe(z ~ Var1 + Var2, dat, drape = TRUE, colorkey = TRUE)
//'
//' xi <- seq(-3, 3, 0.25)
//' zi_l <- interp2(x, x, matrix(z, length(x)), xi, xi, 'linear')
//' dat_l <- cbind(expand.grid(x = xi, y = xi), z = as.vector(zi_l))
//' # graph of linearly interpolation
//' wireframe(z ~ x + y, dat_l, drape = TRUE, colorkey = TRUE)
//'
//' zi_s <- interp2(x, x, matrix(z, length(x)), xi, xi, 'spline')
//' dat_s <- cbind(expand.grid(x = xi, y = xi), z = as.vector(zi_s))
//' # graph of interpolation with spline
//' wireframe(z ~ x + y, dat_s, drape = TRUE, colorkey = TRUE)
//' @export
// [[Rcpp::export]]
arma::mat interp2(SEXP xr, SEXP yr, SEXP vr, SEXP xir, SEXP yir, std::string method = "linear") {
  // check data
  checkValueNum(xr, "x");
  checkValueNum(yr, "y");
  checkValueNum(vr, "v");
  checkValueNum(xir, "xi");
  checkValueNum(yir, "yi");

  arma::vec x = Rcpp::as<arma::vec>(xr);
  arma::vec y = Rcpp::as<arma::vec>(yr);
  arma::mat v = Rcpp::as<arma::mat>(vr);
  arma::vec xi = Rcpp::as<arma::vec>(xir);
  arma::vec yi = Rcpp::as<arma::vec>(yir);
  return interp2Func(x, y, v, xi, yi, method);
}
```

然後在root path下執行prepross：

``` R
unzip_data <- function(root_path){
  stopifnot(file.exists("train.zip"))
  stopifnot(file.exists("validate.zip"))
  
  if (!dir.exists(root_path))
    dir.create(root_path)
  
  unzip("sample_submission_validate.csv.zip", exdir = root_path)
  unzip("train.csv.zip", exdir = root_path)
  
  if (!dir.exists(paste0(root_path, "/train")))
    unzip("train.zip", exdir = root_path)
  if (!dir.exists(paste0(root_path, "/validate"))) {
    unzip("validate.zip", exdir = root_path)
  }
}

get_frames <- function(root_path){
  list.files(root_path, full.names = TRUE) %>>% file.info %>>% (rownames(.)[.$isdir]) %>>% 
    lapply(function(subfolder){
      list.dirs(subfolder, TRUE, TRUE) %>>% `[`(str_detect(., "sax_\\d+$")) %>>%
        lapply(function(subfolder2){
          list.files(subfolder2, "-\\d{4}.dcm$", recursive = TRUE, full.names = TRUE)
        })
    }) %>>% do.call(what = c)
}

write_label_csv <- function(fname, frames, label_map_file = NULL) {
  
  index <- sapply(frames, function(x) sapply(str_split(x, "/"), `[`, 3)) %>>% as.integer
  if (is.null(label_map_file)) {
    fwrite(data.table(index, 0, 0), fname, col.names = FALSE)
  } else {
    fwrite(fread(label_map_file)[index, ], fname, col.names = FALSE)
  }
  invisible(TRUE)
}

encode_csv <- function(label_csv, systole_csv, diastole_csv) {
  labelData <- fread(label_csv)
  systole_encode <- sapply(labelData$V2, `<`, 1:600) %>>% (matrix(as.integer(.), nrow(.))) %>>% t
  diastole_encode <- sapply(labelData$V3, `<`, 1:600) %>>% (matrix(as.integer(.), nrow(.))) %>>% t
  fwrite(data.table(systole_encode), systole_csv, col.names = FALSE)
  fwrite(data.table(diastole_encode), diastole_csv, col.names = FALSE)
  invisible(TRUE)
}

resizeImage <- function(image, targetSize) {
  minDim <- min(dim(image))
  stPixel <- (dim(image) - minDim) / 2 + 1
  tmp <- image[stPixel[1]:(minDim + stPixel[1]-1) , stPixel[2]:(minDim + stPixel[2]-1)]
  
  outGird <- mapply(function(ts, os) (1:ts - 0.5) * (os / ts) - 0.5, 
                    targetSize, dim(tmp), SIMPLIFY = FALSE)
  resultImg <- interp2(0:(nrow(tmp)-1), 0:(ncol(tmp)-1), tmp, outGird[[1]], outGird[[2]]) %>>%
    `*`(255) %>>% as.integer %>>% matrix(targetSize[1])
  return(resultImg)
}

write_data_csv <- function(fname, frames, preproc) {
  clusterExport(cl, "preproc", environment())
  data <- parLapply(cl, frames, function(path){
    lapply(path, function(imgFile){
      img <- readDICOMFile(imgFile)$img %>>% `[`(rev(1:nrow(.)), 1:ncol(.))
      if (diff(dim(img)) < 0) img <- t(img)
      as.vector(preproc(img / max(img)))
    }) %>>% do.call(what = c)
  })
  fwrite(data.table(do.call(rbind, data)), fname, col.names = FALSE)
  invisible(TRUE)
}

library(pipeR)
library(stringr)
library(parallel)
library(data.table)

# unzip train.zip and validate.zip
unzip_data("data")

# Load the list of all the training frames, and shuffle them
# Shuffle the training frames
set.seed(10)
train_frames <- get_frames("data/train") %>>% `[`(sample.int(length(.), length(.)))
validate_frames <- get_frames("data/validate") %>>% `[`(sample.int(length(.), length(.)))

# Write the corresponding label information of each frame into file.
write_label_csv("train-label.csv", train_frames, "data/train.csv")
write_label_csv("validate-label.csv", validate_frames)

# Write encoded label into the target csv
# We use CSV so that not all data need to sit into memory
# You can also use inmemory numpy array if your machine is large enough
encode_csv("train-label.csv", "train-systole.csv", "train-diastole.csv")

# open cluster for parallel processing
cl <- makeCluster(detectCores() - 1L)
tmpOutput <- clusterEvalQ(cl, {
  library(oro.dicom)
  library(data.table)
  library(pipeR)
  library(Rcpp)
  library(RcppArmadillo)
  Sys.setenv(PKG_CPP_FLAG = "-Icpp")
  sourceCpp("cpp/exportFuncs.cpp")
})
clusterExport(cl, "resizeImage")

# Dump the data of each frame into a CSV file, apply crop to 64 preprocessor
write_data_csv("train-64x64-data.csv", train_frames, function(img) resizeImage(img, c(64, 64)))
write_data_csv("validate-64x64-data.csv", train_frames, function(img) resizeImage(img, c(64, 64)))

# stop cluster
stopCluster(cl)
```

接下來，我們就可以跑MxNet的train.R了：

``` R
# Train.R for Second Annual Data Science Bowl
# Deep learning model with GPU support
# Please refer to https://mxnet.readthedocs.org/en/latest/build.html#r-package-installation
# for installation guide

require(mxnet)
require(data.table)

##A lenet style net, takes difference of each frame as input.
get.lenet <- function() {
  source <- mx.symbol.Variable("data")
  source <- (source-128) / 128
  frames <- mx.symbol.SliceChannel(source, num.outputs = 30)
  diffs <- list()
  for (i in 1:29) {
    diffs <- c(diffs, frames[[i + 1]] - frames[[i]])
  }
  diffs$num.args = 29
  source <- mxnet:::mx.varg.symbol.Concat(diffs)
  net <-
    mx.symbol.Convolution(source, kernel = c(5, 5), num.filter = 40)
  net <- mx.symbol.BatchNorm(net, fix.gamma = TRUE)
  net <- mx.symbol.Activation(net, act.type = "relu")
  net <-
    mx.symbol.Pooling(
      net, pool.type = "max", kernel = c(2, 2), stride = c(2, 2)
    )
  net <-
    mx.symbol.Convolution(net, kernel = c(3, 3), num.filter = 40)
  net <- mx.symbol.BatchNorm(net, fix.gamma = TRUE)
  net <- mx.symbol.Activation(net, act.type = "relu")
  net <-
    mx.symbol.Pooling(
      net, pool.type = "max", kernel = c(2, 2), stride = c(2, 2)
    )
  # first fullc
  flatten <- mx.symbol.Flatten(net)
  flatten <- mx.symbol.Dropout(flatten)
  fc1 <- mx.symbol.FullyConnected(data = flatten, num.hidden = 600)
  # Name the final layer as softmax so it auto matches the naming of data iterator
  # Otherwise we can also change the provide_data in the data iter
  return(mx.symbol.LogisticRegressionOutput(data = fc1, name = 'softmax'))
}

network <- get.lenet()
batch_size <- 32

# CSVIter is uesed here, since the data can't fit into memory
data_train <- mx.io.CSVIter(
  data.csv = "train-64x64-data.csv", data.shape = c(64, 64, 30),
  label.csv = "train-systole.csv", label.shape = 600,
  batch.size = batch_size
)

data_validate <- mx.io.CSVIter(
  data.csv = "validate-64x64-data.csv",
  data.shape = c(64, 64, 30),
  batch.size = 1
)

# Custom evaluation metric on CRPS.
mx.metric.CRPS <- mx.metric.custom("CRPS", function(label, pred) {
  pred <- as.array(pred)
  label <- as.array(label)
  for (i in 1:dim(pred)[2]) {
    for (j in 1:(dim(pred)[1] - 1)) {
      if (pred[j, i] > pred[j + 1, i]) {
        pred[j + 1, i] = pred[j, i]
      }
    }
  }
  return(sum((label - pred) ^ 2) / length(label))
})

# Training the stytole net
mx.set.seed(0)
stytole_model <- mx.model.FeedForward.create(
  X = data_train,
  ctx = mx.gpu(0),
  symbol = network,
  num.round = 65,
  learning.rate = 0.001,
  wd = 0.00001,
  momentum = 0.9,
  eval.metric = mx.metric.CRPS
)

# Predict stytole
stytole_prob = predict(stytole_model, data_validate)

# Training the diastole net
network = get.lenet()
batch_size = 32
data_train <-
  mx.io.CSVIter(
    data.csv = "./train-64x64-data.csv", data.shape = c(64, 64, 30),
    label.csv = "./train-diastole.csv", label.shape = 600,
    batch.size = batch_size
  )

diastole_model = mx.model.FeedForward.create(
  X = data_train,
  ctx = mx.gpu(0),
  symbol = network,
  num.round = 65,
  learning.rate = 0.001,
  wd = 0.00001,
  momentum = 0.9,
  eval.metric = mx.metric.CRPS
)

# Predict diastole
diastole_prob = predict(diastole_model, data_validate)

accumulate_result <- function(validate_lst, prob) {
  t <- read.table(validate_lst, sep = ",")
  p <- cbind(t[,1], t(prob))
  dt <- as.data.table(p)
  return(dt[, lapply(.SD, mean), by = V1])
}

stytole_result = as.data.frame(accumulate_result("./validate-label.csv", stytole_prob))
diastole_result = as.data.frame(accumulate_result("./validate-label.csv", diastole_prob))

train_csv <- read.table("./train-label.csv", sep = ',')

# we have 2 person missing due to frame selection, use udibr's hist result instead
doHist <- function(data) {
  res <- rep(0, 600)
  for (i in 1:length(data)) {
    for (j in round(data[i]):600) {
      res[j] = res[j] + 1
    }
  }
  return(res / length(data))
}

hSystole = doHist(train_csv[, 2])
hDiastole = doHist(train_csv[, 3])

res <- read.table("data/sample_submission_validate.csv", sep = ",", header = TRUE, stringsAsFactors = FALSE)

submission_helper <- function(pred) {
  for (i in 2:length(pred)) {
    if (pred[i] < pred[i - 1]) {
      pred[i] = pred[i - 1]
    }
  }
  return(pred)
}

for (i in 1:nrow(res)) {
  key <- unlist(strsplit(res$Id[i], "_"))[1]
  target <- unlist(strsplit(res$Id[i], "_"))[2]
  if (key %in% stytole_result$V1) {
    if (target == 'Diastole') {
      res[i, 2:601] <- submission_helper(diastole_result[which(diastole_result$V1 == key), 2:601])
    } else {
      res[i, 2:601] <- submission_helper(stytole_result[which(stytole_result$V1 == key), 2:601])
    }
  } else {
    if (target == 'Diastole') {
      res[i, 2:601] <- hDiastole
    } else {
      res[i, 2:601] <- hSystole
    }
  }
}

write.table(res, file = "submission.csv", sep = ",", quote = FALSE, row.names = FALSE)
```

這篇的主題有點偏向data preprocessing了Orz

不過最後還是重新回歸主題一下

本篇的重點在於下面這段R，data.csv放training的csv檔案

而這裡的`train-64x64-data.csv`，每一行都是經過resized的三十張圖片

所以data.shape是`64 x 64 x 30`，而label則每一行是長度600的binary vector，其shape設定成600

然後給好`batch.size`，MxNet就可以批次的從csv抓資料出來train模型了

不用一股腦地把資料全部匯入到R裡面再做

``` R
data_train <- mx.io.CSVIter(
  data.csv = "train-64x64-data.csv", data.shape = c(64, 64, 30),
  label.csv = "train-systole.csv", label.shape = 600,
  batch.size = batch_size
)
```
