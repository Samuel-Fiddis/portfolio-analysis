import { PERCENTAGE_MULTIPLIER } from "@/types/constants";
import { useLayoutEffect, useRef, useState } from "react";

interface DynamicBarProps {
    value: number;
    max: number;
    color?: string;
    minWidthForInside?: number; // px, default 60
    decimals?: number;
}

export const DynamicBar: React.FC<DynamicBarProps> = ({
    value,
    max,
    color = "#426da9",
    minWidthForInside = 60,
    decimals = 2,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const spanRef = useRef<HTMLSpanElement>(null);
    const [spanWidth, setSpanWidth] = useState(0);

    // Calculate width percentage
    const widthPercent = Math.max(0, Math.min(1, value / max)) * PERCENTAGE_MULTIPLIER;

    // Measure span width after render
    useLayoutEffect(() => {
        if (spanRef.current) {
            setSpanWidth(spanRef.current.offsetWidth);
        }
    }, [widthPercent, value, max]);

    const displayValue = value.toFixed(decimals);

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                position: "relative",
                height: 32,
                display: "flex",
                alignItems: "center",
            }}
        >
            <span
                ref={spanRef}
                style={{
                    display: "inline-flex", // changed from "inline-block" to "inline-flex"
                    alignItems: "center",   // vertically center content
                    height: 30,
                    background: color,
                    borderRadius: 6,
                    width: `${widthPercent}%`,
                    minWidth: 0,
                    transition: "width 0.3s",
                    position: "relative",
                    color: "#fff",
                    fontWeight: "bold",
                    textAlign: "center",
                    padding: "0 0px",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                }}
            >
                {spanWidth > minWidthForInside ? <span style={{ padding: "0 8px", display: "inline-block" }}>{displayValue}</span> : ""}
            </span>
            {spanWidth <= minWidthForInside && (
                <span
                    style={{
                        marginLeft: 8,
                        color: "#333",
                        fontWeight: "bold",
                        position: "absolute",
                        left: `calc(${widthPercent}% - 2px)`,
                        top: "50%",
                        transform: "translateY(-50%)",
                        height: 24,
                        display: "flex",
                        alignItems: "center", // vertically center content
                        whiteSpace: "nowrap",
                    }}
                >
                    {displayValue}
                </span>
            )}
        </div>
    );
};