"use client";
import "./dashboard.css";
import { PageHead } from "@/components/Bits";

const architectureSections = [
  {
    title: "1. Mission and scope",
    intro:
      "Проект объединяет клиническую ML-диагностику и компьютерное зрение для поддержки оценки состояния печени.",
    bullets: [
      "Классический путь: прогноз по лабораторным данным.",
      "Глубокий путь: классификация УЗИ по классам benign, malignant и normal.",
      "Вся логика собрана в единый web-поток: frontend → backend → model → storage.",
    ],
  },
  {
    title: "2. Machine-learning methodology",
    intro:
      "Табличные модели и CNN обучаются разными способами, чтобы каждый подход использовал свои сильные стороны.",
    bullets: [
      "Табличная ветка: очистка данных, MICE-импутация, SMOTE, ANOVA feature ranking и RandomForest.",
      "Изображения: нормализация, resize к 224×224, Transfer Learning на MobileNetV2.",
      "Обучение проходит в две фазы: голова модели и затем fine-tuning верхних слоёв backbone.",
    ],
  },
  {
    title: "3. Datasets and artifacts",
    intro:
      "Проект опирается на клинические CSV, наборы ультразвуковых снимков и сериализованные артефакты моделей.",
    bullets: [
      "LD_raw_data.csv — основной табличный датасет с лабораторными признаками и диагнозом.",
      "dataset_CNN — исходные УЗИ изображения по классам benign, malignant и normal.",
      "dataset_augmented — ранний набор данных для аугментации, сохранившийся как исторический материал.",
      "models/ — обученные веса и persisted bundles для backend-инференса.",
    ],
  },
  {
    title: "4. Backend and API architecture",
    intro:
      "FastAPI выступает как оркестратор между UI, моделями, OCR и хранилищем.",
    bullets: [
      "app.py — центральный entrypoint для маршрутов inference и health checks.",
      "lab_model.py — загрузка и предикт по табличным данным.",
      "ocr.py — OCR и парсинг лабораторных данных из PDF/изображений.",
      "ultrasound_store.py — хранение результатов в SQLite.",
    ],
  },
  {
    title: "5. Frontend experience",
    intro:
      "Next.js frontend обеспечивает понятные пользовательские сценарии и показывает результаты диагностики в аккуратном интерфейсе.",
    bullets: [
      "landing — описание продукта и ценности.",
      "dashboard — методология, архитектура и структура проекта.",
      "documents — загрузка и OCR разбор лабораторных документов.",
      "ultrasound — загрузка изображений и получение прогноза.",
    ],
  },
  {
    title: "6. Technology stack",
    intro:
      "Проект объединяет Python, TensorFlow, scikit-learn, FastAPI, Next.js и SQLite в одну систему.",
    bullets: [
      "ML: TensorFlow/Keras, scikit-learn, XGBoost, pandas, numpy, imblearn, miceforest.",
      "Backend: FastAPI, Uvicorn, PyMuPDF, EasyOCR, sqlite3.",
      "Frontend: Next.js 14, React, TypeScript, Tailwind, custom CSS system.",
    ],
  },
  {
    title: "7. Deployment and development",
    intro:
      "Репозиторий поддерживает локальный запуск как backend, так и frontend без сложной инфраструктуры.",
    bullets: [
      "Backend: python -m uvicorn app:app --host 0.0.0.0 --port 8000.",
      "Frontend: npm install && npm run dev.",
      "Обучение табличной модели: python train_tabular_model.py.",
      "Обучение CNN: python train.py из папки CNN_Model.",
    ],
  },
];

function SectionCard({
  title,
  intro,
  bullets,
}: {
  title: string;
  intro: string;
  bullets: string[];
}) {
  return (
    <section className="arch-card">
      <h3>{title}</h3>
      <p>{intro}</p>
      <ul>
        {bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function Dashboard() {
  return (
    <div className="architecture-page">
      <header className="architecture-hero">
        <div className="eyebrow">Architecture • ML + Web Platform</div>
        <h1>Архитектура проекта Liver Disease Diagnosis</h1>
        <p>
          Система моделей машинного обучения для выявления заболеваний печени, классификации жировой дистрофии печени и диагностики гепатоцеллюлярной карциномы (ГЦК) с использованием клинических данных и ультразвуковых изображений.
        </p>
        <div className="architecture-tags">
          <span>Clinical ML</span>
          <span>Ultrasound CNN</span>
          <span>FastAPI</span>
          <span>Next.js</span>
        </div>
      </header>

      <section className="architecture-summary">
        <div className="arch-summary-card">
          <h2>Что делает система</h2>
          <p>
            Проект служит медицинским AI-ассистентом для скрининга печени: он
            объединяет анализ лабораторных показателей, распознавание
            ультразвуковых снимков и web-интерфейс для работы клинициста или
            исследователя.
          </p>
        </div>
        <div className="arch-summary-card">
          <h2>Ключевые модули</h2>
          <p>
            Обучение моделей, предикт через API, OCR для документов, история
            анализов, UI для диагностики и визуализация архитектуры проекта.
          </p>
        </div>
      </section>

      <section className="architecture-figure-card">
        <div className="figure-copy">
          <h2>XGBoost: лидер среди классификаторов</h2>
          <p>
            В табличной ветке проекта XGBoost показал наилучшие результаты по
            метрикам точности, precision, recall и ROC-AUC, значительно
            превосходя Logistic Regression, Random Forest, SVM и KNN.
          </p>
          <p>
            Это подтверждает, что при решении задач классификации заболеваний
            печени градиентный бустинг может быть более устойчивым и точным,
            чем классические ансамблевые и линейные методы.
          </p>
        </div>
        <figure className="architecture-figure">
          <img
            src="/123.png"
            alt="Таблица сравнения моделей с показателями Accuracy, Precision, Recall, F1-Score и ROC-AUC"
          />
          <figcaption>Сравнение обученных моделей: XGBoost выступает лучше остальных.</figcaption>
        </figure>
      </section>

      <section className="architecture-grid">
        {architectureSections.map((section) => (
          <SectionCard key={section.title} {...section} />
        ))}
      </section>
    </div>
  );
}
