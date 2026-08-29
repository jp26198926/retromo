import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Plans | RetroMo" };

const plans = [
  {
    name: "Anonymous",
    tagline: "Quick, throw-away retros",
    price: "Free",
    period: "forever",
    features: [
      "Quick and easy to start",
      "Stored for up to 12 months",
      "Unlimited cards, columns and action points",
      "Unlimited participants",
      "Basic facilitation tools",
      "Data export to Markdown",
    ],
    cta: { label: "Start now", href: "/new-retrospective" },
    highlight: false,
  },
  {
    name: "Individual",
    tagline: "For team-focused professionals",
    price: "$10",
    period: "per month / team",
    features: [
      "Everything from Anonymous, and:",
      "Advanced facilitation tools",
      "Extended retro customization",
      "Manage up to 3 teams",
      "Infinite retrospective archive",
      "Configurable data retention times",
      "Private, invite-only retrospectives",
      "High priority support",
    ],
    cta: { label: "Start free 90 day trial", href: "/sign-up?plan=individual" },
    highlight: true,
  },
  {
    name: "Company",
    tagline: "For companies of all sizes",
    price: "$20",
    period: "per month / team",
    features: [
      "Everything from Individual, and:",
      "Manage unlimited teams in your company",
      "Assign any number of teams to Scrum Masters and Team Leads",
      "Zero-knowledge encryption with custom passwords",
      "Top priority support",
    ],
    cta: { label: "Start free 90 day trial", href: "/sign-up?plan=company" },
    highlight: false,
  },
];

export default function PlansPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">Find the perfect plan for you</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
            You can stay anonymous if this is your jam, but you should try our paid plans to get even more goodies!
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={cn(
                  "relative flex flex-col rounded-3xl border bg-white p-8 shadow-sm",
                  p.highlight ? "border-indigo-500 ring-2 ring-indigo-500" : "border-neutral-200"
                )}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </div>
                )}
                <h2 className="text-xl font-bold text-neutral-900">{p.name}</h2>
                <p className="mt-1 text-sm text-neutral-500">{p.tagline}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-neutral-900">{p.price}</span>
                  <span className="text-sm text-neutral-500">/ {p.period}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm text-neutral-700">
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
                      </svg>
                      <span className={i === 0 && p.name !== "Anonymous" ? "font-semibold text-neutral-900" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={p.cta.href} className="mt-8">
                  <Button className="w-full" variant={p.highlight ? "primary" : "outline"} size="lg">
                    {p.cta.label}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-neutral-500">Select monthly or yearly plan, cancel anytime.</p>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center">
            <p className="text-lg font-medium text-neutral-700">&ldquo;We must use time as a tool, not as a couch.&rdquo;</p>
            <p className="mt-2 text-sm text-neutral-500">— John F. Kennedy</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
