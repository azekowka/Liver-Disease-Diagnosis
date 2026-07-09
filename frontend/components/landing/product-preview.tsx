import { Activity, TriangleAlert, ArrowUpRight, CircleCheck, FileText } from 'lucide-react'

const queue = [
  { name: 'Пациент А-2481', marker: 'FIB-4: 3.8', risk: 'Высокий', tone: 'destructive' as const },
  { name: 'Пациент А-1190', marker: 'APRI: 1.2', risk: 'Средний', tone: 'warning' as const },
  { name: 'Пациент А-3355', marker: 'FIB-4: 0.9', risk: 'Низкий', tone: 'success' as const },
]

const toneClasses: Record<string, string> = {
  destructive: 'bg-destructive/10 text-destructive',
  warning: 'bg-warning/15 text-warning-foreground',
  success: 'bg-success/12 text-success',
}

export function ProductPreview() {
  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5 ring-1 ring-border/50">
      {/* window bar */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
        <span className="size-3 rounded-full bg-destructive/40" />
        <span className="size-3 rounded-full bg-warning/50" />
        <span className="size-3 rounded-full bg-success/50" />
        <span className="ml-3 rounded-md bg-background px-3 py-1 font-mono text-xs text-muted-foreground">
          app.gepar-ai.med / триаж
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-5 sm:p-6">
        {/* Left: risk gauge */}
        <div className="sm:col-span-2 flex flex-col justify-between rounded-xl border border-border bg-background p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Индекс риска фиброза</span>
            <Activity className="size-4 text-primary" />
          </div>
          <div className="mt-4">
            <div className="flex items-end gap-2">
              <span className="font-mono text-5xl font-bold tracking-tight text-foreground">72</span>
              <span className="mb-2 text-sm text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[72%] rounded-full bg-destructive" />
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-destructive">
              <TriangleAlert className="size-3.5" />
              Рекомендована консультация гепатолога
            </p>
          </div>
          <div className="mt-5 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            Модель обнаружила ранние маркеры в 2 из 5 показателей панели печёночных проб.
          </div>
        </div>

        {/* Right: queue + OCR */}
        <div className="sm:col-span-3 flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Очередь ИИ-триажа</span>
              <span className="font-mono text-xs text-muted-foreground">сегодня · 18</span>
            </div>
            <div className="flex flex-col gap-2">
              {queue.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{p.marker}</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClasses[p.tone]}`}>
                    {p.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">OCR печёночных проб</p>
              <p className="text-xs text-muted-foreground">panel_2481.pdf · распознано за 1.4 с</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <CircleCheck className="size-4" />
              Готово
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-primary-foreground">
            <span className="text-sm font-medium">Высвобождено рабочего времени врача</span>
            <span className="inline-flex items-center gap-1 font-mono text-lg font-bold">
              20% <ArrowUpRight className="size-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
