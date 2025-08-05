import json
import cvxpy as cp
import pandas as pd
import numpy as np

from analysis import (
    adjust_averages_for_period,
    adjust_std_dev_for_period,
    get_averages,
    get_covariance_matrix,
    get_geometric_mean,
)


def optimise_portfolio(data, time_period):
    """Runs through a range of gamma values to compute the efficiency frontier of the portfolio.
    https://www.investopedia.com/terms/e/efficientfrontier.asp
    :param data: DataFrame containing historical data with columns 'trade_date', 'symbol', and 'change_percent'.
    :param time_period: The time period for which to calculate the averages and standard deviations.
    :return: List of optimal portfolios with their weights, standard deviation, arithmetic mean, and geometric mean.
    """
    n = len(data["symbol"].unique())

    SAMPLES = 200

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
        weights = pd.Series(w.value, index=avg.index)
        geometric_mean = get_geometric_mean(data, weights, time_period, "yearly")
        arithmentic_mean = adjust_averages_for_period(ret.value[0], time_period, "yearly") #arithmetic mean
        std_annualised = adjust_std_dev_for_period(np.sqrt(risk.value), time_period, "yearly")
        optimal_portfolios.append(
            {
                "gamma": gamma_vals[i],
                "std_dev": std_annualised,
                "arithmetic_mean": arithmentic_mean,
                "geometric_mean": geometric_mean,
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
            round(p["std_dev"], 3),
            round(p["arithmetic_mean"], 3),
        )  # rounding to eliminate small numerical differences
        if key not in seen:
            seen.add(key)
            filtered_portfolios.append(p)

    optimal_portfolios = filtered_portfolios

    return optimal_portfolios
