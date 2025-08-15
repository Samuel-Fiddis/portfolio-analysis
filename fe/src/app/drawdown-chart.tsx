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
  PortfolioAnalysisResult,
} from "./interfaces";

export const DrawdownChart = ({
  drawdownData,
  maxDrawdown,
  yourPortfolio,
}: {
  drawdownData: DrawdownData[];
  maxDrawdown: DrawdownDetails;
  yourPortfolio: PortfolioAnalysisResult | null;
}) => {
  const data = drawdownData.map((item) => ({
    tradeDate: new Date(
      String(item.tradeDate).length === 13
        ? item.tradeDate
        : item.tradeDate * 1000
    )
      .toISOString()
      .slice(0, 10),
    value: parseFloat((item.value * 100).toFixed(2)),
  }));

  const yourPortfolioDrawdown = yourPortfolio?.drawdown.map((item) => ({
    tradeDate: new Date(
      String(item.tradeDate).length === 13
        ? item.tradeDate
        : item.tradeDate * 1000
    )
      .toISOString()
      .slice(0, 10),
    value: item.value || 0,
  }));

  const yourPortfolioMaxDrawdown = yourPortfolio?.maxDrawdown;

  console.log("yourPortfolioDrawdown: ", yourPortfolioDrawdown);

  return (
    <div className="overflow-x-auto">
      <p className="text-center font-semibold">Portfolio Drawdowns</p>
      <div className="flex flex-row gap-8 items-start mb-4">
        <AreaChart
          width={1200}
          height={500}
          data={data}
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
          <Area
            type="linear"
            dataKey="value"
            stroke="#8884d8"
            fill="#ff5555"
            isAnimationActive={false}
            name="Selected Optimised Portfolio"
          />
          {yourPortfolio &&
            yourPortfolioDrawdown &&
            yourPortfolioDrawdown?.length > 0 && (
              <Area
                type="linear"
                dataKey="value"
                data={yourPortfolioDrawdown}
                stroke="#22c55e"
                fill="#bbf7d0"
                isAnimationActive={false}
                name="Your Portfolio"
              />
            )}
        </AreaChart>
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-gray-300 rounded p-4 min-w-[250px] shadow">
            <h3 className="font-bold mb-2 text-center text-gray-700">
              Optimised Portfolio Max Drawdown
            </h3>
            <div className="text-sm text-gray-700 text-center">
              <div>
                <span className="font-semibold">Percent:</span>{" "}
                {maxDrawdown?.percent !== undefined
                  ? `${maxDrawdown.percent.toFixed(2)}%`
                  : "N/A"}
              </div>
              <div>
                <span className="font-semibold">Start Date:</span>{" "}
                {maxDrawdown?.startDate?.slice(0, 10) || "Prior start"}
              </div>
              <div>
                <span className="font-semibold">Bottom Date:</span>{" "}
                {maxDrawdown?.bottomDate?.slice(0, 10) || "N/A"}
              </div>
              <div>
                <span className="font-semibold">End Date:</span>{" "}
                {maxDrawdown?.endDate?.slice(0, 10) || "Ongoing"}
              </div>
            </div>
          </div>
          {yourPortfolioMaxDrawdown && yourPortfolioMaxDrawdown.percent < 0 && (
            <div className="bg-white border border-green-300 rounded p-4 min-w-[250px] shadow">
              <h3 className="font-bold mb-2 text-center text-green-700">
                Your Portfolio Max Drawdown
              </h3>
              <div className="text-sm text-gray-700 text-center">
                <div>
                  <span className="font-semibold">Percent:</span>{" "}
                  {yourPortfolioMaxDrawdown?.percent !== undefined
                    ? `${yourPortfolioMaxDrawdown.percent.toFixed(2)}%`
                    : "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Start Date:</span>{" "}
                  {yourPortfolioMaxDrawdown?.startDate?.slice(0, 10) ||
                    "Prior start"}
                </div>
                <div>
                  <span className="font-semibold">Bottom Date:</span>{" "}
                  {yourPortfolioMaxDrawdown?.bottomDate?.slice(0, 10) || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">End Date:</span>{" "}
                  {yourPortfolioMaxDrawdown?.endDate?.slice(0, 10) || "Ongoing"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
