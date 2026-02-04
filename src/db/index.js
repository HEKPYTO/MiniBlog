import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
const dbFileName =
    process.env.DB_FILENAME ||
    (process.env.NODE_ENV === 'development' ? 'miniblog.dev.db' : 'miniblog.db');
const dbPath = path.resolve(process.cwd(), dbFileName);
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
