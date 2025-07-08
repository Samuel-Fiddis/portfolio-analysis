export function CorrelationHeatmap({
  corrMatrix,
}: {
  corrMatrix: Record<string, Record<string, number>>;
}) {
  const symbols = Object.keys(corrMatrix).sort((a, b) => a.localeCompare(b));
  return (
    <div className="overflow-x-auto">
      <p className="text-center font-semibold">Instrument Correlations</p>
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="px-4 py-2">Symbol</th>
            {symbols.map((symbol) => (
              <th key={symbol} className="px-4 py-2">
                {symbol}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {symbols.map((rowSymbol) => (
            <tr key={rowSymbol}>
              <td className="px-4 py-2 font-medium text-center">{rowSymbol}</td>
              {symbols.map((colSymbol) => (
                <td
                  key={colSymbol}
                  className="px-4 py-2 text-center"
                  style={{
                    backgroundColor: `rgba(0, 123, 255, ${Math.abs(
                      corrMatrix[rowSymbol][colSymbol]
                    )})`,
                  }}
                >
                  {corrMatrix[rowSymbol][colSymbol].toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
