import fs from 'fs';

// 1. Получаем версию из constants.tsx
const constantsContent = fs.readFileSync('constants.tsx', 'utf8');
const versionMatch = constantsContent.match(/APP_VERSION = '(.+?)'/);
const appVersion = versionMatch ? versionMatch[1] : null;

// 2. Получаем версию из CHANGELOG.md (первая строка вида ## [1.0.0])
const changelogContent = fs.readFileSync('CHANGELOG.md', 'utf8');
const changelogMatch = changelogContent.match(/## \[(.+?)\]/);
const changelogVersion = changelogMatch ? changelogMatch[1] : null;

if (!appVersion || !changelogVersion) {
    console.error('❌ Could not find version in constants.tsx or CHANGELOG.md');
    process.exit(1);
}

if (appVersion !== changelogVersion) {
    console.error(`❌ Version mismatch!`);
    console.error(`   constants.tsx: ${appVersion}`);
    console.error(`   CHANGELOG.md:  ${changelogVersion}`);
    console.error('   Please update CHANGELOG.md to match the current version.');
    process.exit(1);
}

console.log(`✅ Version check passed: ${appVersion}`);
