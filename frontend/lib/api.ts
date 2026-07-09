// All calls go through the Next.js rewrite (/api/* -> FastAPI), so same-origin, no CORS.
const BASE = "/api";

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, { cache: "no-store", ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} — ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

import type {
  AiCompare, Dashboard, DashboardDocs, DashboardPartners, DocPreview, DocumentResult, DocumentRow, LabExtractResponse, LabFieldMeta, LabPredictInput, LabPredictResult, Partner, PartnerPrice, ProgressEvent, SearchResult, Service, ServiceDescription, ServicePrice, Unmatched, UltrasoundRecord,
} from "./types";

export const api = {
  dashboard: () => j<Dashboard>("/dashboard/stats"),
  dashboardDocs: () => j<DashboardDocs>("/dashboard/documents"),
  dashboardPartners: () => j<DashboardPartners>("/dashboard/partners"),
  search: (q: string) => j<SearchResult>(`/search?q=${encodeURIComponent(q)}`),

  services: (params: { q?: string; category?: string; limit?: number } = {}) => {
    const u = new URLSearchParams();
    if (params.q) u.set("q", params.q);
    if (params.category) u.set("category", params.category);
    u.set("limit", String(params.limit ?? 100));
    return j<Service[]>(`/services?${u}`);
  },
  servicePartners: (id: string) => j<PartnerPrice[]>(`/services/${id}/partners`),
  serviceDescription: (id: string) => j<ServiceDescription>(`/services/${id}/description`),
  updateService: (id: string, body: { canonical_name?: string; category?: string | null; icd_code?: string | null; is_active?: boolean }) =>
    j<Service>(`/services/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),

  partners: (params: { city?: string } = {}) => {
    const u = new URLSearchParams();
    if (params.city) u.set("city", params.city);
    u.set("limit", "500");
    return j<Partner[]>(`/partners?${u}`);
  },
  partnerServices: (id: string, limit = 500) => j<ServicePrice[]>(`/partners/${id}/services?limit=${limit}`),

  documents: () => j<DocumentRow[]>("/documents?limit=500"),
  document: (id: string) => j<DocumentRow>(`/documents/${id}`),

  unmatched: (limit = 50) => j<Unmatched[]>(`/unmatched?limit=${limit}`),
  documentPreview: (id: string, ref: string) =>
    j<DocPreview>(`/documents/${id}/preview?ref=${encodeURIComponent(ref)}`),
  aiCompare: (itemId: string) =>
    j<AiCompare>("/review/ai-compare", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item_id: itemId }),
    }),
  bulkAccept: (minScore: number, dryRun: boolean) =>
    j<{ eligible: number; accepted: number; min_score: number; dry_run: boolean }>(
      `/review/bulk-accept?min_score=${minScore}&dry_run=${dryRun}`,
      { method: "POST" }
    ),
  match: (body: { item_id: string; service_id?: string; create_name?: string; category?: string; decided_by?: string; note?: string }) =>
    j<{ item_id: string; service_id: string; action: string }>("/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  upload: (file: File, asynchronous = false, process = true, dedupe = true, signal?: AbortSignal) => {
    const fd = new FormData();
    fd.append("file", file);
    return j<{ created: string[]; existing: string[]; replay_pages: Record<string, number>; skipped_duplicates: number; queued: boolean }>(
      `/upload?asynchronous=${asynchronous}&process=${process}&dedupe=${dedupe}`,
      { method: "POST", body: fd, signal }
    );
  },

  documentResult: (id: string) => j<DocumentResult>(`/documents/${id}/result`),
  cancelDocument: (id: string) => j<{ canceled: boolean }>(`/documents/${id}/cancel`, { method: "POST" }),
  deleteDocument: (id: string) => j<{ deleted: boolean }>(`/documents/${id}`, { method: "DELETE" }),
  purgeDocuments: (status = "queued") => j<{ deleted: number }>(`/documents/purge?status=${status}`, { method: "POST" }),

  // Tabular liver lab-panel model — OCR extraction + prediction (/documents page).
  labFields: () => j<{ fields: LabFieldMeta[] }>("/labs/fields"),
  labExtract: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return j<LabExtractResponse>("/labs/extract", { method: "POST", body: fd });
  },
  labPredict: (payload: LabPredictInput) =>
    j<LabPredictResult>("/labs/predict", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    }),

  // Ultrasound CNN analysis history (/ultrasound page) — every /ultrasound/predict
  // call is persisted server-side so past verdicts can be reopened.
  ultrasoundHistory: (limit = 200) => j<UltrasoundRecord[]>(`/ultrasound/history?limit=${limit}`),
  ultrasoundRecord: (id: string) => j<UltrasoundRecord>(`/ultrasound/history/${id}`),
  ultrasoundImageUrl: (id: string) => `${BASE}/ultrasound/history/${id}/image`,
  deleteUltrasoundRecord: (id: string) => j<{ deleted: boolean }>(`/ultrasound/history/${id}`, { method: "DELETE" }),

  // fetch the bundled demo scan as a File (so it flows through the normal upload path)
  demoFile: async (): Promise<File> => {
    const res = await fetch(`${BASE}/demo-file`, { cache: "no-store" });
    if (!res.ok) throw new Error(`demo file unavailable (${res.status})`);
    const blob = await res.blob();
    return new File([blob], "Демо · скан-прайс.pdf", { type: "application/pdf" });
  },

  pageImageUrl: (docId: string, pageno: number) => `${BASE}/documents/${docId}/page/${pageno}`,

  // Stream live events via fetch + ReadableStream (proxies cleanly through the Next
  // rewrite; one-shot, so no EventSource auto-reconnect).
  streamProcess: (docId: string, onEvent: (ev: ProgressEvent) => void, signal?: AbortSignal) =>
    streamSSE(`/documents/${docId}/process-stream`, onEvent, signal),
  // Animated replay of an already-processed doc (no OpenAI — reuses stored data).
  // maxPages caps to the first N pages when the uploaded file was trimmed.
  replayStream: (docId: string, onEvent: (ev: ProgressEvent) => void, signal?: AbortSignal, maxPages = 0) =>
    streamSSE(`/documents/${docId}/replay-stream${maxPages ? `?max_pages=${maxPages}` : ""}`, onEvent, signal),
};

async function streamSSE(path: string, onEvent: (ev: ProgressEvent) => void, signal?: AbortSignal): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store", headers: { Accept: "text/event-stream" }, signal });
  if (!res.ok || !res.body) throw new Error(`stream failed (${res.status})`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n\n")) !== -1) {
      const chunk = buf.slice(0, nl);
      buf = buf.slice(nl + 2);
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try { onEvent(JSON.parse(payload) as ProgressEvent); } catch { /* ignore partial */ }
      }
    }
  }
}

export function fmtKzt(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n) + " ₸";
}
