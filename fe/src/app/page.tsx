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
  OptimisedValues,
  PortfolioItem,
} from "./interfaces";
import {
  useCurrentPrice,
  useCurrencyConversion,
  usePortfolioOptimisation,
} from "./custom-hooks";
import EfficiencyFrontierChart from "./efficiency-frontier-chart";
import {
  getArithmeticPortfolioReturn,
  getPortfolioGeometricReturn,
  getPortfolioStandardDeviation,
} from "./analysis-functions";
import { Optimisation } from "./optimisation";
import { CorrelationHeatmap } from "./correlation-heatmap";
import AllocationsBarChart from "./allocations-bar-chart";

// Constants
const PERCENTAGE_MULTIPLIER = 100;
const MIN_ALLOCATION_VALUE = 0.0000000001;
const ISO_DATE_LENGTH = 10;

// Utility functions with error handling
const calculateTotalPortfolioValue = (
  portfolio: PortfolioItem[],
  quotes: Record<string, any> | undefined,
  currencyRates: Record<string, number> | undefined
): number => {
  if (!portfolio?.length || !quotes || !currencyRates) return 0;
  
  return portfolio.reduce((sum, item) => {
    try {
      const quote = quotes[item.symbol];
      const currencyRate = currencyRates[item.currency];
      
      if (!quote || typeof quote.price !== 'number' || !currencyRate) return sum;
      if (item.currentShares < 0) return sum;
      
      return sum + (quote.price * item.currentShares * currencyRate);
    } catch (error) {
      console.warn(`Error calculating value for ${item.symbol}:`, error);
      return sum;
    }
  }, 0);
};

const calculateItemValue = (item: PortfolioItem, quote: any): number => {
  if (!item || !quote || typeof quote.price !== 'number') return 0;
  if (item.currentShares < 0) return 0;
  
  return quote.price * item.currentShares;
};

const calculateAllocationPercentage = (
  itemValue: number,
  currencyRate: number | undefined,
  totalValue: number
): number => {
  if (!currencyRate || totalValue <= 0 || itemValue < 0) return 0;
  if (!isFinite(itemValue) || !isFinite(totalValue) || !isFinite(currencyRate)) return 0;
  
  return (itemValue * currencyRate / totalValue) * PERCENTAGE_MULTIPLIER;
};

const attachQuotesToPortfolio = (
  portfolio: PortfolioItem[],
  quotes: Record<string, any> | undefined,
  currencyRates: Record<string, number> | undefined
) => {
  if (!portfolio?.length) return [];
  
  const totalValue = calculateTotalPortfolioValue(portfolio, quotes, currencyRates);
  
  return portfolio.map((item) => {
    try {
      const quote = quotes?.[item.symbol];
      if (!quote) return item;
      
      const itemValue = calculateItemValue(item, quote);
      const allocationPercentage = calculateAllocationPercentage(
        itemValue,
        currencyRates?.[item.currency],
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
  optimisationData: any,
  portfolioWithQuotes: any[]
): OptimisationResult | null => {
  if (!optimisationData?.stock_stats || !portfolioWithQuotes?.length) return null;
  
  try {
    const { stock_stats, historical_data } = optimisationData;
    
    return {
      arithmetic_mean: stock_stats.avg_return
        ? getArithmeticPortfolioReturn(portfolioWithQuotes, stock_stats.avg_return)
        : 0,
      geometric_mean: historical_data
        ? getPortfolioGeometricReturn(portfolioWithQuotes, historical_data)
        : 0,
      std_dev: stock_stats.std_dev
        ? getPortfolioStandardDeviation(
            portfolioWithQuotes,
            stock_stats.std_dev,
            stock_stats.corr_matrix
          )
        : 0,
      weights: portfolioWithQuotes.map((item) => ({
        symbol: item.symbol || '',
        value_proportion: item.yourAllocation || 0,
      })),
    };
  } catch (error) {
    console.warn('Error creating portfolio result:', error);
    return null;
  }
};

const attachOptimisationToPortfolio = (
  portfolioWithQuotes: any[],
  optimisationResults: any[],
  gamma: number
) => {
  if (!portfolioWithQuotes?.length || !optimisationResults?.length) return portfolioWithQuotes || [];
  
  try {
    const safeGamma = Math.max(0, Math.min(gamma, optimisationResults.length - 1));
    const selectedResult = optimisationResults[safeGamma] ?? optimisationResults[0];
    
    if (!selectedResult?.weights) return portfolioWithQuotes;
    
    const weightsMap = Object.fromEntries(
      selectedResult.weights.map((w: any) => [w.symbol, w.value_proportion])
    );
    
    return portfolioWithQuotes.map((item) => ({
      ...item,
      optimisedAllocation: Math.max(
        weightsMap[item.symbol] || 0,
        MIN_ALLOCATION_VALUE
      ) * PERCENTAGE_MULTIPLIER,
    }));
  } catch (error) {
    console.warn('Error attaching optimisation to portfolio:', error);
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
    console.warn('Error attaching analysis to portfolio:', error);
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

// Analysis Results Component
const AnalysisResults = ({
  gamma,
  setGamma,
  optimisationResults,
  yourPortfolio,
  optimisationData,
}: {
  gamma: number;
  setGamma: (gamma: number) => void;
  optimisationResults: any[];
  yourPortfolio: OptimisationResult | null;
  optimisationData: any;
}) => (
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
);

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

  // Extract symbols and currencies from portfolio
  const symbols = useMemo(() => extractUniqueSymbols(portfolio), [portfolio]);
  const currencies = useMemo(() => extractUniqueCurrencies(portfolio), [portfolio]);
  
  // Fetch current prices and currency rates
  const { data: quotes } = useCurrentPrice(symbols);
  const { data: currencyRates } = useCurrencyConversion(currencies);

  // Attach current price and value to each portfolio item
  const portfolioWithQuotes = useMemo(
    () => attachQuotesToPortfolio(portfolio, quotes, currencyRates),
    [portfolio, quotes, currencyRates]
  );

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
    optimisationSettings.startTime.toISOString().slice(0, ISO_DATE_LENGTH),
    optimisationSettings.endTime.toISOString().slice(0, ISO_DATE_LENGTH)
  );

  // Create optimisation component
  const optimisationComponent = Optimisation({
    optimisationSettings,
    setOptimisationSettings,
    refetchOptimisation,
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
    () => attachOptimisationToPortfolio(portfolioWithQuotes, optimisationResults, gamma),
    [portfolioWithQuotes, optimisationResults, gamma]
  );

  // Attach analysis stats to each item
  const portfolioWithAnalysis = useMemo(
    () => attachAnalysisToPortfolio(portfolioWithOptimisation, optimisationData),
    [portfolioWithOptimisation, optimisationData]
  );

  const shouldShowAnalysis = !isOptimising && optimisationResults.length > 0;
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
          <AnalysisResults
            gamma={gamma}
            setGamma={setGamma}
            optimisationResults={optimisationResults}
            yourPortfolio={yourPortfolio}
            optimisationData={optimisationData}
          />
        )}
      </div>
    </main>
  );
}
