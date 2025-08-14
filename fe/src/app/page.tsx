"use client";

import { useEffect, useMemo, useState } from "react";
import PortfolioDataTable from "./portfolio";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DEFAULT_OPTIMISATION_SETTINGS,
  OptimisationResult,
  OptimisationSettings,
  OptimisedValues,
  PortfolioItem,
  PricePoint,
} from "./interfaces";
import {
  useCurrentPrice,
  useCurrencyConversion,
  usePortfolioOptimisation,
} from "./custom-hooks";
import {
  calculateAllocationPercentage,
  calculateTotalPortfolioValue,
  getArithmeticPortfolioReturn,
  getMaxDrawdownDetails,
  getPortfolioDrawdownSeries,
  getPortfolioGeometricReturn,
  getPortfoliosSharpeRatio,
  getPortfolioStandardDeviation,
} from "./analysis-functions";
import { Optimisation } from "./optimisation";
import { AnalysisResults } from "./AnalysisResults";

export const PERCENTAGE_MULTIPLIER = 100;
const MIN_ALLOCATION_VALUE = 0.0000000001;
const ISO_DATE_LENGTH = 10;

const calculateItemValue = (item: PortfolioItem, quote: PricePoint): number => {
  if (!item || !quote || typeof quote.price !== "number") return 0;
  if (item.currentShares < 0) return 0;

  return quote.price * item.currentShares;
};

const attachQuotesToPortfolio = (
  portfolio: PortfolioItem[],
  quotes: Record<string, PricePoint> | undefined,
  currencyRates: Record<string, PricePoint> | undefined
) => {
  if (!portfolio?.length) return [];

  const totalValue = calculateTotalPortfolioValue(
    portfolio,
    quotes,
    currencyRates
  );

  return portfolio.map((item) => {
    try {
      const quote = quotes?.[item.symbol];
      if (!quote) return item;

      const itemValue = calculateItemValue(item, quote);
      const allocationPercentage = calculateAllocationPercentage(
        itemValue,
        currencyRates?.[item.currency].price,
        totalValue
      );

      return {
        ...item,
        sharePrice: quote.price,
        value: itemValue,
        yourAllocation: allocationPercentage,
        sharePriceDate: quote.timestamp,
      };
    } catch (error) {
      console.warn(`Error attaching quotes for ${item.symbol}:`, error);
      return item;
    }
  });
};

const createYourPortfolioResult = (
  optimisationData: OptimisedValues | undefined,
  portfolioWithQuotes: PortfolioItem[],
): OptimisationResult | null => {
  if (!optimisationData?.stock_stats || !portfolioWithQuotes?.length)
    return null;

  try {
    const { stock_stats, historical_data, time_period } = optimisationData;

    const drawdownSeries = getPortfolioDrawdownSeries(portfolioWithQuotes, historical_data);
    const maxDrawdownDetails = getMaxDrawdownDetails(drawdownSeries);

    console.log("maxDrawdownDetails", maxDrawdownDetails)

    return {
      arithmetic_mean: stock_stats.avg_return
        ? getArithmeticPortfolioReturn(
            portfolioWithQuotes,
            stock_stats.avg_return
          )
        : 0,
      geometric_mean: historical_data
        ? getPortfolioGeometricReturn(portfolioWithQuotes, historical_data, time_period)
        : 0,
      std_dev: stock_stats.std_dev
        ? getPortfolioStandardDeviation(
            portfolioWithQuotes,
            stock_stats.std_dev,
            stock_stats.corr_matrix
          )
        : 0,
      weights: portfolioWithQuotes.map((item) => ({
        symbol: item.symbol || "",
        value_proportion: item.yourAllocation || 0,
      })),
      drawdown: drawdownSeries,
      max_drawdown: maxDrawdownDetails,
    };
  } catch (error) {
    console.warn("Error creating portfolio result:", error);
    return null;
  }
};

const attachOptimisationToPortfolio = (
  portfolioWithQuotes: PortfolioItem[],
  optimisationResults: OptimisationResult[],
  gamma: number
) => {
  if (!portfolioWithQuotes?.length || !optimisationResults?.length)
    return portfolioWithQuotes || [];

  try {
    const safeGamma = Math.max(
      0,
      Math.min(gamma, optimisationResults.length - 1)
    );
    const selectedResult =
      optimisationResults[safeGamma] ?? optimisationResults[0];

    if (!selectedResult?.weights) return portfolioWithQuotes;

    const weightsMap = Object.fromEntries(
      selectedResult.weights.map((w: any) => [w.symbol, w.value_proportion])
    );

    return portfolioWithQuotes.map((item) => ({
      ...item,
      optimisedAllocation:
        Math.max(weightsMap[item.symbol] || 0, MIN_ALLOCATION_VALUE) *
        PERCENTAGE_MULTIPLIER,
    }));
  } catch (error) {
    console.warn("Error attaching optimisation to portfolio:", error);
    return portfolioWithQuotes;
  }
};

const attachAnalysisToPortfolio = (
  portfolioWithOptimisation: any[],
  optimisationData: any
) => {
  if (!portfolioWithOptimisation?.length) return [];

  try {
    const stdDev = optimisationData?.stock_stats?.std_dev ?? {};
    const avgReturn = optimisationData?.stock_stats?.avg_return ?? {};

    return portfolioWithOptimisation.map((item) => ({
      ...item,
      stdDev: stdDev[item.symbol] ?? item.stdDev,
      avgReturn: avgReturn[item.symbol] ?? item.avgReturn,
    }));
  } catch (error) {
    console.warn("Error attaching analysis to portfolio:", error);
    return portfolioWithOptimisation;
  }
};

const extractUniqueSymbols = (portfolio: PortfolioItem[]): string[] => {
  if (!portfolio?.length) return [];
  return portfolio
    .map((item) => item?.symbol)
    .filter((symbol): symbol is string => Boolean(symbol));
};

const extractUniqueCurrencies = (portfolio: PortfolioItem[]): string[] => {
  if (!portfolio?.length) return [];
  const uniqueCurrencies = new Set(
    portfolio
      .map((item) => item?.currency)
      .filter((currency): currency is string => Boolean(currency))
  );
  return Array.from(uniqueCurrencies);
};

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <MainApp />
      </NuqsAdapter>
    </QueryClientProvider>
  );
}

function MainApp() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [optimisationSettings, setOptimisationSettings] =
    useState<OptimisationSettings>(DEFAULT_OPTIMISATION_SETTINGS);
  const [gamma, setGamma] = useState<number>(0);

  const symbols = extractUniqueSymbols(portfolio);
  const currencies = extractUniqueCurrencies(portfolio);
  const { data: quotes } = useCurrentPrice(symbols);
  const { data: currencyRates } = useCurrencyConversion(currencies);

  const portfolioWithQuotes = useMemo(
    () => attachQuotesToPortfolio(portfolio, quotes, currencyRates),
    [portfolio, quotes, currencyRates]
  );

  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["portfolioOptimise"] });
  }, [portfolio.length]);

  // Optimisation query
  const {
    data: optimisationData,
    refetch: refetchOptimisation,
    isFetching: isOptimising,
  } = usePortfolioOptimisation(
    portfolio,
    optimisationSettings.timePeriod,
    optimisationSettings.startTime.toISOString().slice(0, ISO_DATE_LENGTH),
    optimisationSettings.endTime.toISOString().slice(0, ISO_DATE_LENGTH)
  );

  const resetOptimisation = () => {
    refetchOptimisation();
    setGamma(0);
  }

  // Create optimisation component
  const optimisationComponent = Optimisation({
    optimisationSettings,
    setOptimisationSettings,
    refetchOptimisation: resetOptimisation,
    isOptimising,
  });


  // Calculate your portfolio metrics
  const yourPortfolio = useMemo(
    () => createYourPortfolioResult(optimisationData, portfolioWithQuotes),
    [optimisationData, portfolioWithQuotes]
  );

  const optimisationResults = optimisationData?.optimisation_results ?? [];

  // Attach optimised allocation to each item
  const portfolioWithOptimisation = useMemo(
    () =>
      attachOptimisationToPortfolio(
        portfolioWithQuotes,
        optimisationResults,
        gamma
      ),
    [portfolioWithQuotes, optimisationResults, gamma]
  );

  const enhancedOptimisationData: OptimisedValues = useMemo(() => {
    return getPortfoliosSharpeRatio(optimisationData, optimisationSettings.risklessBorrowingRate) ?? {} as OptimisedValues;
  }, [optimisationData, optimisationSettings.risklessBorrowingRate]);

  // Attach analysis stats to each item
  const portfolioWithAnalysis = useMemo(
    () =>
      attachAnalysisToPortfolio(portfolioWithOptimisation, optimisationData),
    [portfolioWithOptimisation, optimisationData]
  );

  const shouldShowAnalysis = !isOptimising && enhancedOptimisationData?.optimisation_results?.length > 0;
  const shouldShowOptimisation = portfolio.length > 1;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="w-[98vw] mx-auto flex flex-col items-center pt-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Portfolio Analysis Tool
        </h1>
        <PortfolioDataTable
          portfolio={portfolioWithAnalysis}
          setPortfolio={setPortfolio}
        />
        {shouldShowOptimisation && optimisationComponent}
      {shouldShowAnalysis && (
        <div className="mt-8 w-full flex justify-center">
          <AnalysisResults
            gamma={gamma}
            setGamma={setGamma}
            yourPortfolio={yourPortfolio}
            optimisationData={enhancedOptimisationData}
          />
        </div>
      )}
      </div>
    </main>
  );
}
