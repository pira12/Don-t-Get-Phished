"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Save, X, FilePenLine, ShieldCheck, Import } from "lucide-react";
import { api, type ImportedDraft, type ServerEmailDto } from "@/net/api";
import { EmailMessage } from "@/components/EmailMessage";
import { TECHNIQUE_LABELS, type GameEmail, type RedFlagType } from "@/game/types";

type Draft = {
  id?: string;
  truth: "phishing" | "legit";
  difficulty: "easy" | "medium" | "hard";
  fromName: string;
  fromAddress: string;
  replyTo: string;
  subject: string;
  snippet: string;
  bodyHtml: string;
  linkText: string;
  linkHref: string;
  spf: string;
  dkim: string;
  dmarc: string;
  firstTimeSender: boolean;
  mailedBy: string;
  signedBy: string;
  redFlags: { type: RedFlagType; anchor: string; explanation: string }[];
  legitSignals: string[];
};

const BLANK: Draft = {
  truth: "phishing",
  difficulty: "medium",
  fromName: "",
  fromAddress: "",
  replyTo: "",
  subject: "",
  snippet: "",
  bodyHtml: "<p>Hello,</p>\n<p>...</p>\n<p><a class=\"btn\" href=\"https://real-destination.example/login\">Click here</a></p>",
  linkText: "Click here",
  linkHref: "https://real-destination.example/login",
  spf: "fail",
  dkim: "fail",
  dmarc: "fail",
  firstTimeSender: true,
  mailedBy: "",
  signedBy: "",
  redFlags: [{ type: "lookalike_domain", anchor: "", explanation: "" }],
  legitSignals: [""],
};

/** Turn the editor draft into the API payload / a GameEmail for the live preview. */
function draftToEmail(d: Draft): GameEmail {
  return {
    id: d.id ?? "preview",
    truth: d.truth,
    difficulty: d.difficulty,
    from: { name: d.fromName || "Sender", address: d.fromAddress || "sender@example.com" },
    replyTo: d.replyTo || undefined,
    to: "you@northwind.example",
    subject: d.subject || "(no subject)",
    timestamp: new Date().toISOString(),
    snippet: d.snippet || d.subject,
    bodyHtml: d.bodyHtml,
    links: d.linkHref ? [{ text: d.linkText || d.linkHref, href: d.linkHref }] : [],
    auth: { spf: d.spf as never, dkim: d.dkim as never, dmarc: d.dmarc as never },
    firstTimeSender: d.firstTimeSender,
    mailedBy: d.mailedBy || undefined,
    signedBy: d.signedBy || undefined,
    redFlags: d.truth === "phishing" ? d.redFlags.filter((f) => f.anchor || f.explanation) : [],
    legitSignals: d.truth === "legit" ? d.legitSignals.filter(Boolean) : undefined,
    techniqueTags: [...new Set(d.redFlags.map((f) => f.type))],
  };
}

function dtoToDraft(e: ServerEmailDto): Draft {
  return {
    id: e.id,
    truth: e.truth,
    difficulty: e.difficulty,
    fromName: e.from.name,
    fromAddress: e.from.address,
    replyTo: e.replyTo ?? "",
    subject: e.subject,
    snippet: e.snippet,
    bodyHtml: e.bodyHtml,
    linkText: e.links[0]?.text ?? "",
    linkHref: e.links[0]?.href ?? "",
    spf: e.auth.spf,
    dkim: e.auth.dkim,
    dmarc: e.auth.dmarc,
    firstTimeSender: !!e.firstTimeSender,
    mailedBy: e.mailedBy ?? "",
    signedBy: e.signedBy ?? "",
    redFlags: (e.redFlags as Draft["redFlags"]).length ? (e.redFlags as Draft["redFlags"]) : [{ type: "lookalike_domain", anchor: "", explanation: "" }],
    legitSignals: e.legitSignals?.length ? e.legitSignals : [""],
  };
}

function importedToDraft(d: ImportedDraft): Draft {
  return {
    truth: d.truth,
    difficulty: d.difficulty,
    fromName: d.from.name,
    fromAddress: d.from.address,
    replyTo: d.replyTo ?? "",
    subject: d.subject,
    snippet: d.snippet ?? "",
    bodyHtml: d.bodyHtml,
    linkText: d.links[0]?.text ?? "",
    linkHref: d.links[0]?.href ?? "",
    spf: d.auth.spf,
    dkim: d.auth.dkim,
    dmarc: d.auth.dmarc,
    firstTimeSender: !!d.firstTimeSender,
    mailedBy: d.mailedBy ?? "",
    signedBy: "",
    redFlags: (d.redFlags as Draft["redFlags"]).length ? (d.redFlags as Draft["redFlags"]) : [{ type: "credential_harvest_link", anchor: "", explanation: "" }],
    legitSignals: [""],
  };
}

function draftToPayload(d: Draft) {
  return {
    truth: d.truth,
    difficulty: d.difficulty,
    from: { name: d.fromName, address: d.fromAddress },
    replyTo: d.replyTo,
    subject: d.subject,
    snippet: d.snippet,
    bodyHtml: d.bodyHtml,
    links: d.linkHref ? [{ text: d.linkText, href: d.linkHref }] : [],
    auth: { spf: d.spf, dkim: d.dkim, dmarc: d.dmarc },
    firstTimeSender: d.firstTimeSender,
    mailedBy: d.mailedBy,
    signedBy: d.signedBy,
    redFlags: d.redFlags,
    legitSignals: d.legitSignals.filter(Boolean),
  };
}

export function ContentAdmin({ orgId }: { orgId: string }) {
  const [emails, setEmails] = useState<ServerEmailDto[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importRaw, setImportRaw] = useState("");
  const [importErr, setImportErr] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await api.listContent(orgId);
      setEmails(r.emails);
    } catch (e) {
      setMsg((e as Error).message);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!draft) return;
    setErrors([]);
    setMsg("");
    try {
      if (draft.id) await api.updateContent(draft.id, draftToPayload(draft));
      else await api.createContent(orgId, draftToPayload(draft));
      setDraft(null);
      await load();
      setMsg("Saved.");
    } catch (e) {
      const m = (e as Error).message;
      try {
        const parsed = JSON.parse(m);
        if (parsed.errors) return setErrors(parsed.errors);
      } catch {
        /* not JSON */
      }
      setErrors([m]);
    }
  };

  const togglePublish = async (e: ServerEmailDto) => {
    await api.updateContent(e.id, { published: !e.published });
    await load();
  };
  const remove = async (e: ServerEmailDto) => {
    await api.deleteContent(e.id);
    await load();
  };

  if (draft) {
    return <Editor draft={draft} setDraft={setDraft} onSave={save} onCancel={() => setDraft(null)} errors={errors} />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-xl text-sm text-ink-muted">
          Author scenario emails that mimic your real vendors and internal senders — the most
          effective training. Published emails appear in members&apos; practice rounds.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => { setImportOpen((o) => !o); setImportErr(""); }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-ink hover:brightness-95"
          >
            <Import size={15} /> Import real email
          </button>
          <button
            onClick={() => setDraft({ ...BLANK })}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110"
          >
            <Plus size={15} /> New scenario
          </button>
        </div>
      </div>

      {importOpen && (
        <div className="mb-4 rounded-2xl border border-border bg-surface p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
            <ShieldCheck size={16} className="text-success" /> Import a real email — safely
          </div>
          <p className="mb-2 text-xs text-ink-muted">
            Paste a real (e.g. research-corpus) email — headers and/or body. It&apos;s{" "}
            <strong>defanged</strong> before you ever see it: scripts and event handlers removed,
            remote images/beacons blocked, and long digit sequences redacted. The real recipient is
            replaced. You then review, add the teaching red flags, and publish. Only import content
            you&apos;re licensed to use, and check for brand names / personal data before publishing.
          </p>
          <textarea
            value={importRaw}
            onChange={(e) => setImportRaw(e.target.value)}
            rows={7}
            placeholder={"From: \"IT Support\" <no-reply@examp1e.com>\nSubject: Password expires today\nAuthentication-Results: spf=fail dkim=fail dmarc=fail\n\n<p>Your password expires today. <a href=\"http://examp1e.com/verify\">Verify now</a></p>"}
            className="w-full rounded-client border border-border bg-surface-2 p-2 font-mono text-xs text-ink outline-none focus:border-accent"
          />
          {importErr && <p className="mt-1 text-xs text-danger">{importErr}</p>}
          <div className="mt-2 flex gap-2">
            <button
              onClick={async () => {
                setImportErr("");
                try {
                  const r = await api.importContent(orgId, importRaw);
                  setImportOpen(false);
                  setImportRaw("");
                  setDraft(importedToDraft(r.draft));
                } catch (e) {
                  setImportErr((e as Error).message);
                }
              }}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110"
            >
              Defang &amp; review
            </button>
            <button onClick={() => setImportOpen(false)} className="rounded-full border border-border px-4 py-2 text-sm text-ink hover:bg-[var(--row-hover)]">
              Cancel
            </button>
          </div>
        </div>
      )}
      {msg && <p className="mb-2 text-xs text-success">{msg}</p>}

      {emails.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-ink-muted">
          No custom scenarios yet. Create one to train your team on threats specific to your org.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {emails.map((e) => (
            <li key={e.id} className="flex items-center gap-3 rounded-client border border-border bg-surface p-3">
              <span className={["h-2 w-2 shrink-0 rounded-full", e.truth === "phishing" ? "bg-danger" : "bg-success"].join(" ")} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">{e.subject}</div>
                <div className="text-[11px] text-ink-faint">
                  {e.truth} · {e.difficulty} · v{e.version} · {e.published ? "published" : "draft"}
                </div>
              </div>
              <button onClick={() => togglePublish(e)} title={e.published ? "Unpublish" : "Publish"} className="rounded p-1.5 text-ink-muted hover:bg-[var(--row-hover)]">
                {e.published ? <Eye size={16} className="text-success" /> : <EyeOff size={16} />}
              </button>
              <button onClick={() => setDraft(dtoToDraft(e))} title="Edit" className="rounded p-1.5 text-ink-muted hover:bg-[var(--row-hover)]">
                <FilePenLine size={16} />
              </button>
              <button onClick={() => remove(e)} title="Delete" className="rounded p-1.5 text-danger hover:bg-danger-soft">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Editor({
  draft,
  setDraft,
  onSave,
  onCancel,
  errors,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  errors: string[];
}) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft({ ...draft, [k]: v });

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Form */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink">{draft.id ? "Edit scenario" : "New scenario"}</h3>
          <div className="flex gap-2">
            <button onClick={onCancel} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-ink hover:bg-[var(--row-hover)]">
              <X size={14} /> Cancel
            </button>
            <button onClick={onSave} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110">
              <Save size={14} /> Save draft
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <ul className="rounded-client border border-danger/40 bg-danger-soft p-2 text-xs text-danger">
            {errors.map((e, i) => (
              <li key={i}>• {e}</li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Select label="Type" value={draft.truth} onChange={(v) => set("truth", v as Draft["truth"])} options={[["phishing", "Phishing"], ["legit", "Legitimate"]]} />
          <Select label="Difficulty" value={draft.difficulty} onChange={(v) => set("difficulty", v as Draft["difficulty"])} options={[["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]]} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Sender name" value={draft.fromName} onChange={(v) => set("fromName", v)} placeholder="IT Security Team" />
          <Field label="Sender address" value={draft.fromAddress} onChange={(v) => set("fromAddress", v)} placeholder="no-reply@vend0r.example" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Reply-to (optional)" value={draft.replyTo} onChange={(v) => set("replyTo", v)} placeholder="attacker@elsewhere.example" />
          <Field label="Subject" value={draft.subject} onChange={(v) => set("subject", v)} placeholder="Action required" />
        </div>
        <Field label="List snippet (optional)" value={draft.snippet} onChange={(v) => set("snippet", v)} placeholder="Short preview shown in the list" />
        <label className="text-xs text-ink-muted">
          Body (HTML) — use <code>{'<a href="REAL-URL">text</a>'}</code> for links
          <textarea
            value={draft.bodyHtml}
            onChange={(e) => set("bodyHtml", e.target.value)}
            rows={6}
            className="mt-1 w-full rounded-client border border-border bg-surface-2 p-2 font-mono text-xs text-ink outline-none focus:border-accent"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Link text" value={draft.linkText} onChange={(v) => set("linkText", v)} />
          <Field label="Link real URL" value={draft.linkHref} onChange={(v) => set("linkHref", v)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Select label="SPF" value={draft.spf} onChange={(v) => set("spf", v)} options={[["pass", "pass"], ["softfail", "softfail"], ["fail", "fail"]]} />
          <Select label="DKIM" value={draft.dkim} onChange={(v) => set("dkim", v)} options={[["pass", "pass"], ["fail", "fail"]]} />
          <Select label="DMARC" value={draft.dmarc} onChange={(v) => set("dmarc", v)} options={[["pass", "pass"], ["softfail", "softfail"], ["fail", "fail"]]} />
        </div>

        {draft.truth === "phishing" ? (
          <fieldset className="rounded-client border border-border p-2">
            <legend className="px-1 text-xs font-medium text-ink-muted">Red flags (feedback)</legend>
            {draft.redFlags.map((f, i) => (
              <div key={i} className="mb-2 grid grid-cols-1 gap-1">
                <select
                  value={f.type}
                  onChange={(e) => {
                    const next = [...draft.redFlags];
                    next[i] = { ...f, type: e.target.value as RedFlagType };
                    set("redFlags", next);
                  }}
                  className="rounded border border-border bg-surface-2 px-2 py-1 text-xs text-ink"
                >
                  {(Object.keys(TECHNIQUE_LABELS) as RedFlagType[]).map((t) => (
                    <option key={t} value={t}>{TECHNIQUE_LABELS[t]}</option>
                  ))}
                </select>
                <input
                  value={f.anchor}
                  onChange={(e) => {
                    const next = [...draft.redFlags];
                    next[i] = { ...f, anchor: e.target.value };
                    set("redFlags", next);
                  }}
                  placeholder="anchor text that appears in the email (e.g. the fake domain)"
                  className="rounded border border-border bg-surface-2 px-2 py-1 text-xs text-ink"
                />
                <input
                  value={f.explanation}
                  onChange={(e) => {
                    const next = [...draft.redFlags];
                    next[i] = { ...f, explanation: e.target.value };
                    set("redFlags", next);
                  }}
                  placeholder="explanation shown in feedback"
                  className="rounded border border-border bg-surface-2 px-2 py-1 text-xs text-ink"
                />
              </div>
            ))}
            <button onClick={() => set("redFlags", [...draft.redFlags, { type: "urgency", anchor: "", explanation: "" }])} className="text-xs font-medium text-accent hover:underline">
              + add red flag
            </button>
          </fieldset>
        ) : (
          <fieldset className="rounded-client border border-border p-2">
            <legend className="px-1 text-xs font-medium text-ink-muted">Reassuring signals (feedback)</legend>
            {draft.legitSignals.map((s, i) => (
              <input
                key={i}
                value={s}
                onChange={(e) => {
                  const next = [...draft.legitSignals];
                  next[i] = e.target.value;
                  set("legitSignals", next);
                }}
                placeholder="e.g. SPF/DKIM/DMARC all pass"
                className="mb-1 w-full rounded border border-border bg-surface-2 px-2 py-1 text-xs text-ink"
              />
            ))}
            <button onClick={() => set("legitSignals", [...draft.legitSignals, ""])} className="text-xs font-medium text-accent hover:underline">
              + add signal
            </button>
          </fieldset>
        )}
      </div>

      {/* Live preview — renders exactly as employees will see it. */}
      <div>
        <div className="mb-2 text-xs font-medium text-ink-muted">Live preview (what employees see)</div>
        <div className="h-[560px] overflow-hidden rounded-2xl border border-border bg-surface">
          <EmailMessage
            email={draftToEmail(draft)}
            onTool={() => {}}
            onHoverLink={() => {}}
            showSender
            setShowSender={() => {}}
            showHeaders={false}
            setShowHeaders={() => {}}
            showReplyActions={false}
          />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="text-xs text-ink-muted">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-client border border-border bg-surface-2 px-2 py-1.5 text-sm text-ink outline-none focus:border-accent" />
    </label>
  );
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="text-xs text-ink-muted">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-client border border-border bg-surface-2 px-2 py-1.5 text-sm text-ink outline-none focus:border-accent">
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}
