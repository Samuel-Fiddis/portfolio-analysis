import InstrumentDataTable from "./instrument-data-table";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { InstrumentRow, InstrumentType } from "./interfaces";

interface InstrumentSearchProps {
  addToPortfolio: (items: InstrumentRow[]) => void;
}

export function InstrumentSearch({ addToPortfolio }: InstrumentSearchProps) {
  return (
    <>
      <NuqsAdapter>
        <div className="sm:max-w-[1750px]">
          <InstrumentDataTable addToPortfolio={addToPortfolio} />
        </div>
      </NuqsAdapter>
    </>
  );
}
