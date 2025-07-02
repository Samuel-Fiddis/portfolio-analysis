import json
import cvxpy as cp
import pandas as pd
import numpy as np

from analysis import (
    adjust_averages_for_period,
    adjust_std_dev_for_period,
    get_averages,
    get_covariance_matrix,
)


def optimise_portfolio(data, time_period):
    n = len(data["symbol"].unique())

    SAMPLES = 200  # Number of samples for gamma values

    avg = get_averages(data)
    cov_matrix = get_covariance_matrix(data)

    avg_return = avg.values.reshape(-1, 1)  # Average returns as a column vector
    Cov = cov_matrix.values  # Covariance matrix

    optimal_portfolios = []

    w = cp.Variable(n)
    gamma = cp.Parameter(nonneg=True)
    gamma_vals = np.logspace(3, -3, num=SAMPLES)
    ret = avg_return.T @ w
    risk = cp.quad_form(w, Cov)
    constraints = [cp.sum(w) == 1, w >= 0]
    prob = cp.Problem(cp.Maximize(ret - gamma * risk), constraints)
    for i in range(SAMPLES):
        gamma.value = gamma_vals[i]
        prob.solve()
        ret_annualised = adjust_averages_for_period(ret.value[0], time_period, "yearly")
        std_annualised = adjust_std_dev_for_period(np.sqrt(risk.value), time_period, "yearly")
        optimal_portfolios.append(
            {
                "gamma": gamma_vals[i],
                "std_dev": std_annualised,
                "return": ret_annualised,
                "weights": json.loads(
                    pd.DataFrame(
                        {"symbol": avg.index, "value_proportion": w.value}
                    ).to_json(orient="records")
                ),
            }
        )

        # Remove portfolios with duplicate std_dev and return
    seen = set()
    filtered_portfolios = []
    for p in optimal_portfolios:
        key = (
            round(p["std_dev"], 8),
            round(p["return"], 8),
        )  # rounding to avoid floating point issues
        if key not in seen:
            seen.add(key)
            filtered_portfolios.append(p)

    optimal_portfolios = filtered_portfolios

    return optimal_portfolios
