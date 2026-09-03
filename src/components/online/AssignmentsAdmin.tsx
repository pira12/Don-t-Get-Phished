"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Users, CheckCircle2 } from "lucide-react";
import { api, type AdminAssignment } from "@/net/api";
import { TECHNIQUE_LABELS, type RedFlagType } from "@/game/types";

export function AssignmentsAdmin({ orgId }: { orgId: string }) {
  const [items, setItems] = useState<AdminAssignment[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("mixed");
  const [focus, setFocus] = useState("");
  const [minAccuracy, setMinAccuracy] = useState(80);
  const [minRounds, setMinRounds] = useState(1);
  const [team, setTeam] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      setItems((await api.listAssignments(orgId)).assignments);
    } catch (e) {
      setMsg((e as Error).message);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setMsg("");
    try {
      await api.createAssignment(orgId, {
        title,
        difficulty,
        focusTechnique: focus || null,
        minAccuracy: minAccuracy / 100,
        minRounds,
        team: team || null,
        dueDate: dueDate || null,
      });
      setOpen(false);
      setTitle("");
      setTeam("");
      setDueDate("");
      await load();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    await api.deleteAssignment(id);
    await load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          Assign training with a difficulty or technique focus, an accuracy target, and a due date.
          Completion is tracked from members&apos; rounds for compliance.
        </p>
        <button onClick={() => setOpen((o) => !o)} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110">
          <Plus size={15} /> New assignment
        </button>
      </div>

      {open && (
        <div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2">
          <label className="text-xs text-ink-muted sm:col-span-2">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Q4 phishing refresher" className="mt-1 w-full rounded-client border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
          </label>
          <label className="text-xs text-ink-muted">
            Difficulty
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="mt-1 w-full rounded-client border border-border bg-surface-2 px-3 py-2 text-sm text-ink">
              {["mixed", "easy", "medium", "hard"].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="text-xs text-ink-muted">
            Focus technique (optional)
            <select value={focus} onChange={(e) => setFocus(e.target.value)} className="mt-1 w-full rounded-client border border-border bg-surface-2 px-3 py-2 text-sm text-ink">
              <option value="">Any</option>
              {(Object.keys(TECHNIQUE_LABELS) as RedFlagType[]).map((t) => <option key={t} value={t}>{TECHNIQUE_LABELS[t]}</option>)}
            </select>
          </label>
          <label className="text-xs text-ink-muted">
            Min accuracy: {minAccuracy}%
            <input type="range" min={0} max={100} step={5} value={minAccuracy} onChange={(e) => setMinAccuracy(Number(e.target.value))} className="mt-2 w-full" />
          </label>
          <label className="text-xs text-ink-muted">
            Qualifying rounds
            <input type="number" min={1} max={20} value={minRounds} onChange={(e) => setMinRounds(Number(e.target.value))} className="mt-1 w-full rounded-client border border-border bg-surface-2 px-3 py-2 text-sm text-ink" />
          </label>
          <label className="text-xs text-ink-muted">
            Team (blank = whole org)
            <input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Finance" className="mt-1 w-full rounded-client border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
          </label>
          <label className="text-xs text-ink-muted">
            Due date (optional)
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 w-full rounded-client border border-border bg-surface-2 px-3 py-2 text-sm text-ink" />
          </label>
          <div className="sm:col-span-2">
            <button onClick={create} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110">Create assignment</button>
          </div>
        </div>
      )}

      {msg && <p className="mb-2 text-xs text-danger">{msg}</p>}

      {items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-ink-muted">No assignments yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((a) => {
            const pct = a.assignedCount ? Math.round((a.completedCount / a.assignedCount) * 100) : 0;
            return (
              <li key={a.id} className="rounded-client border border-border bg-surface p-3">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{a.title}</div>
                    <div className="text-[11px] text-ink-faint">
                      {a.difficulty}
                      {a.focusTechnique ? ` · ${TECHNIQUE_LABELS[a.focusTechnique as RedFlagType]}` : ""} · target {Math.round(a.minAccuracy * 100)}% · {a.minRounds} round{a.minRounds > 1 ? "s" : ""}
                      {a.team ? ` · team ${a.team}` : " · whole org"}
                      {a.dueDate ? ` · due ${new Date(a.dueDate).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Users size={13} /> {a.completedCount}/{a.assignedCount}
                  </div>
                  <button onClick={() => remove(a.id)} title="Delete" className="rounded p-1.5 text-danger hover:bg-danger-soft">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                    <CheckCircle2 size={12} className="text-success" /> {pct}% complete
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
