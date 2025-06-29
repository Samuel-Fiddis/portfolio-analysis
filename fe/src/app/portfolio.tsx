"use client";

import { DataTable } from "@/components/custom/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { PortfolioItem } from "./interfaces";
import { useDebounceCallback } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { getPortfolioColumns } from "./table-columns";
import { DialogWrapper } from "./dialog-wrapper";
import { InstrumentSearch } from "./instrument-search";
import { InstrumentType } from "./interfaces";
import { SymbolSearchBox } from "./symbol-search-box";

interface PortfolioDataTableProps {
  portfolio: PortfolioItem[];
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioItem[]>>;
  refetchOptimisation: () => void;
}

export default function PortfolioDataTable({
  portfolio,
  setPortfolio,
  refetchOptimisation,
}: PortfolioDataTableProps) {
  // Query state hooks
  function updateShares(symbol: string, shares: number) {
    console.log(`Updating shares for ${symbol} to ${shares}`);
    setPortfolio((prev) => {
      return prev.map((item) => {
        if (item.symbol === symbol) {
          return {
            ...item,
            currentShares: shares,
          };
        }
        return item;
      });
    });
  }

  const debouncedUpdateShares = useDebounceCallback(updateShares, 1000);

  const columns = getPortfolioColumns({ updateShares: debouncedUpdateShares });

  const { table } = useDataTable({
    data: portfolio,
    columns,
    pageCount: 1,

    initialState: {
      sorting: [{ id: "symbol", desc: true }],
      columnVisibility: {
        sharePriceDate: false,
      },
    },
    getRowId: (row) => row.symbol,
  });

  const addToPortfolio = (
    items: {
      symbol: string;
      currency: string;
      instrument_type: InstrumentType;
    }[],
  ) => {
    const toAdd: PortfolioItem[] = items.map((r) => {
      return {
        symbol: r.symbol,
        instrumentType: r.instrument_type,
        currentShares: 0,
        value: 0,
        optimisedAllocation: undefined,
        currency: r.currency,
      };
    });
    setPortfolio((prevPortfolio) => {
      const newPortfolio = new Set(prevPortfolio);
      toAdd.forEach((newItem) => {
        if (
          Array.from(newPortfolio).find(
            (item) => item.symbol === newItem.symbol,
          ) == null
        ) {
          newPortfolio.add(newItem);
        }
      });
      return Array.from(newPortfolio);
    });
  };

  const advInstrumentSearch = (
    <div className="flex items-center gap-2">
      <SymbolSearchBox addToPortfolio={addToPortfolio} />
      <DialogWrapper
        buttonText="Advanced Instrument Search 🔍"
        dialogTitle="Advanced Instrument Search"
      >
        <InstrumentSearch addToPortfolio={addToPortfolio} />
      </DialogWrapper>
    </div>
  );

  const analyseAndOptimise = portfolio.length > 1 && (
    <Button size="sm" onClick={() => refetchOptimisation()}>
      Analyse and Optimise 🧠
    </Button>
  );

  return (
    <div className="data-table-container">
      <DataTable
        table={table}
        noValuesString="Add at least 2 assets to your portfolio for analysis! 😊"
      >
        <DataTableToolbar table={table} childrenFarLeft={advInstrumentSearch}>
          {analyseAndOptimise}
          {portfolio.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-dashed"
              onClick={() => {
                setPortfolio([]);
              }}
            >
              Reset Portfolio
            </Button>
          )}
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
