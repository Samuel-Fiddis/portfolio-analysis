import pytest
import pandas as pd

from optimisation import optimise_portfolio

@pytest.fixture
def optimisation_data():
    """Fixture providing mock stock price data"""
    return pd.read_csv('tests/data/optimisation_test_data.csv')

class TestOptimisation:
    def test_optimisation(self, optimisation_data):        
        time_period = "monthly"
        optimal_portfolios = optimise_portfolio(optimisation_data, time_period)

        minimal_variance_portfolio = optimal_portfolios[0]

        # Check that the minimal variance portfolio has the expected return and standard deviation
        assert minimal_variance_portfolio['geometric_mean'] == pytest.approx(30.23, rel=1e-2)
        assert minimal_variance_portfolio['arithmetic_mean'] == pytest.approx(32.59, rel=1e-2)
        assert minimal_variance_portfolio['std_dev'] == pytest.approx(19.40, rel=1e-2)
        
        # Check that weights sum to 1
        for portfolio in optimal_portfolios:
            weights_sum = sum(weight['value_proportion'] for weight in portfolio['weights'])
            assert pytest.approx(weights_sum, rel=1e-2) == 1.0

        mvp_weights = {w['symbol']: w['value_proportion'] for w in minimal_variance_portfolio['weights']}

        # Check that the minimal variance portfolio has the expected weights
        assert mvp_weights['MSFT'] == pytest.approx(0.7037, rel=1e-2)
        assert mvp_weights['DELL'] == pytest.approx(0.1484, rel=1e-2)
        assert mvp_weights['AAPL'] == pytest.approx(0.1479, rel=1e-2)

