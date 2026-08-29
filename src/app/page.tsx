import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { MessageUs } from "@/components/MessageUs";

const coreFeatures = [
  {
    emoji: "🗂️",
    title: "Ready to use templates",
    desc: "Jump-start your meeting with Mad | Sad | Glad, Liked | Learned | Lacked, or Start | Stop | Continue.",
  },
  {
    emoji: "📝",
    title: "Like post-its on a whiteboard",
    desc: "Every participant has a Private Section. Drag ideas to the Public Section when you're ready to share.",
  },
  {
    emoji: " dot",
    title: "Dot voting",
    desc: "Prioritize the most relevant topics. Secret voting keeps results hidden until you reveal them.",
  },
  {
    emoji: "✅",
    title: "Action points",
    desc: "Turn insights into improvements. Assign a responsible teammate and set a due date.",
  },
  {
    emoji: "⏱️",
    title: "Built-in timer",
    desc: "Fit your retro into the meeting. Timebox idea generation, voting and action points.",
  },
  {
    emoji: "🔗",
    title: "Unique link to share",
    desc: "Every board has a secure URL. No login or popups — just send the link and start.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, rgba(99,102,241,0.18) 0%, rgba(255,255,255,0) 70%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Over 1,000K retros created by our users
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                Go back in time to <span className="text-indigo-600">improve the future</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 sm:text-xl">
                Try the easiest to use tool for running engaging online retrospectives for your remote or hybrid teams.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/new-retrospective">
                  <Button size="lg" className="w-full sm:w-auto">
                    Create free, anonymous retro
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-neutral-500">No credit card required · Free forever plan</p>
            </div>
          </div>
        </section>

        {/* Workflow steps */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              We'll get you there in no time
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              Set things up the way you want them and get people in before you can say &quot;It doesn't get easier than this.&quot;
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { step: "1", title: "Pick a template", desc: "Choose a ready-to-use template or start from a clean slate. You're no more than 3 clicks away." },
              { step: "2", title: "Share the link", desc: "Every board has a unique, secure URL. Send it to your team — no login or popups to distract them." },
              { step: "3", title: "Run your retro", desc: "Collect ideas in private sections, drag to public, vote, discuss, and capture action points." },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">{s.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Core features grid */}
        <section className="border-y border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                No limits to how you run a retro
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Create as many columns, cards and action points as you need. Invite every participant that counts.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {coreFeatures.map((f) => (
                <div key={f.title} className="rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-md">
                  <div className="mb-3 text-2xl">{f.emoji === " dot" ? "⚪" : f.emoji}</div>
                  <h3 className="text-lg font-semibold text-neutral-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-neutral-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Message Us */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-16 text-white sm:px-12">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">Message Us</h2>
              <p className="mx-auto mt-4 max-w-xl text-indigo-100">
                Have a question, suggestion, or just want to say hello? Send us a message and we'll get back to you.
              </p>
            </div>
            <div className="mx-auto mt-10 max-w-xl">
              <MessageUs />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
