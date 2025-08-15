import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  OptimisedValues,
  PortfolioItem,
  PricePoint,
  InstrumentSearchPayload,
  InstrumentRow,
} from "../types/interfaces";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useCurrentPrice(symbols: string[]) {
  return useQuery<{
    [symbol: string]: PricePoint;
  }>({
    queryKey: ["currentPrice", symbols],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/instruments/current_price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(symbols),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
    enabled: symbols.length > 0,
  });
}

export function useCurrencyConversion(currencies: string[]) {
  return useQuery<{
    [symbol: string]: PricePoint;
  }>({
    queryKey: ["currencyConversion", currencies],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/currencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currencies),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
    enabled: currencies.length > 0,
  });
}

export function usePortfolioOptimisation(
  portfolio: PortfolioItem[],
  timePeriod: string,
  startTime: string,
  endTime: string
) {
  const symbols = portfolio.map((item) => ({
    symbol: item.symbol,
    exchange: item.exchange,
  }));
  return useQuery<OptimisedValues>({
    queryKey: ["portfolioOptimise", symbols],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/portfolio/optimise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolio,
          timePeriod,
          startTime,
          endTime,
        }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
    enabled: false, // Only run when manually triggered
  });
}

export function useAnalyseInstruments(
  symbols: string[],
  timePeriod: string,
  startTime: string,
  endTime: string
) {
  return useQuery({
    queryKey: ["instrumentsAnalyse", symbols, timePeriod, startTime, endTime],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/instruments/analyse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbols,
          timePeriod,
          startTime,
          endTime,
        }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
    enabled: false,
  });
}

export function useInstrumentSearchQuery(
  payload: InstrumentSearchPayload,
  queryKey: (string | unknown)[]
): UseQueryResult<{
  data: InstrumentRow[];
  pageCount: number;
  options: Record<string, any>;
}> {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`${API_URL}/instruments/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      // Always return a consistent shape
      return {
        data: result.data || [],
        pageCount: result.pageCount || 0,
        options: result.options || {},
      };
    },
    enabled: !!payload && Object.values(payload).some((v) => v), // Only run if there's at least one non-falsy value
  });
}
