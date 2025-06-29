import pytest
import pandas as pd

from analysis import get_averages, get_standard_deviation, get_covariance_matrix, get_correlation_matrix

@pytest.fixture
def stock_price_data():
    """Fixture providing mock stock price data"""
    return pd.read_csv('data/test_data.csv')

class TestAnalysis:
    @pytest.mark.parametrize("symbol_a,symbol_b,corr", [
        ('MSFT', 'DELL', 0.24),
        ('MSFT', 'GE', 0.39),
        ('DELL', 'GE', 0.30),
    ])
    def test_correlation_coefficients(self,stock_price_data,symbol_a,symbol_b,corr):
        corr_matrix = get_correlation_matrix(stock_price_data)
        assert corr_matrix.loc[symbol_a, symbol_b] == pytest.approx(corr, rel=1e-2)