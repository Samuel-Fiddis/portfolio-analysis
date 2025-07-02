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

interface OptimisationProps {
    optimisationSettings: OptimisationSettings;
    setOptimisationSettings: React.Dispatch<React.SetStateAction<OptimisationSettings>>;
    refetchOptimisation: () => void;
}

export function Optimisation({
    optimisationSettings,
    setOptimisationSettings,
    refetchOptimisation
}: OptimisationProps) {
    return (
        <>
            <Button size="sm" onClick={() => refetchOptimisation()}>
                Analyse and Optimise 🧠
            </Button>
      <Sheet>
        <Tooltip>
          <SheetTrigger asChild>
            <TooltipTrigger asChild>
              <Button variant="outline">
                <Settings />
              </Button>
            </TooltipTrigger>
          </SheetTrigger>
          <TooltipContent>
            <p>Optimisation Settings</p>
          </TooltipContent>
        </Tooltip>
        <SheetContent>
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
    </>
  );
}