import { cn } from "@better-analytics/ui";

interface TrendPercentageProps {
    value: number;
    invertColor?: boolean;
    className?: string;
}

export default function TrendPercentage({
    value,
    invertColor = false,
    className,
}: TrendPercentageProps) {
    const color =
        value === 0
            ? "text-muted-foreground"
            : (value > 0 && !invertColor) || (value < 0 && invertColor)
                ? "text-green-500"
                : "text-red-500";

    return (
        <span className={cn("font-semibold", color, className)}>
            {value.toFixed(2)}%
        </span>
    );
} 