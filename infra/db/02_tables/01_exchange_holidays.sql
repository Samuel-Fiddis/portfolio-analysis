CREATE TABLE IF NOT EXISTS exchange_holidays (
    exchange VARCHAR(12),
    holiday_date TIMESTAMPTZ,
    PRIMARY KEY (exchange, holiday_date)
);