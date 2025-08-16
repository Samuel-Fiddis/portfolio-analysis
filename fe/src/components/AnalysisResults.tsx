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
  yourPortfolio,
  optimisationData,
}: {
  gamma: number;
  setGamma: (gamma: number) => void;
  yourPortfolio: PortfolioAnalysisResult;
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
      comparePortfolios={[{name: SELECTED_PORTFOLIO_NAME, data: optimisationData?.optimisationResults[gamma]}, { name: YOUR_PORTFOLIO_NAME, data: yourPortfolio ? yourPortfolio : undefined }]}
    />
    {optimisationData && (
      <DrawdownChart
        items={[
          {
            portfolioName: SELECTED_PORTFOLIO_NAME,
            drawdown: optimisationData?.optimisationResults[gamma]?.drawdown || [],
            maxDrawdown: optimisationData?.optimisationResults[gamma]?.maxDrawdown
          },
          {
            portfolioName: YOUR_PORTFOLIO_NAME,
            drawdown: yourPortfolio?.drawdown || [],
            maxDrawdown: yourPortfolio?.maxDrawdown || {
              percent: 0,
              startDate: "",
              endDate: "",
              bottomDate: ""
            }
          }
        ]}
      />
    )}
    {optimisationData && (
      <div className="flex flex-row w-full gap-8 items-stretch justify-center">
        <div className="flex-1">
          <AllocationsBarChart
          allocations={[{
            portfolioName: YOUR_PORTFOLIO_NAME,
            data: yourPortfolio?.weights || []
          },{
            portfolioName: SELECTED_PORTFOLIO_NAME,
            data: optimisationData?.optimisationResults[gamma]?.weights || []
          }]}
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
