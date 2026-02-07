import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import path from 'path';
import fs from 'fs';

const dbFileName = process.env.DB_FILENAME || 'miniblog.db';
const dbPath = path.resolve(process.cwd(), dbFileName);

console.log('[Migration] Starting...');
console.log(`[Migration] Database Path: ${dbPath}`);

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    console.log(`[Migration] Creating directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
}

if (!fs.existsSync(dbPath)) {
    console.log(`[Migration] Creating database file: ${dbPath}`);
    try {
        fs.writeFileSync(dbPath, '');
    } catch (e) {
        console.error(
            `[Migration] Failed to create database file at ${dbPath}. Check directory permissions.`,
        );
        throw e;
    }
}

try {
    const db = drizzle({ connection: { url: 'file:' + dbPath } });

    const migrationsFolder = path.resolve(process.cwd(), 'drizzle');

    console.log(`[Migration] Reading migrations from: ${migrationsFolder}`);

    migrate(db, { migrationsFolder });

    console.log('[Migration] Successfully applied migrations.');
} catch (e) {
    console.error('[Migration] Failed to migrate database.');
    console.error(e);
    process.exit(1);
}
