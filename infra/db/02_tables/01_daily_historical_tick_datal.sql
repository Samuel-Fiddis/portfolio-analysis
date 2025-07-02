CREATE TABLE IF NOT EXISTS daily_historical_tick_data (
    symbol VARCHAR(12),
    trade_date TIMESTAMPTZ,
    open_price DOUBLE PRECISION,
    high_price DOUBLE PRECISION,
    low_price DOUBLE PRECISION,
    close_price DOUBLE PRECISION,
    volume NUMERIC,
    change DOUBLE PRECISION,
    change_percent DOUBLE PRECISION,
    PRIMARY KEY (symbol, trade_date)
) WITH (
   tsdb.hypertable,
   tsdb.partition_column='trade_date',
   tsdb.segmentby ='symbol'
);