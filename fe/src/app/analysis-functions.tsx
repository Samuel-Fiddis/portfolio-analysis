import { PortfolioItem } from "./interfaces";
import { HistoricalDataPoint, PeriodType } from "./interfaces";

function adjustReturnForPeriod(
  returns: number,
  inputPeriod: PeriodType,
  outputPeriod: PeriodType
): number {
  switch (inputPeriod) {
    case "monthly":
      if (outputPeriod === "yearly") return ((1 + returns / 100) ** 12 - 1) * 100;
      if (outputPeriod === "daily") return ((1 + returns / 100) ** (1 / 22) - 1) * 100;
    case "yearly":
      if (outputPeriod === "monthly") return ((1 + returns / 100) ** (1 / 12) - 1) * 100;
      if (outputPeriod === "daily") return ((1 + returns / 100) ** (1 / 252) - 1) * 100;
    case "daily":
      if (outputPeriod === "monthly") return ((1 + returns / 100) ** 22 - 1) * 100;
      if (outputPeriod === "yearly") return ((1 + returns / 100) ** 252 - 1) * 100;
    default:
      throw new Error("Invalid period type");
  }
}

export function getArithmeticPortfolioReturn(
  portfolio: PortfolioItem[],
  avg: any
) {
  return portfolio.reduce(
    (sum, item) => sum + (avg[item.symbol] ?? 0) * (item.yourAllocation / 100),
    0
  );
}

export function getPortfolioGeometricReturn(
  portfolio: PortfolioItem[],
  historicalData: Record<string, HistoricalDataPoint[]>,
  inputPeriod: PeriodType = "monthly"
) { 
  const weightedReturns = portfolio.map((item) => {
    const symbol = item.symbol;
    const weight = item.yourAllocation / 100.0;
    const data = historicalData[symbol].map(
      (point) => ((point.change_percent / 100.0) + 1) * weight
    );
    return data;
  });

  const maxLen = Math.max(...weightedReturns.map((arr) => arr.length));
  const pivoted: number[][] = [];
  for (let i = 0; i < maxLen; i++) {
    pivoted[i] = weightedReturns.map((arr) => arr[i] ?? 0);
  }

  const geoReturn =
    (pivoted
      .map((arr) => {
        return arr.reduce((acc, val) => acc + val, 0);
      })
      .reduce((acc, val) => acc * val, 1) **
      (1 / maxLen) -
      1) *
    100;


  return adjustReturnForPeriod(geoReturn, inputPeriod, "yearly");
}

export function getPortfolioStandardDeviation(
  portfolio: PortfolioItem[],
  stdDev: any,
  corrMatrix: any
) {
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
