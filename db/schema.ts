import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type SourceCategory =
  | "official"
  | "listing"
  | "business_data"
  | "reviews"
  | "research"
  | "news";
export type SourceCheck = "reliable" | "verify";
export type RunStatus = "pending" | "running" | "done" | "failed";
// "reference": the fact is written in another section (seeSection); no source here.
export type CardItemStatus = "established" | "not_established" | "not_applicable" | "reference";

export const niches = pgTable("niches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // Free-text "Niche questions" (BRIEF card section 11).
  nicheQuestions: text("niche_questions").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  nicheId: integer("niche_id")
    .notNull()
    .references(() => niches.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // "product" (one company / product) or "topic" (a solution or topic, no single domain).
  kind: text("kind").$type<"product" | "topic">().notNull().default("product"),
  // Exactly what the user typed (URL, domain, name or messy link; the topic name for topics).
  input: text("input").notNull().default(""),
  // Official URL resolved from the input; null until resolved.
  mainUrl: text("main_url"),
  // How the input was resolved: domain, reason, other candidates (see lib/research/resolve.ts).
  resolution: jsonb("resolution"),
  extraUrls: text("extra_urls").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const runs = pgTable("runs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  status: text("status").$type<RunStatus>().notNull().default("pending"),
  pageCount: integer("page_count").notNull().default(0),
  modelCalls: integer("model_calls").notNull().default(0),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  // Estimated cost in USD (AI Gateway usage).
  costUsd: doublePrecision("cost_usd").notNull().default(0),
  // Run log: search queries, URLs read, skipped sources, errors (BRIEF "Run log").
  log: jsonb("log"),
  error: text("error"),
  workflowRunId: text("workflow_run_id"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// All sources of a product together form that product's context.
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  runId: integer("run_id").references(() => runs.id, { onDelete: "set null" }),
  // Number n in [Sn], unique within a run.
  ref: integer("ref"),
  url: text("url").notNull(),
  title: text("title"),
  category: text("category").$type<SourceCategory>().notNull(),
  check: text("check").$type<SourceCheck>().notNull(),
  dateRead: timestamp("date_read", { withTimezone: true }).notNull().defaultNow(),
  // Text, because pages may show "not shown" or relative dates.
  datePublished: text("date_published").notNull().default("not shown"),
  addedByUser: boolean("added_by_user").notNull().default(false),
  fullText: text("full_text"),
  // false = read but not used for the card (namesake, listicle, empty page...).
  relevant: boolean("relevant").notNull().default(true),
  note: text("note"),
});

export const cardItems = pgTable("card_items", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  runId: integer("run_id").references(() => runs.id, { onDelete: "cascade" }),
  section: text("section").notNull(),
  // Short field label inside the section, e.g. "Founding year".
  field: text("field"),
  value: text("value").notNull(),
  quote: text("quote"),
  sourceId: integer("source_id").references(() => sources.id, { onDelete: "set null" }),
  status: text("status").$type<CardItemStatus>().notNull().default("established"),
  // Reason for "not_established" / "not_applicable".
  reason: text("reason"),
  companyClaim: boolean("company_claim").notNull().default(false),
  // false when the quote was not found verbatim in the source text.
  quoteVerified: boolean("quote_verified").notNull().default(true),
  // For status "reference": the section key that holds the fact.
  seeSection: text("see_section"),
});
