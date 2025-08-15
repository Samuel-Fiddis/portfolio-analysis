import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  OPTIMISATION_SETTINGS_DESCRIPTIONS,
  OptimisationSettings,
} from "./interfaces";
import { useDebounce } from "@uidotdev/usehooks";
import { MonthPicker } from "@/components/ui/monthpicker";

export function OptimisationForm({
  optimisationSettings,
  setOptimisationSettings,
}: {
  optimisationSettings: OptimisationSettings;
  setOptimisationSettings: React.Dispatch<
    React.SetStateAction<OptimisationSettings>
  >;
}) {
  // Local state for form fields
  const [localSettings, setLocalSettings] =
    useState<OptimisationSettings>(optimisationSettings);
  const debouncedSettings = useDebounce(localSettings, 400);

  // Sync local state with parent prop
  useEffect(() => {
    setLocalSettings(optimisationSettings);
  }, [optimisationSettings]);

  // Update parent state when debounced local state changes
  useEffect(() => {
    setOptimisationSettings(debouncedSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSettings]);

  function getFormElement(key: string, type: string, meta: any) {
    switch (type) {
      case "number":
        return (
          <Input
            name={key}
            id={key}
            type="number"
            step={meta.step}
            min={meta.min}
            {...meta}
            value={meta.value}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setLocalSettings((prev) => ({
                ...prev,
                [meta.name]: value,
              }));
            }}
          />
        );
      case "date":
        return (
          <>
            {localSettings.timePeriod == "monthly" ? (
              <MonthPicker
                selectedMonth={
                  localSettings[key as keyof OptimisationSettings] as Date
                }
                onMonthSelect={(date) => {
                  setLocalSettings((prev) => ({
                    ...prev,
                    [meta.name]: date,
                  }));
                }}
              />
            ) : (
              <Input
                name={key}
                id={key}
                {...meta}
                value={meta.value.toISOString().split("T")[0]}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setLocalSettings((prev) => ({
                    ...prev,
                    [meta.name]: date,
                  }));
                }}
              />
            )}
          </>
        );
      case "select":
        return (
          <Select
            value={meta.value}
            onValueChange={(value) => {
              setLocalSettings((prev) => ({
                ...prev,
                [meta.name]: value,
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={meta.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {meta.options.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
    }
  }

  return (
    <div className="grid flex-1 auto-rows-min gap-6 px-4">
      {Object.entries(OPTIMISATION_SETTINGS_DESCRIPTIONS).map(([key, meta]) => {
        return (
          <div className="grid gap-3" key={key}>
            <Label htmlFor={key}>{meta.title}</Label>
            {getFormElement(key, meta.type, {
              ...meta,
              value: localSettings[key as keyof OptimisationSettings],
              name: key,
            })}
          </div>
        );
      })}
    </div>
  );
}
