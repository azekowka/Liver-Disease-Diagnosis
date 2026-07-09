'use client'

import { useState } from 'react'
import { ArrowRight, CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Cta() {
  const [sent, setSent] = useState(false)

  return (
    <section id="cta" className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Внедрите клинический ИИ в вашу сеть ПМСП
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          Оставьте контакты — покажем платформу на данных вашего региона и рассчитаем ожидаемый эффект.
        </p>

        {sent ? (
          <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full bg-success/12 px-5 py-3 text-sm font-medium text-success">
            <CircleCheck className="size-5" />
            Заявка отправлена — мы свяжемся с вами
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
            }}
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="Рабочая эл. почта"
              aria-label="Рабочая электронная почта"
              className="h-11 flex-1 rounded-lg border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus:ring-2"
            />
            <Button type="submit" size="lg">
              Запросить демо
              <ArrowRight className="size-4" />
            </Button>
          </form>
        )}
      </div>
    </section>
  )
}
