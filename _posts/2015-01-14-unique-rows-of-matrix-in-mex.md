---
layout: post
cTitle: Finding unique rows of a matrix in mex
title: "Finding unique rows of a matrix in mex"
category: MATLAB
tagline:
tags: [MATLAB, mex, C++]
cssdemo: 2014-spring
published: true
---
{% include JB/setup %}

This code is to find the unique rows of a matrix. It is based on the quick sort algorithm. Thanks to this, I find that MATLAB also use quick sort to sort data.

<!-- more -->

{% highlight C++ %}
// import header files
#include <omp.h>
// use armadillo
#define ARMA_USE_MKL_ALLOC
#include <armadillo>
// include matlab mex header files
#include "mex.h"
#include "matrix.h"

inline void armaSetPr(mxArray *matlabMatrix, const arma::Mat<double>& armaMatrix)
{
    double *dst_pointer = mxGetPr(matlabMatrix);
    const double *src_pointer = armaMatrix.memptr();
    std::memcpy(dst_pointer, src_pointer, sizeof(double)*armaMatrix.n_elem);
}

// import namespace and typedef
using namespace arma;

inline int compare_vec(const rowvec mat_row, const rowvec pivot_row)
{
    int v;
    for (uword i = 0; i < mat_row.n_elem; i++)
    {
        if (mat_row(i) < pivot_row(i))
            v = 1;
        else if (mat_row(i) > pivot_row(i))
            v = -1;
        if (v != 0)
            break;
    }
    return v;
}

inline void sortrows_f(mat& M, const int left, const int right)
{
    if (left < right)
    {
        int i = left, j = right;
        uword mid_loc = (uword) (left+right)/2, pivot_loc = mid_loc;
        if (right - left >= 3)
        {
            uword range = (right - left) / 3;
          ucolvec median_loc = sort_index(M.col(0).subvec(mid_loc-range, mid_loc+range));
            pivot_loc = as_scalar(find(median_loc == range / 2)) + mid_loc - range;
        }
        rowvec pivot_row = M.row(pivot_loc);
        while (i <= j)
        {
            while (compare_vec(M.row( (uword) i), pivot_row) == 1)
                i++;
            while (compare_vec(M.row( (uword) j), pivot_row) == -1)
                j--;
            if (i <= j)
            {
                M.swap_rows((uword) i, (uword) j);
                i++;
                j--;
            }
        }
        if (j > 0)
            sortrows_f(M, left, j);
        if (i < M.n_rows - 1)
            sortrows_f(M, i, right);
    }
}

void mexFunction(int nlhs, mxArray *plhs[], int nrhs, const mxArray *prhs[])
{
  arma_rng::set_seed_random();
    int max_threads_mkl = mkl_get_max_threads();
  mkl_set_num_threads(max_threads_mkl);

    mat x = Mat<double>(mxGetPr(prhs[0]), (uword) mxGetM(prhs[0]),
            (uword) mxGetN(prhs[0]), false, true);
    sortrows_f(x, 0, x.n_rows - 1);
    ucolvec groupsSortM2 = any(x.rows(0, x.n_rows-2) != x.rows(1, x.n_rows-1), 1);
    groupsSortM2.insert_rows(0, ones<ucolvec>(1));
    mat x_unique = x.rows(find(groupsSortM2));
  plhs[0] = mxCreateDoubleMatrix(x_unique.n_rows, x_unique.n_cols, mxREAL);
    armaSetPr(plhs[0], x_unique);
}
{% endhighlight %}
