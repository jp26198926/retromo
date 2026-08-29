"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { useAdmin } from "@/components/useAdmin";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

// ---------- Types ----------
type Settings = {
  appName: string;
  appDescription: string;
  appIconUrl: string | null;
  faviconUrl: string | null;
  individualPrice: string;
  companyPrice: string;
  anonymousParticipantLimit: number;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionCurrentPeriodEnd: string | null;
  subscriptionCancelledAt: string | null;
  createdAt: string;
};

type Transaction = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  plan: string;
  amount: string;
  currency: string;
  status: string;
  type: string;
  previousPlan: string | null;
  description: string | null;
  paypalOrderId: string | null;
  createdAt: string;
};

type Reports = {
  users: { total: number; activeSubs: number; cancelledSubs: number; byPlan: { individual: number; company: number } };
  revenue: { total: string; thisMonth: string; totalTransactions: number };
  content: { totalRetros: number; activeRetros: number; totalTeams: number; totalCards: number; totalActionPoints: number };
};

type Tab = "overview" | "settings" | "users" | "billing";

export default function AdminPage() {
  const { isAdmin, loaded: adminLoaded } = useAdmin();
  const { data: sessionData, isPending } = useSession();
  const [tab, setTab] = useState<Tab>("overview");

  if (isPending || !adminLoaded) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-neutral-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!sessionData?.session || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Admin access required</h1>
          <p className="max-w-md text-neutral-600">
            You must be signed in as an administrator to view this page. The admin user is
            defined by the <code className="rounded bg-neutral-100 px-1">ADMIN_EMAIL</code> environment
            variable or by having the <code className="rounded bg-neutral-100 px-1">admin</code> role in
            the database.
          </p>
          <a href="/sign-in"><Button>Sign in</Button></a>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
          <p className="mt-2 text-neutral-600">Manage application settings, users, plans, billing and reports.</p>

          {/* Tabs */}
          <div className="mt-6 flex flex-wrap gap-2 border-b border-neutral-200">
            {([
              ["overview", "Overview & Reports"],
              ["settings", "Application Settings"],
              ["users", "Users"],
              ["billing", "Billing"],
            ] as [Tab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  tab === key
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {tab === "overview" && <OverviewTab />}
            {tab === "settings" && <SettingsTab />}
            {tab === "users" && <UsersTab />}
            {tab === "billing" && <BillingTab />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ============== OVERVIEW / REPORTS ==============
function OverviewTab() {
  const [reports, setReports] = useState<Reports | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then(async (r) => {
        const d = await r.json();
        // Only set reports if the response has the expected shape
        if (d && d.users && d.revenue && d.content) {
          setReports(d);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-neutral-500">Loading reports…</p>;
  if (!reports) return <p className="text-red-600">Failed to load reports. Please try again later.</p>;

  const statCards = [
    { label: "Total Users", value: reports.users?.total ?? 0, color: "bg-indigo-50 text-indigo-700" },
    { label: "Active Subscriptions", value: reports.users?.activeSubs ?? 0, color: "bg-green-50 text-green-700" },
    { label: "Cancelled Subscriptions", value: reports.users?.cancelledSubs ?? 0, color: "bg-amber-50 text-amber-700" },
    { label: "Total Retros", value: reports.content?.totalRetros ?? 0, color: "bg-violet-50 text-violet-700" },
    { label: "Active Retros", value: reports.content?.activeRetros ?? 0, color: "bg-blue-50 text-blue-700" },
    { label: "Total Teams", value: reports.content?.totalTeams ?? 0, color: "bg-pink-50 text-pink-700" },
    { label: "Total Cards", value: reports.content?.totalCards ?? 0, color: "bg-teal-50 text-teal-700" },
    { label: "Action Points", value: reports.content?.totalActionPoints ?? 0, color: "bg-orange-50 text-orange-700" },
  ];

  return (
    <div className="space-y-8">
      {/* Revenue */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Total Revenue</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">
            {reports.revenue?.total === "0.00" ? "$0.00" : `$${reports.revenue?.total || "0.00"}`}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Revenue This Month</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">
            {reports.revenue?.thisMonth === "0.00" ? "$0.00" : `$${reports.revenue?.thisMonth || "0.00"}`}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Total Transactions</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">{reports.revenue?.totalTransactions ?? 0}</p>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className={cn("rounded-2xl border border-neutral-200 p-6", s.color)}>
            <p className="text-sm font-medium opacity-80">{s.label}</p>
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">Active Subscribers by Plan</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Individual Plan</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">{reports.users?.byPlan?.individual ?? 0}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Company Plan</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">{reports.users?.byPlan?.company ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== SETTINGS ==============
function SettingsTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d);
        setForm(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSettings(data);
      setForm(data);
      setMsg("Settings saved successfully.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(file: File, type: "icon" | "favicon") {
    const setter = type === "icon" ? setUploadingIcon : setUploadingFavicon;
    setter(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setSettings((s) => (s ? { ...s, [type === "icon" ? "appIconUrl" : "faviconUrl"]: data.url } : s));
      setForm((f) => (f ? { ...f, [type === "icon" ? "appIconUrl" : "faviconUrl"]: data.url } : f));
      setMsg(`${type === "icon" ? "App icon" : "Favicon"} uploaded.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setter(false);
    }
  }

  if (!form) return <p className="text-neutral-500">Loading settings…</p>;

  return (
    <div className="space-y-6">
      {msg && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          {msg}
        </div>
      )}

      {/* App identity */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">Application Identity</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">App Name</label>
            <input
              value={form.appName}
              onChange={(e) => setForm({ ...form, appName: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">App Description</label>
            <input
              value={form.appDescription}
              onChange={(e) => setForm({ ...form, appDescription: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>
      </div>

      {/* App icon & favicon */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">App Icon & Favicon</h3>
        <p className="mt-1 text-sm text-neutral-500">Upload a PNG, JPEG, GIF, WEBP, ICO or SVG (max 2 MB).</p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">App Icon</label>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                {form.appIconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.appIconUrl} alt="App icon" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-neutral-400">None</span>
                )}
              </div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                  {uploadingIcon ? "Uploading…" : "Upload icon"}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/x-icon"
                  className="hidden"
                  disabled={uploadingIcon}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f, "icon");
                  }}
                />
              </label>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Favicon</label>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                {form.faviconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.faviconUrl} alt="Favicon" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-neutral-400">None</span>
                )}
              </div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                  {uploadingFavicon ? "Uploading…" : "Upload favicon"}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/x-icon"
                  className="hidden"
                  disabled={uploadingFavicon}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f, "favicon");
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Plan pricing & limits */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">Plan Pricing & Limits</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Individual Price ($/mo)</label>
            <input
              value={form.individualPrice}
              onChange={(e) => setForm({ ...form, individualPrice: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Company Price ($/mo)</label>
            <input
              value={form.companyPrice}
              onChange={(e) => setForm({ ...form, companyPrice: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Anonymous Participant Limit</label>
            <input
              type="number"
              min={1}
              value={form.anonymousParticipantLimit}
              onChange={(e) => setForm({ ...form, anonymousParticipantLimit: Number(e.target.value) })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          The Anonymous Participant Limit caps how many participants can join a free-plan retrospective.
          Prices are used for PayPal checkout and the plans page.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}

// ============== USERS ==============
function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<{ role: string; plan: string; status: string }>({ role: "", plan: "", status: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const limit = 50;

  function load(p: number) {
    setLoading(true);
    fetch(`/api/admin/users?page=${p}&limit=${limit}`)
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users || []);
        setTotal(d.total || 0);
        setPage(d.page || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(1);
  }, []);

  function startEdit(u: AdminUser) {
    setEditing(u);
    setEditForm({ role: u.role, plan: u.subscriptionPlan, status: u.subscriptionStatus });
    setMsg(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editing.id, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setMsg(`Updated ${editing.email}.`);
      setEditing(null);
      load(page);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      {msg && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">{msg}</div>
      )}

      {loading ? (
        <p className="text-neutral-500">Loading users…</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-900">{u.name}</td>
                    <td className="px-4 py-3 text-neutral-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        u.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-neutral-100 text-neutral-600"
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-700 capitalize">{u.subscriptionPlan}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        u.subscriptionStatus === "active" ? "bg-green-100 text-green-700" :
                        u.subscriptionStatus === "cancelled" ? "bg-amber-100 text-amber-700" :
                        "bg-neutral-100 text-neutral-600"
                      )}>
                        {u.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => startEdit(u)}>Edit</Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">{total} total users</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => load(page - 1)}>Previous</Button>
                <span className="flex items-center px-3 text-sm text-neutral-600">Page {page} of {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => load(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-neutral-900">Edit User</h3>
            <p className="mt-1 text-sm text-neutral-500">{editing.name} &lt;{editing.email}&gt;</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Subscription Plan</label>
                <select
                  value={editForm.plan}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="anonymous">anonymous</option>
                  <option value="individual">individual</option>
                  <option value="company">company</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Subscription Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="none">none</option>
                  <option value="active">active</option>
                  <option value="cancelled">cancelled</option>
                  <option value="past_due">past_due</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== BILLING ==============
function BillingTab() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 100;

  function load(p: number) {
    setLoading(true);
    fetch(`/api/admin/billing?page=${p}&limit=${limit}`)
      .then((r) => r.json())
      .then((d) => {
        setTxns(d.transactions || []);
        setTotal(d.total || 0);
        setPage(d.page || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-neutral-500">Loading billing transactions…</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{t.userEmail || t.userId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-neutral-600">{t.description || t.type}</td>
                    <td className="px-4 py-3 text-neutral-600 capitalize">{t.type?.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-neutral-700 capitalize">{t.plan}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      {t.currency === "USD" ? "$" : ""}{t.amount}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        t.status === "completed" ? "bg-green-100 text-green-700" :
                        t.status === "cancelled" ? "bg-amber-100 text-amber-700" :
                        t.status === "failed" ? "bg-red-100 text-red-700" :
                        "bg-neutral-100 text-neutral-600"
                      )}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {txns.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-500">No billing transactions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">{total} total transactions</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => load(page - 1)}>Previous</Button>
                <span className="flex items-center px-3 text-sm text-neutral-600">Page {page} of {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => load(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
