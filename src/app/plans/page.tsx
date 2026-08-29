import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PlanCard } from "@/components/PlanCard";

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
    planKey: "anonymous" as const,
    amount: "0",
    highlight: false,
  },
  {
    name: "Individual",
    tagline: "For team-focused professionals",
    price: "$10",
    period: "per month",
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
    planKey: "individual" as const,
    amount: "10.00",
    highlight: true,
  },
  {
    name: "Company",
    tagline: "For companies of all sizes",
    price: "$20",
    period: "per month",
    features: [
      "Everything from Individual, and:",
      "Manage unlimited teams in your company",
      "Assign any number of teams to Scrum Masters and Team Leads",
      "Zero-knowledge encryption with custom passwords",
      "Top priority support",
    ],
    planKey: "company" as const,
    amount: "20.00",
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
              <PlanCard key={p.name} {...p} />
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-neutral-500">Pay securely with PayPal. Cancel anytime.</p>
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
