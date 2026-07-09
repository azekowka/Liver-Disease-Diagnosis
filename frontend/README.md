# MedArchive — Frontend

Next.js (App Router) admin UI for the MedArchive API. Hand-crafted **"archive
ledger"** aesthetic — paper & ink, hairline rules, tabular monospaced figures,
custom geometric SVG glyphs. No gradients, no icon-library clichés.

## Pages
| Route | Назначение |
|---|---|
| `/` | Сводка: метрики, шкала нормализации, статусы документов |
| `/search` | Полнотекстовый поиск услуг и клиник |
| `/services` · `/services/[id]` | Справочник → кто оказывает услугу и по какой цене |
| `/partners` · `/partners/[id]` | Партнёры → полный прайс клиники по тарифам |
| `/documents` | Загрузка прайсов (drag-and-drop) + статусы обработки |
| `/review` | Очередь верификации: подтверждение сопоставлений в один клик |

## Запуск

Бэкенд должен работать на `http://localhost:8000` (см. `../backend`). Фронтенд
проксирует `/api/*` → бэкенд (см. `next.config.mjs`), поэтому CORS не нужен.

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
# прод-сборка:
npm run build && npm run start
```

Если бэкенд на другом адресе:
```bash
BACKEND_URL=http://host:port npm run dev
```

## Стек / решения
- **Next.js 14 + TypeScript**, React Server/Client components.
- Шрифты через `next/font`: **Spectral** (заголовки), **Commissioner** (текст),
  **IBM Plex Mono** (данные/цены) — все с кириллицей.
- Дизайн — один файл `app/globals.css` (CSS-переменные, без UI-библиотек), чтобы
  вид был узнаваемым, а не «дефолтным».
- Иконки — собственные inline-SVG (`components/Icon.tsx`), не из icon-библиотек.
