import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import numpy as np
import pandas as pd

import financedatabase as fd
from financetoolkit import Toolkit
import yfinance as yf

from pydantic import BaseModel
from typing import Any, Dict, Union, List, Optional

from sqlalchemy import create_engine, text

from analysis import (
    get_averages,
    get_correlation_matrix,
    get_porfolio_return,
    get_portfolio_standard_deviation,
    get_standard_deviation,
)
from optimisation import optimise_portfolio

from logging import basicConfig, INFO, getLogger

# Configure logging
basicConfig(level=INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = getLogger(__name__)

# Database connection parameters
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 5433))
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
# Connect to the PostgreSQL database
engine = None

try:
    engine = create_engine(
        f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    with engine.connect() as connection:
        connection.execute(text("SELECT 1;"))
    log.info("Database connection established successfully")
except Exception as e:
    log.error(f"Failed to connect to the database: {e}")

EQUITIES = fd.Equities()
ETFS = fd.ETFs()

API_KEY = os.getenv("FMP_API_KEY")


class SearchCategories(BaseModel):
    page: Optional[int] = 1
    page_size: Optional[int] = 10
    filters: Optional[Dict[str, Any]] = None


class SearchOptions(SearchCategories):
    index: Optional[str] = None
    instrument_type: Optional[str] = None
    currency: Optional[Union[str, List[str]]] = None
    sector: Optional[Union[str, List[str]]] = None
    industry_group: Optional[Union[str, List[str]]] = None
    industry: Optional[Union[str, List[str]]] = None
    exchange: Optional[Union[str, List[str]]] = None
    market: Optional[Union[str, List[str]]] = None
    country: Optional[Union[str, List[str]]] = None
    category_group: Optional[Union[str, List[str]]] = None
    category: Optional[Union[str, List[str]]] = None
    family: Optional[Union[str, List[str]]] = None
    market_cap: Optional[Union[str, List[str]]] = None


class EquitiesSearchOptions(SearchCategories):
    index: Optional[str] = None
    currency: Optional[Union[str, List[str]]] = None
    sector: Optional[Union[str, List[str]]] = None
    industry_group: Optional[Union[str, List[str]]] = None
    industry: Optional[Union[str, List[str]]] = None
    exchange: Optional[Union[str, List[str]]] = None
    market: Optional[Union[str, List[str]]] = None
    country: Optional[Union[str, List[str]]] = None
    market_cap: Optional[Union[str, List[str]]] = None


class ETFsSearchOptions(SearchCategories):
    index: Optional[str] = None
    currency: Optional[Union[str, List[str]]] = None
    category_group: Optional[Union[str, List[str]]] = None
    category: Optional[Union[str, List[str]]] = None
    family: Optional[Union[str, List[str]]] = None
    exchange: Optional[Union[str, List[str]]] = None


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


def convert_ndarrays(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_ndarrays(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_ndarrays(i) for i in obj]
    else:
        return obj


def get_current_price_and_time(symbol: str):
    ticker = yf.Ticker(symbol)
    # Option 1: Use fast_info (preferred if available)
    if hasattr(ticker, "fast_info") and "last_price" in ticker.fast_info:
        # yfinance does not provide a timestamp with fast_info
        price = ticker.fast_info["last_price"]
        # You may want to use the current time as a fallback
        from datetime import datetime

        timestamp = datetime.utcnow().isoformat()
        return price, timestamp
    # Option 2: Use history (fallback)
    data = ticker.history(period="1d")
    if not data.empty:
        price = data["Close"].iloc[-1]
        timestamp = data.index[-1].isoformat()
        return price, timestamp
    # Option 3: Use info (slower)
    info = ticker.info
    price = info.get("regularMarketPrice")
    # yfinance does not provide a timestamp here, so fallback to current time
    from datetime import datetime

    timestamp = datetime.utcnow().isoformat()
    return price, timestamp


@app.get("/health", response_model=Dict[str, str])
async def health_check():
    return {"status": "ok"}


@app.post("/search", response_model=Dict[str, Any])
async def search_instruments(search_values: SearchOptions):
    print("Search values:", search_values)
    if search_values.instrument_type == "Equities":
        return await search_equities(search_values)
    elif search_values.instrument_type == "ETFs":
        return await search_etfs(search_values)
    else:
        equities = await search_equities(search_values)
        etfs = await search_etfs(search_values)
        combined_data = {
            "data": equities["data"] + etfs["data"],
            "pageCount": equities["pageCount"] + etfs["pageCount"],
            "options": {**equities["options"], **etfs["options"]},
        }
        return combined_data


@app.post("/search/equities", response_model=Dict[str, Any])
async def search_equities(search_values: EquitiesSearchOptions):
    req_json = search_values.model_dump(exclude_none=True)
    page = req_json.pop("page", None)
    page_size = req_json.pop("page_size", None)
    options = {k: v.astype(str).tolist() for k, v in EQUITIES.show_options().items()}
    if search_values.index is not None:
        results = json.loads(
            EQUITIES.search(**req_json).reset_index().to_json(orient="records")
        )
    else:
        results = json.loads(
            EQUITIES.select(**req_json).reset_index().to_json(orient="records")
        )
    for item in results:
        item["instrument_type"] = "Equity"
    if page_size is None or page is None:
        return {"data": results, "pageCount": 1, "options": options}
    return {
        "data": results[(page - 1) * page_size : page * page_size],
        "pageCount": (1 + len(results) // page_size),
        "options": options,
    }


@app.post("/search/etfs", response_model=Dict[str, Any])
async def search_etfs(search_values: ETFsSearchOptions):
    print("ETF Search values:", search_values)
    req_json = search_values.model_dump(exclude_none=True)
    page = req_json.pop("page", None)
    page_size = req_json.pop("page_size", None)
    options = {k: v.astype(str).tolist() for k, v in ETFS.show_options().items()}
    if search_values.index is not None:
        results = json.loads(
            ETFS.search(**req_json).reset_index().to_json(orient="records")
        )
    else:
        results = json.loads(
            ETFS.select(**req_json).reset_index().to_json(orient="records")
        )
    for item in results:
        item["instrument_type"] = "ETF"
    if page_size is None or page is None:
        return {"data": results, "pageCount": 1, "options": options}
    return {
        "data": results[(page - 1) * page_size : page * page_size],
        "pageCount": (1 + len(results) // page_size),
        "options": options,
    }


@app.post("/instruments/equities/quotes", response_model=Dict[str, Any])
async def get_equity_instrument(symbols: List[str]):
    tk = Toolkit(symbols, api_key=API_KEY)
    data = tk.get_historical_data(period="monthly").loc[:, (slice(None), symbols)]
    data = process_historical_data(data)
    data["trade_date"] = data["trade_date"].dt.strftime("%Y-%m")
    insert_data_into_db(data)
    return data


@app.post("/instruments/equities/current_price", response_model=Dict[str, Any])
async def get_equity_instrument_current_price(symbols: List[str]):
    """
    Get the current price of equity instruments by their symbols.
    :param symbols: List of equity instrument symbols.
    :return: Dictionary with symbols as keys and their current prices and timestamps as values.
    """
    current_prices = {}
    for symbol in symbols:
        price, timestamp = get_current_price_and_time(symbol)
        if price is not None:
            current_prices[symbol] = {"price": price, "timestamp": timestamp}
        else:
            log.warning(f"Could not retrieve price for symbol: {symbol}")
    return current_prices


@app.post("/portfolio/optimise", response_model=Dict[str, Any])
async def optimise_portfolio_route(portfolio: List[Dict[str, Any]]):
    """Optimise a portfolio based on the provided portfolio data.
    :param portfolio: Dictionary containing portfolio data with symbols as keys and their respective values.
    :return: Dictionary containing optimisation results, historical data, standard deviation, and average return.
    """
    portfolio_allocations = get_value_proportions(
        portfolio
    )  # Can get this from the frontend

    symbols = [item["symbol"] for item in portfolio]
    data = pd.read_sql_table(
        "eod_tick", con=engine
    )  # Really inefficient, need to fix to limit by symbols
    data = data[data["symbol"].isin(symbols)]
    missing_symbols = [s for s in symbols if s not in data["symbol"].unique()]
    if missing_symbols:
        missing_data = await get_equity_instrument(missing_symbols)
        data = pd.concat([data, pd.DataFrame(missing_data)])

    data["trade_date"] = pd.to_datetime(data["trade_date"])

    std = get_standard_deviation(data, input_period="monthly", output_period="yearly")
    corr_matrix = get_correlation_matrix(data)
    ret = get_averages(data, input_period="monthly", output_period="yearly")

    op = optimise_portfolio(data)

    return {
        "optimisation_results": op,
        "historical_data": data.groupby("symbol")[
            ["trade_date", "close_price", "change_percent"]
        ]
        .apply(lambda x: x.to_dict(orient="records"))
        .to_dict(),
        "stock_stats": {
            "std_dev": std.to_dict(),
            "avg_return": ret.to_dict(),
            'corr_matrix': corr_matrix.to_dict(),
        },
        "portfolio_stats": {
            "std_dev": get_portfolio_standard_deviation(
                portfolio_allocations, std, corr_matrix
            ),
            "avg_return": get_porfolio_return(portfolio_allocations, ret),
        },
    }


@app.post("/currencies", response_model=Dict[str, Any])
def get_usd_conversion_rates(currencies: List[str]):
    """
    Returns a dict mapping currency codes to their USD conversion rate.
    For example, {'EUR': 1.07, 'GBP': 1.25}
    """
    rates = {}
    for currency in currencies:
        if currency.upper() == "USD":
            rates["USD"] = 1.0
            continue
        ticker = f"{currency.upper()}USD=X"
        data = yf.Ticker(ticker)
        price = None
        # Try fast_info first
        if hasattr(data, "fast_info") and "last_price" in data.fast_info:
            price = data.fast_info["last_price"]
        else:
            hist = data.history(period="1d")
            if not hist.empty:
                price = hist["Close"].iloc[-1]
        if price is not None:
            rates[currency.upper()] = price
        else:
            rates[currency.upper()] = None  # or handle error/log
    return rates


def get_value_proportions(portfolio: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Calculate the value proportions of each asset in the portfolio.
    :param portfolio: List of dictionaries containing 'symbol', 'value' and 'currency' for each asset.
    :return: DataFrame with 'symbol' and 'value_proportion' columns.
    """
    # Convert portfolio to DataFrame
    df = pd.DataFrame(
        [p for p in portfolio if "symbol" in p and "value" in p and "currency" in p]
    )

    # Calculate total value in USD
    total_value = 0.0
    conversion_rates = get_usd_conversion_rates(df["currency"].unique())

    for index, row in df.iterrows():
        currency = row["currency"].upper()
        value = row["value"]
        if currency in conversion_rates and conversion_rates[currency] is not None:
            total_value += value * conversion_rates[currency]

    # Calculate value proportions
    if total_value == 0:
        df["value_proportion"] = 0.0
    else:
        df["value_proportion"] = df.apply(
            lambda x: (x["value"] * conversion_rates[x["currency"].upper()])
            / total_value,
            axis=1,
        )

    return df[["symbol", "value_proportion"]]


def process_historical_data(data: pd.DataFrame) -> pd.DataFrame:
    data = data.stack().reset_index()
    data = data.rename(
        columns={
            "level_0": "trade_date",
            "Date": "trade_date",
            "date": "trade_date",
            "level_1": "symbol",
            "Open": "open_price",
            "High": "high_price",
            "Low": "low_price",
            "Close": "close_price",
            "Volume": "volume",
            "Return": "change_percent",
        }
    )
    data["change_percent"] = data["change_percent"] * 100  # Convert to percentage
    return data.drop(
        columns=[
            "Adj Close",
            "Dividends",
            "Volatility",
            "Excess Return",
            "Excess Volatility",
            "Cumulative Return",
        ]
    )


def insert_data_into_db(data):
    data.to_sql("eod_tick", con=engine, if_exists="replace", index=False)
