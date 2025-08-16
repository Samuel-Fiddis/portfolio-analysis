import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useInstrumentSearchQuery } from "../hooks/custom-hooks";
import { useDebounce } from "@uidotdev/usehooks";
import { InstrumentRow } from "../types/interfaces";

export default function SymbolSearchBox({
  addToPortfolio,
}: {
  addToPortfolio: (items: InstrumentRow[]) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [symbolSearchValue, setSymbolSearchValue] = useState("");
  const debouncedValue = useDebounce(symbolSearchValue, 1000);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbolSearchValue(e.target.value);
  };

  const { data, isLoading, error } = useInstrumentSearchQuery(
    {
      symbol: debouncedValue,
      name: debouncedValue,
      pageSize: null,
      page: null,
    },
    ["simple-instrument-search", debouncedValue]
  );

  const handleSelect = (item: any) => {
    addToPortfolio([
      {
        symbol: item.symbol,
        currency: item.currency,
        instrumentType: item.instrumentType,
        exchange: item.exchange,
      } as InstrumentRow,
    ]);
    setSymbolSearchValue("");
  };

  return (
    <div className="w-1/2 relative">
      <Input
        placeholder="Search Stock/ETF/Crypto..."
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
          {data && data.data && data.data.length > 0 ? (
            <ul>
              {data.data.map((item: any) => (
                <li
                  key={item.symbol + "-" + item.name + "-1"}
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
