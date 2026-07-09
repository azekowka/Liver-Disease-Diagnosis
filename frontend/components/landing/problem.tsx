import { Clock, Database, LayoutGrid, UserRound } from 'lucide-react'

const problems = [
  {
    icon: Clock,
    title: 'Позднее выявление',
    text: 'Отсутствие автоматизированного скрининга в ПМСП приводит к поздней диагностике заболеваний печени.',
  },
  {
    icon: Database,
    title: 'Фрагментарность данных',
    text: 'Разрозненные данные МИС и отсутствие единого интеллектуального регистра с предиктивной аналитикой.',
  },
  {
    icon: UserRound,
    title: 'Высокая нагрузка на врачей',
    text: 'Перегрузка персонала повышает риск пропуска ранних маркеров патологий.',
  },
  {
    icon: LayoutGrid,
    title: 'Нет цифрового триажа',
    text: 'Гепатологические центры перегружены непрофильными случаями из-за отсутствия триаж-системы.',
  },
]

export function Problem() {
  return (
    <section id="problem" className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">Проблема</span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Заболевания печени выявляются слишком поздно
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Существующая система первичной медико-санитарной помощи не приспособлена для раннего обнаружения
            патологий печени и хронического вирусного гепатита.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((p) => (
            <div key={p.title} className="rounded-xl border border-border bg-card p-6">
              <span className="flex size-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <p.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
