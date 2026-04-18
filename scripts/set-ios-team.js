#!/usr/bin/env node
/**
 * Writes your Apple Development Team ID into ios/FoodReceiptApp.xcodeproj/project.pbxproj
 * (replaces placeholder XXXXXXXXXX).
 *
 * Team ID: Xcode → Settings → Accounts → select Apple ID → hover team → "Team ID" (10 characters).
 *
 * Usage:
 *   node scripts/set-ios-team.js XXXXXXXXXX
 *   APPLE_TEAM_ID=XXXXXXXXXX node scripts/set-ios-team.js
 */
const fs = require('fs');
const path = require('path');

const team = process.argv[2] || process.env.APPLE_TEAM_ID;
if (!team || !/^[A-Za-z0-9]{10}$/.test(team.trim())) {
  console.error(`
Set your Apple Development Team ID (10 characters).

Usage:
  node scripts/set-ios-team.js <TEAM_ID>

Find TEAM_ID: Xcode → Settings → Accounts → select your Apple ID → pick a team → Team ID column.
`);
  process.exit(1);
}

const normalized = team.trim().toUpperCase();
const pbx = path.join(__dirname, '..', 'ios', 'FoodReceiptApp.xcodeproj', 'project.pbxproj');
let s = fs.readFileSync(pbx, 'utf8');

if (!s.includes('XXXXXXXXXX')) {
  console.error(
    'Placeholder XXXXXXXXXX not found in project.pbxproj — it may already be set. Open Xcode → Signing & Capabilities to verify.',
  );
  process.exit(1);
}

s = s.replace(/XXXXXXXXXX/g, normalized);
fs.writeFileSync(pbx, s);
console.log('Updated DEVELOPMENT_TEAM to', normalized, 'in ios/FoodReceiptApp.xcodeproj/project.pbxproj');
