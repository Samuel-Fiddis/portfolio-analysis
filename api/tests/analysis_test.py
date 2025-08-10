import pytest
import pandas as pd

from analysis import (
    get_averages,
    get_geometric_mean,
    get_standard_deviation,
    get_covariance_matrix,
    get_correlation_matrix,
    get_portfolio_drawdown_percentage,
    get_symbols_drawdown_percentage,
)


@pytest.fixture
def stock_price_data():
    """Fixture providing mock stock price data"""
    return pd.read_csv("tests/data/test_data.csv")


@pytest.fixture
def optimisation_test_data():
    """Fixture providing optimisation test data"""
    return pd.read_csv("tests/data/optimisation_test_data.csv")


class TestAnalysis:
    @pytest.mark.parametrize(
        "symbol_a,symbol_b,corr",
        [
            ("MSFT", "DELL", 0.24),
            ("MSFT", "GE", 0.39),
            ("DELL", "GE", 0.30),
        ],
    )
    def test_correlation_coefficients(self, stock_price_data, symbol_a, symbol_b, corr):
        corr_matrix = get_correlation_matrix(stock_price_data)
        assert corr_matrix.loc[symbol_a, symbol_b] == pytest.approx(corr, rel=1e-2)

    def test_geometric_average(self, optimisation_test_data):
        weights = pd.Series({"MSFT": 0.7037, "AAPL": 0.1479, "DELL": 0.1484})
        avg_returns = get_geometric_mean(
            optimisation_test_data,
            weights,
            input_period="monthly",
            output_period="yearly",
        )
        assert avg_returns == pytest.approx(30.23, rel=1e-2)

    @pytest.mark.parametrize(
        "symbol,avg",
        [
            ("MSFT", -0.303),
            ("DELL", 0.974),
            ("GE", 0.355),
        ],
    )
    def test_average_returns(self, stock_price_data, symbol, avg):
        avg_returns = get_averages(stock_price_data)
        assert avg_returns[symbol] == pytest.approx(avg, rel=1e-2)

    @pytest.mark.parametrize(
        "symbol,std_dev",
        [
            ("MSFT", 4.237),
            ("DELL", 8.760),
            ("GE", 7.459),
        ],
    )
    def test_standard_deviation(self, stock_price_data, symbol, std_dev):
        std_devs = get_standard_deviation(stock_price_data)
        assert std_devs[symbol] == pytest.approx(std_dev, rel=1e-2)

    def test_covariance_matrix(self, stock_price_data):
        cov_matrix = get_covariance_matrix(stock_price_data)
        assert cov_matrix.shape == (3, 3)
        assert cov_matrix.index.equals(cov_matrix.columns)
        assert cov_matrix.loc["MSFT", "DELL"] == pytest.approx(8.905, rel=1e-2)
        assert cov_matrix.loc["MSFT", "GE"] == pytest.approx(12.254, rel=1e-2)
        assert cov_matrix.loc["DELL", "GE"] == pytest.approx(19.646, rel=1e-2)

    @pytest.mark.parametrize(
        "symbol,expected_drawdown",
        [
            ("MSFT", -30.52),
            ("AAPL", -30.46),
            ("DELL", -41.33),
        ],
    )
    def test_symbols_drawdown_percentage(
        self, optimisation_test_data, symbol, expected_drawdown
    ):
        drawdowns = get_symbols_drawdown_percentage(optimisation_test_data)
        assert drawdowns[symbol]["max_drawdown"]["percent"] == pytest.approx(
            expected_drawdown, rel=1e-3
        )

    def test_portfolio_drawdown_percentage(self, optimisation_test_data):
        # Equal weights portfolio
        weights = pd.Series({"MSFT": 0.7037, "AAPL": 0.1479, "DELL": 0.1484})
        portfolio_drawdown = get_portfolio_drawdown_percentage(
            optimisation_test_data, weights
        )
        assert portfolio_drawdown["max_drawdown"]["percent"] == pytest.approx(
            -30.10, rel=1e-3
        )
        assert portfolio_drawdown["max_drawdown"]["start_date"] == "2021-12-01"
        assert portfolio_drawdown["max_drawdown"]["end_date"] == "2023-06-01"
        assert portfolio_drawdown["max_drawdown"]["bottom_date"] == "2022-09-01"
