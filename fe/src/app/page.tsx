"use client";

import { useEffect, useMemo, useState } from "react";
import PortfolioDataTable from "./portfolio";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OptimisationSlider } from "./optimisation-slider";
import {
  DEFAULT_OPTIMISATION_SETTINGS,
  OptimisationResult,
  OptimisationSettings,
  PortfolioItem,
} from "./interfaces";
import {
  useCurrentPrice,
  useCurrencyConversion,
  usePortfolioOptimisation,
} from "./custom-hooks";
import EfficiencyFrontierChart from "./efficiency-frontier-chart";
import {
  getPortfolioReturn,
  getPortfolioStandardDeviation,
} from "./analysis-functions";
import { Optimisation } from "./optimisation";
import { CorrelationHeatmap } from "./correlation-heatmap";
import AllocationsBarChart from "./allocations-bar-chart";

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

  // Fetch current prices for portfolio symbols
  const symbols = useMemo(
    () => portfolio.map((item) => item.symbol),
    [portfolio]
  );
  const currencies = useMemo(() => {
    const uniqueCurrencies = new Set(portfolio.map((item) => item.currency));
    return Array.from(uniqueCurrencies);
  }, [portfolio]);
  const { data: quotes } = useCurrentPrice(symbols);
  const { data: currencyRates } = useCurrencyConversion(currencies);

  // Attach current price and value to each portfolio item
  const portfolioWithQuotes = useMemo(() => {
    const totalValue = portfolio.reduce(
      (sum, item) =>
        sum +
        (quotes?.[item.symbol].price *
          item.currentShares *
          currencyRates?.[item.currency] || 0),
      0
    );
    return portfolio.map((item) => {
      const quote = quotes?.[item.symbol];
      const value = quote?.price * item.currentShares;
      return quote
        ? {
            ...item,
            sharePrice: quote.price,
            value: value,
            yourAllocation:
              ((value * currencyRates?.[item.currency]) / totalValue) * 100,
            sharePriceDate: quote.timestamp,
          }
        : item;
    });
  }, [portfolio, quotes, currencyRates]);

  // Remove optimisation results when portfolio length changes
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
    optimisationSettings.startTime.toISOString().slice(0, 10),
    optimisationSettings.endTime.toISOString().slice(0, 10)
  );

  const optimisationComponent = Optimisation({
    optimisationSettings,
    setOptimisationSettings,
    refetchOptimisation,
    isOptimising,
  });

  const yourPortfolio = useMemo(() => {
    if (!optimisationData?.stock_stats) return null;
    console.log(optimisationData?.stock_stats);
    return {
      return: optimisationData?.stock_stats.avg_return
        ? getPortfolioReturn(
            portfolioWithQuotes,
            optimisationData.stock_stats.avg_return
          )
        : 0,
      std_dev: optimisationData?.stock_stats.std_dev
        ? getPortfolioStandardDeviation(
            portfolioWithQuotes,
            optimisationData?.stock_stats.std_dev,
            optimisationData?.stock_stats.corr_matrix
          )
        : 0,
      weights: portfolioWithQuotes.map((item) => ({
        symbol: item.symbol,
        value_proportion: item.yourAllocation, // Convert percentage to proportion
      })),
    } as OptimisationResult;
  }, [optimisationData, portfolioWithQuotes]);

  const optimisationResults = optimisationData?.optimisation_results ?? [];

  // Attach optimised allocation to each item
  const portfolioWithOptimisation = useMemo(() => {
    if (!optimisationResults.length) return portfolioWithQuotes;
    const result = optimisationResults[gamma] ?? optimisationResults[0];
    const weights = Object.fromEntries(
      result.weights.map((w) => [w.symbol, w.value_proportion])
    );
    return portfolioWithQuotes.map((item) => ({
      ...item,
      optimisedAllocation:
        weights[item.symbol] < 0 ? 0.0000000001 : weights[item.symbol] * 100,
    }));
  }, [portfolioWithQuotes, optimisationResults, gamma]);

  // Attach analysis stats to each item
  const portfolioWithAnalysis = useMemo(() => {
    const stdDev = optimisationData?.stock_stats.std_dev ?? {};
    const avgReturn = optimisationData?.stock_stats.avg_return ?? {};
    return portfolioWithOptimisation.map((item) => ({
      ...item,
      stdDev: stdDev[item.symbol] ?? item.stdDev,
      avgReturn: avgReturn[item.symbol] ?? item.avgReturn,
    }));
  }, [portfolioWithOptimisation, optimisationData]);

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
        {portfolio.length > 1 && optimisationComponent}
        {/* {quotes && <StockChart data={quotes} />} */}
        {!isOptimising && optimisationResults.length > 0 && (
          <>
            <OptimisationSlider
              gamma={gamma}
              setGamma={setGamma}
              optimisationResults={optimisationResults}
            />
            <h2 className="text-2xl font-bold mb-6 text-center">
              Analysis and Optimisation Results
            </h2>
            <div className="flex flex-col w-full gap-8 items-center justify-center">
              <EfficiencyFrontierChart
                optimisedPortfolios={optimisationResults}
                selectedPortfolio={optimisationResults[gamma]}
                yourPortfolio={yourPortfolio}
              />
              {optimisationData && (
                <AllocationsBarChart
                  optimisedAllocation={optimisationResults[gamma].weights}
                  yourAllocation={yourPortfolio?.weights}
                />
              )}
              {optimisationData && (
                <CorrelationHeatmap
                  corrMatrix={optimisationData?.stock_stats.corr_matrix}
                />
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
