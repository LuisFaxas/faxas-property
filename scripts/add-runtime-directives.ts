/**
 * Script to add runtime directives to all API route files
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const RUNTIME_EXPORTS = `
// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';`;

async function addRuntimeDirectives() {
  // Find all route.ts files in app/api directory
  const routeFiles = await glob('app/api/**/route.ts', {
    cwd: process.cwd()
  });

  console.log(`Found ${routeFiles.length} route files`);

  let updated = 0;
  let skipped = 0;

  for (const file of routeFiles) {
    const filePath = path.join(process.cwd(), file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check if already has runtime export
    if (content.includes('export const runtime')) {
      console.log(`⏭️  Skipped (already has runtime): ${file}`);
      skipped++;
      continue;
    }

    // Add runtime exports at the end of the file
    const newContent = content.trimEnd() + '\n' + RUNTIME_EXPORTS;

    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Updated: ${file}`);
    updated++;
  }

  console.log(`\nSummary:`);
  console.log(`- Updated: ${updated} files`);
  console.log(`- Skipped: ${skipped} files`);
  console.log(`- Total: ${routeFiles.length} files`);
}

// Run the script
addRuntimeDirectives().catch(console.error);