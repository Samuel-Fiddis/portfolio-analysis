import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { DrawdownData, DrawdownDetails } from "./interfaces";

export const DrawdownChart = ({
  drawdownData,
  maxDrawdown,
}: {
  drawdownData: DrawdownData[];
  maxDrawdown: DrawdownDetails;
}) => {
  const data = drawdownData.map((item) => ({
    trade_date: new Date(
      String(item.trade_date).length === 13
        ? item.trade_date
        : item.trade_date * 1000
    )
      .toISOString()
      .slice(0, 10),
    value: item.value * 100,
  }));

  return (
    <div className="overflow-x-auto">
      <p className="text-center font-semibold">
        Selected Optimised Portfolio Drawdown
      </p>
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
            dataKey="trade_date"
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
          <Tooltip />
          <Area
            type="linear"
            dataKey="value"
            stroke="#8884d8"
            fill="#ff5555"
            isAnimationActive={false}
          />
        </AreaChart>
        <div className="bg-white border border-gray-300 rounded p-4 min-w-[250px] shadow">
          <h3 className="font-bold mb-2 text-center text-gray-700">Max Drawdown</h3>
          <div className="text-sm text-gray-700">
            <div>
              <span className="font-semibold">Percent:</span>{" "}
              {maxDrawdown?.percent !== undefined
                ? `${(maxDrawdown.percent).toFixed(2)}%`
                : "N/A"}
            </div>
            <div>
              <span className="font-semibold">Start Date:</span>{" "}
              {maxDrawdown?.start_date.slice(0, 10) || "N/A"}
            </div>
            <div>
              <span className="font-semibold">End Date:</span>{" "}
              {maxDrawdown?.end_date.slice(0, 10) || "N/A"}
            </div>
            <div>
              <span className="font-semibold">Bottom Date:</span>{" "}
              {maxDrawdown?.bottom_date.slice(0, 10) || "N/A"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};