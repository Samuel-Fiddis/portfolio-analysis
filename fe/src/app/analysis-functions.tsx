import {
  DrawdownData,
  DrawdownDetails,
  OptimisedValues,
  PortfolioItem,
  PortfolioWeight,
  PricePoint,
} from "./interfaces";
import {
  HistoricalDataPoint,
  PeriodType,
  PortfolioAnalysisResult,
} from "./interfaces";
import { PERCENTAGE_MULTIPLIER } from "./page";
import _ from "lodash";
import { parseISO, compareAsc, format } from "date-fns";

function adjustReturnForPeriod(
  returns: number,
  inputPeriod: PeriodType,
  outputPeriod: PeriodType
): number {
  switch (inputPeriod) {
    case "monthly":
      if (outputPeriod === "yearly")
        return ((1 + returns / 100) ** 12 - 1) * 100;
      if (outputPeriod === "daily")
        return ((1 + returns / 100) ** (1 / 22) - 1) * 100;
    case "yearly":
      if (outputPeriod === "monthly")
        return ((1 + returns / 100) ** (1 / 12) - 1) * 100;
      if (outputPeriod === "daily")
        return ((1 + returns / 100) ** (1 / 252) - 1) * 100;
    case "daily":
      if (outputPeriod === "monthly")
        return ((1 + returns / 100) ** 22 - 1) * 100;
      if (outputPeriod === "yearly")
        return ((1 + returns / 100) ** 252 - 1) * 100;
    default:
      throw new Error("Invalid period type");
  }
}

export function getPortfolioArithmeticReturn(
  weights: PortfolioWeight[],
  avgReturn: Record<string, number>
) {
  return weights.reduce(
    (sum, item) => sum + (avgReturn[item.symbol] ?? 0) * item.valueProportion,
    0
  );
}

export function getPortfolioGeometricReturn(
  weights: PortfolioWeight[],
  historicalData: Record<string, HistoricalDataPoint[]>,
  inputPeriod: PeriodType = "monthly"
) {
  const weightedReturns: number[][] = _(weights)
    .filter((item: PortfolioWeight) => item.valueProportion !== 0)
    .map((item: PortfolioWeight) =>
      _(historicalData[item.symbol])
        .map(
          (point: HistoricalDataPoint) =>
            (point.changePercent / 100 + 1) * item.valueProportion
        )
        .value()
    )
    .value();

  if (_.isEmpty(weightedReturns)) return 0;

  const maxLen = _.max(weightedReturns.map((arr) => arr.length)) ?? 0;
  const pivoted = _.times(maxLen, (i: number) =>
    weightedReturns.map((arr) => arr[i] ?? 0)
  );

  const geoReturn =
    (pivoted.map((arr: number[]) => _.sum(arr)).reduce((acc: number, val: number) => acc * val, 1) **
      (1 / maxLen) -
      1) *
    100;

  return adjustReturnForPeriod(geoReturn, inputPeriod, "yearly");
}

export function getPortfolioStandardDeviation(
  weights: PortfolioWeight[],
  stdDev: Record<string, number>,
  corrMatrix: Record<string, Record<string, number>>
) {
  const variance = _.sum(
    _.flatMap(weights, ({ symbol: i, valueProportion: wi }: PortfolioWeight) =>
      weights.map(
        ({ symbol: j, valueProportion: wj }: PortfolioWeight) =>
          wi *
          wj *
          (corrMatrix[i]?.[j] ?? 0) *
          (stdDev[i] ?? 0) *
          (stdDev[j] ?? 0)
      )
    )
  );
  return Math.sqrt(variance);
}

function getSharpeRatio(
  avg: number,
  stdDev: number,
  risklessBorrowingRate: number
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
    optimisationResults: optimisationData?.optimisationResults.map(
      (result) => ({
        ...result,
        sharpeRatioAnnualised: getSharpeRatio(
          result.geometricMean,
          result.stdDev,
          risklessBorrowingRate
        ),
      })
    ),
  };
}

export function getMaxSharpeRatioGamma(
  optimisationResults: PortfolioAnalysisResult[]
): number | undefined {
  let maxIndex: number | undefined = undefined;
  let maxSharpe = -Infinity;
  optimisationResults.forEach((result, idx) => {
    if (
      typeof result.sharpeRatioAnnualised === "number" &&
      result.sharpeRatioAnnualised > maxSharpe
    ) {
      maxSharpe = result.sharpeRatioAnnualised;
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
  weights: PortfolioWeight[],
  historicalData: Record<string, HistoricalDataPoint[]>
): DrawdownData[] {
  if (!weights.length || _.isEmpty(historicalData)) {
    return [];
  }

  const allDates = _(historicalData)
    .values()
    .flatten()
    .map("tradeDate")
    .uniq()
    .sort((a: string, b: string) => compareAsc(parseISO(a), parseISO(b)))
    .value();

  if (allDates.length === 0) {
    return [];
  }

  const dataLookup = _(historicalData)
    .mapValues((dataArr: HistoricalDataPoint[]) =>
      _.keyBy(dataArr, "tradeDate")
    )
    .value();

  const portfolioReturns = allDates.map((date: string) => {
    return _(weights)
      .map((item: PortfolioWeight) => {
        const dataPoint = dataLookup[item.symbol]?.[date];
        const changePercent = dataPoint?.changePercent ?? 0;
        return changePercent * (item.valueProportion ?? 0);
      })
      .sum();
  });

  const cumulativeReturns = portfolioReturns.reduce(
    (acc: number[], dailyReturn: number, index: number) => {
      const prevCumulative = index === 0 ? 1 : acc[index - 1];
      const newCumulative = prevCumulative * (1 + dailyReturn / 100);
      acc.push(newCumulative);
      return acc;
    },
    [] as number[]
  );

  let runningMax = 0;
  const drawdowns = cumulativeReturns.map((value: number) => {
    runningMax = Math.max(runningMax, value);
    return runningMax === 0 ? 0 : ((value - runningMax) / runningMax) * 100;
  });

  return _.zipWith(
    allDates,
    drawdowns,
    (tradeDate: string, value: number) => ({
      tradeDate: new Date(tradeDate).getTime(),
      value: _.round(value, 4), // Round to avoid floating point precision issues
    })
  );
}

export function getMaxDrawdownDetails(
  drawdown: DrawdownData[]
): DrawdownDetails {
  if (_.isEmpty(drawdown)) {
    return {
      percent: 0,
      startDate: "",
      endDate: "",
      bottomDate: "",
    };
  }

  const minDrawdown = _.minBy(drawdown, "value");
  const bottomIdx = _.findIndex(drawdown, { value: minDrawdown.value });
  const bottomDate = drawdown[bottomIdx].tradeDate;

  let startDate = drawdown[0].tradeDate;
  for (let i = bottomIdx - 1; i >= 0; i--) {
    if (drawdown[i].value === 0) {
      startDate = drawdown[i].tradeDate;
      break;
    }
  }

  const postBottomSeries = _.drop(drawdown, bottomIdx);
  const recoveryPoint = _.find(
    postBottomSeries,
    (point: DrawdownData) => point.value >= 0
  );

  return {
    percent: _.round(minDrawdown.value, 4),
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(recoveryPoint?.tradeDate).toISOString() ?? null,
    bottomDate: new Date(bottomDate).toISOString(),
  };
}
