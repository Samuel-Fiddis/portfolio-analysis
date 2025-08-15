import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Scatter,
  Tooltip,
} from "recharts";
import { PortfolioAnalysisResult } from "./interfaces";

const xBoarderBuffer = 0.2;
const yBoarderBuffer = 0.2;

export default function EfficiencyFrontierChart({
  optimisedPortfolios,
  yourPortfolio,
  selectedPortfolio,
}: {
  optimisedPortfolios: PortfolioAnalysisResult[];
  selectedPortfolio?: PortfolioAnalysisResult;
  yourPortfolio?: PortfolioAnalysisResult | null;
}) {
  const stdDevs = optimisedPortfolios.map((p) => p.stdDev);
  const returns = optimisedPortfolios.map((p) => p.geometricMean);

  // Calculate min/max and range for each axis
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
  const xAsixTickInterval = 2;

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
          ticks={Array.from(
              {
                length:
                  Math.ceil(
                    (Math.ceil(maxStdDev / xAsixTickInterval) * xAsixTickInterval -
                      Math.floor((minStdDev - 1) / xAsixTickInterval) * xAsixTickInterval) /
                      xAsixTickInterval
                  ) + 1,
              },
              (_, i) => Math.floor((minStdDev - 1) / xAsixTickInterval) * xAsixTickInterval + i * xAsixTickInterval
            )}
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
          ticks={Array.from(
              {
                length:
                  Math.ceil(
                    (Math.ceil(maxReturn / yAxisTickInterval) * yAxisTickInterval -
                      Math.floor((minReturn - 1) / yAxisTickInterval) * yAxisTickInterval) /
                      yAxisTickInterval
                  ) + 1,
              },
              (_, i) => Math.floor((minReturn - 1) / yAxisTickInterval) * yAxisTickInterval + i * yAxisTickInterval
            )}
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
        {selectedPortfolio && (
          <Scatter
            name="Selected Optimised Portfolio"
            data={[selectedPortfolio]}
            fill="#66A3FF"
            stroke="#001f3f"
            shape="circle"
            isAnimationActive={false}
          />
        )}
        {yourPortfolio &&
          yourPortfolio.geometricMean &&
          yourPortfolio.stdDev && (
            <Scatter
              name="Your Portfolio"
              data={[yourPortfolio]}
              fill="#8884d8"
              stroke="#001f3f"
              shape="circle"
            />
          )}
        <Tooltip />
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
