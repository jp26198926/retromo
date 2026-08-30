import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/Button";

export const metadata = { title: "Features | RetroMo" };

const core = [
  {
    title: "Ready to use templates",
    body: "Use our templates to jump-start your meeting: Mad | Sad | Glad, Liked | Learned | Lacked, and Start | Stop | Continue.",
  },
  {
    title: "Easily setup your retro",
    body: "Set the topic, change column names and descriptions, adjust engagement level (anonymous or require names), re-order columns, and see who joined.",
  },
  {
    title: "Familiar experience: post-its on a whiteboard",
    body: "Each participant has their own Private Section. Write on an empty card, press Enter to save, drag to the Public Section when ready. Supports emojis and card colors.",
  },
  {
    title: "Prioritize with dot voting",
    body: "Surface the most relevant topics. Sort cards by votes. Secret voting hides results until you reveal them. Limit votes per retro, per column, and per card.",
  },
  {
    title: "Action points for improvements",
    body: "Create action items in a dedicated panel, assign a responsible teammate, and set a due date — the keys to improving teamwork, product, and process.",
  },
  {
    title: "Fit the retro in a single meeting",
    body: "A built-in timer helps timebox idea generation, voting, and action points so you finish with tangible results.",
  },
];

const enhanced = [
  {
    title: "Advanced facilitation tools",
    body: "Facilitator-only moderation, ready-to-proceed checks without interrupting, and read-only lock mode.",
  },
  {
    title: "Customize your retro",
    body: "Upload custom column images, use colors to match areas, or pick from a beautiful Unsplash gallery. Apply filters like translucency or blur.",
  },
  {
    title: "Require names for better discussion",
    body: "Ask every participant for a name on entry for mature teams — deeper discussions since you can ask the author directly.",
  },
  {
    title: "Use images for cards",
    body: "Paste an image into a new card (even from Google!) or upload one from your computer. GIFs supported.",
  },
  {
    title: "Improved privacy and security",
    body: "Regular team retros, private sign-in-only retros, and encrypted ad-hoc retros for top-tier security.",
  },
];

const teams = [
  {
    title: "Build the team identity",
    body: "Give your team a name and color, visible across everything they do together in RetroMo.",
  },
  {
    title: "Learn from the past retros",
    body: "A list of past retrospectives gives perspective and helps set meaningful steps to improve.",
  },
  {
    title: "Achieve more with action points",
    body: "Visibility of team action points from retro to retro brings clarity and better focus on changes that move the team forward.",
  },
];

function Section({
  kicker,
  heading,
  items,
  cta,
}: {
  kicker: string;
  heading: string;
  items: { title: string; body: string }[];
  cta: boolean;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          {kicker}
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          {heading}
        </h2>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-neutral-900">
              {f.title}
            </h3>
            <p className="mt-2 text-sm text-neutral-600">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            Features that make you stand out
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
            Read about features RetroMo has to offer and how you can use them to
            improve your retrospectives.
          </p>
          <p className="mt-4 text-base text-neutral-700">
            No limits to how you run a retro — create as many columns, cards and
            action points as you need, and invite every participant that counts.
          </p>
        </section>
        <Section
          kicker="Core features"
          heading="Everything you need, free"
          items={core}
          cta
        />
        <div className="border-y border-neutral-200 bg-neutral-50">
          <Section
            kicker="Enhanced experience"
            heading="More power on paid plans"
            items={enhanced}
            cta
          />
        </div>
        <Section
          kicker="Manage your teams"
          heading="Continuous retros at scale"
          items={teams}
          cta
        />
      </main>
      <Footer />
    </div>
  );
}
