"use client";

import { DataTable } from "@/components/custom/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { InstrumentRow, PortfolioItem } from "./interfaces";
import { useDebounceCallback } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { getPortfolioColumns } from "./table-columns";
import { DialogWrapper } from "./dialog-wrapper";
import { InstrumentSearch } from "./instrument-search";
import { SymbolSearchBox } from "./symbol-search-box";

interface PortfolioDataTableProps {
  portfolio: PortfolioItem[];
  toolBarChildren?: React.ReactNode;
  toolBarChildrenLeft?: React.ReactNode;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioItem[]>>;
}

export default function PortfolioDataTable({
  portfolio,
  setPortfolio,
  toolBarChildren,
}: PortfolioDataTableProps) {
  // Query state hooks
  function updateShares(symbol: string, shares: number) {
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

  const addToPortfolio = (items: InstrumentRow[]) => {
    const toAdd: PortfolioItem[] = items.map((r) => {
      return {
        symbol: r.symbol,
        instrumentType: r.instrument_type,
        currentShares: 0,
        value: 0,
        currency: r.currency,
        exchange: r.exchange,
        yourAllocation: 0,
      };
    });
    setPortfolio((prevPortfolio) => {
      const newPortfolio = new Set(prevPortfolio);
      toAdd.forEach((newItem) => {
        if (
          Array.from(newPortfolio).find(
            (item) => item.symbol === newItem.symbol
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
        dialogTitle="Advanced Instrument Search 🔍"
      >
        <InstrumentSearch addToPortfolio={addToPortfolio} />
      </DialogWrapper>
    </div>
  );

  return (
    <div className="data-table-container">
      <DataTable
        table={table}
        noValuesString="Add at least 2 assets to your portfolio for analysis"
      >
        <DataTableToolbar table={table} childrenFarLeft={advInstrumentSearch}>
          {toolBarChildren}
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
