"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const latency = [
  { time: "09:00", p95: 720, avg: 390 },
  { time: "10:00", p95: 812, avg: 418 },
  { time: "11:00", p95: 760, avg: 402 },
  { time: "12:00", p95: 908, avg: 467 }
];

const throughput = [
  { provider: "Claude", value: 420 },
  { provider: "OpenAI", value: 310 },
  { provider: "Gemini", value: 180 }
];

export function DashboardPreview() {
  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-2">
      <div className="zynex-card p-5">
        <p className="font-mono text-xs font-bold uppercase text-[var(--body-soft)]">Latency over time</p>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={latency}>
              <defs>
                <linearGradient id="latencyFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.26} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E8EEF7" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area dataKey="p95" fill="url(#latencyFill)" stroke="#4F46E5" />
              <Area dataKey="avg" fill="transparent" stroke="#06B6D4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="zynex-card p-5">
        <p className="font-mono text-xs font-bold uppercase text-[var(--body-soft)]">Provider throughput</p>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={throughput}>
              <CartesianGrid stroke="#E8EEF7" />
              <XAxis dataKey="provider" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4F46E5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
