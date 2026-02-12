import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// In Docker, script is in /app/server/scripts/
// CHANGELOG.md is in /app/
// constants.tsx is in /app/
const rootDir = path.join(__dirname, '../../'); 
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
const constantsPath = path.join(rootDir, 'constants.tsx');

async function sync() {
    try {
        console.log('🔄 Syncing changelog to database...');
        
        if (!fs.existsSync(changelogPath) || !fs.existsSync(constantsPath)) {
            console.warn('⚠️ Changelog or constants file missing, skipping sync.');
            return;
        }

        // 1. Get version
        const constantsContent = fs.readFileSync(constantsPath, 'utf8');
        const versionMatch = constantsContent.match(/APP_VERSION = '(.+?)'/);
        if (!versionMatch) throw new Error('Could not find version in constants.tsx');
        const version = versionMatch[1];

        // 2. Get description from CHANGELOG.md
        const changelogContent = fs.readFileSync(changelogPath, 'utf8');
        
        // Find the start of our version section
        const header = `## [${version}]`;
        const startIndex = changelogContent.indexOf(header);
        
        if (startIndex === -1) {
            console.warn(`⚠️ No entry for version ${version} found in CHANGELOG.md`);
            return;
        }

        // Find the end (next header or end of file)
        const restOfFile = changelogContent.substring(startIndex + header.length);
        const nextHeaderMatch = restOfFile.match(/\n## \[/);
        const description = nextHeaderMatch 
            ? restOfFile.substring(0, nextHeaderMatch.index).trim()
            : restOfFile.trim();

        // 3. Upsert to DB
        await db.query(`
            INSERT INTO changelogs (version, release_date, description_ru)
            VALUES ($1, NOW(), $2)
            ON CONFLICT (version) DO UPDATE 
            SET description_ru = EXCLUDED.description_ru;
        `, [version, description]);

        console.log(`✅ Changelog for v${version} successfully synced to DB.`);
    } catch (err) {
        console.error('❌ Failed to sync changelog:', err.message);
    } finally {
        process.exit(0);
    }
}

sync();
