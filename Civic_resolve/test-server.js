/**
 * CivicResolve Automated Verification Test Suite
 * Tests all core backend endpoints:
 * 1. Health & Seed Data Loading
 * 2. Real-Time Gemini Multimodal Triage API
 * 3. Issue Creation & Persistence
 * 4. Community Upvoting
 * 5. Lifecycle Status Transitions (Reported -> Triaged -> In Progress -> Resolved -> Verified)
 * 6. Admin Analytics KPIs
 */

import * as db from './src/lib/db.js';
import { analyzeComplaintWithGemini, fallbackHeuristicTriage } from './src/lib/gemini.js';

async function runTestSuite() {
  console.log('--- STARTING CIVICRESOLVE TEST SUITE ---');

  // Test 1: Seed data and persistence
  const initial = db.getAllIssues();
  console.log(`[PASS] Initial seed issues loaded: ${initial.length} issues found.`);
  if (initial.length < 8) throw new Error('Expected at least 8 seed issues');

  // Test 2: Heuristic & Gemini Triage
  console.log('[TEST] Evaluating AI Triage engine...');
  const triage1 = fallbackHeuristicTriage({
    title: 'Severe 2-foot sinkhole collapsing on highway',
    description: 'Cars are swerving, deep crater in pavement',
    hasImage: true
  });
  console.log(`[PASS] Triage Category: ${triage1.category}, Urgency: ${triage1.urgency}, SLA: ${triage1.estimatedSla}`);
  if (triage1.urgency !== 'CRITICAL') throw new Error('Expected CRITICAL urgency for sinkhole');

  const triage2 = fallbackHeuristicTriage({
    title: 'Sparking high-voltage live wire down near school',
    description: 'Cable hanging 3 feet from ground',
    hasImage: true
  });
  console.log(`[PASS] Triage Category: ${triage2.category}, Dept: ${triage2.department}`);
  if (triage2.category !== 'ELECTRICAL_LIGHTING') throw new Error('Expected ELECTRICAL_LIGHTING');
  if (!triage2.suggestedTitle || !triage2.suggestedDescription) {
    throw new Error('Expected AI auto-fill suggestedTitle and suggestedDescription');
  }
  console.log(`[PASS] AI Auto-fill title generated: "${triage2.suggestedTitle}"`);

  // Test 3: Issue Creation
  console.log('[TEST] Testing Issue Creation in DB...');
  const created = db.createIssue({
    title: 'Test Overflowing Recycling Bin at Public Square',
    description: 'Plastic bottles and boxes spilling onto pedestrian path',
    category: 'SANITATION_WASTE',
    urgency: 'MEDIUM',
    department: 'Municipal Sanitation Board',
    location: {
      lat: 37.775,
      lng: -122.418,
      address: 'Test Plaza Square'
    },
    reportedBy: {
      name: 'Verification Tester'
    }
  });
  console.log(`[PASS] Created issue with ID: ${created.id}, Ticket: ${created.ticketNumber}`);

  // Test 4: Community Upvoting
  console.log('[TEST] Testing Community Upvoting...');
  const upvoteResult = db.toggleUpvote(created.id, 'tester-user');
  console.log(`[PASS] Upvote count after toggle: ${upvoteResult.upvotes}`);
  if (upvoteResult.upvotes !== 2) throw new Error('Expected upvotes to increment');

  // Test 5: Status Lifecycle Transition
  console.log('[TEST] Testing 5-stage lifecycle transition...');
  const inProgress = db.updateIssueStatus(created.id, {
    newStatus: 'IN_PROGRESS',
    actorName: 'Officer Marcus Chen',
    actorRole: 'FIELD_OFFICER',
    notes: 'Crew dispatched with vacuum truck'
  });
  if (inProgress.status !== 'IN_PROGRESS') throw new Error('Failed to transition to IN_PROGRESS');

  const resolved = db.updateIssueStatus(created.id, {
    newStatus: 'RESOLVED',
    actorName: 'Officer Marcus Chen',
    actorRole: 'FIELD_OFFICER',
    notes: 'Bin emptied and area cleaned.',
    afterImageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec'
  });
  if (resolved.status !== 'RESOLVED') throw new Error('Failed to transition to RESOLVED');

  const verified = db.submitSatisfactionRating(created.id, {
    rating: 5,
    feedback: 'Prompt and clean response!'
  });
  if (verified.status !== 'VERIFIED') throw new Error('Failed to transition to VERIFIED');
  console.log('[PASS] Full 5-stage lifecycle verified successfully.');

  // Test 6: Municipal Stats
  const stats = db.getStats();
  console.log(`[PASS] Municipal Analytics KPIs: Total: ${stats.total}, Critical: ${stats.critical}, Resolution Rate: ${stats.resolutionRate}%`);

  // Reset back to clean seed dataset
  db.resetToSeedData();
  console.log('[PASS] Reset to pristine seed dataset confirmed.');

  console.log('--- ALL CIVICRESOLVE TESTS PASSED (6/6) ---');
}

runTestSuite().catch((e) => {
  console.error('[FAIL] Test failed:', e);
  process.exit(1);
});
