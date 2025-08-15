import {
  Slider,
  SliderRange,
  SliderThumb,
  SliderTrack,
} from "@radix-ui/react-slider";

import { PortfolioAnalysisResult } from "../types/interfaces";
import { getMaxSharpeRatioGamma } from "../lib/analysis-functions";
import { Button } from "@/components/ui/button";

export default function OptimisationSlider({
  gamma,
  setGamma,
  optimisationResults,
}: {
  gamma: number;
  setGamma: (v: number) => void;
  optimisationResults: PortfolioAnalysisResult[];
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex flex-col items-center">
        <Button
          size="sm"
          onClick={() => {
            const sharpeGamma = getMaxSharpeRatioGamma(optimisationResults);
            setGamma(sharpeGamma ?? 0);
          }}
          className="mb-0"
          style={{ marginBottom: 2 }} // minimal space
        >
          ⚖️ Balance for Max Sharpe Ratio
        </Button>
        <div
          className="flex items-center gap-2 w-full"
          style={{ marginTop: 2 }}
        >
          <div className="flex flex-col items-center">
            <span role="img" aria-label="Low risk" style={{ fontSize: 24 }}>
              🪨
            </span>
            <span className="text-xs text-gray-600 mt-1">Minimise Risk</span>
          </div>
          <Slider
            defaultValue={[0]}
            min={0}
            max={optimisationResults.length - 1}
            step={1}
            onValueChange={(e) => setGamma(e[0])}
            value={[gamma]}
            className="optimisation-slider"
          >
            <SliderTrack className="optimisation-slider-track">
              <SliderRange className="optimisation-slider-range" />
            </SliderTrack>
            <SliderThumb className="optimisation-slider-thumb" />
          </Slider>
          <div className="flex flex-col items-center">
            <span role="img" aria-label="High risk" style={{ fontSize: 24 }}>
              🎢
            </span>
            <span className="text-xs text-gray-600 mt-1">Maximise Returns</span>
          </div>
        </div>
      </div>
    </div>
  );
}
