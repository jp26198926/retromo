import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = { title: "FAQ | RetroMo" };

const faqs = [
  { q: "What is RetroMo?", a: "RetroMo is a free-to-use online team retrospectives tool. It was built so remote and hybrid teams could hold engaging retrospectives with no friction — just share a link and start." },
  { q: "Do I need an account to run a retro?", a: "No. You can create a free, anonymous retro with no signup. Every board has a unique, secure URL you can send to your team. Accounts unlock teams, archives, and advanced facilitation." },
  { q: "How long are anonymous retros stored?", a: "Anonymous retros are stored for up to 12 months. Paid plans offer configurable data retention times and an infinite retrospective archive." },
  { q: "What templates are available?", a: "We ship Mad | Sad | Glad, Liked | Learned | Lacked, and Start | Stop | Continue, plus a blank slate. Templates aren't set in stone — you can adjust column names, descriptions, and order." },
  { q: "How does the private section work?", a: "Each participant has their own Private Section in every column where only they can see what they wrote. They decide what to drag to the Public Section above for everyone to see." },
  { q: "Can I limit voting?", a: "Yes. You can limit how many votes a participant has for the whole retro, in a single column, and on a single card. Secret voting hides results until you disable it." },
  { q: "What are action points?", a: "Action items are the most important product of a retrospective. Create them in the action points panel, assign a responsible teammate, and set a due date to help finish them." },
  { q: "What's the difference between plans?", a: "Anonymous is free forever with core features. Individual ($10/team/mo) adds advanced facilitation, customization, teams, archives, and private retros. Company ($20/team/mo) adds unlimited teams, team assignment, and zero-knowledge encryption." },
  { q: "Can I export my data?", a: "Yes. All plans support data export to Markdown." },
  { q: "Is my data secure?", a: "Paid plans offer regular, private invite-only, and encrypted ad-hoc retrospectives for top-tier security, including zero-knowledge encryption with custom passwords on the Company plan." },
];

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl text-center">
            Frequently asked questions
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-neutral-600">
            Here's a list of frequent questions we get asked.
          </p>

          <div className="mt-12 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
            {faqs.map((f) => (
              <details key={f.q} className="group p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-neutral-900">
                  {f.q}
                  <svg className="h-5 w-5 flex-shrink-0 text-neutral-400 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z" clipRule="evenodd" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
