"use client";
import { useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import type { UltrasoundRecord } from "@/lib/types";
import { Glyph } from "./Icon";

export default function UltrasoundResultModal({
  record,
  onClose,
}: {
  record: UltrasoundRecord;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const probabilityEntries = useMemo(
    () => Object.entries(record.probabilities).sort((a, b) => b[1] - a[1]),
    [record]
  );
  const verdictCls = record.is_malignant ? "verdict-warn" : "verdict-ok";
  const badgeCls = record.is_malignant ? "warn" : "ok";
  const date = new Date(record.created_at);

  return (
    <div className="pipe-modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="pipe-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pipe-modal-head">
          <div className="pipe-pp-id">
            <div className="pipe-pp-name">{record.filename}</div>
            <div className="pipe-pp-meta">
              {Number.isNaN(date.getTime()) ? record.created_at : date.toLocaleString("ru-RU")}
            </div>
          </div>
          <button className="btn small pp-cancel" onClick={onClose}>
            <Glyph.x size={13} /> Закрыть
          </button>
        </div>

        <div className="pipe-modal-body">
          <div className={`pp-shot-frame ${verdictCls}`}>
            <img className="pp-shot-img" src={api.ultrasoundImageUrl(record.id)} alt={record.filename} />
            <div className={`pp-shot-badge ${badgeCls}`}>
              <Glyph.check size={15} />
            </div>
          </div>

          <div className="pipe-result" style={{ padding: 0, border: "none" }}>
            <div className="pipe-rcells">
              <div className="pipe-rcell hero">
                <div className="k">Класс</div>
                <div className="v">{record.predicted_class}</div>
              </div>
              <div className="pipe-rcell">
                <div className="k">Злокачественность</div>
                <div className="stat">{record.is_malignant ? "Да" : "Нет"}</div>
              </div>
              <div className="pipe-rcell">
                <div className="k">Уверенность</div>
                <div className="stat">{record.confidence.toFixed(2)}</div>
              </div>
            </div>

            <div className="pp-preview">
              <div className="pp-preview-head">Вероятности по классам</div>
              <div className="pp-preview-rows">
                {probabilityEntries.map(([name, value]) => (
                  <div className="pp-pv-row" key={name}>
                    <div className="pp-pv-raw">{name}</div>
                    <div className="pp-pv-price">{value.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
