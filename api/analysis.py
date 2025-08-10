import numpy as np


def get_correlation_matrix(df):
    return df.pivot(
        index="trade_date", columns="symbol", values="change_percent"
    ).corr()


def get_covariance_matrix(df):
    cov_matrix = df.pivot(index="trade_date", columns="symbol", values="change_percent").cov()
    # Ensure symmetry to avoid cvxpy errors
    cov_matrix = 0.5 * (cov_matrix + cov_matrix.T)
    return cov_matrix


def get_averages(df, input_period=None, output_period=None):
    """
    Calculate the average returns for each symbol.
    :param df: DataFrame containing historical data with columns 'trade_date', 'symbol', and 'change_percent'.
    :return: Series with average returns for each symbol in perecntage values e.g. (5.7%).
    """
    avg = df.pivot(index="trade_date", columns="symbol", values="change_percent").mean()
    return adjust_averages_for_period(avg, input_period, output_period)


def get_standard_deviation(df, input_period=None, output_period=None):
    std = df.pivot(index="trade_date", columns="symbol", values="change_percent").std()
    return adjust_std_dev_for_period(std, input_period, output_period)


def get_geometric_mean(df, weights, input_period=None, output_period=None):
    """
    Calculate the geometric average returns for each symbol.
    :param df: DataFrame containing historical data with columns 'trade_date', 'symbol', and 'change_percent'.
    :param weights: Series with weights for each symbol.
    :return: Series with geometric average returns for each symbol in percentage values e.g. (5.7%).
    """
    data = df.pivot(
        index="trade_date", columns="symbol", values="change_percent"
    ).apply(
        lambda x: 1 + (x / 100)
    )  # Convert to decimal
    time_periods = len(data.index)
    geo_mean = ((data * weights).sum(axis=1).prod() ** (1 / time_periods) - 1) * 100 # Convert back to percentage
    return adjust_averages_for_period(geo_mean, input_period, output_period)


def adjust_std_dev_for_period(std, input_period, output_period):
    """
    Adjust the standard deviation based on the input and output periods.
    :param std: Standard deviation Series.
    :param input_period: Input period (e.g., 'monthly').
    :param output_period: Output period (e.g., 'yearly').
    :return: Adjusted standard deviation Series.
    """
    if input_period == output_period:
        return std
    elif input_period == "monthly" and output_period == "yearly":
        return std * np.sqrt(12)
    elif input_period == "weekly" and output_period == "yearly":
        return std * np.sqrt(52)
    elif input_period == "daily" and output_period == "yearly":
        return std * np.sqrt(252)
    elif input_period == "yearly" and output_period == "monthly":
        return std / np.sqrt(12)
    elif input_period == "yearly" and output_period == "weekly":
        return std / np.sqrt(52)
    elif input_period == "yearly" and output_period == "daily":
        return std / np.sqrt(252)
    else:
        raise ValueError("Unsupported input/output period combination")


def adjust_averages_for_period(avg, input_period, output_period):
    """
    Adjust the average returns based on the input and output periods.
    :param avg: Average returns Series.
    :param input_period: Input period (e.g., 'monthly').
    :param output_period: Output period (e.g., 'yearly').
    :return: Adjusted average returns Series.
    """
    if input_period == output_period:
        return avg
    elif input_period == "monthly" and output_period == "yearly":
        return ((1 + avg / 100) ** 12 - 1) * 100
    elif input_period == "weekly" and output_period == "yearly":
        return ((1 + avg / 100) ** 52 - 1) * 100
    elif input_period == "daily" and output_period == "yearly":
        return ((1 + avg / 100) ** 252 - 1) * 100
    elif input_period == "yearly" and output_period == "monthly":
        return (avg / 100 + 1) ** (1 / 12) - 1
    elif input_period == "yearly" and output_period == "weekly":
        return (avg / 100 + 1) ** (1 / 52) - 1
    elif input_period == "yearly" and output_period == "daily":
        return (avg / 100 + 1) ** (1 / 252) - 1
    else:
        raise ValueError("Unsupported input/output period combination")


def get_semivariances(df):
    # https://www.investopedia.com/terms/s/semivariance.asp
    semivariances = df.groupby("symbol")["change_percent"].apply(
        lambda x: np.nanmean((x[x < x.mean()] - x.mean()) ** 2) / x.size
    )
    return semivariances


def get_sharpe_ratio(port_return, port_std_dev, risk_free_rate=4.29):
    # https://www.investopedia.com/terms/s/sharperatio.asp
    """
    Calculate the Sharpe Ratio of a portfolio.
    :param port_return: Expected return of the portfolio.
    :param port_std_dev: Standard deviation of the portfolio.
    :param risk_free_rate: Risk-free rate (default is 4.29%).
    :return: Sharpe Ratio of the portfolio.
    """

    return (port_return - risk_free_rate) / port_std_dev


def get_porfolio_return(portfolio, avg):
    """
    Calculate the expected return of a portfolio based on the average returns of the assets in the portfolio.
    :param portfolio: DataFrame containing the portfolio with columns 'symbol' and 'value_proportion'.
    :param avg: Series containing the average returns of the assets.
    :return: Expected return of the portfolio.
    """
    avg_df = avg.reset_index()
    avg_df.columns = ["symbol", "avg_return"]
    port_returns = portfolio.merge(avg_df, on="symbol")

    return (port_returns["avg_return"] * port_returns["value_proportion"]).sum()


def get_portfolio_standard_deviation(portfolio, std_dev, corr_matrix):
    """
    Calculate the standard deviation of a portfolio based on the weights, standard deviations, and correlation matrix of the assets in the portfolio.
    :param portfolio: DataFrame containing the portfolio with columns 'symbol', 'value_proportion'.
    :param std_dev: Series containing the standard deviations of the assets.
    :param corr_matrix: DataFrame containing the correlation matrix of the assets.
    :return: Standard deviation of the portfolio.
    """
    port_std_dev = 0
    for i in range(len(portfolio)):
        for j in range(len(portfolio)):
            weight_i = portfolio.iloc[i]["value_proportion"]
            weight_j = portfolio.iloc[j]["value_proportion"]
            symbol_i = portfolio.iloc[i]["symbol"]
            symbol_j = portfolio.iloc[j]["symbol"]
            port_std_dev += (
                weight_i
                * weight_j
                * corr_matrix.loc[symbol_i, symbol_j]
                * std_dev[symbol_i]
                * std_dev[symbol_j]
            )

    return np.sqrt(port_std_dev)


def calculate_drawdown_statistics(cumulative_returns):
    """
    Helper function to calculate drawdown details from cumulative returns.
    :param cumulative_returns: Series of cumulative returns.
    :return: Dictionary containing drawdown details.
    """
    # Calculate running maximum
    running_max = cumulative_returns.expanding().max()
    # Calculate drawdown
    drawdown = (cumulative_returns - running_max) / running_max

    # Find maximum drawdown
    max_drawdown = drawdown.min() * 100
    max_drawdown_date = drawdown.idxmin()

    # Find the start of the drawdown period (peak before the drawdown)
    peak_before_drawdown = running_max.loc[:max_drawdown_date].idxmax()

    # Find the end of the drawdown period (recovery to new high)
    recovery_date = None
    peak_value = running_max.loc[peak_before_drawdown]

    # Look for recovery after the drawdown bottom
    for date in cumulative_returns.loc[max_drawdown_date:].index:
        if cumulative_returns.loc[date] >= peak_value:
            recovery_date = date
            break

    return {
        "drawdown": drawdown,
        "max_drawdown": {
            "percent": max_drawdown,
            "start_date": peak_before_drawdown,
            "end_date": recovery_date,
            "bottom_date": max_drawdown_date,
        },
    }


def get_portfolio_drawdown_percentage(df, weights):
    """
    Calculate the maximum drawdown percentage for a portfolio with given weights.
    :param df: DataFrame containing historical data with columns 'trade_date', 'symbol', and 'change_percent'.
    :param weights: Series with weights for each symbol.
    :return: Dictionary containing maximum drawdown percentage, start date, and end date.
    """
    pivot_data = df.pivot(index="trade_date", columns="symbol", values="change_percent")

    # Calculate portfolio returns
    portfolio_returns = (pivot_data * weights).sum(axis=1)
    # Calculate cumulative returns
    cumulative_returns = (1 + portfolio_returns / 100).cumprod()

    return calculate_drawdown_statistics(cumulative_returns)


def get_symbols_drawdown_percentage(df):
    """
    Calculate the maximum drawdown percentage for each symbol in the dataframe.
    :param df: DataFrame containing historical data with columns 'trade_date', 'symbol', and 'change_percent'.
    :return: Dictionary with symbol names as keys and dictionaries containing drawdown info as values.
    """
    pivot_data = df.pivot(index="trade_date", columns="symbol", values="change_percent")

    symbol_drawdowns = {}
    for symbol in pivot_data.columns:
        returns = pivot_data[symbol].dropna()
        cumulative_returns = (1 + returns / 100).cumprod()
        symbol_drawdowns[symbol] = calculate_drawdown_statistics(cumulative_returns)

    return symbol_drawdowns
