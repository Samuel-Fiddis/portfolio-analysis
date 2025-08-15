import {
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { PortfolioWeight } from "./interfaces";

export default function AllocationsBarChart({
  optimisedAllocation,
  yourAllocation,
}: {
  optimisedAllocation: PortfolioWeight[];
  yourAllocation?: PortfolioWeight[];
}) {
  // Prepare data for the chart
  const data = optimisedAllocation.map((item) => ({
    symbol: item.symbol,
    optimisedValue: (item.value_proportion * 100).toFixed(2),
    yourValue: (
      yourAllocation?.find((a) => a.symbol === item.symbol)?.value_proportion ??
      0
    ).toFixed(2),
  }));

  return (
    <div className="overflow-x-auto">
      <p className="text-center font-semibold">Instrument Allocations</p>
      <BarChart
        width={800}
        height={300}
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
        title="Instrument Allocations"
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="symbol" />
        <YAxis
          domain={[0, 100]}
          label={{
            value: "Allocation (%)",
            angle: -90,
            offset: 3,
            dy: -80,
            position: "left",
            fontWeight: "bold",
            fontSize: 14,
          }}
        />
        <Tooltip />
        <Legend
          formatter={(value) => <span style={{ color: "black" }}>{value}</span>}
        />
        <Bar
          dataKey="optimisedValue"
          name="Selected Optimised Portfolio"
          fill="#66A3FF"
          activeBar={<Rectangle fill="pink" stroke="blue" />}
          isAnimationActive={false}
        />
        <Bar
          dataKey="yourValue"
          name="Your Portfolio"
          fill="#8884d8"
          activeBar={<Rectangle fill="gold" stroke="purple" />}
          isAnimationActive={false}
        />
      </BarChart>
    </div>
  );
}
