"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { BUILTIN_TEMPLATES } from "@/lib/templates";
import { cn } from "@/lib/utils";

type ColumnDraft = { name: string; description: string; color: string };

export default function NewRetroPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-neutral-500">Loading…</p></div>}>
      <NewRetroForm />
    </Suspense>
  );
}

function NewRetroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId");
  const [templateId, setTemplateId] = useState<string>("mad-sad-glad");
  const [title, setTitle] = useState("Sprint retrospective");
  const [topic, setTopic] = useState("");
  const [engagement, setEngagement] = useState<"anonymous" | "required_names">("anonymous");
  const [columns, setColumns] = useState<ColumnDraft[]>(
    BUILTIN_TEMPLATES[0].columns.map((c) => ({ name: c.name, description: c.description ?? "", color: c.color }))
  );
  const [votesPerParticipant, setVotesPerParticipant] = useState(3);
  const [secretVoting, setSecretVoting] = useState(true);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Privacy & compliance options (plan-gated)
  const [isPrivate, setIsPrivate] = useState(false);
  const [moderated, setModerated] = useState(false);
  const [retentionDays, setRetentionDays] = useState<number>(0); // 0 = forever
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState("");
  const [encryptionConfirm, setEncryptionConfirm] = useState("");

  // Fetch the user's plan to know which features are available
  const [planFeatures, setPlanFeatures] = useState<{
    plan: string;
    privateRetros: boolean;
    advancedFacilitation: boolean;
    configurableRetention: boolean;
    zeroKnowledgeEncryption: boolean;
    maxColumns: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/subscription");
        if (res.ok) {
          const data = await res.json();
          if (data.plan) {
            setPlanFeatures({
              plan: data.plan.plan,
              privateRetros: data.plan.privateRetros,
              advancedFacilitation: data.plan.advancedFacilitation,
              configurableRetention: data.plan.configurableRetention,
              zeroKnowledgeEncryption: data.plan.zeroKnowledgeEncryption,
              maxColumns: data.plan.maxColumns ?? 3,
            });
          }
        }
      } catch {
        /* not logged in or no plan — defaults to anonymous */
      }
    })();
  }, []);

  const isPaid = planFeatures && planFeatures.plan !== "anonymous";
  const canPrivate = planFeatures?.privateRetros ?? false;
  const canModerate = planFeatures?.advancedFacilitation ?? false;
  const canRetention = planFeatures?.configurableRetention ?? false;
  const canEncrypt = planFeatures?.zeroKnowledgeEncryption ?? false;
  // -1 = unlimited. Until the plan loads, assume the free-plan cap so we never
  // let a free user build a board the API will reject.
  const maxColumns = planFeatures?.maxColumns ?? 3;
  const columnsUnlimited = maxColumns === -1;
  const atColumnLimit = !columnsUnlimited && columns.length >= maxColumns;

  function selectTemplate(id: string) {
    setTemplateId(id);
    const t = BUILTIN_TEMPLATES.find((x) => x.id === id);
    if (t) setColumns(t.columns.map((c) => ({ name: c.name, description: c.description ?? "", color: c.color })));
  }

  function updateColumn(i: number, patch: Partial<ColumnDraft>) {
    setColumns((cols) => cols.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addColumn() {
    setColumns((cols) => {
      if (!columnsUnlimited && cols.length >= maxColumns) return cols;
      return [...cols, { name: `Column ${cols.length + 1}`, description: "", color: "#a78bfa" }];
    });
  }
  function removeColumn(i: number) {
    setColumns((cols) => cols.filter((_, idx) => idx !== i));
  }
  function moveColumn(i: number, dir: -1 | 1) {
    setColumns((cols) => {
      const next = [...cols];
      const j = i + dir;
      if (j < 0 || j >= next.length) return cols;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      // Validate encryption password if encryption is enabled
      if (encryptionEnabled) {
        if (encryptionPassword.length < 6) {
          throw new Error("Encryption password must be at least 6 characters.");
        }
        if (encryptionPassword !== encryptionConfirm) {
          throw new Error("Encryption passwords do not match.");
        }
      }
      const res = await fetch("/api/retros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          topic: topic || undefined,
          engagement,
          visibility: isPrivate ? "private" : "regular",
          moderated,
          retentionDays: canRetention ? retentionDays : undefined,
          encryptionEnabled: canEncrypt ? encryptionEnabled : false,
          columns,
          votesPerParticipant,
          secretVoting,
          timerDuration: timerMinutes * 60,
          teamId: teamId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create retro");
      // Store the encryption password in sessionStorage so the board can use it
      // immediately for encryption/decryption without re-prompting.
      if (encryptionEnabled && encryptionPassword) {
        sessionStorage.setItem(`retromo_enc_${data.id}`, encryptionPassword);
      }
      router.push(`/retro/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create retro");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Set up your retrospective</h1>
            <p className="mt-2 text-neutral-600">Pick a template, customize your columns, and choose how your team will participate.</p>
            {teamId && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                This retro will be linked to your team.
              </div>
            )}
          </div>

          {/* Template picker */}
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Choose a template</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {BUILTIN_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectTemplate(t.id)}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-all",
                    templateId === t.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  )}
                >
                  <div className="text-2xl">{t.emoji}</div>
                  <div className="mt-2 font-semibold text-neutral-900">{t.name}</div>
                  <div className="mt-1 text-xs text-neutral-500">{t.description}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Basics */}
          <section className="mb-10 rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Basics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Retrospective title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Topic (optional)</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. End of Q3 launch"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-neutral-700">Engagement level</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => setEngagement("anonymous")}
                  className={cn("flex-1 rounded-lg border-2 p-3 text-left", engagement === "anonymous" ? "border-indigo-500 bg-indigo-50" : "border-neutral-200")}
                >
                  <div className="text-sm font-semibold">Anonymous</div>
                  <div className="text-xs text-neutral-500">Cards aren't tied to names — great for new teams.</div>
                </button>
                <button
                  onClick={() => setEngagement("required_names")}
                  className={cn("flex-1 rounded-lg border-2 p-3 text-left", engagement === "required_names" ? "border-indigo-500 bg-indigo-50" : "border-neutral-200")}
                >
                  <div className="text-sm font-semibold">Require names</div>
                  <div className="text-xs text-neutral-500">Ask each participant for a name — better for mature teams.</div>
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Votes per participant</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={votesPerParticipant}
                  onChange={(e) => setVotesPerParticipant(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Timer (minutes, 0 = none)</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Secret voting</label>
                <button
                  onClick={() => setSecretVoting((v) => !v)}
                  className={cn("flex h-10 w-full items-center justify-between rounded-lg border-2 px-3 text-sm", secretVoting ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-neutral-200 text-neutral-600")}
                >
                  {secretVoting ? "On" : "Off"}
                  <span className={cn("relative h-5 w-9 rounded-full transition-colors", secretVoting ? "bg-indigo-600" : "bg-neutral-300")}>
                    <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", secretVoting ? "left-4" : "left-0.5")} />
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* Privacy & Compliance */}
          <section className="mb-10 rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-1 text-lg font-semibold text-neutral-900">Privacy &amp; Compliance</h2>
            <p className="mb-4 text-sm text-neutral-500">Optional controls — some require a paid plan.</p>

            {/* Private retro */}
            <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
              <div>
                <div className="text-sm font-medium text-neutral-800">Private retrospective</div>
                <div className="text-xs text-neutral-500">Participants must sign in to view and join this board. Anonymous visitors are blocked, even with the link. {!canPrivate && <span className="text-amber-600">Requires Personal or Company plan.</span>}</div>
              </div>
              <button
                onClick={() => canPrivate && setIsPrivate((v) => !v)}
                disabled={!canPrivate}
                className={cn("flex h-10 items-center justify-between rounded-lg border-2 px-3 text-sm", isPrivate ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-neutral-200 text-neutral-600", !canPrivate && "cursor-not-allowed opacity-50")}
              >
                {isPrivate ? "On" : "Off"}
                <span className={cn("relative ml-2 h-5 w-9 rounded-full transition-colors", isPrivate ? "bg-indigo-600" : "bg-neutral-300")}>
                  <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", isPrivate ? "left-4" : "left-0.5")} />
                </span>
              </button>
            </div>

            {/* Moderation */}
            <div className="mt-3 flex items-center justify-between rounded-lg border border-neutral-200 p-3">
              <div>
                <div className="text-sm font-medium text-neutral-800">Moderation</div>
                <div className="text-xs text-neutral-500">Cards need facilitator approval when a participant posts them to the shared board. You and your facilitators are exempt. {!canModerate && <span className="text-amber-600">Requires Personal or Company plan.</span>}</div>
              </div>
              <button
                onClick={() => canModerate && setModerated((v) => !v)}
                disabled={!canModerate}
                className={cn("flex h-10 items-center justify-between rounded-lg border-2 px-3 text-sm", moderated ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-neutral-200 text-neutral-600", !canModerate && "cursor-not-allowed opacity-50")}
              >
                {moderated ? "On" : "Off"}
                <span className={cn("relative ml-2 h-5 w-9 rounded-full transition-colors", moderated ? "bg-indigo-600" : "bg-neutral-300")}>
                  <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", moderated ? "left-4" : "left-0.5")} />
                </span>
              </button>
            </div>

            {/* Data retention */}
            <div className="mt-3 rounded-lg border border-neutral-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-neutral-800">Data retention</div>
                  <div className="text-xs text-neutral-500">Auto-delete this retro after N days. {!canRetention && <span className="text-amber-600">Requires Personal or Company plan.</span>}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <select
                  disabled={!canRetention}
                  value={retentionDays === 0 ? "forever" : String(retentionDays)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRetentionDays(v === "forever" ? 0 : Number(v));
                  }}
                  className={cn("rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500", !canRetention && "cursor-not-allowed opacity-50")}
                >
                  <option value="forever">Keep forever</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">365 days</option>
                </select>
                {!canRetention && <span className="text-xs text-amber-600">Upgrade to configure</span>}
              </div>
            </div>

            {/* Zero-knowledge encryption */}
            <div className="mt-3 rounded-lg border border-neutral-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-neutral-800">Zero-knowledge encryption</div>
                  <div className="text-xs text-neutral-500">Encrypt card content with a password. The password is never sent to the server. {!canEncrypt && <span className="text-amber-600">Requires Company plan.</span>}</div>
                </div>
                <button
                  onClick={() => canEncrypt && setEncryptionEnabled((v) => !v)}
                  disabled={!canEncrypt}
                  className={cn("flex h-10 items-center justify-between rounded-lg border-2 px-3 text-sm", encryptionEnabled ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-neutral-200 text-neutral-600", !canEncrypt && "cursor-not-allowed opacity-50")}
                >
                  {encryptionEnabled ? "On" : "Off"}
                  <span className={cn("relative ml-2 h-5 w-9 rounded-full transition-colors", encryptionEnabled ? "bg-indigo-600" : "bg-neutral-300")}>
                    <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", encryptionEnabled ? "left-4" : "left-0.5")} />
                  </span>
                </button>
              </div>
              {encryptionEnabled && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">Encryption password</label>
                    <input
                      type="password"
                      value={encryptionPassword}
                      onChange={(e) => setEncryptionPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">Confirm password</label>
                    <input
                      type="password"
                      value={encryptionConfirm}
                      onChange={(e) => setEncryptionConfirm(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <p className="col-span-full text-xs text-amber-600">⚠ Keep this password safe — it cannot be recovered. If lost, encrypted cards become unreadable.</p>
                </div>
              )}
            </div>

            {!isPaid && (
              <div className="mt-4 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                You&apos;re on the free plan. <Link href="/plans" className="font-medium text-indigo-600 hover:underline">Upgrade</Link> to unlock unlimited columns, private retros, moderation, data retention, and encryption.
              </div>
            )}
          </section>

          {/* Columns */}
          <section className="mb-10 rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Columns</h2>
                {!columnsUnlimited && (
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {columns.length} of {maxColumns} columns used on the free plan.{" "}
                    <Link href="/plans" className="font-medium text-indigo-600 hover:underline">
                      Upgrade
                    </Link>{" "}
                    for unlimited columns.
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={addColumn}
                disabled={atColumnLimit}
                title={atColumnLimit ? `The free plan is limited to ${maxColumns} columns.` : undefined}
              >
                + Add column
              </Button>
            </div>
            <div className="space-y-3">
              {columns.map((c, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveColumn(i, -1)}
                      disabled={i === 0}
                      className="rounded p-1 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"
                      aria-label="Move up"
                    >▲</button>
                    <button
                      onClick={() => moveColumn(i, 1)}
                      disabled={i === columns.length - 1}
                      className="rounded p-1 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"
                      aria-label="Move down"
                    >▼</button>
                  </div>
                  <input
                    value={c.color}
                    onChange={(e) => updateColumn(i, { color: e.target.value })}
                    type="color"
                    className="h-10 w-10 flex-shrink-0 cursor-pointer rounded border border-neutral-300 bg-white p-0.5"
                  />
                  <input
                    value={c.name}
                    onChange={(e) => updateColumn(i, { name: e.target.value })}
                    placeholder="Column name"
                    className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <input
                    value={c.description}
                    onChange={(e) => updateColumn(i, { description: e.target.value })}
                    placeholder="Description (optional)"
                    className="flex-[2] rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <button
                    onClick={() => removeColumn(i)}
                    className="rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >Remove</button>
                </div>
              ))}
            </div>
          </section>

          {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
            <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">Cancel</Link>
            <Button size="lg" onClick={handleCreate} disabled={loading || !title.trim()}>
              {loading ? "Creating…" : "Create retro →"}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
