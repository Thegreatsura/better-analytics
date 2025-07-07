'use client';

import { Badge } from "@better-analytics/ui/components/badge";
import { Button } from "@better-analytics/ui/components/button";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@better-analytics/ui/components/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@better-analytics/ui/components/popover";
import { Separator } from "@better-analytics/ui/components/separator";
import { cn } from "@better-analytics/ui";
import { Check } from "@phosphor-icons/react";
import type React from "react";

interface StatusLogsFilterProps {
    value?: string[];
    setValue?: (value: string[]) => void;
    title?: string;
    options: {
        label: string;
        value: string;
        icon?: React.ComponentType<{ className?: string }>;
    }[];
}

export function StatusLogsFilter({
    value = [],
    setValue,
    title,
    options,
}: StatusLogsFilterProps) {
    const selectedValues = new Set(value as string[]);
    const allSelected = selectedValues.size === 0;

    const getSelectedBadges = () => {
        if (allSelected) {
            return (
                <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    All
                </Badge>
            );
        }

        if (selectedValues.size >= 1) {
            const selected = options.find((opt) => selectedValues.has(opt.value));
            return (
                <>
                    <Badge
                        variant={
                            selected?.value === "info"
                                ? "default"
                                : selected?.value === "error"
                                    ? "destructive"
                                    : selected?.value === "warning"
                                        ? "secondary"
                                        : selected?.value === "debug"
                                            ? "outline"
                                            : "secondary"
                        }
                        className="rounded-sm px-1 font-normal"
                    >
                        {selected?.label}
                    </Badge>
                    {selectedValues.size > 1 && (
                        <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                            +{selectedValues.size - 1}
                        </Badge>
                    )}
                </>
            );
        }

        return null;
    };

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
                    <div className="space-x-1 flex">{getSelectedBadges()}</div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandList>
                        <CommandGroup>
                            <CommandItem
                                onSelect={() => {
                                    setValue?.([]); // Empty array means "All"
                                }}
                            >
                                <div
                                    className={cn(
                                        "mr-2 flex h-4 w-4 items-center rounded-sm border border-primary",
                                        allSelected
                                            ? "bg-primary text-primary-foreground"
                                            : "opacity-50 [&_svg]:invisible",
                                    )}
                                >
                                    <Check className={cn("h-4 w-4")} />
                                </div>
                                <Badge variant="secondary">All</Badge>
                            </CommandItem>
                            {options.map((option) => {
                                const isSelected = selectedValues.has(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => {
                                            const newValues = new Set(selectedValues);
                                            if (isSelected) {
                                                newValues.delete(option.value);
                                            } else {
                                                newValues.add(option.value);
                                            }
                                            setValue?.(Array.from(newValues));
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center rounded-sm border border-primary",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible",
                                            )}
                                        >
                                            <Check className={cn("h-4 w-4")} />
                                        </div>
                                        {option.icon && (
                                            <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        )}
                                        <Badge
                                            variant={
                                                option.value === "info"
                                                    ? "default"
                                                    : option.value === "error"
                                                        ? "destructive"
                                                        : option.value === "warning"
                                                            ? "secondary"
                                                            : option.value === "debug"
                                                                ? "outline"
                                                                : "secondary"
                                            }
                                        >
                                            {option.label}
                                        </Badge>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
} 