function getColour(
    value: number | undefined,
    min: number,
    max: number,
    invert: boolean = false // add an invert flag
) {
    if (value === undefined || value === null || isNaN(value)) {
        return "#fff"; // white
    }
    // Clamp value between min and max
    const clamped = Math.max(min, Math.min(max, value));
    // Calculate ratio (0 = min, 1 = max)
    let ratio = (clamped - min) / (max - min);
    if (invert) {
        ratio = 1 - ratio; // invert the gradient
    }

    // Interpolate: red (255,100,100) -> orange (255,165,0) -> green (100,200,100)
    let r, g, b;
    if (ratio < 0.5) {
        // Red to Orange
        const localRatio = ratio / 0.5;
        r = 255;
        g = Math.round(100 + (165 - 100) * localRatio);
        b = Math.round(100 * (1 - localRatio));
    } else {
        // Orange to Green
        const localRatio = (ratio - 0.5) / 0.5;
        r = Math.round(255 + (100 - 255) * localRatio);
        g = Math.round(165 + (200 - 165) * localRatio);
        b = Math.round(0 + (100 - 0) * localRatio);
    }
    return `rgb(${r},${g},${b})`;
}

interface ColourValueProps {
    value?: number;
    min?: number;
    max?: number;
    decimals?: number;
    invert?: boolean; // add an invert flag
}

export const ColourValue: React.FC<ColourValueProps> = ({
    value,
    min = 0,
    max = 1,
    decimals = 2,
    invert = false,
}) => {
    const bgColor = getColour(value, min, max, invert);
    return (
        <span
            style={{
                display: "inline-block",
                padding: "0.25em 0.75em",
                borderRadius: "0.5em",
                background: bgColor,
                color: "#fff",
                fontWeight: "bold",
                minWidth: "3em",
                textAlign: "center",
            }}
        >
            {value === undefined || value === null || isNaN(value) ? "—" : value.toFixed(decimals)}
        </span>
    );
};