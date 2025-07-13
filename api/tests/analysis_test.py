import pytest
import pandas as pd

from analysis import get_averages, get_geometric_mean, get_standard_deviation, get_covariance_matrix, get_correlation_matrix

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

    # @pytest.mark.parametrize("symbol,avg", [
    #     ('MSFT', None),
    # ])
    # def test_geometric_average(self, stock_price_data, symbol, avg):
    #     avg_returns = get_geometric_mean(stock_price_data)
    #     print(avg_returns)
    #     assert avg_returns[symbol] == pytest.approx(avg, rel=1e-2)

    @pytest.mark.parametrize("symbol,avg", [
        ('MSFT', -0.303),
        ('DELL', 0.974),
        ('GE', 0.355),
    ])
    def test_average_returns(self, stock_price_data, symbol, avg):
        avg_returns = get_averages(stock_price_data)
        assert avg_returns[symbol] == pytest.approx(avg, rel=1e-2)

    @pytest.mark.parametrize("symbol,std_dev", [
        ('MSFT', 4.237),
        ('DELL', 8.760),
        ('GE', 7.459),
    ])
    def test_standard_deviation(self, stock_price_data, symbol, std_dev):
        std_devs = get_standard_deviation(stock_price_data)
        assert std_devs[symbol] == pytest.approx(std_dev, rel=1e-2)

    
    def test_covariance_matrix(self, stock_price_data):
        cov_matrix = get_covariance_matrix(stock_price_data)
        assert cov_matrix.shape == (3, 3)
        assert cov_matrix.index.equals(cov_matrix.columns)
        assert cov_matrix.loc['MSFT', 'DELL'] == pytest.approx(8.905, rel=1e-2)
        assert cov_matrix.loc['MSFT', 'GE'] == pytest.approx(12.254, rel=1e-2)
        assert cov_matrix.loc['DELL', 'GE'] == pytest.approx(19.646, rel=1e-2)