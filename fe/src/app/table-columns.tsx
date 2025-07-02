import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

import { CircleDashed, DollarSign, Text } from "lucide-react";

import type { Column, ColumnDef } from "@tanstack/react-table";

import { Checkbox } from "@/components/ui/checkbox";

import {
  EquitiesOptions,
  EquitiesRow,
  ETFsOptions,
  ETFsRow,
  InstrumentRow,
  InstrumentType,
} from "./interfaces";
import { PortfolioItem } from "./interfaces";
import React, { useState, useEffect } from "react";
import { DynamicBar } from "@/components/custom/dynamic-bar";
import { ColourValue } from "@/components/custom/colour-value";

import { Input } from "@/components/ui/input";

interface GetTableColumnsProps<T> {
  instrumentType: InstrumentType;
  options: EquitiesOptions;
}

export function getTableColumns<T extends InstrumentRow>({
  instrumentType,
  options,
}: GetTableColumnsProps<T>): ColumnDef<T>[] {
  switch (instrumentType) {
    case "Equities":
      return getEquitiesColumns(options) as ColumnDef<T>[];
    case "ETFs":
      return getETFsColumns(options) as ColumnDef<T>[];
    default:
      return [];
  }
}

function getEquitiesColumns(options: EquitiesOptions) {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 32,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "instrument_type",
      accessorKey: "instrument_type",
      header: ({ column }: { column: Column<ETFsRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Instrument Type" />
      ),
      cell: ({ cell }) => (
        <div>{cell.getValue<ETFsRow["instrument_type"]>()}</div>
      ),
      meta: {
        label: "Instrument Type",
      },
    },
    {
      id: "symbol",
      accessorKey: "symbol",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Symbol" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["symbol"]>()}</div>,
      meta: {
        label: "Symbol",
        placeholder: "Search symbols...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      enableHiding: false,
    },
    {
      id: "exchange",
      accessorKey: "exchange",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Exchange" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["exchange"]>()}</div>,
      meta: {
        label: "Exchange",
        variant: "multiSelect",
        options:
          options?.exchange &&
          options?.exchange.map((value: String) => {
            return {
              label: value,
              value: value,
            };
          }),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["name"]>()}</div>,
      meta: {
        label: "Name",
      },
    },
    {
      id: "summary",
      accessorKey: "summary",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Summary" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["summary"]>()}</div>,
      meta: {
        label: "Summary",
      },
    },
    {
      id: "currency",
      accessorKey: "currency",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Currency" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["currency"]>()}</div>,
      meta: {
        label: "Currency",
        variant: "multiSelect",
        options:
          options?.currency &&
          options?.currency.map((value: String) => {
            return {
              label: value,
              value: value,
            };
          }),
        icon: DollarSign,
      },
      enableColumnFilter: true,
    },
    {
      id: "sector",
      accessorKey: "sector",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Sector" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["sector"]>()}</div>,
      meta: {
        label: "Sector",
        variant: "multiSelect",
        options:
          options?.sector &&
          options?.sector.map((value: String) => {
            return {
              label: value,
              value: value,
            };
          }),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "industry_group",
      accessorKey: "industry_group",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Industry Group" />
      ),
      cell: ({ cell }) => (
        <div>{cell.getValue<EquitiesRow["industry_group"]>()}</div>
      ),
      meta: {
        label: "Industry Group",
      },
    },
    {
      id: "industry",
      accessorKey: "industry",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Industry" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["industry"]>()}</div>,
      meta: {
        label: "Industry",
        variant: "multiSelect",
        options:
          options?.industry &&
          options?.industry.map((value: String) => {
            return {
              label: value,
              value: value,
            };
          }),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "market",
      accessorKey: "market",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Market" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["market"]>()}</div>,
      meta: {
        label: "Market",
      },
    },
    {
      id: "country",
      accessorKey: "country",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Country" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["country"]>()}</div>,
      meta: {
        label: "Country",
      },
    },
    {
      id: "state",
      accessorKey: "state",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="State" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["state"]>()}</div>,
      meta: {
        label: "State",
      },
    },
    {
      id: "city",
      accessorKey: "city",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="City" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["city"]>()}</div>,
      meta: {
        label: "City",
      },
    },
    {
      id: "zipcode",
      accessorKey: "zipcode",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Zipcode" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["zipcode"]>()}</div>,
      meta: {
        label: "Zipcode",
      },
    },
    {
      id: "website",
      accessorKey: "website",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Website" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["website"]>()}</div>,
      meta: {
        label: "Website",
      },
    },
    {
      id: "market_cap",
      accessorKey: "market_cap",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Market Cap" />
      ),
      cell: ({ cell }) => (
        <div>{cell.getValue<EquitiesRow["market_cap"]>()}</div>
      ),
      meta: {
        label: "Market Cap",
      },
    },
    {
      id: "isin",
      accessorKey: "isin",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="ISIN" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["isin"]>()}</div>,
      meta: {
        label: "ISIN",
      },
    },
    {
      id: "cusip",
      accessorKey: "cusip",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="CUSIP" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["cusip"]>()}</div>,
      meta: {
        label: "CUSIP",
      },
    },
    {
      id: "figi",
      accessorKey: "figi",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="FIGI" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["figi"]>()}</div>,
      meta: {
        label: "FIGI",
      },
    },
    {
      id: "composite_figi",
      accessorKey: "composite_figi",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Composite FIGI" />
      ),
      cell: ({ cell }) => (
        <div>{cell.getValue<EquitiesRow["composite_figi"]>()}</div>
      ),
      meta: {
        label: "Composite FIGI",
      },
    },
    {
      id: "shareclass_figi",
      accessorKey: "shareclass_figi",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Shareclass FIGI" />
      ),
      cell: ({ cell }) => (
        <div>{cell.getValue<EquitiesRow["shareclass_figi"]>()}</div>
      ),
      meta: {
        label: "Shareclass FIGI",
      },
    },
  ] as ColumnDef<EquitiesRow>[];
}

function getETFsColumns(options: ETFsOptions) {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 32,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "instrument_type",
      accessorKey: "instrument_type",
      header: ({ column }: { column: Column<ETFsRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Instrument Type" />
      ),
      cell: ({ cell }) => (
        <div>{cell.getValue<ETFsRow["instrument_type"]>()}</div>
      ),
      meta: {
        label: "Instrument Type",
      },
    },
    {
      id: "symbol",
      accessorKey: "symbol",
      header: ({ column }: { column: Column<ETFsRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Symbol" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<ETFsRow["symbol"]>()}</div>,
      meta: {
        label: "Symbol",
        placeholder: "Search symbols...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      enableHiding: false,
    },
    {
      id: "exchange",
      accessorKey: "exchange",
      header: ({ column }: { column: Column<EquitiesRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Exchange" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<EquitiesRow["exchange"]>()}</div>,
      meta: {
        label: "Exchange",
        variant: "multiSelect",
        options:
          options?.exchange &&
          options?.exchange.map((value: String) => {
            return {
              label: value,
              value: value,
            };
          }),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }: { column: Column<ETFsRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<ETFsRow["name"]>()}</div>,
      meta: {
        label: "Name",
      },
    },
    {
      id: "summary",
      accessorKey: "summary",
      header: ({ column }: { column: Column<ETFsRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Summary" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<ETFsRow["summary"]>()}</div>,
      meta: {
        label: "Summary",
      },
    },
    {
      id: "currency",
      accessorKey: "currency",
      header: ({ column }: { column: Column<ETFsRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Currency" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<ETFsRow["currency"]>()}</div>,
      meta: {
        label: "Currency",
        variant: "multiSelect",
        options:
          options?.currency &&
          options?.currency.map((value: String) => {
            return {
              label: value,
              value: value,
            };
          }),
        icon: DollarSign,
      },
      enableColumnFilter: true,
    },
    {
      id: "category_group",
      accessorKey: "category_group",
      header: ({ column }: { column: Column<ETFsRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Category Group" />
      ),
      cell: ({ cell }) => (
        <div>{cell.getValue<ETFsRow["category_group"]>()}</div>
      ),
      meta: {
        label: "Category Group",
        variant: "multiSelect",
        options:
          options?.category_group &&
          options?.category_group.map((value: String) => {
            return {
              label: value,
              value: value,
            };
          }),
        icon: DollarSign,
      },
      enableColumnFilter: true,
    },
    {
      id: "category",
      accessorKey: "category",
      header: ({ column }: { column: Column<ETFsRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<ETFsRow["category"]>()}</div>,
      meta: {
        label: "Category",
        variant: "multiSelect",
        options:
          options?.category &&
          options?.category.map((value: String) => {
            return {
              label: value,
              value: value,
            };
          }),
        icon: DollarSign,
      },
      enableColumnFilter: true,
    },
    {
      id: "family",
      accessorKey: "family",
      header: ({ column }: { column: Column<ETFsRow, unknown> }) => (
        <DataTableColumnHeader column={column} title="Family" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<ETFsRow["family"]>()}</div>,
      meta: {
        label: "Family",
        variant: "multiSelect",
        options:
          options?.family &&
          options?.family.map((value: String) => {
            return {
              label: value,
              value: value,
            };
          }),
        icon: DollarSign,
      },
      enableColumnFilter: true,
    },
  ] as ColumnDef<ETFsRow>[];
}

export function getPortfolioColumns({
  updateShares,
}: {
  updateShares: (symbol: string, shares: number) => void;
}) {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 32,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "symbol",
      accessorKey: "symbol",
      header: ({ column }: { column: Column<PortfolioItem, unknown> }) => (
        <DataTableColumnHeader column={column} title="Symbol" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<PortfolioItem["symbol"]>()}</div>,
      meta: {
        label: "Symbol",
      },
      enableHiding: false,
    },
    {
      id: "exchange",
      accessorKey: "exchange",
      header: ({ column }: { column: Column<PortfolioItem, unknown> }) => (
        <DataTableColumnHeader column={column} title="Exchange" />
      ),
      cell: ({ cell }) => <div>{cell.getValue<PortfolioItem["exchange"]>()}</div>,
      meta: {
        label: "Exchange",
      },
      enableHiding: false,
    },
    {
      id: "instrumentType",
      accessorKey: "instrumentType",
      header: ({ column }: { column: Column<PortfolioItem, unknown> }) => (
        <DataTableColumnHeader column={column} title="Instrument Type" />
      ),
      cell: ({ cell }) => (
        <div>{cell.getValue<PortfolioItem["instrumentType"]>()}</div>
      ),
      meta: {
        label: "Instrument Type",
      },
    },
    {
      id: "currentShares",
      accessorKey: "currentShares",
      header: ({ column }: { column: Column<PortfolioItem, unknown> }) => (
        <DataTableColumnHeader column={column} title="Shares" />
      ),
      cell: ({ cell }) => {
        const symbol = cell.row.original.symbol;
        const [localValue, setLocalValue] = useState(
          cell.row.original.currentShares,
        );

        // Sync local state if the row changes (e.g., after a refresh)
        useEffect(() => {
          setLocalValue(cell.row.original.currentShares);
        }, [cell.row.original.currentShares]);

        return (
          <div>
            <Input
              type="number"
              value={localValue}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLocalValue(val);
                updateShares(symbol, val); // debounced
              }}
            />
          </div>
        );
      },
      meta: {
        label: "currentShares",
      },
    },
    {
      id: "value",
      accessorKey: "value",
      header: ({ column }: { column: Column<PortfolioItem, unknown> }) => (
        <DataTableColumnHeader column={column} title="Value" />
      ),
      cell: ({ cell }) => {
        const value = cell.getValue<PortfolioItem["value"]>();
        return value !== undefined && value !== null ? value.toFixed(2) : "";
      },
      meta: {
        label: "Value",
      },
    },
    {
      id: "sharePrice",
      accessorKey: "sharePrice",
      header: ({ column }: { column: Column<PortfolioItem, unknown> }) => (
        <DataTableColumnHeader column={column} title="Share Price" />
      ),
      cell: ({ cell }) => {
        const value = cell.getValue<PortfolioItem["sharePrice"]>();
        return value !== undefined && value !== null ? value.toFixed(2) : "";
      },
      meta: {
        label: "Share Price",
      },
    },
    {
      id: "sharePriceDate",
      accessorKey: "sharePriceDate",
      header: ({ column }: { column: Column<PortfolioItem, unknown> }) => (
        <DataTableColumnHeader column={column} title="Share Price Date" />
      ),
      cell: ({ cell }) => (
        <div>{cell.getValue<PortfolioItem["sharePriceDate"]>()}</div>
      ),
      meta: {
        label: "Share Price Date",
      },
      enableHiding: true,
    },
    {
      id: "currency",
      accessorKey: "currency",
      header: ({ column }: { column: Column<PortfolioItem, unknown> }) => (
        <DataTableColumnHeader column={column} title="Currency" />
      ),
      cell: ({ cell }) => (
        <div>{cell.getValue<PortfolioItem["currency"]>()}</div>
      ),
      meta: {
        label: "Currency",
      },
    },
    {
      id: "yourAllocation",
      accessorKey: "yourAllocation",
      header: ({ column }: { column: Column<PortfolioItem, unknown> }) => (
        <DataTableColumnHeader column={column} title="Allocation %" />
      ),
      cell: ({ cell }) => {
        const value = cell.getValue<PortfolioItem["yourAllocation"]>() || 0;
        return value && <DynamicBar value={value} max={98} />;
      },
      meta: {
        label: "Allocation %",
      },
    },
    {
      id: "avgReturn",
      accessorKey: "avgReturn",
      header: ({ column }: { column: Column<PortfolioItem, unknown> }) => (
        <DataTableColumnHeader column={column} title="Average Return" />
      ),
      cell: ({ cell }) => {
        const value = cell.getValue<PortfolioItem["avgReturn"]>();
        return value && <ColourValue value={value} min={20} max={30} />;
      },
      // Use ColorValue component to display the value with color coding
      meta: {
        label: "Average Return",
      },
    },
    {
      id: "stdDev",
      accessorKey: "stdDev",
      header: ({ column }: { column: Column<PortfolioItem, unknown> }) => (
        <DataTableColumnHeader column={column} title="Standard Deviation" />
      ),
      cell: ({ cell }) => {
        const value = cell.getValue<PortfolioItem["stdDev"]>();
        return (
          value && <ColourValue value={value} min={20} max={30} invert={true} />
        );
      },
      meta: {
        label: "Standard Deviation",
      },
    },
    {
      id: "optimisedAllocation",
      accessorKey: "optimisedAllocation",
      header: ({ column }: { column: Column<PortfolioItem, unknown> }) => (
        <DataTableColumnHeader column={column} title="Optimised Allocation %" />
      ),
      cell: ({ cell }) => {
        const value = cell.getValue<PortfolioItem["optimisedAllocation"]>();
        return value && <DynamicBar value={value} max={98} />;
      },
      meta: {
        label: "Optimised Allocation %",
      },
    },
  ] as ColumnDef<PortfolioItem>[];
}
