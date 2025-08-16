"use client";
import AllocationsBarChart from "./charts/AllocationsBarChart";
import CorrelationHeatmap from "./charts/CorrelationHeatmap";
import DrawdownChart from "./charts/DrawdownChart";
import EfficiencyFrontierChart from "./charts/EfficiencyFrontierChart";
import { PortfolioAnalysisResult, OptimisedValues } from "../types/interfaces";
import OptimisationSlider from "./OptimisationSlider";


const YOUR_PORTFOLIO_NAME = "Your Portfolio";
const SELECTED_PORTFOLIO_NAME = "Selected Optimised Portfolio";

export const AnalysisResults = ({
  gamma,
  setGamma,
  comparePortfolios,
  optimisationData,
}: {
  gamma: number;
  setGamma: (gamma: number) => void;
  comparePortfolios: PortfolioAnalysisResult[];
  optimisationData: OptimisedValues;
}) => (
  <div className="flex flex-col w-full gap-8 items-center justify-center">
    <h2 className="text-2xl font-bold text-center">
      Analysis Results
    </h2>
    <OptimisationSlider
      gamma={gamma}
      setGamma={setGamma}
      optimisationResults={optimisationData?.optimisationResults || []}
    />
    <EfficiencyFrontierChart
      optimisedPortfolios={optimisationData?.optimisationResults || []}
      comparePortfolios={comparePortfolios}
    />
    {optimisationData && (
      <DrawdownChart
        items={comparePortfolios}
      />
    )}
    {optimisationData && (
      <div className="flex flex-row w-full gap-8 items-stretch justify-center">
        <div className="flex-1">
          <AllocationsBarChart
          allocations={comparePortfolios}
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
