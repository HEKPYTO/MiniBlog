import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';

const dbFileName =
    process.env.DB_FILENAME ||
    (process.env.NODE_ENV === 'development' ? 'miniblog.dev.db' : 'miniblog.db');
const dbPath = path.resolve(process.cwd(), dbFileName);
export const db = drizzle({ connection: { url: 'file:' + dbPath }, schema });
