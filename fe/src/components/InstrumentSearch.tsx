import InstrumentDataTable from "./tables/InstrumentDataTable";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { InstrumentRow, InstrumentType } from "../types/interfaces";

interface InstrumentSearchProps {
  addToPortfolio: (items: InstrumentRow[]) => void;
}

export default function InstrumentSearch({ addToPortfolio }: InstrumentSearchProps) {
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
