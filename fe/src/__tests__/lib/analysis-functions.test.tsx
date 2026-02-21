import _ from "lodash";
import {
  getPortfolioGeometricReturn,
  getPortfolioStandardDeviation,
  getPortfolioDrawdownSeries,
  getMaxDrawdownDetails,
  getSharpeRatio,
} from "../../lib/analysis-functions";
import { PortfolioWeight, HistoricalDataPoint } from "../../types/interfaces";

// Mock data helpers
import optimisationTestData from "./data/optimisation_test_data.csv";
import optimisationMinVarianceDrawdown from "./data/optimisation_min_variance_drawdown.csv";

describe("analysis-functions", () => {
  test("geometric average", () => {
    const weights: PortfolioWeight[] = [
      { symbol: "MSFT", valueProportion: 0.7037 },
      { symbol: "AAPL", valueProportion: 0.1479 },
      { symbol: "DELL", valueProportion: 0.1484 },
    ];
    const avgReturns = getPortfolioGeometricReturn(
      weights,
      optimisationTestData as Record<string, HistoricalDataPoint[]>,
      "monthly"
    );
    expect(avgReturns).toBeCloseTo(30.23, 2);
  });


  test("standard deviation", () => {
    const stdDevs = getPortfolioStandardDeviation(
      [
        { symbol: "MSFT", valueProportion: 0.5 },
        { symbol: "DELL", valueProportion: 0.5 },
      ],
      { MSFT: 4.237, DELL: 8.760, GE: 7.459 },
      {
        MSFT: { MSFT: 1, DELL: 0.24, GE: 0.39 },
        DELL: { MSFT: 0.24, DELL: 1, GE: 0.30 },
        GE: { MSFT: 0.39, DELL: 0.30, GE: 1 },
      }
    );
    expect(stdDevs).toBeCloseTo(6.5, 1); // Example expected value
  });

  test("portfolio drawdown percentage", () => {
    const weights: PortfolioWeight[] = [
      { symbol: "MSFT", valueProportion: 0.7037 },
      { symbol: "AAPL", valueProportion: 0.1479 },
      { symbol: "DELL", valueProportion: 0.1484 },
    ];
    const drawdownSeries = getPortfolioDrawdownSeries(
      weights,
      optimisationTestData as Record<string, HistoricalDataPoint[]>
    );
    // Compare drawdown series values (rounded for floating point)
    drawdownSeries.forEach((point, idx) => {
      expect(point.value).toBeCloseTo(optimisationMinVarianceDrawdown[idx].value, 1);
    });

    const maxDrawdown = getMaxDrawdownDetails(drawdownSeries);
    expect(maxDrawdown.percent).toBeCloseTo(-30.10, 2);
    expect(maxDrawdown.startDate.slice(0, 10)).toBe("2021-12-01");
    expect(maxDrawdown?.endDate?.slice(0, 10)).toBe("2023-06-01");
    expect(maxDrawdown.bottomDate.slice(0, 10)).toBe("2022-09-01");
  });

  test("sharpe ratio", () => {
    const ratio = getSharpeRatio(10, 5, 4.29);
    expect(ratio).toBeCloseTo(1.142, 2);
  });
});