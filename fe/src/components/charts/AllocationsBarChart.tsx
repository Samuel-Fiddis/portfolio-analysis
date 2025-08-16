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
import { PortfolioWeight } from "../../types/interfaces";
import { DEFAULT_COLOURS } from "../../types/colours";

export default function AllocationsBarChart({
  allocations,
}: {
  allocations: {
    portfolioName: string;
    data: PortfolioWeight[];
  }[];
}) {
  const allSymbols = Array.from(
    new Set(allocations.flatMap((allocation) => allocation.data.map((item) => item.symbol)))
  );

  const data = allSymbols.map((symbol) => {
    const entry: Record<string, any> = { symbol };
    allocations.forEach((allocation) => {
      const found = allocation.data.find((item) => item.symbol === symbol);
      entry[allocation.portfolioName] = found
        ? Number((found.valueProportion * 100).toFixed(2))
        : 0;
    });
    return entry;
  });

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
        {allocations.map((allocation, idx) => (
          <Bar
            key={allocation.portfolioName}
            dataKey={allocation.portfolioName}
            name={allocation.portfolioName}
            fill={DEFAULT_COLOURS[idx % DEFAULT_COLOURS.length]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </div>
  );
}