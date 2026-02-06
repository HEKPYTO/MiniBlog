import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const dbFileName =
    process.env.DB_FILENAME ||
    (process.env.NODE_ENV === 'development' ? 'miniblog.dev.db' : 'miniblog.db');
const dbPath = path.resolve(process.cwd(), dbFileName);

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

export const db = drizzle({ connection: { url: 'file:' + dbPath }, schema });
