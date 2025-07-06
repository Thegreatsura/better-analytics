'use client';

import { Badge } from "@better-analytics/ui/components/badge";
import { Button } from "@better-analytics/ui/components/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@better-analytics/ui/components/popover";
import { Separator } from "@better-analytics/ui/components/separator";
import { cn } from "@better-analytics/ui";
import { CheckIcon } from "lucide-react";

interface LineCountFilterProps {
    value: number;
    onValueChange: (value: number) => void;
    title?: string;
}

const lineOptions = [50, 100, 200, 500, 1000];

export function LineCountFilter({ value, onValueChange, title = "Lines" }: LineCountFilterProps) {
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
                            {value}
                        </Badge>
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[150px] p-0" align="start">
                <div className="p-2 space-y-1">
                    {lineOptions.map((option) => {
                        const isSelected = value === option;
                        return (
                            <div
                                key={option}
                                onClick={() => {
                                    if (!isSelected) {
                                        onValueChange(option);
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
                                <span>{option} lines</span>
                            </div>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
} 