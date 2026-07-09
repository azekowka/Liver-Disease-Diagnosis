import Link from 'next/link'
import { ArrowRight, ShieldCheck, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductPreview } from './product-preview'

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="flex size-1.5 rounded-full bg-success" />
            Ранняя диагностика печени с искусственным интеллектом
          </span>
          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Клинический ИИ для раннего выявления патологий печени и ХВГ
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Внедряем системы искусственного интеллекта и сквозной цифровой мониторинг в ПМСП: автоматический
            скрининг, единый интеллектуальный регистр с предиктивной аналитикой и ИИ-триаж пациентов с хроническим
            вирусным гепатитом.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button render={<Link href="/#cta" />} nativeButton={false} size="lg">
              Запросить демо
              <ArrowRight className="size-4" />
            </Button>
            <Button
              render={<Link href="/dashboard" />}
              nativeButton={false}
              variant="outline"
              size="lg"
            >
              Открыть кабинет врача
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-primary" />
              Соответствие клиническим протоколам
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Stethoscope className="size-4 text-primary" />
              Интеграция с МИС
            </span>
          </div>
        </div>

        <div className="mt-14">
          <ProductPreview />
        </div>
      </div>
    </section>
  )
}
