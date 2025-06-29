export interface PortfolioItem {
  instrumentType: InstrumentType;
  symbol: string;
  currentShares: number;
  currency: string;
  value: number;
  stdDev?: number;
  avgReturn?: number;
  sharePrice?: number;
  sharePriceDate?: string;
  investmentDate?: string;
  optimisedAllocation?: number;
  yourAllocation?: number;
}

export interface PortfolioWeight {
  symbol: string;
  value_proportion: number;
}
export interface OptimisedValues {
  historical_data: any;
  stock_stats: {
    std_dev: Record<string, number>;
    avg_return: Record<string, number>;
  };
  portfolio_stats: any;
  optimisation_results: OptimisationResult[];
}
export interface OptimisationResult {
  gamma: number;
  std_dev: number;
  return: number;
  sharpe_ratio_annualised: number;
  weights: PortfolioWeight[];
}
export interface CurrentPrice {
  price: number;
  timestamp: string;
}
export type InstrumentType = "Equities" | "ETFs";

export interface InstrumentRow {
  symbol: string;
  name: string;
  summary: string;
  currency: string;
  exchange: string;
  instrument_type: string;
}
export interface EquitiesRow extends InstrumentRow {
  sector: string;
  industry_group: string;
  industry: string;
  market: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  website: string;
  market_cap: string;
  isin: string;
  cusip: string;
  figi: string;
  composite_figi: string;
  shareclass_figi: string;
}
export interface ETFsRow extends InstrumentRow {
  category_group: string;
  category: string;
  family: string;
}
export interface EquitiesOptions {
  currency?: string[];
  sector?: string[];
  exchange?: string[];
  industry?: string[];
}
export interface ETFsOptions {
  currency?: string[];
  category_group?: string[];
  category?: string[];
  family?: string[];
  exchange?: string[];
}
