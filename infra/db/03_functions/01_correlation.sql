CREATE OR REPLACE FUNCTION get_symbol_correlations()
RETURNS TABLE(symbol1 text, symbol2 text, correlation double precision) AS $$
BEGIN
    RETURN QUERY
    WITH SymbolValues AS (
        SELECT
            trade_date,
            symbol,
            change_percent
        FROM
            eod_tick
    ),
    SymbolCorrelations AS (
        SELECT
            sv1.symbol AS symbol1,
            sv2.symbol AS symbol2,
            corr(stats_agg(sv1.change_percent, sv2.change_percent)) AS correlation
        FROM
            SymbolValues sv1
        JOIN
            SymbolValues sv2
        ON
            sv1.trade_date = sv2.trade_date
        WHERE
            sv1.symbol < sv2.symbol
        GROUP BY
            sv1.symbol,
            sv2.symbol
    )
    SELECT
        symbol1,
        symbol2,
        correlation
    FROM
        SymbolCorrelations
    ORDER BY
        symbol1,
        symbol2;
END;    
$$ LANGUAGE plpgsql;
