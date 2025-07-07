'use client';

import { Badge } from "@better-analytics/ui/components/badge";
import { Button } from "@better-analytics/ui/components/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@better-analytics/ui/components/popover";
import { Separator } from "@better-analytics/ui/components/separator";
import { Switch } from "@better-analytics/ui/components/switch";
import { Check } from "@phosphor-icons/react";
import {
    Command,
    CommandGroup,
    CommandItem,
} from "@better-analytics/ui/components/command";

export type TimeFilter = "all" | "1h" | "6h" | "24h" | "168h" | "720h";

const timeRanges: Array<{ label: string; value: TimeFilter }> = [
    {
        label: "All time",
        value: "all",
    },
    {
        label: "Last hour",
        value: "1h",
    },
    {
        label: "Last 6 hours",
        value: "6h",
    },
    {
        label: "Last 24 hours",
        value: "24h",
    },
    {
        label: "Last 7 days",
        value: "168h",
    },
    {
        label: "Last 30 days",
        value: "720h",
    },
] as const;

interface SinceLogsFilterProps {
    value: TimeFilter;
    onValueChange: (value: TimeFilter) => void;
    showTimestamp: boolean;
    onTimestampChange: (show: boolean) => void;
    title?: string;
}

export function SinceLogsFilter({
    value,
    onValueChange,
    showTimestamp,
    onTimestampChange,
    title = "Time range",
}: SinceLogsFilterProps) {
    const selectedLabel =
        timeRanges.find((range) => range.value === value)?.label ??
        "Select time range";

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 bg-background text-sm w-full sm:w-auto"
                >
                    {title}
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <div className="space-x-1 flex">
                        <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                            {selectedLabel}
                        </Badge>
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <div className="p-2 space-y-1">
                    <Command>
                        <CommandGroup>
                            {timeRanges.map((range) => {
                                const isSelected = value === range.value;
                                return (
                                    <CommandItem
                                        key={range.value}
                                        onSelect={() => {
                                            if (!isSelected) {
                                                onValueChange(range.value);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span>{range.label}</span>
                                            {value === range.value && <Check className="h-4 w-4" />}
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </Command>
                </div>
                <Separator className="my-2" />
                <div className="p-2 flex items-center justify-between">
                    <span className="text-sm">Show timestamps</span>
                    <Switch checked={showTimestamp} onCheckedChange={onTimestampChange} />
                </div>
            </PopoverContent>
        </Popover>
    );
} 