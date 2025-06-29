import json
import cvxpy as cp
import pandas as pd
import numpy as np

from analysis import (
    get_averages,
    get_covariance_matrix,
)


def optimise_portfolio(data, risk_free_rate=6.0):
    n = len(data["symbol"].unique())

    SAMPLES = 200  # Number of samples for gamma values

    avg = get_averages(data, input_period="monthly", output_period="monthly")
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
        ret_annualised = ((1 + ret.value[0] / 100) ** 12 - 1) * 100
        std_annualised = np.sqrt(risk.value) * np.sqrt(12)
        optimal_portfolios.append(
            {
                "gamma": gamma_vals[i],
                "std_dev": std_annualised,
                "return": ret_annualised,
                "sharpe_ratio_annualised": (ret_annualised - risk_free_rate)
                / std_annualised,
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
