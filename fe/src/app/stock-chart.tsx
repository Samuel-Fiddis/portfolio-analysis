import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { QuoteData } from "./interfaces";

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

export default function StockChart({ data }: { data: QuoteData }) {
  const symbols: string[] = Object.keys(data);
  const dateMap: Record<string, any> = {};

  symbols.forEach((symbol) => {
    const historicalData = data[symbol].historicalData;
    historicalData.forEach((point) => {
      const date = point.tradeDate;
      if (!dateMap[date]) {
        dateMap[date] = { tradeDate: date };
      }
      dateMap[date][symbol] = point.closePrice;
    });
  });

  const chartData = Object.values(dateMap);

  return (
    <LineChart
      width={1000}
      height={400}
      data={chartData}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="tradeDate"
        label={{
          value: "Date",
          position: "insideBottom",
          offset: -10,
          style: { textAnchor: "middle", fontWeight: "bold", fontSize: 14 },
        }}
      />
      <YAxis
        label={{
          value: "Close Price",
          angle: -90,
          position: "insideLeft", // or "insideLeft"
          offset: -4, // increase this value to move further left
          fontWeight: "bold",
          fontSize: 14,
        }}
      />
      <Tooltip />
      <Legend verticalAlign="top" align="right" />
      {symbols.map((symbol, idx) => (
        <Line
          key={symbol}
          type="monotone"
          dataKey={symbol}
          name={symbol}
          stroke={lineColors[idx % lineColors.length]}
        />
      ))}
    </LineChart>
  );
}
