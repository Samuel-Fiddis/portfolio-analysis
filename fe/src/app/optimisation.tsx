import { OptimisationForm } from "./optimisation-settings-form";
import { Settings } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { OptimisationSettings } from "./interfaces";
import { Spinner } from "@/components/custom/spinner";

interface OptimisationProps {
  optimisationSettings: OptimisationSettings;
  setOptimisationSettings: React.Dispatch<
    React.SetStateAction<OptimisationSettings>
  >;
  refetchOptimisation: () => void;
  isOptimising: boolean;
}

export function Optimisation({
  optimisationSettings,
  setOptimisationSettings,
  refetchOptimisation,
  isOptimising,
}: OptimisationProps) {
  return (
    <div className="flex flex-row items-start gap-2">
      <Button
        size="sm"
        onClick={() => refetchOptimisation()}
        disabled={isOptimising}
      >
        {isOptimising ? "Processing..." : "🧠 Analyse and Optimise"}
      </Button>
      <Sheet>
        <Tooltip>
          <SheetTrigger asChild>
            <TooltipTrigger asChild>
              <Button size="sm">
                <Settings />
              </Button>
            </TooltipTrigger>
          </SheetTrigger>
          <TooltipContent>
            <p>Optimisation Settings</p>
          </TooltipContent>
        </Tooltip>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Optimisation Settings</SheetTitle>
            <SheetDescription>
              Make changes to your optimisation settings here.
            </SheetDescription>
          </SheetHeader>
          <OptimisationForm
            optimisationSettings={optimisationSettings}
            setOptimisationSettings={setOptimisationSettings}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
