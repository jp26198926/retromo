"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { useSession, changePassword } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/** Matches the minimum enforced by the sign-up form and better-auth. */
const MIN_PASSWORD_LENGTH = 8;

type ProfileData = {
  profile: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    emailVerified: boolean;
    role: string;
    createdAt: string;
  };
  auth: {
    hasPassword: boolean;
    providers: string[];
  };
  plan: {
    effectivePlan: string;
    status: string;
    isActive: boolean;
    isAdminOverride: boolean;
    currentPeriodEnd: string | null;
  };
  isAdmin: boolean;
  stats: {
    retrosCreated: number;
    retrosJoined: number;
    teams: number;
  };
};

const planLabel = (plan: string) =>
  plan === "individual" ? "Individual" : plan === "company" ? "Company" : "Anonymous";

const planBadge = (plan: string) =>
  plan === "individual"
    ? "bg-indigo-100 text-indigo-700"
    : plan === "company"
    ? "bg-purple-100 text-purple-700"
    : "bg-neutral-100 text-neutral-600";

const providerLabel = (id: string) =>
  id === "google" ? "Google" : id === "github" ? "GitHub" : id;

/** Simple strength meter so people get feedback while typing a new password. */
function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= MIN_PASSWORD_LENGTH) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
  if (score === 3) return { score, label: "Fair", color: "bg-amber-500" };
  if (score === 4) return { score, label: "Good", color: "bg-lime-500" };
  return { score, label: "Strong", color: "bg-green-600" };
}

export default function ProfilePage() {
  const { data: sessionData, isPending } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- profile form state ---
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // --- password form state ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOthers, setRevokeOthers] = useState(true);
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        setData(null);
        return;
      }
      const d: ProfileData = await res.json();
      setData(d);
      setName(d.profile.name ?? "");
      setImage(d.profile.image ?? "");
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (sessionData?.user) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [isPending, sessionData?.user, loadProfile]);

  const strength = useMemo(() => passwordStrength(newPassword), [newPassword]);

  // The save button stays disabled until something actually changed.
  const profileDirty =
    !!data &&
    (name.trim() !== (data.profile.name ?? "") || image.trim() !== (data.profile.image ?? ""));

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profileDirty) return;
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), image: image.trim() }),
      });
      const d = await res.json();
      if (!res.ok) {
        setProfileMsg({ type: "err", text: d.error || "Could not save your profile." });
      } else {
        setProfileMsg({ type: "ok", text: "Profile updated." });
        await loadProfile();
        // Refresh the navbar/session copy of the user's name
        window.dispatchEvent(new Event("visibilitychange"));
      }
    } catch {
      setProfileMsg({ type: "err", text: "Could not save your profile." });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordMsg({
        type: "err",
        text: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "err", text: "New password and confirmation do not match." });
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordMsg({ type: "err", text: "New password must be different from the current one." });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: revokeOthers,
      });
      if (res?.error) {
        setPasswordMsg({
          type: "err",
          text: res.error.message || "Could not change your password.",
        });
      } else {
        setPasswordMsg({
          type: "ok",
          text: revokeOthers
            ? "Password changed. Other devices have been signed out."
            : "Password changed.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordMsg({ type: "err", text: "Could not change your password." });
    } finally {
      setSavingPassword(false);
    }
  }

  // --- signed out ---
  if (!isPending && !sessionData?.user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Sign in to view your profile</h1>
          <p className="text-neutral-600">
            Manage your account details and password from one place.
          </p>
          <div className="flex gap-3">
            <Link href="/sign-in?callbackURL=%2Fprofile">
              <Button>Sign in</Button>
            </Link>
            <Link href="/sign-up?callbackURL=%2Fprofile">
              <Button variant="outline">Create an account</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-neutral-500">Loading your profile…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-red-600">We couldn&apos;t load your profile.</p>
          <Button variant="outline" onClick={() => { setLoading(true); loadProfile(); }}>
            Try again
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const { profile, auth, plan, stats } = data;
  const initials = (profile.name || profile.email || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const memberSince = new Date(profile.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const inputClass =
    "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-neutral-50">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">My profile</h1>
            <p className="mt-1 text-neutral-600">
              Update your personal information and manage how you sign in.
            </p>
          </div>

          {/* Summary card */}
          <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.image}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-neutral-100"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-2xl font-semibold text-white">
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-semibold text-neutral-900">{profile.name}</h2>
                <p className="truncate text-sm text-neutral-500">{profile.email}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      planBadge(plan.effectivePlan)
                    )}
                  >
                    {planLabel(plan.effectivePlan)}
                    {plan.isAdminOverride ? " (Admin)" : ""}
                  </span>
                  {data.isAdmin && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      Administrator
                    </span>
                  )}
                  {profile.emailVerified ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Email verified
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Email not verified
                    </span>
                  )}
                  {auth.providers.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600"
                    >
                      {providerLabel(p)} linked
                    </span>
                  ))}
                </div>

                <p className="mt-3 text-xs text-neutral-400">Member since {memberSince}</p>
              </div>
            </div>

            {/* Activity */}
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-5">
              <div className="text-center">
                <div className="text-2xl font-semibold text-neutral-900">{stats.retrosCreated}</div>
                <div className="text-xs text-neutral-500">Retros created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-neutral-900">{stats.retrosJoined}</div>
                <div className="text-xs text-neutral-500">Retros joined</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-neutral-900">{stats.teams}</div>
                <div className="text-xs text-neutral-500">Teams</div>
              </div>
            </div>
          </section>

          {/* Personal information */}
          <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Personal information</h2>
            <p className="mt-1 text-sm text-neutral-500">
              This is how your name appears to teammates on retro boards.
            </p>

            <form onSubmit={handleProfileSave} className="mt-5 space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-neutral-700">
                  Display name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  required
                  className={inputClass}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  readOnly
                  className={cn(inputClass, "cursor-not-allowed bg-neutral-50 text-neutral-500")}
                />
                <p className="mt-1 text-xs text-neutral-400">
                  Your email is used to sign in and can&apos;t be changed here. Contact support if
                  you need to update it.
                </p>
              </div>

              <div>
                <label htmlFor="image" className="mb-1 block text-sm font-medium text-neutral-700">
                  Avatar URL <span className="font-normal text-neutral-400">(optional)</span>
                </label>
                <input
                  id="image"
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className={inputClass}
                  placeholder="https://example.com/avatar.png"
                />
                <p className="mt-1 text-xs text-neutral-400">
                  Leave empty to use your initials instead.
                </p>
              </div>

              {profileMsg && (
                <p
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    profileMsg.type === "ok"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  )}
                >
                  {profileMsg.text}
                </p>
              )}

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={savingProfile || !profileDirty}>
                  {savingProfile ? "Saving…" : "Save changes"}
                </Button>
                {profileDirty && !savingProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setName(profile.name ?? "");
                      setImage(profile.image ?? "");
                      setProfileMsg(null);
                    }}
                    className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Password */}
          <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Password</h2>

            {auth.hasPassword ? (
              <>
                <p className="mt-1 text-sm text-neutral-500">
                  Choose a strong password you don&apos;t use anywhere else.
                </p>

                <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="mb-1 block text-sm font-medium text-neutral-700"
                    >
                      Current password
                    </label>
                    <input
                      id="currentPassword"
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className={inputClass}
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="mb-1 block text-sm font-medium text-neutral-700"
                    >
                      New password
                    </label>
                    <input
                      id="newPassword"
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={MIN_PASSWORD_LENGTH}
                      autoComplete="new-password"
                      className={inputClass}
                      placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                    />
                    {newPassword && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
                          <div
                            className={cn("h-full transition-all", strength.color)}
                            style={{ width: `${(strength.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-xs text-neutral-500">
                          {strength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-1 block text-sm font-medium text-neutral-700"
                    >
                      Confirm new password
                    </label>
                    <input
                      id="confirmPassword"
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className={cn(
                        inputClass,
                        confirmPassword &&
                          confirmPassword !== newPassword &&
                          "border-red-400 focus:border-red-500 focus:ring-red-200"
                      )}
                      placeholder="Re-enter the new password"
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
                    )}
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600">
                    <input
                      type="checkbox"
                      checked={showPasswords}
                      onChange={(e) => setShowPasswords(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Show passwords
                  </label>

                  <label className="flex cursor-pointer items-start gap-2 text-sm text-neutral-600">
                    <input
                      type="checkbox"
                      checked={revokeOthers}
                      onChange={(e) => setRevokeOthers(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      Sign out other devices
                      <span className="block text-xs text-neutral-400">
                        Recommended if you think someone else knows your password.
                      </span>
                    </span>
                  </label>

                  {passwordMsg && (
                    <p
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm",
                        passwordMsg.type === "ok"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      )}
                    >
                      {passwordMsg.text}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={
                      savingPassword || !currentPassword || !newPassword || !confirmPassword
                    }
                  >
                    {savingPassword ? "Updating…" : "Change password"}
                  </Button>
                </form>
              </>
            ) : (
              // OAuth-only accounts have no password to change.
              <div className="mt-3 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600">
                You signed up with{" "}
                <strong>
                  {auth.providers.length > 0
                    ? auth.providers.map(providerLabel).join(" and ")
                    : "a social provider"}
                </strong>
                , so there is no password on this account. Manage your credentials with your
                provider instead.
              </div>
            )}
          </section>

          {/* Subscription shortcut */}
          <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Subscription</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  You&apos;re on the{" "}
                  <span className="font-medium text-neutral-700">
                    {planLabel(plan.effectivePlan)}
                  </span>{" "}
                  plan
                  {plan.isAdminOverride
                    ? " with full admin access."
                    : plan.isActive
                    ? "."
                    : " (inactive)."}
                </p>
              </div>
              <Link href="/billing">
                <Button variant="outline">Manage billing</Button>
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
