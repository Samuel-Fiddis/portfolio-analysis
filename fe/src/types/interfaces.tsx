export interface PortfolioItem {
  instrumentType: InstrumentType;
  symbol: string;
  exchange: string;
  currentShares: number;
  currency: string;
  value: number;
  yourAllocation: number;
  sharePrice?: number;
  sharePriceDate?: string;
  investmentDate?: string;
}

export interface PortfolioWeight {
  symbol: string;
  valueProportion: number;
}

export type HistoricalData = Record<string, HistoricalDataPoint[]>;

export type StockStats = {
  stdDev: Record<string, number>;
  arithmeticMean: Record<string, number>;
  geometricMean: Record<string, number>;
  corrMatrix: Record<string, Record<string, number>>;
};

export interface OptimisedValues {
  historicalData: HistoricalData;
  timePeriod: PeriodType;
  stockStats: StockStats;
  optimisationResults: PortfolioAnalysisResult[];
}

export interface DrawdownData {
  tradeDate: number;
  value: number;
}

export interface DrawdownDetails {
  percent: number;
  startDate: string;
  endDate: string | null;
  bottomDate: string;
}

export interface PortfolioAnalysisResult {
  name: string;
  stdDev: number;
  arithmeticMean: number;
  geometricMean: number;
  sharpeRatioAnnualised?: number;
  weights: PortfolioWeight[];
  drawdown: DrawdownData[];
  maxDrawdown: DrawdownDetails;
}

export interface CurrentPrice {
  price: number;
  timestamp: string;
}

export type InstrumentType = "Equities" | "ETFs" | "Cryptos";

export interface InstrumentRow {
  symbol: string;
  name: string;
  summary: string;
  currency: string;
  exchange: string;
  instrumentType: InstrumentType;
}

export interface EquitiesRow extends InstrumentRow {
  sector: string;
  industryGroup: string;
  industry: string;
  market: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  website: string;
  marketCap: string;
  isin: string;
  cusip: string;
  figi: string;
  compositeFigi: string;
  shareclassFigi: string;
}

export interface ETFsRow extends InstrumentRow {
  categoryGroup: string;
  category: string;
  family: string;
}

export interface CryptoRow extends InstrumentRow {
  cryptocurrency: string;
}

export interface EquitiesOptions {
  currency?: string[];
  sector?: string[];
  exchange?: string[];
  industry?: string[];
}

export interface ETFsOptions {
  currency?: string[];
  categoryGroup?: string[];
  category?: string[];
  family?: string[];
  exchange?: string[];
}

export interface CryptoOptions {
  currency?: string[];
}

export interface PricePoint {
  price: number;
  timestamp: string;
}

export type PeriodType = "yearly" | "monthly" | "daily";

export interface OptimisationSettings {
  risklessBorrowingRate: number;
  // risklessLendingRate: number;
  timePeriod: PeriodType;
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

export const OPTIMISATION_SETTINGS_DESCRIPTIONS: Record<
  keyof OptimisationSettings,
  OptimisationSettingDescription
> = {
  risklessBorrowingRate: {
    title: "Riskless Borrowing Rate",
    description:
      "The riskless borrowing rate is the interest rate at which you can borrow money without taking on any risk.",
    type: "number",
    step: "0.01",
    min: "0",
  },
  // risklessLendingRate: {
  //   title: "Riskless Lending Rate",
  //   description: "The riskless lending rate is the interest rate at which you can lend money without taking on any risk.",
  //   type: "number",
  //   step: "0.01",
  //   min: "0",
  // },
  timePeriod: {
    title: "Time Period",
    description:
      "The timing period for the optimisation. This can be set to either daily or monthly.",
    type: "select",
    options: [
      { value: "daily", label: "Daily" },
      { value: "monthly", label: "Monthly" },
    ],
  },
  startTime: {
    title: "Start Time",
    description:
      "The start time for the optimisation period. This should be set to the beginning of the year.",
    type: "date",
  },
  endTime: {
    title: "End Time",
    description:
      "The end time for the optimisation period. This should be set to the end of the year.",
    type: "date",
  },
};

export const DEFAULT_OPTIMISATION_SETTINGS: OptimisationSettings = {
  risklessBorrowingRate: 5.0,
  // risklessLendingRate: 3.5,
  timePeriod: "monthly",
  startTime: new Date(
    new Date().setFullYear(
      new Date().getFullYear() - 5,
      new Date().getMonth(),
      new Date().getDate()
    )
  ),
  endTime: new Date(),
};

export interface HistoricalDataPoint {
  tradeDate: string;
  closePrice: number;
  changePercent: number;
}

export interface QuoteEntry {
  historicalData: HistoricalDataPoint[];
  stdDev: number;
  arithmeticMean: number;
  geometricMean: number;
  corrMatrix: Record<string, Record<string, number>>;
}

export interface QuoteData {
  [symbol: string]: QuoteEntry;
}

export interface InstrumentSearchPayload {
  symbol?: string;
  name?: string;
  instrumentType?: InstrumentType;
  currency?: string[] | null;
  exchange?: string[] | null;
  sector?: string[] | null;
  industry?: string[] | null;
  category?: string[] | null;
  categoryGroup?: string[] | null;
  family?: string[] | null;
  pageSize?: string | null;
  page?: string | null;
  options?: Record<string, string[]>;
}
