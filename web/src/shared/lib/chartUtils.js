/**
 * Generates a smooth SVG path from an array of data points.
 * @param {number[]} data - Array of numerical values (y-axis).
 * @param {number} width - Viewbox width.
 * @param {number} height - Viewbox height.
 * @returns {string} SVG Path string (d attribute).
 */
export const generateSmoothPath = (data, width, height) => {
    if (!data || data.length === 0) return "";

    // 1. Normalize data to fit within height (leaving some padding)
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const padding = height * 0.1; // 10% padding top/bottom
    const chartHeight = height - padding * 2;

    const points = data.map((val, index) => {
        const x = (index / (data.length - 1)) * width;
        const normalizedY = range === 0 ? 0.5 : (val - min) / range;
        // SVG y-coordinates are inverted (0 is top)
        const y = height - (padding + normalizedY * chartHeight);
        return [x, y];
    });

    // 2. Generate Smooth Bezier Path (Catmull-Rom to Cubic Bezier)
    // Simple strategy: Line to first point, then curve to others
    if (points.length === 1) {
        return `M 0 ${points[0][1]} L ${width} ${points[0][1]}`;
    }

    let path = `M ${points[0][0]},${points[0][1]}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;

        // Control points for Catmull-Rom spline
        const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6;

        const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }

    return path;
};
