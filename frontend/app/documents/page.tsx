"use client";
import "../pipeline.css";
import "./lab-panel.css";
import { PageHead } from "@/components/Bits";
import LabPanel from "@/components/LabPanel";

export default function DocumentsPage() {
  return (
    <>
      <PageHead eyebrow="Источники · загрузка" title="Диагностика по печёночным пробам" />
      <p className="pipe-lede">
        Загрузите PDF или фото панели печёночных проб — OCR распознает возраст, пол и биохимические
        показатели, либо введите их вручную. Модель RandomForest, обученная на клинических данных,
        вернёт предварительный вердикт о наличии признаков заболевания печени.
      </p>
      <LabPanel />
    </>
  );
}
