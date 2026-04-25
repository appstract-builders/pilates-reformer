import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqliteUrl = process.env.DATABASE_URL ?? "file:./local.db";
const sqlitePath = sqliteUrl.startsWith("file:") ? sqliteUrl.replace("file:", "") : sqliteUrl;
const client = new Database(sqlitePath);

export const db = drizzle(client, { schema });
