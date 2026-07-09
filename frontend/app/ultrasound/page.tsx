"use client";
import "../pipeline.css";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { PageHead, Loading, ErrorNote, StatusBadge } from "@/components/Bits";
import { Reveal, AmbientField } from "@/components/Motion";
import { Glyph } from "@/components/Icon";
import ParseProgress from "@/components/ParseProgress";

const METHOD_RU: Record<string, string> = {
  table: "таблица", ocr: "OCR", words: "текст", lines: "строки", text: "текст", line_items: "строки",
  pdf_text: "PDF · текст", pdf_ocr: "PDF · OCR", pdf_table: "PDF · таблица", xlsx: "Excel", docx: "Word", xls: "Excel",
};

const FORMATS: { ic: keyof typeof Glyph; nm: string; sub: string; ext: string }[] = [
  { ic: "scan", nm: "Изображение", sub: "CNN", ext: ".jpg / .png" },
];

const ACTIVE_KEY = "medarchive:activeDoc";

export default function DocumentsPage() {
  const { data, error, loading, reload } = useFetch(() => api.documents(), []);
  const [over, setOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [reconnect, setReconnect] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // On load, resume a still-running job from a prior page session (survives reload).
  useEffect(() => {
    let alive = true;
    try {
      const raw = localStorage.getItem(ACTIVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { id: string; name: string };
      api.document(saved.id)
        .then((doc) => {
          if (!alive) return;
          if (doc.status === "queued" || doc.status === "processing") setReconnect(saved);
          else localStorage.removeItem(ACTIVE_KEY);
        })
        .catch(() => localStorage.removeItem(ACTIVE_KEY));
    } catch { /* ignore */ }
    return () => { alive = false; };
  }, []);

  const queuedCount = (data || []).filter((d) => d.status === "queued").length;

  async function del(id: string) {
    setBusy(id);
    try { await api.deleteDocument(id); reload(); }
    catch (e) { alert("Не удалось удалить: " + (e as Error).message); }
    finally { setBusy(null); }
  }
  async function purgeQueue() {
    if (!window.confirm(`Удалить все документы в очереди (${queuedCount})?`)) return;
    setBusy("purge");
    try { const r = await api.purgeDocuments("queued"); reload(); alert(`Удалено: ${r.deleted}`); }
    catch (e) { alert("Ошибка: " + (e as Error).message); }
    finally { setBusy(null); }
  }

  const showProgress = file || reconnect;
  const closeProgress = () => { setFile(null); setReconnect(null); reload(); };

  return (
    <>
      <PageHead eyebrow="CNN · УЗИ печени" title="Загрузка и AI-обработка изображений УЗИ печени" />
      <p className="pipe-lede">
        Бросьте сюда изображение УЗИ печени. Система прочитает файл,
        извлечёт информацию о панели и передаст её на CNN-модель для выявления наличия/отсутствия заболеваний.
      </p>

      {showProgress ? (
        <ParseProgress
          file={file ?? undefined}
          reconnectId={!file && reconnect ? reconnect.id : undefined}
          reconnectName={!file && reconnect ? reconnect.name : undefined}
          onComplete={reload}
          onClose={closeProgress}
        />
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
      {queuedCount > 0 && (
        <div className="pipe-queuebar">
          <span>{queuedCount} в очереди</span>
          <button className="btn small" disabled={busy === "purge"} onClick={purgeQueue}>
            <Glyph.x size={13} /> {busy === "purge" ? "Очистка…" : "Очистить очередь"}
          </button>
        </div>
      )}
      {data && (
        <Reveal dir="up">
          <div className="panel">
            <table className="table">
              <thead>
                <tr><th>Файл</th><th style={{ width: 110 }}>Формат</th><th style={{ width: 70 }} className="num">Год</th><th style={{ width: 130 }}>Статус</th><th>Метод извлечения</th><th style={{ width: 44 }}></th></tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.id}>
                    <td className="pipe-doc-name">{d.source_filename}</td>
                    <td><span className="pipe-fmt-cell">{d.file_format}</span></td>
                    <td className="num muted">{d.year ?? "—"}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        {Object.entries(d.method_summary || {}).map(([k, v]) => (
                          <span className="badge" key={k}>{METHOD_RU[k] || k} · {v}</span>
                        ))}
                        {Object.keys(d.method_summary || {}).length === 0 && <span className="muted">—</span>}
                      </div>
                    </td>
                    <td>
                      <button className="pipe-doc-del" title="Удалить документ" disabled={busy === d.id} onClick={() => del(d.id)}>
                        <Glyph.x size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && <tr><td colSpan={6} className="muted" style={{ padding: 30, textAlign: "center" }}>Документов пока нет — загрузите первый прайс-лист выше.</td></tr>}
              </tbody>
            </table>
          </div>
        </Reveal>
      )}
    </>
  );
}
