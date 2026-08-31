'use client';

import { useState } from 'react';

/**
 * A single-series mastery-over-time line chart - thin stroke, rounded
 * ends, a soft area fill under the line, and a hover tooltip per point.
 * One hue (brand ink), since this is one metric, not a category
 * comparison - no legend needed for a single series.
 */
export function TrendChart({ points }: { points: { label: string; value: number }[] }) {
  const width = 640;
  const height = 160;
  const padding = 20;

  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) {
    return <p>Not enough test activity yet to show a trend.</p>;
  }

  const max = Math.max(100, ...points.map((p) => p.value));
  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const scaleY = (v: number) => height - padding - (v / max) * (height - padding * 2);
  // A single point has no line to draw - center it instead of pinning it
  // to the left padding edge, which reads as a rendering glitch.
  const startX = points.length > 1 ? padding : width / 2;
  const coords = points.map((p, i) => [startX + i * xStep, scaleY(p.value)] as const);
  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1][0]},${height - padding} L${coords[0][0]},${height - padding} Z`;
  const hoverX = hover !== null ? coords[hover][0] : 0;

  return (
    <div className="trend-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label="School mastery average over recent weeks"
        onMouseLeave={() => setHover(null)}
      >
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="trend-axis" />
        <path d={areaPath} className="trend-area" />
        <path d={linePath} className="trend-line" />
        {coords.map(([x, y], i) => (
          <g key={i}>
            <rect
              x={x - (xStep || width) / 2}
              y={0}
              width={xStep || width}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
            <circle
              cx={x}
              cy={y}
              r={hover === i ? 5 : 3}
              className={`trend-dot${i === coords.length - 1 ? ' last' : ''}`}
            />
          </g>
        ))}
      </svg>
      <div className="trend-labels">
        {points.map((p, i) => (
          <span key={i} className={i === hover ? 'active' : ''}>
            {p.label}
          </span>
        ))}
      </div>
      {hover !== null ? (
        <div className="trend-tooltip" style={{ left: `${(hoverX / width) * 100}%` }}>
          <b>{points[hover].value}%</b> avg mastery · {points[hover].label}
        </div>
      ) : null}
    </div>
  );
}
