import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_URL } from "./custom-hooks";
import { useDebounce } from "@uidotdev/usehooks";
import { InstrumentRow, InstrumentType } from "./interfaces";

export function SymbolSearchBox({
  addToPortfolio,
}: {
  addToPortfolio: (
    items: InstrumentRow[],
  ) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [symbolSearchValue, setSymbolSearchValue] = useState("");
  const debouncedValue = useDebounce(symbolSearchValue, 1000);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbolSearchValue(e.target.value);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["simple-instrument-search", debouncedValue],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          index: debouncedValue,
          page_size: null,
          page: null,
        }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!debouncedValue, // only run when input is not empty
  });

  const handleSelect = (item: any) => {
    addToPortfolio([
      {
        symbol: item.symbol,
        currency: item.currency,
        instrument_type: item.instrument_type,
        exchange: item.exchange,
      } as InstrumentRow,
    ]);
    setSymbolSearchValue("");
  };

  return (
    <div className="w-1/2 relative">
      <Input
        placeholder="Search for a stock/ETF..."
        value={symbolSearchValue}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {debouncedValue && isFocused && (
        <div
          className="absolute left-0 mt-1 bg-white rounded shadow p-2 z-50 max-h-60 overflow-y-auto"
          style={{ width: "200%" }}
        >
          {isLoading && <div className="text-xs text-gray-500">Loading...</div>}
          {error && (
            <div className="text-xs text-red-500">Error loading results</div>
          )}
          {data && data.length > 0 ? (
            <ul>
              {data.map((item: any) => (
                <li
                  key={item.symbol + "-1"}
                  className="py-1 border-b last:border-b-0 cursor-pointer hover:bg-gray-100"
                  onMouseDown={() => handleSelect(item)}
                >
                  <span className="font-mono">{item.symbol}</span>
                  {item.name && (
                    <span className="ml-2 text-gray-600 text-xs">
                      {item.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            !isLoading &&
            debouncedValue && (
              <div className="text-xs text-gray-400">No results found.</div>
            )
          )}
        </div>
      )}
    </div>
  );
}
