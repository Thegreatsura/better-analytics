import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@better-analytics/ui";

interface TrendArrowProps {
    value: number;
    invertColor?: boolean;
}

export default function TrendArrow({ value, invertColor = false }: TrendArrowProps) {
    const Icon = value === 0 ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
    const color =
        value === 0
            ? "text-muted-foreground"
            : (value > 0 && !invertColor) || (value < 0 && invertColor)
                ? "text-green-500"
                : "text-red-500";

    return <Icon className={cn("h-4 w-4", color)} />;
} 