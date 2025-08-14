"use client";
import { Button } from "@/components/ui/button";
import AllocationsBarChart from "./allocations-bar-chart";
import { CorrelationHeatmap } from "./correlation-heatmap";
import { DrawdownChart } from "./drawdown-chart";
import EfficiencyFrontierChart from "./efficiency-frontier-chart";
import { OptimisationResult, OptimisedValues } from "./interfaces";
import { OptimisationSlider } from "./optimisation-slider";
import { getMaxSharpeRatioGamma } from "./analysis-functions";


export const AnalysisResults = ({
  gamma, setGamma, yourPortfolio, optimisationData,
}: {
  gamma: number;
  setGamma: (gamma: number) => void;
  yourPortfolio: OptimisationResult | null;
  optimisationData: OptimisedValues;
}) => (
  <div className="flex flex-col w-full gap-8 items-center justify-center">
    <h2 className="text-2xl font-bold text-center">
      Analysis and Optimisation Results
    </h2>
    <OptimisationSlider
      gamma={gamma}
      setGamma={setGamma}
      optimisationResults={optimisationData?.optimisation_results || []} />
      <EfficiencyFrontierChart
        optimisedPortfolios={optimisationData?.optimisation_results || []}
        selectedPortfolio={optimisationData?.optimisation_results[gamma]}
        yourPortfolio={yourPortfolio} />
      {optimisationData && (
        <DrawdownChart
          drawdownData={optimisationData?.optimisation_results[gamma]?.drawdown || []}
          maxDrawdown={optimisationData?.optimisation_results[gamma]?.max_drawdown} />
      )}
      {optimisationData && (
        <div className="flex flex-row w-full gap-8 items-stretch justify-center">
          <div className="flex-1">
            <AllocationsBarChart
              optimisedAllocation={optimisationData?.optimisation_results[gamma]?.weights}
              yourAllocation={yourPortfolio?.weights} />
          </div>
          <div className="flex-1">
            <CorrelationHeatmap
              corrMatrix={optimisationData?.stock_stats.corr_matrix} />
          </div>
        </div>
      )}
    </div>
);
