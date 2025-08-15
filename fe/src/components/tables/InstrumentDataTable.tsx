"use client";

import { useMemo, useState } from "react";
import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";
import { DataTable } from "@/components/custom/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { getTableColumns } from "../../types/table-columns";
import { useDebounce } from "@uidotdev/usehooks";
import { useInstrumentSearchQuery } from "../../hooks/custom-hooks";
import { InstrumentRow, InstrumentType } from "../../types/interfaces";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InstrumentDataTable({
  addToPortfolio,
}: {
  addToPortfolio: (items: InstrumentRow[]) => void;
}) {
  // Query state hooks
  const [searcyQueryValues, setSearchQueryValues] = useQueryStates({
    symbol: parseAsString.withDefault(""),
    currency: parseAsArrayOf(parseAsString),
    exchange: parseAsArrayOf(parseAsString),
    sector: parseAsArrayOf(parseAsString),
    industry: parseAsArrayOf(parseAsString),
    category: parseAsArrayOf(parseAsString),
    categoryGroup: parseAsArrayOf(parseAsString),
    family: parseAsArrayOf(parseAsString),
    page: parseAsString.withDefault("1"),
    perPage: parseAsString.withDefault("10"),
  });

  const debouncedQueryValues = useDebounce(searcyQueryValues, 500);

  const instrumentTypes: InstrumentType[] = ["Equities", "ETFs"];
  const [selectedType, setSelectedType] = useState<InstrumentType>("Equities");

  const {
    data = { data: [], pageCount: 0, options: {} },
    isLoading,
    error,
  } = useInstrumentSearchQuery(
    {
      symbol: debouncedQueryValues.symbol,
      name: debouncedQueryValues.symbol,
      instrumentType: selectedType,
      currency: debouncedQueryValues.currency,
      exchange: debouncedQueryValues.exchange,
      sector: debouncedQueryValues.sector,
      industry: debouncedQueryValues.industry,
      category: debouncedQueryValues.category,
      categoryGroup: debouncedQueryValues.categoryGroup,
      family: debouncedQueryValues.family,
      page: debouncedQueryValues.page,
      pageSize: debouncedQueryValues.perPage,
    },
    ["instrument-search", selectedType, debouncedQueryValues]
  );

  const columns = useMemo(
    () =>
      getTableColumns({ instrumentType: selectedType, options: data.options }),
    [selectedType, data.options]
  );

  const { table } = useDataTable({
    data: data.data,
    columns,
    pageCount: data.pageCount,
    initialState: {
      sorting: [{ id: "symbol", desc: true }],
      columnVisibility: {
        summary: false,
        instrumentType: false,
      },
    },
    getRowId: (row) => row.symbol,
  });

  // Force DataTable remount when column options change to allow for dynamic options
  const tableKey = useMemo(
    () => JSON.stringify(columns.map((col) => col?.meta?.options?.length)),
    [columns]
  );

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const instrumentTypeSelection = (
    <Select
      value={selectedType}
      onValueChange={(val) => setSelectedType(val as InstrumentType)}
    >
      <SelectTrigger className="w-[100px]">
        <SelectValue placeholder="Select instrument type" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Instrument Type</SelectLabel>
          {instrumentTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );

  return (
    <div className="data-table-container">
      <DataTable key={tableKey} isLoading={isLoading} table={table}>
        <DataTableToolbar
          table={table}
          childrenFarLeft={instrumentTypeSelection}
        >
          {selectedRows.length > 0 && (
            <Button
              size="sm"
              onClick={() =>
                addToPortfolio(
                  selectedRows.map(
                    (row) =>
                      ({
                        symbol: row.getValue("symbol"),
                        currency: row.getValue("currency"),
                        instrumentType: row.getValue(
                          "instrumentType"
                        ) as InstrumentType,
                        exchange: row.getValue("exchange"),
                      } as InstrumentRow)
                  )
                )
              }
            >
              Add To Portfolio
            </Button>
          )}
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
