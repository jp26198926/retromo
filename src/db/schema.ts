import { pgTable, text, timestamp, boolean, integer, pgEnum, uuid, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// -----------------------------
// Enums (declared early so tables can reference them)
// -----------------------------
export const planEnum = pgEnum("plan", ["anonymous", "individual", "company"]);

// -----------------------------
// better-auth tables
// -----------------------------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  // role: "user" | "admin" — admin is also defined by ADMIN_EMAIL env var
  role: text("role").notNull().default("user"),
  // subscription / billing fields
  subscriptionPlan: planEnum("subscription_plan").notNull().default("anonymous"),
  subscriptionStatus: text("subscription_status").notNull().default("none"), // none | active | cancelled | past_due
  paypalSubscriptionId: text("paypal_subscription_id"),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
  subscriptionCancelledAt: timestamp("subscription_cancelled_at"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  issuer: text("issuer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// -----------------------------
// App tables
// -----------------------------

export const teams = pgTable("team", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  ownerId: text("owner_id").references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const teamMembers = pgTable("team_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // owner | member
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const retroVisibilityEnum = pgEnum("retro_visibility", ["regular", "private"]);
export const retroEngagementEnum = pgEnum("retro_engagement", ["anonymous", "required_names"]);

export const retros = pgTable("retro", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().default("Untitled retrospective"),
  topic: text("topic"),
  visibility: retroVisibilityEnum("visibility").notNull().default("regular"),
  engagement: retroEngagementEnum("engagement").notNull().default("anonymous"),
  // voting config
  votesPerParticipant: integer("votes_per_participant").notNull().default(3),
  votesPerColumn: integer("votes_per_column").notNull().default(3),
  votesPerCard: integer("votes_per_card").notNull().default(3),
  secretVoting: boolean("secret_voting").notNull().default(true),
  // facilitation
  locked: boolean("locked").notNull().default(false),
  moderated: boolean("moderated").notNull().default(false),
  // timer (seconds, 0 = none)
  timerDuration: integer("timer_duration").notNull().default(0),
  timerEndsAt: timestamp("timer_ends_at"),
  // plan / ownership
  plan: planEnum("plan").notNull().default("anonymous"),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  ownerId: text("owner_id").references(() => user.id, { onDelete: "set null" }),
  // data retention (days), null = forever
  retentionDays: integer("retention_days"),
  // share token for anonymous access
  shareToken: text("share_token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  archived: boolean("archived").notNull().default(false),
});

export const retroParticipants = pgTable("retro_participant", {
  id: uuid("id").primaryKey().defaultRandom(),
  retroId: uuid("retro_id").notNull().references(() => retros.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  // for anonymous guests we keep a transient name/color
  displayName: text("display_name"),
  color: text("color"),
  // anonymous browser session id — used to dedup guests per browser tab/session
  anonymousSessionId: text("anonymous_session_id"),
  isFacilitator: boolean("is_facilitator").notNull().default(false),
  ready: boolean("ready").notNull().default(false),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const columns = pgTable("column", {
  id: uuid("id").primaryKey().defaultRandom(),
  retroId: uuid("retro_id").notNull().references(() => retros.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#facc15"),
  imageUrl: text("image_url"),
  imageFilter: text("image_filter").notNull().default("none"), // none | blur | translucent
  position: integer("position").notNull().default(0),
});

export const cardColorEnum = pgEnum("card_color", ["yellow", "green", "blue", "pink", "orange", "white"]);

export const cards = pgTable("card", {
  id: uuid("id").primaryKey().defaultRandom(),
  columnId: uuid("column_id").notNull().references(() => columns.id, { onDelete: "cascade" }),
  retroId: uuid("retro_id").notNull().references(() => retros.id, { onDelete: "cascade" }),
  authorId: text("author_id"), // can be null for fully anonymous
  authorName: text("author_name"),
  // For anonymous users we store the participant id so we can verify ownership
  // (the participant is deduped by anonymousSessionId per browser session)
  authorParticipantId: uuid("author_participant_id"),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  color: cardColorEnum("color").notNull().default("yellow"),
  // public = in the shared board area; private = in author's private section
  isPublic: boolean("is_public").notNull().default(false),
  position: integer("position").notNull().default(0),
  votesCount: integer("votes_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const votes = pgTable("vote", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardId: uuid("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  retroId: uuid("retro_id").notNull().references(() => retros.id, { onDelete: "cascade" }),
  voterId: text("voter_id"), // user id
  voterName: text("voter_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const actionPointStatusEnum = pgEnum("action_point_status", ["open", "done"]);

export const actionPoints = pgTable("action_point", {
  id: uuid("id").primaryKey().defaultRandom(),
  retroId: uuid("retro_id").notNull().references(() => retros.id, { onDelete: "cascade" }),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  text: text("text").notNull(),
  assigneeId: text("assignee_id").references(() => user.id, { onDelete: "set null" }),
  assigneeName: text("assignee_name"),
  dueDate: timestamp("due_date"),
  status: actionPointStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const templates = pgTable("template", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  emoji: text("emoji").notNull(),
  columns: jsonb("columns").$type<{ name: string; description?: string; color: string }[]>().notNull(),
  isBuiltIn: boolean("is_built_in").notNull().default(true),
});

// -----------------------------
// Billing history
// -----------------------------
export const billingHistory = pgTable("billing_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  paypalOrderId: text("paypal_order_id"),
  plan: planEnum("plan").notNull(),
  amount: text("amount").notNull(), // store as string to preserve decimals
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("completed"), // completed | refunded | failed | pending
  // type of transaction: subscribe | change_plan | renewal
  type: text("type").notNull().default("subscribe"),
  // if changing plans, store the previous plan
  previousPlan: planEnum("previous_plan"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// -----------------------------
// App settings (managed by admin)
// -----------------------------
export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey().default("singleton"),
  appName: text("app_name").notNull().default("RetroMo"),
  appDescription: text("app_description").notNull().default("Your online retrospective made easy"),
  // URLs to uploaded assets (stored under /public/uploads)
  appIconUrl: text("app_icon_url"),
  faviconUrl: text("favicon_url"),
  // plan pricing (admin can adjust)
  individualPrice: text("individual_price").notNull().default("10.00"),
  companyPrice: text("company_price").notNull().default("20.00"),
  anonymousParticipantLimit: integer("anonymous_participant_limit").notNull().default(50),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// -----------------------------
// Relations
// -----------------------------
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  teams: many(teamMembers),
  retros: many(retros),
}));

export const teamRelations = relations(teams, ({ many, one }) => ({
  members: many(teamMembers),
  retros: many(retros),
  owner: one(user, { fields: [teams.ownerId], references: [user.id] }),
}));

export const teamMemberRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  user: one(user, { fields: [teamMembers.userId], references: [user.id] }),
}));

export const retroRelations = relations(retros, ({ one, many }) => ({
  team: one(teams, { fields: [retros.teamId], references: [teams.id] }),
  owner: one(user, { fields: [retros.ownerId], references: [user.id] }),
  participants: many(retroParticipants),
  columns: many(columns),
  actionPoints: many(actionPoints),
}));

export const columnRelations = relations(columns, ({ one, many }) => ({
  retro: one(retros, { fields: [columns.retroId], references: [retros.id] }),
  cards: many(cards),
}));

export const cardRelations = relations(cards, ({ one, many }) => ({
  column: one(columns, { fields: [cards.columnId], references: [columns.id] }),
  retro: one(retros, { fields: [cards.retroId], references: [retros.id] }),
  votes: many(votes),
}));

export const voteRelations = relations(votes, ({ one }) => ({
  card: one(cards, { fields: [votes.cardId], references: [cards.id] }),
}));

export const actionPointRelations = relations(actionPoints, ({ one }) => ({
  retro: one(retros, { fields: [actionPoints.retroId], references: [retros.id] }),
  team: one(teams, { fields: [actionPoints.teamId], references: [teams.id] }),
}));

export const retroParticipantRelations = relations(retroParticipants, ({ one }) => ({
  retro: one(retros, { fields: [retroParticipants.retroId], references: [retros.id] }),
  user: one(user, { fields: [retroParticipants.userId], references: [user.id] }),
}));

export const billingHistoryRelations = relations(billingHistory, ({ one }) => ({
  user: one(user, { fields: [billingHistory.userId], references: [user.id] }),
}));

export type Team = typeof teams.$inferSelect;
export type Retro = typeof retros.$inferSelect;
export type Column = typeof columns.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type ActionPoint = typeof actionPoints.$inferSelect;
export type RetroParticipant = typeof retroParticipants.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type BillingHistory = typeof billingHistory.$inferSelect;
export type AppSettings = typeof appSettings.$inferSelect;
