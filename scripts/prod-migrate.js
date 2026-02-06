import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { Database } from 'bun:sqlite';
import path from 'path';
import fs from 'fs';

// Get DB path from environment or default
const dbFileName = process.env.DB_FILENAME || 'miniblog.db';
const dbPath = path.resolve(process.cwd(), dbFileName);

console.log('[Migration] Starting...');
console.log(`[Migration] Database Path: ${dbPath}`);

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    console.log(`[Migration] Creating directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
}

try {
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite);

    // Path to migrations folder
    const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
    
    console.log(`[Migration] Reading migrations from: ${migrationsFolder}`);

    migrate(db, { migrationsFolder });

    console.log('[Migration] Successfully applied migrations.');
    sqlite.close();
} catch (e) {
    console.error('[Migration] Failed to migrate database.');
    console.error(e);
    process.exit(1);
}