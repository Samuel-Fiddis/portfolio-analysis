import OptimisationSettingsForm from "./OptimisationSettingsForm";
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
import { OptimisationSettings } from "../types/interfaces";

interface OptimisationProps {
  optimisationSettings: OptimisationSettings;
  setOptimisationSettings: React.Dispatch<
    React.SetStateAction<OptimisationSettings>
  >;
  refetchOptimisation: () => void;
  isOptimising: boolean;
}

export default function Optimisation({
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
        {isOptimising ? "Processing..." : "🧠 Analyse Portfolio"}
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
          <OptimisationSettingsForm
            optimisationSettings={optimisationSettings}
            setOptimisationSettings={setOptimisationSettings}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
