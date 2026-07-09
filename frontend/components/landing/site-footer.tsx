import Link from 'next/link'
import { Activity } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-5" strokeWidth={2.4} />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-foreground">Гепар ИИ</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Клинический ИИ и сквозной цифровой мониторинг для гепатологии.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <Link href="/#problem" className="text-muted-foreground hover:text-foreground">
            Проблема
          </Link>
          <Link href="/#solution" className="text-muted-foreground hover:text-foreground">
            Платформа
          </Link>
          <Link href="/#effect" className="text-muted-foreground hover:text-foreground">
            Эффект
          </Link>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            Кабинет врача
          </Link>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Гепар ИИ. Демонстрационный интерфейс. Не является медицинским изделием.
        </div>
      </div>
    </footer>
  )
}
