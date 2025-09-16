#!/usr/bin/env node

/**
 * Pre-commit quality checks
 * Run this manually before committing: node scripts/pre-commit.js
 * Or add to git hooks
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Running pre-commit checks...\n');

let hasErrors = false;

// TypeScript type check
try {
  console.log('📝 Running TypeScript type check...');
  execSync('npm run typecheck', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ TypeScript check passed\n');
} catch (error) {
  console.log('❌ TypeScript check failed\n');
  hasErrors = true;
}

// ESLint
try {
  console.log('🧹 Running ESLint...');
  execSync('npm run lint', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ ESLint check passed\n');
} catch (error) {
  console.log('❌ ESLint check failed\n');
  hasErrors = true;
}

if (hasErrors) {
  console.log('❌ Pre-commit checks failed. Please fix errors before committing.');
  process.exit(1);
} else {
  console.log('✅ All pre-commit checks passed!');
  process.exit(0);
}