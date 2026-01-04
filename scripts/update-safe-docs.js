/**
 * AUTO-GENERATED DOCUMENTATION SCRIPT
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, '../components/safe-island/schema.ts');
const DOCS_PATH = path.join(__dirname, '../docs/SAFE_COMPONENTS.md');

const main = () => {
    if (!fs.existsSync(SCHEMA_PATH)) {
        console.error('Schema file not found!');
        process.exit(1);
    }

    const content = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    const components = [];
    
    // Regex to find Component Schemas
    const componentRegex = /export const Safe(\w+)Schema = BaseNodeSchema\.extend\({([\s\S]*?)}\);/g;
    
    let match;
    while ((match = componentRegex.exec(content)) !== null) {
        const name = match[1]; 
        const body = match[2];
        
        const typeMatch = /type: z\.literal\('(\w+)'\)/.exec(body);
        const type = typeMatch ? typeMatch[1] : 'unknown';

        const propsBlockMatch = /props: z\.object\({([\s\S]*?)}\)/.exec(body);
        const props = [];
        if (propsBlockMatch) {
            const propsBody = propsBlockMatch[1];
            const lines = propsBody.split('\n');
            lines.forEach(line => {
                const clean = line.trim();
                if (clean && !clean.startsWith('//') && clean.includes(':')) {
                    const parts = clean.split(':');
                    if (parts.length > 1) {
                        props.push(parts[0].trim());
                    }
                }
            });
        }
        components.push({ name, type, props });
    }

    let md = "# 🛡 Safe Island Components\n\n";
    md += "*Auto-generated from `schema.ts`. Do not edit manually.*\n\n";
    md += "> **Protocol Version:** " + new Date().toISOString().split('T')[0] + "\n\n";

    components.forEach(c => {
        md += "## " + c.name + "\n";
        md += "- **Type:** `\"" + c.type + "\"`\n";
        md += "- **Props:**\n";
        c.props.forEach(p => md += "  - `" + p + "`\n");
        md += "\n";
    });

    md += "## Base Styles (Available on all nodes)\n";
    md += "- `padding`, `margin`, `background`, `shadow`, `width`\n";

    fs.writeFileSync(DOCS_PATH, md);
    console.log("Successfully generated docs for " + components.length + " components.");
};

main();
