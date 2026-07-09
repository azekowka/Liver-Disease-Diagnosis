import Link from 'next/link'
import { ArrowRight, ClipboardList, FileUp, ListFilter, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const steps = [
  {
    icon: ClipboardList,
    title: 'СППВР по клиническим протоколам',
    text: 'Система поддержки принятия врачебных решений подсказывает тактику ведения на основе актуальных клинических протоколов.',
  },
  {
    icon: ListFilter,
    title: 'ИИ-триаж пациентов',
    text: 'Автоматическая маршрутизация: профильные случаи направляются гепатологу, непрофильные остаются в ПМСП.',
  },
  {
    icon: FileUp,
    title: 'Загрузка и OCR печёночных проб',
    text: 'Врач загружает PDF или фото панели печёночных проб — OCR сам распознаёт и структурирует показатели.',
  },
]

export function Cdss() {
  return (
    <section id="cdss" className="border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">
            СППВР и ИИ-триаж
          </span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Поддержка врачебных решений на каждом шаге
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            В кабинете врача можно загрузить файл панели печёночных проб — наш OCR распознает значения, а СППВР
            оценит риск и предложит следующий шаг по клиническому протоколу.
          </p>

          <div className="mt-8 flex flex-col gap-4">
            {steps.map((s, i) => (
              <div key={s.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <s.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    <span className="mr-2 font-mono text-sm text-muted-foreground">0{i + 1}</span>
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </div>
              </div>
            ))}
          </div>

          <Button render={<Link href="/dashboard" />} size="lg" className="mt-8">
            Открыть кабинет врача
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="size-4 text-primary" />
            Заключение СППВР
          </div>
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <p className="font-mono text-xs text-muted-foreground">Пациент А-2481 · Ж, 54 года</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">АЛТ</span>
                <span className="font-mono font-semibold text-destructive">88 Ед/л ↑</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">АСТ</span>
                <span className="font-mono font-semibold text-destructive">102 Ед/л ↑</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">FIB-4</span>
                <span className="font-mono font-semibold text-warning-foreground">3.8</span>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-primary/5 p-4">
            <p className="text-sm font-semibold text-foreground">Рекомендация протокола</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Высокий риск фиброза печени. Направить на эластографию и очную консультацию гепатолога. Скрининг
              на ХВГ (HBsAg, anti-HCV).
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
