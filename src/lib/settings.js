import { db } from '../db';
import { siteSettings } from '../db/schema';

const DEFAULTS = {
    site_name: 'Miniblog',
    site_title: 'MiniBlog',
    site_subtitle: 'A minimal blog built with Astro and SQLite.',
};

export async function getSiteSettings() {
    const rows = await db.select().from(siteSettings).all();
    const settings = { ...DEFAULTS };
    for (const row of rows) {
        if (row.key in DEFAULTS) {
            settings[row.key] = row.value;
        }
    }
    return settings;
}

export async function updateSiteSetting(key, value) {
    if (!(key in DEFAULTS)) {
        throw new Error(`Unknown setting: ${key}`);
    }
    await db
        .insert(siteSettings)
        .values({ key, value })
        .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
}
