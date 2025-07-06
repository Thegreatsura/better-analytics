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
import { cn } from "@better-analytics/ui";
import { CheckIcon } from "lucide-react";

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
                    {timeRanges.map((range) => {
                        const isSelected = value === range.value;
                        return (
                            <div
                                key={range.value}
                                onClick={() => {
                                    if (!isSelected) {
                                        onValueChange(range.value);
                                    }
                                }}
                                className={cn(
                                    "flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
                                    isSelected && "bg-accent"
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex h-4 w-4 items-center rounded-sm border border-primary",
                                        isSelected
                                            ? "bg-primary text-primary-foreground"
                                            : "opacity-50 [&_svg]:invisible",
                                    )}
                                >
                                    <CheckIcon className={cn("h-4 w-4")} />
                                </div>
                                <span>{range.label}</span>
                            </div>
                        );
                    })}
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