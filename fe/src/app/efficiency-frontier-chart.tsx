import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Scatter,
} from "recharts";
import { OptimisationResult } from "./interfaces";

const lineColors = [
  "#8884d8", // purple
  "#82ca9d", // green
  "#ff7300", // orange
  "#0088FE", // blue
  "#FF8042", // orange-red
  "#00C49F", // teal
  "#FFBB28", // yellow
  "#A28FD0", // lavender
  "#FF6699", // pink
  "#33CCFF", // light blue
];

const xBoarderBuffer = 0.02; // 2% buffer for x-axis
const yBoarderBuffer = 0.05; // 2% buffer for y-axis

export default function EfficiencyFrontierChart({
  optimisedPortfolios,
  yourPortfolio,
  selectedPortfolio,
}: {
  optimisedPortfolios: OptimisationResult[];
  selectedPortfolio?: OptimisationResult;
  yourPortfolio: OptimisationResult;
}) {
  const stdDevs = optimisedPortfolios.map(p => p.std_dev);
  const returns = optimisedPortfolios.map(p => p.return);

  const fontSize = 14;

  return (
    <LineChart
      width={1000}
      height={400}
      data={optimisedPortfolios}
      margin={{ top: 5, right: 50, left: 20, bottom: 20 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        type="number"
        dataKey="std_dev"
        domain={[(dataMin) => {
          const min = Math.min(...stdDevs);
          return min * (1 - xBoarderBuffer);
        },
        (dataMax) => {
          
          const max = Math.max(...stdDevs);
          return max * (1 + xBoarderBuffer);
        }]}
        tickFormatter={(value) => value.toFixed(2)}
        label={{
          value: "Standard Deviation (Risk %)",
          position: "insideBottom",
          offset: -10,
          style: { textAnchor: "middle", fontWeight: "bold", fontSize },
        }}
      />
      <YAxis
        dataKey="return"
        type="number"
        domain={[(dataMin) => {
          const min = Math.min(...returns);
          return min * (1 - yBoarderBuffer);
        },
        (dataMax) => {
          const max = Math.max(...returns);
          return max * (1 + yBoarderBuffer);
        }
      ]}
      tickFormatter={(value) => value.toFixed(2)}
        label={{
          value: "Annualised Return (%)",
          angle: -90,
          offset: 3,
          dy: -80,
          position: "left",
          fontWeight: "bold",
          fontSize,
        }}
      />
      <Line
        type="monotone"
        dataKey="return"
        name="Efficiency Frontier"
        stroke="#8884d8"
        isAnimationActive={false}
      />
      {selectedPortfolio && (
        <Scatter
          name="Selected Portfolio"
          data={[selectedPortfolio]}
          fill="#0074D9"
          shape="circle"
          isAnimationActive={false}
        />
      )}
      {yourPortfolio && (
        <Scatter
          name="Your Portfolio"
          data={[yourPortfolio]}
          fill="#FF4136"
          shape="circle"
        />
      )}
      <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize }} />
    </LineChart>
  );
}
