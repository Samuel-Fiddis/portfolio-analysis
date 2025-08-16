"use client";

import { useEffect, useMemo, useState } from "react";
import PortfolioDataTable from "../components/tables/PortfolioDataTable";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DEFAULT_OPTIMISATION_SETTINGS,
  OptimisationSettings,
  OptimisedValues,
  PortfolioItem,
  PricePoint,
} from "../types/interfaces";
import {
  useCurrentPrice,
  useCurrencyConversion,
  usePortfolioOptimisation,
} from "../hooks/custom-hooks";
import {
  calculateAllocationPercentage,
  calculateTotalPortfolioValue,
  generatePortfolioAnalysis,
  getPortfoliosSharpeRatio,
  getSelectedOptimisedPortfolio,
} from "../lib/analysis-functions";
import Optimisation from "../components/Optimisation";
import { AnalysisResults } from "../components/AnalysisResults";
import { ISO_DATE_LENGTH, YOUR_PORTFOLIO_NAME } from "@/types/constants";


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

  const {
    stockStats = undefined,
    historicalData = undefined,
    timePeriod = undefined,
  } = optimisationData ?? {};

  const resetOptimisation = () => {
    refetchOptimisation();
    setGamma(0);
  };

  // Create optimisation component
  const optimisationComponent = Optimisation({
    optimisationSettings,
    setOptimisationSettings,
    refetchOptimisation: resetOptimisation,
    isOptimising,
  });

  // Attach price quotes to portfolio
  const portfolioWithQuotes = useMemo(
    () => attachQuotesToPortfolio(portfolio, quotes, currencyRates),
    [portfolio, quotes, currencyRates]
  );

  // Calculate your portfolio metrics
  const yourPortfolioAnalysis = useMemo(
    () =>
      generatePortfolioAnalysis(
        YOUR_PORTFOLIO_NAME,
        historicalData,
        stockStats,
        timePeriod,
        portfolioWithQuotes
      ),
    [historicalData, stockStats, timePeriod, portfolioWithQuotes]
  );

  const enhancedOptimisationData: OptimisedValues = useMemo(
    () =>
      getPortfoliosSharpeRatio(
        optimisationData,
        optimisationSettings.risklessBorrowingRate
      ) ?? ({} as OptimisedValues),
    [optimisationData, optimisationSettings.risklessBorrowingRate]
  );

  const selectedOptimisedPortfolio = getSelectedOptimisedPortfolio(
    optimisationData?.optimisationResults[gamma]
  );

  const shouldShowAnalysis =
    !isOptimising && enhancedOptimisationData?.optimisationResults?.length > 0;
  const shouldShowOptimisation = portfolio.length > 1;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="w-[98vw] mx-auto flex flex-col items-center pt-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Portfolio Analysis Tool
        </h1>
        <PortfolioDataTable
          portfolio={portfolioWithQuotes}
          setPortfolio={setPortfolio}
        />
        {shouldShowOptimisation && optimisationComponent}
        {shouldShowAnalysis && (
          <div className="mt-8 w-full flex justify-center">
            <AnalysisResults
              gamma={gamma}
              setGamma={setGamma}
              comparePortfolios={[
                ...(selectedOptimisedPortfolio ? [selectedOptimisedPortfolio] : []),
                ...(yourPortfolioAnalysis ? [yourPortfolioAnalysis] : []),
              ]}
              optimisationData={enhancedOptimisationData}
            />
          </div>
        )}
      </div>
    </main>
  );
}
