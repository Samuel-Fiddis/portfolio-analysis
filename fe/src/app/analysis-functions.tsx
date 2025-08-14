import { DrawdownData, DrawdownDetails, OptimisedValues, PortfolioItem, PricePoint } from "./interfaces";
import { HistoricalDataPoint, PeriodType, OptimisationResult } from "./interfaces";
import { PERCENTAGE_MULTIPLIER } from "./page";
import _ from 'lodash';
import { parseISO, compareAsc, format } from 'date-fns';

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
  const weightedReturns = portfolio.filter((item) => item.yourAllocation !== 0).map((item) => {
    const symbol = item.symbol;
    const weight = item.yourAllocation / 100.0;
    const data = historicalData[symbol].map(
      (point) => ((point.change_percent / 100.0) + 1) * weight
    );
    return data;
  });

  if (weightedReturns.length === 0) return 0;

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

function getSharpeRatio(
  avg: number,
  stdDev: number,
  risklessBorrowingRate: number,
) {
  return (avg - risklessBorrowingRate) / stdDev;
}

export function getPortfoliosSharpeRatio(
  optimisationData: OptimisedValues | undefined,
  risklessBorrowingRate: number
): OptimisedValues | undefined {
  if (!optimisationData) return undefined;

  return {
    ...optimisationData,
    optimisation_results: optimisationData?.optimisation_results.map(result => ({
      ...result,
      sharpe_ratio_annualised: getSharpeRatio(
        result.geometric_mean,
        result.std_dev,
        risklessBorrowingRate
      ),
    })),
  };
}

export function getMaxSharpeRatioGamma(optimisationResults: OptimisationResult[]): number | undefined {
  let maxIndex: number | undefined = undefined;
  let maxSharpe = -Infinity;
  optimisationResults.forEach((result, idx) => {
    if (typeof result.sharpe_ratio_annualised === "number" && result.sharpe_ratio_annualised > maxSharpe) {
      maxSharpe = result.sharpe_ratio_annualised;
      maxIndex = idx;
    }
  });
  return maxIndex;
}

export const calculateAllocationPercentage = (
  itemValue: number,
  currencyRate: number | undefined,
  totalValue: number
): number => {
  if (!currencyRate || totalValue <= 0 || itemValue < 0) return 0;
  if (!isFinite(itemValue) || !isFinite(totalValue) || !isFinite(currencyRate))
    return 0;

  return ((itemValue * currencyRate) / totalValue) * PERCENTAGE_MULTIPLIER;
};

export const calculateTotalPortfolioValue = (
  portfolio: PortfolioItem[],
  quotes: Record<string, PricePoint> | undefined,
  currencyRates: Record<string, PricePoint> | undefined
): number => {
  if (!portfolio?.length || !quotes || !currencyRates) return 0;

  return portfolio.reduce((sum, item) => {
    try {
      const quote = quotes[item.symbol];
      const currencyRate = currencyRates[item.currency].price;

      if (!quote || typeof quote.price !== "number" || !currencyRate)
        return sum;
      if (item.currentShares < 0) return sum;

      return sum + quote.price * item.currentShares * currencyRate;
    } catch (error) {
      console.warn(`Error calculating value for ${item.symbol}:`, error);
      return sum;
    }
  }, 0);
};

export function getPortfolioDrawdownSeries(
  portfolio: PortfolioItem[],
  historicalData: Record<string, HistoricalDataPoint[]>
): DrawdownData[] {
  // Input validation
  if (!portfolio.length || _.isEmpty(historicalData)) {
    return [];
  }

  const totalAllocation = _.sumBy(portfolio, 'yourAllocation');

  if (totalAllocation === 0) {
    return [];
  }

  const allDates = _(historicalData)
    .values()
    .flatten()
    .map('trade_date')
    .uniq()
    .sort((a: string, b: string) => compareAsc(parseISO(a), parseISO(b)))
    .value();

  if (allDates.length === 0) {
    return [];
  }

  const weights = _(portfolio)
    .keyBy('symbol')
    .mapValues((item: PortfolioItem) => item.yourAllocation / totalAllocation)
    .value();

  const dataLookup = _(historicalData)
    .mapValues((dataArr: HistoricalDataPoint[]) => _.keyBy(dataArr, 'trade_date'))
    .value();

  // 4. Calculate portfolio returns for each date
  const portfolioReturns = allDates.map((date: string) => {
    return _(portfolio)
      .map((item: PortfolioItem) => {
        const dataPoint = dataLookup[item.symbol]?.[date];
        const changePercent = dataPoint?.change_percent ?? 0;
        return changePercent * (weights[item.symbol] ?? 0);
      })
      .sum();
  });

  // 5. Calculate cumulative returns using reduce for better performance
  const cumulativeReturns = portfolioReturns.reduce((acc: number[], dailyReturn: number, index: number) => {
    const prevCumulative = index === 0 ? 1 : acc[index - 1];
    const newCumulative = prevCumulative * (1 + dailyReturn / 100);
    acc.push(newCumulative);
    return acc;
  }, [] as number[]);

  // 6. Calculate drawdowns with running maximum
  let runningMax = 0;
  const drawdowns = cumulativeReturns.map((value: number) => {
    runningMax = Math.max(runningMax, value);
    return runningMax === 0 ? 0 : ((value - runningMax) / runningMax) * 100;
  });

  // 7. Return formatted results
  return _.zipWith(allDates, drawdowns, (trade_date: string, value: number) => ({
    trade_date: new Date(trade_date).getTime(),
    value: _.round(value, 4) // Round to avoid floating point precision issues
  }));
}


export function getMaxDrawdownDetails(
  drawdownSeries: DrawdownData[]
): DrawdownDetails {
  if (_.isEmpty(drawdownSeries)) {
    return {
      percent: 0,
      start_date: "",
      end_date: "",
      bottom_date: "",
    };
  }

  // Find the maximum drawdown (most negative value)
  const minDrawdown = _.minBy(drawdownSeries, 'value');
  if (!minDrawdown) {
    return {
      percent: 0,
      start_date: "",
      end_date: "",
      bottom_date: "",
    };
  }

  const bottomIdx = _.findIndex(drawdownSeries, { value: minDrawdown.value });
  const bottomDate = drawdownSeries[bottomIdx].trade_date;

  // Find the last date before the bottomIdx where drawdown was zero
  let startDate = drawdownSeries[0].trade_date;
  for (let i = bottomIdx - 1; i >= 0; i--) {
    if (drawdownSeries[i].value === 0) {
      startDate = drawdownSeries[i].trade_date;
      break;
    }
  }

  // Find recovery date (first point after bottom that reaches or exceeds previous peak)
  const postBottomSeries = _.drop(drawdownSeries, bottomIdx);
  const recoveryPoint = _.find(postBottomSeries, (point: DrawdownData) =>
    point.value >= 0
  );

  return {
    percent: _.round(minDrawdown.value, 4),
    start_date: new Date(startDate).toISOString(),
    end_date: new Date(recoveryPoint?.trade_date).toISOString() ?? null,
    bottom_date: new Date(bottomDate).toISOString(),
  };
}

