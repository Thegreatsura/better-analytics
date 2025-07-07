'use client';

import type React from 'react';
import { Badge } from '@better-analytics/ui/components/badge';
import { Button } from '@better-analytics/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@better-analytics/ui/components/popover';
import { Separator } from '@better-analytics/ui/components/separator';
import { Check, CaretDown, Faders, Hash } from '@phosphor-icons/react';
import { cn } from '@better-analytics/ui';

interface FilterOption {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
    color?: string;
}

interface ErrorFiltersProps {
    severityFilter: string[];
    setSeverityFilter: (value: string[]) => void;
    typeFilter: string[];
    setTypeFilter: (value: string[]) => void;
    statusFilter: string[];
    setStatusFilter: (value: string[]) => void;
    lines: number;
    setLines: (value: number) => void;
    severityOptions: FilterOption[];
    typeOptions: FilterOption[];
}

const statusOptions = [
    { label: "New", value: "new" },
    { label: "Investigating", value: "investigating" },
    { label: "Resolved", value: "resolved" },
    { label: "Ignored", value: "ignored" },
    { label: "Recurring", value: "recurring" },
];

const lineOptions = [25, 50, 100, 200, 500];

function FilterPopover({
    title,
    options,
    selectedValues,
    onSelectionChange,
    icon: Icon
}: {
    title: string;
    options: FilterOption[];
    selectedValues: string[];
    onSelectionChange: (values: string[]) => void;
    icon?: React.ComponentType<{ className?: string }>;
}) {
    const toggleOption = (value: string) => {
        if (selectedValues.includes(value)) {
            onSelectionChange(selectedValues.filter(v => v !== value));
        } else {
            onSelectionChange([...selectedValues, value]);
        }
    };

    const clearAll = () => {
        onSelectionChange([]);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "gap-2 transition-all duration-200",
                        selectedValues.length > 0
                            ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                            : "hover:bg-muted/50"
                    )}
                >
                    {Icon && <Icon className="h-4 w-4" />}
                    {title}
                    {selectedValues.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                            {selectedValues.length}
                        </Badge>
                    )}
                    <CaretDown className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">{title}</h4>
                        {selectedValues.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAll}
                                className="h-6 px-2 text-xs"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                    <Separator />
                    <div className="space-y-1">
                        {options.map((option) => {
                            const isSelected = selectedValues.includes(option.value);
                            const OptionIcon = option.icon;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={cn(
                                        "flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors",
                                        isSelected
                                            ? "bg-blue-500/10 text-blue-400"
                                            : "hover:bg-muted/50"
                                    )}
                                    onClick={() => toggleOption(option.value)}
                                >
                                    <div className="flex items-center gap-2">
                                        {OptionIcon && (
                                            <OptionIcon className={cn("h-4 w-4", option.color)} />
                                        )}
                                        <span className="text-sm">{option.label}</span>
                                    </div>
                                    {isSelected && <Check className="h-4 w-4" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function LineCountFilter({ lines, setLines }: { lines: number; setLines: (value: number) => void }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 hover:bg-muted/50 transition-all duration-200"
                >
                    <Hash className="h-4 w-4" />
                    Lines: {lines}
                    <CaretDown className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40" align="start">
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Lines to show</h4>
                    <Separator />
                    <div className="space-y-1">
                        {lineOptions.map((option) => (
                            <button
                                key={option}
                                className={cn(
                                    "flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors",
                                    lines === option
                                        ? "bg-blue-500/10 text-blue-400"
                                        : "hover:bg-muted/50"
                                )}
                                onClick={() => setLines(option)}
                                type="button"
                            >
                                <span className="text-sm">{option}</span>
                                {lines === option && <Check className="h-4 w-4" />}
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function ErrorFilters({
    severityFilter,
    setSeverityFilter,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    lines,
    setLines,
    severityOptions,
    typeOptions
}: ErrorFiltersProps) {
    return (
        <>
            <FilterPopover
                title="Severity"
                options={severityOptions}
                selectedValues={severityFilter}
                onSelectionChange={setSeverityFilter}
                icon={Faders}
            />

            <FilterPopover
                title="Type"
                options={typeOptions}
                selectedValues={typeFilter}
                onSelectionChange={setTypeFilter}
            />

            <FilterPopover
                title="Status"
                options={statusOptions}
                selectedValues={statusFilter}
                onSelectionChange={setStatusFilter}
            />

            <LineCountFilter lines={lines} setLines={setLines} />
        </>
    );
} 