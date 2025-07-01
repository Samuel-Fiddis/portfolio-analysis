export function getPortfolioReturn(portfolio: any[], avg: any) {
  return portfolio.reduce(
    (sum, item) => sum + (avg[item.symbol] ?? 0) * (item.yourAllocation / 100),
    0
  );
}

export function getPortfolioStandardDeviation(portfolio: any[], stdDev: any, corrMatrix: any) {
  let portStdDev = 0;
  for (let i = 0; i < portfolio.length; i++) {
    for (let j = 0; j < portfolio.length; j++) {
      const weightI = portfolio[i].yourAllocation / 100;
      const weightJ = portfolio[j].yourAllocation / 100;
      const symbolI = portfolio[i].symbol;
      const symbolJ = portfolio[j].symbol;
      portStdDev +=
        weightI *
        weightJ *
        (corrMatrix[symbolI][symbolJ] ?? 0) *
        (stdDev[symbolI] ?? 0) *
        (stdDev[symbolJ] ?? 0);
    }
  }
  return Math.sqrt(portStdDev);
}