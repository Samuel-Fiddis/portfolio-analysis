import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  DrawdownData,
  DrawdownDetails,
} from "../../types/interfaces";
import { DEFAULT_COLOURS } from "@/types/colours";


interface DrawdownChartItem {
  portfolioName: string;
  drawdown: DrawdownData[];
  maxDrawdown: DrawdownDetails;
}

type DrawdownChartProps = {
  items: DrawdownChartItem[];
};

export default function DrawdownChart({ items }: DrawdownChartProps) {

  const allSeries = items.map((item) => ({
    ...item,
    data: item.drawdown.map((d) => ({
      tradeDate: new Date(
        String(d.tradeDate).length === 13
          ? d.tradeDate
          : d.tradeDate * 1000
      )
        .toISOString()
        .slice(0, 10),
      value: parseFloat((d.value * 100).toFixed(2)),
    })),
  }));

  const allDates = Array.from(
    new Set(allSeries.flatMap((s) => s.data.map((d) => d.tradeDate)))
  ).sort();

  // Merge all series into one data array for AreaChart
  const chartData = allDates.map((date) => {
    const entry: Record<string, any> = { tradeDate: date };
    allSeries.forEach((series) => {
      const found = series.data.find((d) => d.tradeDate === date);
      entry[series.portfolioName] = found ? found.value : null;
    });
    return entry;
  });

  // Find min/max for Y axis
  const allValues = chartData.flatMap((row) =>
    items.map((item) => row[item.portfolioName]).filter((v) => v !== null)
  );
  const minY = Math.min(...allValues, 0);
  const maxY = Math.max(...allValues, 0);
  const yAxisTickInterval = 5;
  const domainMin = Math.floor((minY - 1) / yAxisTickInterval) * yAxisTickInterval;
  const domainMax = Math.ceil(maxY / yAxisTickInterval) * yAxisTickInterval;
  const ticks = Array.from(
    { length: Math.ceil((domainMax - domainMin) / yAxisTickInterval) + 1 },
    (_, i) => domainMin + i * yAxisTickInterval
  ).filter(tick => tick >= minY - 1 && tick <= maxY);

  return (
    <div className="overflow-x-auto">
      <p className="text-center font-semibold">Portfolio Drawdowns</p>
      <div className="flex flex-row gap-8 items-start mb-4">
        <AreaChart
          width={1200}
          height={500}
          data={chartData}
          margin={{
            top: 0,
            right: 0,
            left: 20,
            bottom: 30,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="tradeDate"
            label={{
              value: "Date",
              position: "insideBottom",
              offset: -20,
              style: { textAnchor: "middle", fontWeight: "bold" },
            }}
          />
          <YAxis
            type="number"
            domain={[minY - 1, maxY]}
            ticks={ticks}
            label={{
              value: "Drawdown (%)",
              angle: -90,
              offset: 3,
              dy: -50,
              position: "left",
              fontWeight: "bold",
            }}
          />
          <Legend
            verticalAlign="bottom"
            align="right"
            formatter={(value) => (
              <span style={{ color: "black" }}>{value}</span>
            )}
          />
          <Tooltip />
          {allSeries.map((series, idx) => (
            <Area
              key={series.portfolioName}
              type="linear"
              dataKey={series.portfolioName}
              stroke="#8884d8"
              fill={DEFAULT_COLOURS[idx % DEFAULT_COLOURS.length]}
              isAnimationActive={false}
              name={series.portfolioName}
            />
          ))}
        </AreaChart>
        <div className="flex flex-col gap-4">
          {allSeries.map((series) => (
            <div
              key={series.portfolioName}
              className={`bg-white border rounded p-4 min-w-[250px] shadow ${
                series.portfolioName === allSeries[0].portfolioName
                  ? "border-gray-300"
                  : "border-green-300"
              }`}
            >
              <h3
                className={`font-bold mb-2 text-center ${
                  series.portfolioName === allSeries[0].portfolioName
                    ? "text-gray-700"
                    : "text-green-700"
                }`}
              >
                {series.portfolioName} Max Drawdown
              </h3>
              <div className="text-sm text-gray-700 text-center">
                <div>
                  <span className="font-semibold">Percent:</span>{" "}
                  {series.maxDrawdown?.percent !== undefined
                    ? `${series.maxDrawdown.percent.toFixed(2)}%`
                    : "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Start Date:</span>{" "}
                  {series.maxDrawdown?.startDate?.slice(0, 10) || "Prior start"}
                </div>
                <div>
                  <span className="font-semibold">Bottom Date:</span>{" "}
                  {series.maxDrawdown?.bottomDate?.slice(0, 10) || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">End Date:</span>{" "}
                  {series.maxDrawdown?.endDate?.slice(0, 10) || "Ongoing"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
