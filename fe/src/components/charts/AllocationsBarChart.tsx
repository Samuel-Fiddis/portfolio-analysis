import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { PortfolioAnalysisResult, PortfolioWeight } from "../../types/interfaces";
import { DEFAULT_COLOURS } from "../../types/colours";

export default function AllocationsBarChart({
  comparePortfolios,
}: {
  comparePortfolios: PortfolioAnalysisResult[];
}) {
  const allSymbols = Array.from(
    new Set(comparePortfolios.flatMap((allocation) => allocation.weights.map((item) => item.symbol)))
  );

  const data = allSymbols.map((symbol) => {
    const entry: Record<string, any> = { symbol };
    comparePortfolios.forEach((allocation) => {
      const found = allocation.weights.find((item) => item.symbol === symbol);
      entry[allocation.name] = found
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
        {comparePortfolios.map((allocation, idx) => (
          <Bar
            key={allocation.name}
            dataKey={allocation.name}
            name={allocation.name}
            fill={DEFAULT_COLOURS[idx % DEFAULT_COLOURS.length]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </div>
  );
}