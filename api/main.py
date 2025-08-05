import os
from time import sleep
import asyncio
from datetime import datetime
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
from sqlalchemy.dialects.postgresql import insert

from analysis import (
    get_averages,
    get_correlation_matrix,
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

while engine is None:
    try:
        engine = create_engine(
            f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        )
        with engine.connect() as connection:
            connection.execute(text("SELECT 1;"))
        log.info("Database connection established successfully")
    except Exception as e:
        log.error(f"Failed to connect to the database: {e}")
        engine = None
        sleep(5)  # Wait before retrying

EQUITIES = None
ETFS = None

while EQUITIES is None or ETFS is None:
    log.info("Initializing financial data...")
    try:
        if EQUITIES is None:
            EQUITIES = fd.Equities()
        if ETFS is None:
            ETFS = fd.ETFs()
        log.info("Initialised financial data")
    except Exception as e:
        log.error(f"Failed to initialize financial data: {e}")
        EQUITIES = None
        ETFS = None
        sleep(1)  # Wait before retrying

API_KEY = os.getenv("FMP_API_KEY")


class OptimisationSettings(BaseModel):
    portfolio: List[Dict[str, Any]]
    time_period: str = "monthly"
    start_time: str
    end_time: str


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


async def get_current_price_and_time(symbol: str):
    loop = asyncio.get_event_loop()
    ticker = await loop.run_in_executor(None, yf.Ticker, symbol)

    if hasattr(ticker, "fast_info") and "last_price" in ticker.fast_info:
        price = ticker.fast_info["last_price"]
        timestamp = datetime.utcnow().isoformat()
        return price, timestamp

    data = await loop.run_in_executor(None, ticker.history, "1d")
    if not data.empty:
        price = data["Close"].iloc[-1]
        timestamp = data.index[-1].isoformat()
        return price, timestamp

    info = await loop.run_in_executor(None, lambda: ticker.info)
    price = info.get("regularMarketPrice")
    timestamp = datetime.utcnow().isoformat()
    return price, timestamp


@app.get("/health", response_model=Dict[str, str])
async def health_check():
    return {"status": "ok"}


@app.post("/search", response_model=Dict[str, Any])
async def search_instruments(search_values: SearchOptions):
    instrument_type = search_values.instrument_type
    search_values.instrument_type = None
    if instrument_type == "Equities":
        return await search_equities(search_values)
    elif instrument_type == "ETFs":
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
async def get_data_from_toolkit(settings: OptimisationSettings):
    symbols = [portfolio_item["symbol"] for portfolio_item in settings.portfolio]
    tk = Toolkit(
        symbols,
        start_date=settings.start_time,
        end_date=settings.end_time,
        api_key=API_KEY,
    )
    data = tk.get_historical_data(period=settings.time_period).loc[
        :, (slice(None), symbols)
    ]
    data = process_historical_data(data)
    data["trade_date"] = data["trade_date"].dt.strftime("%Y-%m-%d")
    for symbol in settings.portfolio:
        missing_dates = get_missing_dates(
            data,
            symbol["symbol"],
            symbol["exchange"],
            settings.time_period,
            settings.start_time,
            settings.end_time,
        )
        if len(missing_dates) > 0:
            set_exchange_holidays(symbol["exchange"], missing_dates)
    insert_data_into_db(data, settings.time_period)
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
        price, timestamp = await get_current_price_and_time(symbol)
        if price is not None:
            current_prices[symbol] = {"price": price, "timestamp": timestamp}
        else:
            log.warning(f"Could not retrieve price for symbol: {symbol}")
    return current_prices


@app.post("/instruments/analyse", response_model=Dict[str, Any])
async def analyse_instruments(settings: OptimisationSettings):
    """
    Analyse a set of instruments based on the provided settings.
    :param settings: OptimisationSettings containing symbols, timing period, start time, and end time.
    :return: Dictionary containing analysis results including historical data, standard deviation, and average return.
    """
    data = get_data_from_toolkit(settings)

    std = get_standard_deviation(
        data, input_period=settings.time_period, output_period="yearly"
    )
    corr_matrix = get_correlation_matrix(data)
    ret = get_averages(data, input_period=settings.time_period, output_period="yearly")

    return {
        "std_dev": std.to_dict(),
        "avg_return": ret.to_dict(),
        "corr_matrix": corr_matrix.to_dict(),
    }


@app.post("/portfolio/optimise", response_model=Dict[str, Any])
async def optimise_portfolio_route(settings: OptimisationSettings):
    """Optimise a portfolio based on the provided portfolio data.
    :param portfolio: Dictionary containing portfolio data with symbols as keys and their respective values.
    :return: Dictionary containing optimisation results, historical data, standard deviation, and average return.
    """
    data = read_data_from_db(settings)

    # Need to refetch data if symbols are missing
    missing_portfolio = [
        portfolio_item
        for portfolio_item in settings.portfolio
        if portfolio_item["symbol"] not in data["symbol"].unique()
    ]
    # Need to refetch data if dates are missing for any of the symbols
    for portfolio_item in settings.portfolio:
        missing_dates = get_missing_dates(
            data,
            portfolio_item["symbol"],
            portfolio_item["exchange"],
            settings.time_period,
            settings.start_time,
            settings.end_time,
        )
        if len(missing_dates) > 0:
            if portfolio_item["symbol"] not in missing_portfolio:
                missing_portfolio.append(portfolio_item)

    # Drop old data for the symbols that are missing
    missing_symbols = [item["symbol"] for item in missing_portfolio]
    data = data[
        data["symbol"].isin(
            [
                item["symbol"]
                for item in settings.portfolio
                if (item["symbol"] not in missing_symbols)
            ]
        )
    ]

    if missing_portfolio:
        settings.portfolio = missing_portfolio
        missing_data = await get_data_from_toolkit(settings)
        data = pd.concat([data, pd.DataFrame(missing_data)])

    std = get_standard_deviation(
        data, input_period=settings.time_period, output_period="yearly"
    )
    corr_matrix = get_correlation_matrix(data)
    ret = get_averages(data, input_period=settings.time_period, output_period="yearly")

    op = optimise_portfolio(data, settings.time_period)

    return {
        "optimisation_results": op,
        "time_period": settings.time_period,
        "historical_data": data.groupby("symbol")[
            ["trade_date", "close_price", "change_percent"]
        ]
        .apply(lambda x: x.to_dict(orient="records"))
        .to_dict(),
        "stock_stats": {
            "std_dev": std.to_dict(),
            "avg_return": ret.to_dict(),
            "corr_matrix": corr_matrix.to_dict(),
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


def insert_data_into_db(data: pd.DataFrame, time_period: str):
    data.to_sql(
        f"{time_period}_historical_tick_data",
        con=engine,
        if_exists="append",
        index=False,
        method=insert_on_conflict_nothing_indices(["symbol", "trade_date"]),
    )


def read_data_from_db(settings: OptimisationSettings) -> pd.DataFrame:
    symbols = [s["symbol"] for s in settings.portfolio]
    sql_query = text(
        f"SELECT * FROM {settings.time_period}_historical_tick_data WHERE symbol IN :symbols AND trade_date BETWEEN :start_time AND :end_time"
    )
    data = pd.read_sql_query(
        sql_query,
        con=engine,
        params={
            "symbols": tuple(symbols),
            "start_time": settings.start_time,
            "end_time": settings.end_time,
        },
    )
    data["trade_date"] = pd.to_datetime(data["trade_date"])
    return data


def get_missing_dates(
    data: pd.DataFrame,
    symbol: str,
    exchange: str,
    time_period: str,
    start_time: str,
    end_time: str,
) -> List[str]:
    data_dates = pd.to_datetime(data[data["symbol"] == symbol]["trade_date"]).dt.date.to_list()
    if time_period == "daily":
        holidays = get_exchange_holidays(exchange, start_time, end_time)
        all_dates = pd.date_range(start=start_time, end=end_time, freq="B").to_pydatetime().tolist()
        all_dates = [d.date() for d in all_dates if d.date() not in holidays]
    elif time_period == "monthly":
        # Ignore holidays for monthly data
        all_dates = pd.date_range(start=start_time, end=end_time, freq="ME").to_pydatetime().tolist()
        all_dates = [d.date() for d in all_dates if d.date() not in data_dates]
    missing_dates = [date for date in all_dates if date not in data_dates]
    return missing_dates


def get_exchange_holidays(
    exchange: str, start_time: str, end_time: str
) -> List[str]:
    sql_query = text(
        """
        SELECT holiday_date FROM exchange_holidays
        WHERE exchange = :exchange AND holiday_date BETWEEN :start_time AND :end_time
    """
    )
    holidays = pd.read_sql_query(
        sql_query,
        con=engine,
        params={"exchange": exchange, "start_time": start_time, "end_time": end_time},
    )
    holidays["holiday_date"] = pd.to_datetime(holidays["holiday_date"])
    return holidays["holiday_date"].dt.date.to_list()


def set_exchange_holidays(exchange: str, holidays: List[str]):
    """
    Set exchange holidays in the database.
    :param exchange: The exchange for which to set holidays.
    :param start_time: Start date for the holidays.
    :param end_time: End date for the holidays.
    :param holidays: List of holiday dates in 'YYYY-MM-DD' format.
    """
    df = pd.DataFrame({"exchange": exchange, "holiday_date": pd.to_datetime(holidays)})
    df.to_sql(
        "exchange_holidays",
        con=engine,
        if_exists="append",
        index=False,
        method=insert_on_conflict_nothing_indices(["exchange", "holiday_date"]),
    )


def insert_on_conflict_nothing_indices(indices):
    def insert_on_conflict_nothing(table, conn, keys, data_iter):
        data = [dict(zip(keys, row)) for row in data_iter]
        stmt = (
            insert(table.table)
            .values(data)
            .on_conflict_do_nothing(index_elements=indices)
        )
        result = conn.execute(stmt)
        return result.rowcount

    return insert_on_conflict_nothing
