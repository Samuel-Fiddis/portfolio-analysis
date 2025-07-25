export interface PortfolioItem {
  instrumentType: InstrumentType;
  symbol: string;
  exchange: string;
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
  historical_data: Record<string, HistoricalDataPoint[]>;
  stock_stats: {
    std_dev: Record<string, number>;
    avg_return: Record<string, number>;
    corr_matrix: Record<string, Record<string, number>>;
  };
  optimisation_results: OptimisationResult[];
}

interface HistoricalDataPoint {
  trade_date: string;
  close_price: number;
  change_percent: number;
}

export interface OptimisationResult {
  gamma?: number;
  std_dev: number;
  arithmetic_mean: number;
  geometric_mean: number;
  sharpe_ratio_annualised?: number;
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
  instrument_type: InstrumentType;
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

export interface OptimisationSettings {
  // risklessBorrowingRate: number;
  // risklessLendingRate: number;
  timePeriod: "daily" | "monthly";
  startTime: Date;
  endTime: Date;
}

type OptimisationSettingDescription = {
  title: string;
  description: string;
  type: "number" | "select" | "date";
  step?: string;
  min?: string;
  options?: { value: string; label: string }[];
};

export const OPTIMISATION_SETTINGS_DESCRIPTIONS: Record<keyof OptimisationSettings, OptimisationSettingDescription> = {
  // risklessBorrowingRate: {
  //   title: "Riskless Borrowing Rate",
  //   description: "The riskless borrowing rate is the interest rate at which you can borrow money without taking on any risk.",
  //   type: "number",
  //   step: "0.01",
  //   min: "0",
  // },
  // risklessLendingRate: {
  //   title: "Riskless Lending Rate",
  //   description: "The riskless lending rate is the interest rate at which you can lend money without taking on any risk.",
  //   type: "number",
  //   step: "0.01",
  //   min: "0",
  // },
  timePeriod: {
    title: "Time Period",
    description: "The timing period for the optimisation. This can be set to either daily or monthly.",
    type: "select",
    options: [
      { value: "daily", label: "Daily" },
      { value: "monthly", label: "Monthly" },
    ],
  },
  startTime: {
    title: "Start Time",
    description: "The start time for the optimisation period. This should be set to the beginning of the year.",
    type: "date",
  },
  endTime: {
    title: "End Time",
    description: "The end time for the optimisation period. This should be set to the end of the year.",
    type: "date",
  },
}

export const DEFAULT_OPTIMISATION_SETTINGS: OptimisationSettings = {
  // risklessBorrowingRate: 5.0,
  // risklessLendingRate: 3.5,
  timePeriod: "monthly",
  startTime: new Date(new Date().setFullYear(new Date().getFullYear() - 5, new Date().getMonth(), new Date().getDate())),
  endTime: new Date(),
}