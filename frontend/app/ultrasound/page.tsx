"use client";
import "../pipeline.css";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { PageHead, Loading, ErrorNote } from "@/components/Bits";
import { Reveal, AmbientField } from "@/components/Motion";
import { Glyph } from "@/components/Icon";
import ParseProgress from "@/components/ParseProgress";
import UltrasoundResultModal from "@/components/UltrasoundResultModal";
import type { UltrasoundRecord } from "@/lib/types";

const FORMATS: { ic: keyof typeof Glyph; nm: string; sub: string; ext: string }[] = [
  { ic: "scan", nm: "Изображение", sub: "CNN", ext: ".jpg / .png" },
];

export default function UltrasoundPage() {
  const { data, error, loading, reload } = useFetch(() => api.ultrasoundHistory(), []);
  const [over, setOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [openRecord, setOpenRecord] = useState<UltrasoundRecord | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function del(id: string) {
    setBusy(id);
    try {
      await api.deleteUltrasoundRecord(id);
      if (openRecord?.id === id) setOpenRecord(null);
      reload();
    } catch (e) {
      alert("Не удалось удалить: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const closeProgress = () => { setFile(null); reload(); };

  return (
    <>
      <PageHead eyebrow="CNN · УЗИ печени" title="Загрузка и AI-обработка изображений УЗИ печени" />
      <p className="pipe-lede">
        Бросьте сюда изображение УЗИ печени. Система прочитает файл,
        извлечёт информацию о панели и передаст её на CNN-модель для выявления наличия/отсутствия заболеваний.
      </p>

      {file ? (
        <ParseProgress file={file} onComplete={reload} onClose={closeProgress} />
      ) : (
        <div
          className={`pipe-drop ${over ? "over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const f = e.dataTransfer.files?.[0];
            if (!f) return;
            if (!f.type.startsWith("image/")) {
              alert("Пожалуйста, загружайте только изображения.");
              return;
            }
            setFile(f);
          }}
        >
          <AmbientField />
          <div className="pipe-drop-glyph"><Glyph.upload size={40} /></div>

          <div className="pipe-drop-main">
            <h2>Перетащите изображение УЗИ печени сюда</h2>
            <div className="sub">
              {over ? "Отпустите — начнём разбор." : "или выберите файл вручную."}
            </div>
            <div className="cta-row">
              <button className="btn pipe-pick" onClick={() => inputRef.current?.click()}>
                <Glyph.scan size={15} /> Выбрать изображение
              </button>
              <span className="hint">только изображения</span>
            </div>
            <input
              ref={inputRef} type="file" hidden
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (!f.type.startsWith("image/")) {
                  alert("Пожалуйста, загружайте только изображения.");
                  e.target.value = "";
                  return;
                }
                setFile(f);
                e.target.value = "";
              }}
            />
          </div>

          <div className="pipe-drop-aside">
            <div className="pipe-fmts">
              {FORMATS.map((f, i) => {
                const Ic = Glyph[f.ic];
                return (
                  <div className="pipe-fmt" key={i}>
                    <span className="ic"><Ic size={17} /></span>
                    <span className="nm">{f.nm}<small>{f.sub}</small></span>
                    <span className="ext">{f.ext}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="section-title">Обработанные документы</div>

      {data && (
        <Reveal dir="up">
          <div className="panel">
            <table className="table">
              <thead>
                <tr>
                  <th>Файл</th>
                  <th style={{ width: 120 }}>Класс</th>
                  <th style={{ width: 140 }}>Злокачественность</th>
                  <th style={{ width: 100 }} className="num">Уверенность</th>
                  <th style={{ width: 170 }}>Дата</th>
                  <th style={{ width: 44 }}></th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id} className="pipe-row-click" onClick={() => setOpenRecord(r)}>
                    <td className="pipe-doc-name">{r.filename}</td>
                    <td>{r.predicted_class}</td>
                    <td>
                      <span className={`badge ${r.is_malignant ? "ox" : "ok"}`}>
                        {r.is_malignant ? "Да" : "Нет"}
                      </span>
                    </td>
                    <td className="num mono">{r.confidence.toFixed(2)}</td>
                    <td className="muted">{new Date(r.created_at).toLocaleString("ru-RU")}</td>
                    <td>
                      <button
                        className="pipe-doc-del"
                        title="Удалить анализ"
                        disabled={busy === r.id}
                        onClick={(e) => { e.stopPropagation(); del(r.id); }}
                      >
                        <Glyph.x size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted" style={{ padding: 30, textAlign: "center" }}>
                      Пока нет проанализированных снимков — загрузите первый выше.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Reveal>
      )}

      {openRecord && (
        <UltrasoundResultModal record={openRecord} onClose={() => setOpenRecord(null)} />
      )}
    </>
  );
}
