import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Scatter,
} from "recharts";
import { PortfolioAnalysisResult } from "../../types/interfaces";
import { DEFAULT_COLOURS } from "@/types/constants";
import { generateTicks } from "@/lib/chart-functions";

const xBoarderBuffer = 0.2;
const yBoarderBuffer = 0.2;

export default function EfficiencyFrontierChart({
  optimisedPortfolios,
  comparePortfolios,
}: {
  optimisedPortfolios: PortfolioAnalysisResult[];
  comparePortfolios?: PortfolioAnalysisResult[];
}) {
  const stdDevs = optimisedPortfolios.map((p) => p.stdDev);
  const returns = optimisedPortfolios.map((p) => p.geometricMean);

  const minStdDev = Math.min(...stdDevs);
  const maxStdDev = Math.max(...stdDevs);
  const stdDevRange = maxStdDev - minStdDev;

  const minReturn = Math.min(...returns);
  const maxReturn = Math.max(...returns);
  const returnRange = maxReturn - minReturn;

  const xBuffer = stdDevRange * xBoarderBuffer;
  const yBuffer = returnRange * yBoarderBuffer;

  const fontSize = 14;
  const yAxisTickInterval = 2;
  const xAxisTickInterval = 2;
  const xTicks = generateTicks(minStdDev - xAxisTickInterval, maxStdDev + xAxisTickInterval, xAxisTickInterval);
  const yTicks = generateTicks(minReturn - yAxisTickInterval, maxReturn + yAxisTickInterval, yAxisTickInterval);

  return (
    <div className="overflow-x-auto">
      <p className="text-center font-semibold">Efficiency Frontier</p>
      <LineChart
        width={1000}
        height={400}
        data={optimisedPortfolios}
        margin={{ top: 5, right: 50, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="stdDev"
          domain={[() => minStdDev - xBuffer, () => maxStdDev + xBuffer]}
          tickFormatter={(value) => value.toFixed(2)}
          ticks={xTicks}
          label={{
            value: "Standard Deviation (Risk %)",
            position: "insideBottom",
            offset: -10,
            style: { textAnchor: "middle", fontWeight: "bold", fontSize },
          }}
        />
        <YAxis
          dataKey="geometricMean"
          type="number"
          domain={[() => minReturn - yBuffer, () => maxReturn + yBuffer]}
          tickFormatter={(value) => value.toFixed(2)}
          ticks={yTicks}
          label={{
            value: "Annualised Return (%)",
            angle: -90,
            offset: 3,
            dy: -110,
            position: "left",
            fontWeight: "bold",
            fontSize,
          }}
        />
        <Line
          type="monotone"
          dataKey="geometricMean"
          name="Efficiency Frontier"
          stroke="#288cfa"
          isAnimationActive={false}
        />
        {comparePortfolios &&
          comparePortfolios.length > 0 &&
          comparePortfolios.map((portfolio, idx) => {
            if (portfolio && portfolio.geometricMean && portfolio.stdDev) {
              return (
                <Scatter
                  key={portfolio.name}
                  name={portfolio.name}
                  data={[portfolio]}
                  fill={DEFAULT_COLOURS[idx % DEFAULT_COLOURS.length]}
                  stroke="#001f3f"
                  shape="circle"
                  isAnimationActive={false}
                />
              );
            }
            return null;
          })}
        <Legend
          verticalAlign="top"
          align="center"
          wrapperStyle={{ fontSize }}
          formatter={(value) => <span style={{ color: "black" }}>{value}</span>}
        />
      </LineChart>
    </div>
  );
}
