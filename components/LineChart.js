"use client";

// Small dependency-free SVG line chart: one series, time on the x-axis.
// Touch or hover to see the nearest reading. Optional dashed reference line
// (e.g. the germination chamber's set temperature).
import { useEffect, useRef, useState } from "react";

const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 40 };

// Round tick values: 1, 2, 5 × 10^n
function niceTicks(min, max, count = 5) {
  const span = max - min || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(+v.toFixed(6));
  return ticks;
}

function timeLabel(ms, spanMs) {
  const d = new Date(ms);
  if (spanMs <= 36 * 3600 * 1000) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function LineChart({ points, unit = "", color = "var(--chart-line)", reference = null, label }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!points.length) return <p className="empty">No readings in this range.</p>;

  const xs = points.map((p) => p.t);
  const ys = points.map((p) => p.v);
  if (reference != null) ys.push(reference);
  const minX = xs[0];
  const maxX = xs[xs.length - 1];
  const spanX = maxX - minX || 1;
  const padY = (Math.max(...ys) - Math.min(...ys)) * 0.1 || 1;
  const yTicks = niceTicks(Math.min(...ys) - padY, Math.max(...ys) + padY);
  const minY = yTicks[0];
  const maxY = yTicks[yTicks.length - 1];

  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (t) => PAD.left + ((t - minX) / spanX) * plotW;
  const y = (v) => PAD.top + (1 - (v - minY) / (maxY - minY || 1)) * plotH;

  const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const xTickCount = Math.max(2, Math.floor(plotW / 90));
  const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) => minX + (spanX * i) / xTickCount);

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = minX + ((e.clientX - rect.left - PAD.left) / plotW) * spanX;
    // Points are sorted by time: binary search for the nearest one.
    let lo = 0;
    let hi = points.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (points[mid].t < t) lo = mid;
      else hi = mid;
    }
    setHover(Math.abs(points[lo].t - t) < Math.abs(points[hi].t - t) ? points[lo] : points[hi]);
  };

  return (
    <div ref={wrapRef} className="chart" aria-label={label}>
      <svg
        width={width}
        height={HEIGHT}
        onPointerMove={handleMove}
        onPointerDown={handleMove}
        onPointerLeave={() => setHover(null)}
        style={{ touchAction: "pan-y" }}
        role="img"
      >
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} className="chart-grid" />
            <text x={PAD.left - 6} y={y(v)} dy="0.32em" textAnchor="end" className="chart-axis">{v}</text>
          </g>
        ))}
        {xTicks.map((t, i) => (
          <text
            key={i}
            x={x(t)}
            y={HEIGHT - 8}
            textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}
            className="chart-axis"
          >
            {timeLabel(t, spanX)}
          </text>
        ))}
        {reference != null && (
          <>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(reference)} y2={y(reference)} className="chart-ref" />
            <text x={width - PAD.right} y={y(reference) - 4} textAnchor="end" className="chart-axis">
              Set {reference}{unit}
            </text>
          </>
        )}
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hover && (
          <>
            <line x1={x(hover.t)} x2={x(hover.t)} y1={PAD.top} y2={PAD.top + plotH} className="chart-crosshair" />
            <circle cx={x(hover.t)} cy={y(hover.v)} r="5" fill={color} stroke="var(--surface)" strokeWidth="2" />
          </>
        )}
      </svg>
      {hover && (
        <div
          className="chart-tip"
          style={{ left: Math.min(Math.max(x(hover.t), 70), width - 70), top: 0 }}
        >
          <strong>{hover.v}{unit}</strong>
          <span>{new Date(hover.t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
        </div>
      )}
    </div>
  );
}
