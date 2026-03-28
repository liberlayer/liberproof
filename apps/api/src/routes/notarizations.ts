/**
 * Notarization routes
 *
 * POST /notarizations                   Create
 * GET  /notarizations                   List (auth)
 * GET  /notarizations/:id               Get by ID (public)
 * GET  /notarizations/hash/:h           Lookup by file hash (public)
 * POST /notarizations/:id/anchor        Record an on-chain anchor
 */
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { randomBytes, bytesToHex } from "@noble/hashes/utils";
import { getDb } from "../db/index.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const notarizationsRouter = new Hono();

const createBody = z.object({
  documentHash: z.string().length(64),
  mimeType: z.string(),
  label: z.string().optional(),
  proofJson: z.string(),
});

const anchorBody = z.object({
  chain: z.string().min(1),
  txHash: z.string().min(10),
  blockNumber: z.number().optional(),
});

// Create
notarizationsRouter.post("/", requireAuth, zValidator("json", createBody), (c) => {
  const { documentHash, mimeType, label, proofJson } = c.req.valid("json");
  const owner = c.get("walletAddress") as string;
  const id = `urn:liberproof:notarization:${bytesToHex(randomBytes(16))}`;
  const db = getDb();

  db.prepare(
    "INSERT INTO notarizations (id, owner_id, document_hash, mime_type, label, proof_json) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, owner, documentHash, mimeType, label ?? null, proofJson);

  const row = db.prepare("SELECT * FROM notarizations WHERE id = ?").get(id) as Record<string, unknown>;
  return c.json(formatNotarization(row), 201);
});

// List (auth)
notarizationsRouter.get("/", requireAuth, (c) => {
  const owner = c.get("walletAddress") as string;
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50"), 100);
  const offset = parseInt(c.req.query("offset") ?? "0");
  const db = getDb();
  const rows = db.prepare(
    "SELECT * FROM notarizations WHERE owner_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ).all(owner, limit, offset) as Record<string, unknown>[];
  const total = (db.prepare("SELECT COUNT(*) as n FROM notarizations WHERE owner_id = ?").get(owner) as { n: number }).n;
  return c.json({ items: rows.map(formatNotarization), total, limit, offset });
});

// Get by ID (public)
notarizationsRouter.get("/:id", (c) => {
  const db = getDb();
  const row = db.prepare("SELECT * FROM notarizations WHERE id = ?").get(
    decodeURIComponent(c.req.param("id"))
  ) as Record<string, unknown> | undefined;
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(formatNotarization(row));
});

// Lookup by document hash (public)
notarizationsRouter.get("/hash/:hash", (c) => {
  const db = getDb();
  const rows = db.prepare(
    "SELECT * FROM notarizations WHERE document_hash = ? ORDER BY created_at DESC"
  ).all(c.req.param("hash")) as Record<string, unknown>[];
  return c.json(rows.map(formatNotarization));
});

// Record anchor — auth required, must be owner
notarizationsRouter.post("/:id/anchor", requireAuth, zValidator("json", anchorBody), (c) => {
  const owner = c.get("walletAddress") as string;
  const id = decodeURIComponent(c.req.param("id"));
  const { chain, txHash, blockNumber } = c.req.valid("json");
  const db = getDb();

  const row = db.prepare("SELECT owner_id, anchor_json FROM notarizations WHERE id = ?").get(id) as
    | { owner_id: string; anchor_json: string | null } | undefined;

  if (!row) return c.json({ error: "Not found" }, 404);
  if (row.owner_id !== owner) return c.json({ error: "Forbidden" }, 403);
  if (row.anchor_json) return c.json({ error: "Already anchored" }, 409);

  const anchor = {
    chain,
    txHash,
    blockNumber: blockNumber ?? null,
    anchoredAt: new Date().toISOString(),
  };

  db.prepare("UPDATE notarizations SET anchor_json = ? WHERE id = ?").run(
    JSON.stringify(anchor), id
  );

  const updated = db.prepare("SELECT * FROM notarizations WHERE id = ?").get(id) as Record<string, unknown>;
  return c.json(formatNotarization(updated));
});

function formatNotarization(row: Record<string, unknown>) {
  return {
    id: row["id"],
    ownerId: row["owner_id"],
    documentHash: row["document_hash"],
    mimeType: row["mime_type"],
    label: row["label"],
    proof: JSON.parse(row["proof_json"] as string),
    anchor: row["anchor_json"] ? JSON.parse(row["anchor_json"] as string) : null,
    createdAt: row["created_at"],
  };
}
