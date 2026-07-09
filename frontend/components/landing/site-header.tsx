'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Activity, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navLinks = [
  { label: 'Проблема', href: '/#problem' },
  { label: 'Платформа', href: '/#solution' },
  { label: 'Эффект', href: '/#effect' },
  { label: 'СППВР', href: '/#cdss' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-5" strokeWidth={2.4} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-tight text-foreground">Гепар ИИ</span>
            <span className="text-[11px] font-medium text-muted-foreground">Клинический ИИ · Гепатология</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button render={<Link href="/dashboard" />} nativeButton={false} variant="ghost" size="sm">
            Кабинет врача
          </Button>
          <Button render={<Link href="/#cta" />} nativeButton={false} size="sm">
            Запросить демо
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex size-9 items-center justify-center rounded-md border border-border text-foreground md:hidden"
          aria-label="Меню"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Button
                render={<Link href="/dashboard" onClick={() => setOpen(false)} />}
                variant="outline"
                size="sm"
              >
                Кабинет врача
              </Button>
              <Button render={<Link href="/#cta" onClick={() => setOpen(false)} />} size="sm">
                Запросить демо
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
