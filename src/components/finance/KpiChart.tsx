import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface KpiChartProps {
  title: string
  type: 'bar' | 'line'
  data: { date: string; value: number }[]
  color?: string
  format?: 'currency' | 'number'
}

function formatVal(v: number, fmt?: string) {
  if (fmt === 'currency') return `₱${v.toLocaleString()}`
  return `${v.toLocaleString()}`
}

export function KpiChart({ title, type, data, color = '#C9953E', format }: KpiChartProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-display text-sm font-semibold mb-3 text-foreground">{title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatVal(v, format)} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v: number) => [formatVal(v, format), title]} labelFormatter={(l) => l} />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatVal(v, format)} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v: number) => [formatVal(v, format), title]} labelFormatter={(l) => l} />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}