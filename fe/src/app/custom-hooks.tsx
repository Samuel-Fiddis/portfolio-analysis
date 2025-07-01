import { useQuery } from "@tanstack/react-query";
import { OptimisedValues, PortfolioItem } from "./interfaces";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useCurrentPrice(symbols: string[]) {
  return useQuery({
    queryKey: ["currentPrice", symbols],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/instruments/equities/current_price`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(symbols),
        },
      );
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
    enabled: symbols.length > 0,
  });
}

export function useCurrencyConversion(currencies: string[]) {
  return useQuery({
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

export function usePortfolioOptimisation(portfolio: PortfolioItem[]) {
  return useQuery<OptimisedValues>({
    queryKey: ["portfolioOptimise", portfolio.map(item => item.symbol)],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/portfolio/optimise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(portfolio),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
    enabled: false, // Only run when manually triggered
  });
}
