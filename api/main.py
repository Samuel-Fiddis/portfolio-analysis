import os
from time import sleep
import asyncio
from datetime import datetime
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import pandas as pd
import math

from financetoolkit import Toolkit
import yfinance as yf

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from humps import camelize
from typing import Any, Dict, Union, List, Optional

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert

from analysis import (
    get_averages,
    get_geometric_mean,
    get_correlation_matrix,
    get_standard_deviation,
)
from utils import initialize_engine, initialize_financial_data
from optimisation import optimise_portfolio

from logging import basicConfig, INFO, getLogger


basicConfig(level=INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = getLogger(__name__)

engine = initialize_engine()

API_KEY = os.getenv("FMP_API_KEY")

EQUITIES, ETFS = None, None
while EQUITIES is None or ETFS is None:
    EQUITIES, ETFS = initialize_financial_data()
    if EQUITIES is None or ETFS is None:
        sleep(1)

INSTRUMENT_NAME_MAPPING = {
    "Equities": "Equity",
    "ETFs": "ETF",
}

StringList = Union[str, List[str]]


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class OptimisationSettings(BaseSchema):
    portfolio: List[Dict[str, Any]]
    time_period: str = "monthly"
    start_time: str
    end_time: str


class SearchOptions(BaseSchema):
    # Values used by React Search DataTable
    page: Optional[int] = 1
    page_size: Optional[int] = 10
    filters: Optional[Dict[str, Any]] = None

    # Values common to all search options
    symbol: Optional[str] = None
    name: Optional[str] = None
    currency: Optional[StringList] = None
    instrument_type: Optional[str] = None
    exchange: Optional[StringList] = None

    # Equities options
    sector: Optional[StringList] = None
    industry_group: Optional[StringList] = None
    industry: Optional[StringList] = None
    market: Optional[StringList] = None
    country: Optional[StringList] = None
    market_cap: Optional[StringList] = None

    # ETF options
    category_group: Optional[StringList] = None
    category: Optional[StringList] = None
    family: Optional[StringList] = None


app = FastAPI(
    description="Portfolio Analysis API",
    version="1.0.0",
    default_response_class=ORJSONResponse,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


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


@app.post("/instruments/search", response_model=Dict[str, Any])
async def search_instruments(search_values: SearchOptions):
    instrument_type = search_values.instrument_type
    search_values.instrument_type = None
    if instrument_type == "Equities":
        return search_instruments_helper(search_values, [EQUITIES])
    elif instrument_type == "ETFs":
        return search_instruments_helper(search_values, [ETFS])
    else:
        # Search both and merge results
        return search_instruments_helper(search_values, [EQUITIES, ETFS])


def search_instruments_helper(search_values, DBs):
    req_json = search_values.model_dump(exclude_none=True)
    symbol = req_json.pop("symbol", "")
    name = req_json.pop("name", "").lower()
    page = req_json.pop("page", None)
    page_size = req_json.pop("page_size", None)

    all_options = {}
    all_exact = pd.DataFrame()
    all_startswith = pd.DataFrame()
    all_name_contains = pd.DataFrame()

    for DB in DBs:
        instrument_type = INSTRUMENT_NAME_MAPPING[DB.__class__.__name__]
        options = {k: v.astype(str).tolist() for k, v in DB.show_options().items()}
        for k, v in options.items():
            all_options[k] = all_options.get(k, []) + v
        db_options = {k: v for k, v in req_json.items() if k in options.keys()}
        results = DB.select(**db_options)
        results.index = results.index.astype(str)
        results["name"] = results["name"].astype(str)
        results["instrumentType"] = instrument_type

        exact_match = results[results.index == symbol]
        startswith_match = results[
            (results.index.str.startswith(symbol)) & (results.index != symbol)
        ]
        already_matched = set(exact_match.index).union(startswith_match.index)
        name_contains_match = results[
            (~results.index.isin(already_matched))
            & (results["name"].str.lower().str.contains(name))
        ]

        all_exact = pd.concat([all_exact, exact_match])
        all_startswith = pd.concat([all_startswith, startswith_match])
        all_name_contains = pd.concat([all_name_contains, name_contains_match])

    all_exact = all_exact.sort_index()
    all_startswith = all_startswith.sort_index()
    all_name_contains = all_name_contains.sort_index()
    all_results = pd.concat([all_exact, all_startswith, all_name_contains])

    all_results_json = json.loads(all_results.reset_index().to_json(orient="records"))

    if page_size is None or page is None:
        return {"data": all_results_json, "pageCount": 1, "options": all_options}
    return {
        "data": all_results_json[(page - 1) * page_size : page * page_size],
        "pageCount": math.ceil(len(all_results_json) / page_size),
        "options": all_options,
    }


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
    for item in settings.portfolio:
        missing_dates = get_missing_dates(
            data[data["symbol"] == item["symbol"]],
            item["exchange"],
            settings.time_period,
            settings.start_time,
            settings.end_time,
        )
        if len(missing_dates) > 0:
            set_exchange_holidays(item["exchange"], missing_dates)
    insert_data_into_db(data, settings.time_period)
    return data


@app.post("/instruments/current_price", response_model=Dict[str, Any])
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

    return camelize({
        "historical_data": data.groupby("symbol")[
            ["trade_date", "close_price", "change_percent"]
        ].apply(lambda x: x.to_dict(orient="records")),
        "std_dev": std.to_dict(),
        "avg_return": ret.to_dict(),
        "corr_matrix": corr_matrix.to_dict(),
    })


def find_missing_portfolio_items(
    data: pd.DataFrame, settings: OptimisationSettings
) -> List[Dict[str, Any]]:
    """Return portfolio items missing from the data (by symbol or missing dates)."""
    existing_symbols = set(data["symbol"].unique())
    missing_portfolio = [
        item for item in settings.portfolio if item["symbol"] not in existing_symbols
    ]
    for item in settings.portfolio:
        missing_dates = get_missing_dates(
            data[data["symbol"] == item["symbol"]],
            item["exchange"],
            settings.time_period,
            settings.start_time,
            settings.end_time,
        )
        if missing_dates and item not in missing_portfolio:
            missing_portfolio.append(item)
    return missing_portfolio


def filter_existing_data(
    data: pd.DataFrame, settings: OptimisationSettings, missing_symbols: List[str]
) -> pd.DataFrame:
    """Return data for symbols not in missing_symbols."""
    keep_symbols = [
        item["symbol"]
        for item in settings.portfolio
        if item["symbol"] not in missing_symbols
    ]
    return data[data["symbol"].isin(keep_symbols)]


@app.post("/portfolio/optimise", response_class=ORJSONResponse)
async def optimise_portfolio_route(settings: OptimisationSettings):
    """Optimise a portfolio based on the provided portfolio data."""
    data = read_data_from_db(settings)

    # Find missing portfolio items (by symbol or missing dates)
    missing_portfolio = find_missing_portfolio_items(data, settings)
    missing_symbols = [item["symbol"] for item in missing_portfolio]
    data = filter_existing_data(data, settings, missing_symbols)

    # Fetch and append missing data if needed
    if missing_portfolio:
        settings.portfolio = missing_portfolio
        missing_data = await get_data_from_toolkit(settings)
        data = pd.concat([data, pd.DataFrame(missing_data)])

    std = get_standard_deviation(
        data, input_period=settings.time_period, output_period="yearly"
    )
    corr_matrix = get_correlation_matrix(data)
    ret = get_averages(data, input_period=settings.time_period, output_period="yearly")
    geo_ret = get_geometric_mean(
        data, input_period=settings.time_period, output_period="yearly"
    )

    optimisation_results = optimise_portfolio(data, settings.time_period)

    return camelize({
        "optimisation_results": optimisation_results,
        "time_period": settings.time_period,
        "historical_data": data.groupby("symbol")[
            ["trade_date", "close_price", "change_percent"]
        ].apply(lambda x: camelize(x.to_dict(orient="records"))),
        "stock_stats": {
            "std_dev": std,
            "arithmetic_mean": ret,
            "geometric_mean": geo_ret,
            "corr_matrix": corr_matrix,
        },
    })


@app.post("/currencies", response_model=Dict[str, Any])
async def get_usd_conversion_rates(currencies: List[str]):
    """
    Returns a dict mapping currency codes to their USD conversion rate and timestamp.
    For example, {'EUR': {'price': 1.07, 'timestamp': '...'}, ...}
    """
    rates = {}
    for currency in currencies:
        if currency.upper() == "USD":
            rates["USD"] = {"price": 1.0, "timestamp": datetime.utcnow().isoformat()}
            continue
        ticker = f"{currency.upper()}USD=X"
        price, timestamp = await get_current_price_and_time(ticker)
        if price is not None:
            rates[currency.upper()] = {"price": price, "timestamp": timestamp}
        else:
            log.warning(f"Could not retrieve conversion rate for currency: {currency}")

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
    exchange: str,
    time_period: str,
    start_time: str,
    end_time: str,
) -> List[str]:
    """Checks for missing dates in the database"""
    data_dates = pd.to_datetime(data["trade_date"]).dt.date.to_list()
    if time_period == "daily":
        holidays = get_exchange_holidays(exchange, start_time, end_time)
        all_dates = (
            pd.date_range(start=start_time, end=end_time, freq="B")
            .to_pydatetime()
            .tolist()
        )
        all_dates = [d.date() for d in all_dates if d.date() not in holidays]
    elif time_period == "monthly":
        # Ignore holidays for monthly data
        all_dates = (
            pd.date_range(start=start_time, end=end_time, freq="ME")
            .to_pydatetime()
            .tolist()
        )
        all_dates = [d.date() for d in all_dates if d.date()]
    missing_dates = [date for date in all_dates if date not in data_dates]
    return missing_dates


def get_exchange_holidays(exchange: str, start_time: str, end_time: str) -> List[str]:
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
    """A helper function to handle insertions with conflict resolution using pandas.
    :param indices: List of column names"""

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
