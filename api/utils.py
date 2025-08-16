import os
import time
from functools import wraps

import financedatabase as fd

from sqlalchemy import create_engine, text
from time import sleep
from logging import basicConfig, INFO, getLogger

basicConfig(level=INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = getLogger(__name__)


DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 5433))
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")

def timeit(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        result = func(*args, **kwargs)
        end_time = time.perf_counter()
        total_time = end_time - start_time
        print(f"Function '{func.__name__}' took {total_time:.4f} seconds to execute.")
        return result
    return wrapper


def initialize_engine(retries=10, delay=5):
    for attempt in range(retries):
        try:
            engine = create_engine(
                f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
            )
            with engine.connect() as connection:
                connection.execute(text("SELECT 1;"))
            log.info("Database connection established successfully")
            return engine
        except Exception as e:
            log.error(f"Failed to connect to the database (attempt {attempt + 1}): {e}")
            sleep(delay)
    raise RuntimeError(
        "Could not establish database connection after multiple attempts."
    )


def initialize_financial_data():
    log.info("Initializing financial data...")
    try:
        equities = fd.Equities()
        etfs = fd.ETFs()
        cryptos = fd.Cryptos()
        log.info("Initialised financial data")
        return equities, etfs, cryptos
    except Exception as e:
        log.error(f"Failed to initialize financial data: {e}")
        return None, None, None