"use client";
import AllocationsBarChart from "./allocations-bar-chart";
import { CorrelationHeatmap } from "./correlation-heatmap";
import { DrawdownChart } from "./drawdown-chart";
import EfficiencyFrontierChart from "./efficiency-frontier-chart";
import { PortfolioAnalysisResult, OptimisedValues } from "./interfaces";
import { OptimisationSlider } from "./optimisation-slider";

export const AnalysisResults = ({
  gamma,
  setGamma,
  yourPortfolio,
  optimisationData,
}: {
  gamma: number;
  setGamma: (gamma: number) => void;
  yourPortfolio: PortfolioAnalysisResult | null;
  optimisationData: OptimisedValues;
}) => (
  <div className="flex flex-col w-full gap-8 items-center justify-center">
    <h2 className="text-2xl font-bold text-center">
      Analysis and Optimisation Results
    </h2>
    <OptimisationSlider
      gamma={gamma}
      setGamma={setGamma}
      optimisationResults={optimisationData?.optimisationResults || []}
    />
    <EfficiencyFrontierChart
      optimisedPortfolios={optimisationData?.optimisationResults || []}
      selectedPortfolio={optimisationData?.optimisationResults[gamma]}
      yourPortfolio={yourPortfolio}
    />
    {optimisationData && (
      <DrawdownChart
        drawdownData={
          optimisationData?.optimisationResults[gamma]?.drawdown || []
        }
        maxDrawdown={
          optimisationData?.optimisationResults[gamma]?.maxDrawdown
        }
        yourPortfolio={yourPortfolio}
      />
    )}
    {optimisationData && (
      <div className="flex flex-row w-full gap-8 items-stretch justify-center">
        <div className="flex-1">
          <AllocationsBarChart
            optimisedAllocation={
              optimisationData?.optimisationResults[gamma]?.weights
            }
            yourAllocation={yourPortfolio?.weights}
          />
        </div>
        <div className="flex-1">
          <CorrelationHeatmap
            corrMatrix={optimisationData?.stockStats.corrMatrix}
          />
        </div>
      </div>
    )}
  </div>
);
