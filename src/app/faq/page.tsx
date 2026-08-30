import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = { title: "FAQ | RetroMo" };

const faqs = [
  { q: "What is RetroMo?", a: "RetroMo is a free-to-use online team retrospectives tool. It was built so remote and hybrid teams could hold engaging retrospectives with no friction — just share a link and start." },
  { q: "Do I need an account to run a retro?", a: "No. You can create a free, anonymous retro with no signup. Every board has a unique, secure URL you can send to your team. Accounts unlock teams, archives, and advanced facilitation." },
  { q: "How long are anonymous retros stored?", a: "Anonymous retros are stored for up to 12 months. Paid plans offer configurable data retention times and an infinite retrospective archive." },
  { q: "What templates are available?", a: "We ship Mad | Sad | Glad, Liked | Learned | Lacked, and Start | Stop | Continue, plus a blank slate. Every built-in template uses three columns, so they all work on the free plan. Templates aren't set in stone — you can adjust column names, descriptions, and order." },
  { q: "How does the private section work?", a: "Each participant has their own Private Section in every column where only they can see what they wrote. They decide what to drag to the Public Section above for everyone to see." },
  { q: "Can I limit voting?", a: "Yes. You can limit how many votes a participant has for the whole retro, in a single column, and on a single card. Secret voting hides results until you disable it." },
  { q: "What are action points?", a: "Action items are the most important product of a retrospective. Create them in the action points panel, assign a responsible teammate, and set a due date to help finish them." },
  { q: "What's the difference between plans?", a: "Anonymous is free forever with core features, but is capped at 3 columns per retro and has no Markdown export. Personal ($10/team/mo) adds unlimited columns, Markdown export, private retros, card moderation, advanced facilitation, customization, up to 3 teams, archiving, and configurable data retention. Company ($20/team/mo) adds unlimited teams, Scrum Master and Team Lead role assignment, and zero-knowledge encryption with custom passwords." },
  { q: "Is there a limit on the free plan?", a: "Anonymous (free) retros are limited to 3 columns per retrospective. Cards and action points are unlimited on every plan. Upgrade to Personal or Company to build boards with as many columns as you like." },
  { q: "Can I export my data?", a: "Data export to Markdown is available on the Personal and Company plans. The free Anonymous plan does not include export." },
  { q: "Is my data secure?", a: "Paid plans offer regular, private, and encrypted ad-hoc retrospectives for top-tier security, including zero-knowledge encryption with custom passwords on the Company plan." },
  { q: "How does card moderation work?", a: "When moderation is on, cards are reviewed at the moment they're published to the shared board — not while you're writing them. Anything you keep in your own private section stays visible to you and never enters the queue. Once a participant shares a card, it waits for approval and shows a 'Pending review' badge to its author until a facilitator approves it. The host and facilitators are exempt: their cards go straight to the board, since they're the ones running the review. Turning moderation off releases anything still waiting." },
  { q: "How do I update my profile or change my password?", a: "Open the Profile page from the avatar button in the navbar (or the Profile link in the mobile menu). There you can change your display name and avatar image, review your plan and activity, and set a new password by entering your current one. You can also sign out every other device at the same time. If you signed up with Google or GitHub you don't have a password on this site, so password changes are handled by that provider instead." },
  { q: "What does the 'Private retrospective' option do?", a: "A private retro requires everyone to sign in with an account before they can open or join the board. Sharing the link isn't enough on its own — anonymous visitors are turned away and prompted to sign in first. It's available on the Personal and Company plans." },
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
