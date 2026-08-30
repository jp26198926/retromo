"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PlanCard } from "@/components/PlanCard";
import { useAppSettings } from "@/components/useAppSettings";

export default function PlansPage() {
  const { settings, loaded } = useAppSettings();

  const individualPrice = `$${settings.individualPrice}`;
  const companyPrice = `$${settings.companyPrice}`;

  const plans = [
    {
      name: "Anonymous",
      tagline: "Quick, throw-away retros",
      price: "Free",
      period: "forever",
      features: [
        "Quick and easy to start — no account needed",
        "Up to 3 columns per retrospective",
        "Unlimited cards and action points",
        `Up to ${settings.anonymousParticipantLimit} participants per retro`,
        "Basic facilitation tools",
        "Stored for 12 months (fixed retention)",
      ],
      planKey: "anonymous" as const,
      amount: "0",
      highlight: false,
    },
    {
      name: "Individual",
      tagline: "For team-focused professionals",
      price: loaded ? individualPrice : "$10",
      period: "per month",
      features: [
        "Everything from Anonymous, and:",
        "Unlimited columns per retrospective",
        "Data export to Markdown",
        "Private, invite-only retrospectives",
        "Card moderation — approve or reject before they go public",
        "Advanced facilitation tools (secret voting, timer)",
        "Extended retro customization",
        "Manage up to 3 teams",
        "Infinite archive — archive and restore any retro",
        "Configurable data retention (30 / 90 / 180 / 365 days or forever)",
        "High priority support",
      ],
      planKey: "individual" as const,
      amount: settings.individualPrice,
      highlight: true,
    },
    {
      name: "Company",
      tagline: "For companies of all sizes",
      price: loaded ? companyPrice : "$20",
      period: "per month",
      features: [
        "Everything from Individual, and:",
        "Manage unlimited teams in your company",
        "Assign any number of teams to Scrum Masters and Team Leads",
        "Zero-knowledge encryption with custom passwords",
        "Card content encrypted in your browser — we never see your password",
        "Top priority support",
      ],
      planKey: "company" as const,
      amount: settings.companyPrice,
      highlight: false,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            Find the perfect plan for you
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
            You can stay anonymous if this is your jam, but you should try our
            paid plans to get even more goodies!
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <PlanCard key={p.name} {...p} />
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-neutral-500">
            Pay securely with PayPal. Recurring monthly — cancel anytime.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
