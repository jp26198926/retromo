import { db } from "@/db";
import { templates } from "@/db/schema";
import { BUILTIN_TEMPLATES } from "@/lib/templates";

async function main() {
  for (const t of BUILTIN_TEMPLATES) {
    await db
      .insert(templates)
      .values({
        id: t.id,
        name: t.name,
        description: t.description,
        emoji: t.emoji,
        columns: t.columns as any,
        isBuiltIn: true,
      })
      .onConflictDoNothing();
  }
  console.log("Seeded templates");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
