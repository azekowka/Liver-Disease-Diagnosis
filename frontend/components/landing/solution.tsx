import { Brain, ChartLine, Network, ScanLine } from 'lucide-react'

const features = [
  {
    icon: ScanLine,
    title: 'Автоматизированный скрининг',
    text: 'ИИ анализирует данные ПМСП и лабораторные показатели, выявляя ранние маркеры патологий печени без участия узкого специалиста.',
  },
  {
    icon: Network,
    title: 'Единый интеллектуальный регистр',
    text: 'Консолидация фрагментированных данных МИС в единый регистр пациентов с патологиями печени и ХВГ.',
  },
  {
    icon: ChartLine,
    title: 'Предиктивная аналитика',
    text: 'Прогнозирование прогрессирования фиброза и обострений ХВГ для проактивного ведения пациентов.',
  },
  {
    icon: Brain,
    title: 'Сквозной цифровой мониторинг',
    text: 'Непрерывное наблюдение за состоянием пациента на всех этапах — от скрининга до диспансерного учёта.',
  },
]

export function Solution() {
  return (
    <section id="solution" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">Платформа</span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Сквозной цифровой мониторинг печени на базе ИИ
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Единая платформа внедрения искусственного интеллекта в ПМСП для раннего выявления и ведения пациентов с
            патологиями печени и хроническим вирусным гепатитом.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
