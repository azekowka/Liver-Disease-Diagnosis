import { HeartPulse, Timer, TrendingDown, Users } from 'lucide-react'

const stats = [
  {
    icon: TrendingDown,
    value: '−34%',
    label: 'Снижение инвалидизации и смертности за счёт раннего выявления патологий',
  },
  {
    icon: Timer,
    value: '2.5×',
    label: 'Сокращение времени ожидания приёма благодаря ИИ-триажу и телемедицине',
  },
  {
    icon: Users,
    value: '20%',
    label: 'Высвобождение рабочего времени медперсонала ПМСП',
  },
  {
    icon: HeartPulse,
    value: '+41%',
    label: 'Повышение качества диагностики и получение предиктивных данных',
  },
]

export function Effect() {
  return (
    <section id="effect" className="border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/70">
            Ожидаемый эффект
          </span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Измеримый результат для системы здравоохранения
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-primary-foreground/80">
            Раннее выявление, интеллектуальный триаж и предиктивная аналитика снижают нагрузку и улучшают исходы
            для пациентов.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-primary-foreground/15 bg-primary-foreground/15 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-4 bg-primary p-6">
              <s.icon className="size-6 text-primary-foreground/70" />
              <span className="font-mono text-4xl font-bold tracking-tight">{s.value}</span>
              <p className="text-sm leading-relaxed text-primary-foreground/80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
