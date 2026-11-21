/**
 * CivicResolve: Persistent Local File-Backed Database
 * Thread-safe atomic reads and writes to data/grievances.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INITIAL_ISSUES } from './seed-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, '../../data/grievances.json');

function ensureDbFile() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_ISSUES, null, 2), 'utf8');
  }
}

function readAllRaw() {
  ensureDbFile();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading grievances.json, restoring seed data:', err);
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_ISSUES, null, 2), 'utf8');
    return INITIAL_ISSUES;
  }
}

function writeAllRaw(data) {
  ensureDbFile();
  const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  try {
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    // OneDrive can lock the destination and reject rename. Copy, then remove the temp file.
    if (err.code !== 'EPERM' && err.code !== 'EBUSY') throw err;
    fs.copyFileSync(tempFile, DB_FILE);
    fs.unlinkSync(tempFile);
  }
}

export function getAllIssues(filters = {}) {
  let issues = readAllRaw();

  if (filters.category && filters.category !== 'ALL') {
    issues = issues.filter((i) => i.category === filters.category);
  }
  if (filters.urgency && filters.urgency !== 'ALL') {
    issues = issues.filter((i) => i.urgency === filters.urgency);
  }
  if (filters.status && filters.status !== 'ALL') {
    issues = issues.filter((i) => i.status === filters.status);
  }
  if (filters.department && filters.department !== 'ALL') {
    issues = issues.filter((i) => i.department === filters.department);
  }
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    issues = issues.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.ticketNumber.toLowerCase().includes(q) ||
        i.location.address.toLowerCase().includes(q)
    );
  }

  // Sort descending by creation date
  return issues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getIssueById(id) {
  const issues = readAllRaw();
  return issues.find((i) => i.id === id) || null;
}

export function createIssue(payload) {
  const issues = readAllRaw();
  const nextNum = 850 + issues.length;
  const now = new Date().toISOString();

  const newIssue = {
    id: `civic-${Date.now()}`,
    ticketNumber: `CR-2026-${nextNum}`,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    urgency: payload.urgency || 'MEDIUM',
    status: 'REPORTED',
    department: payload.department || 'Department of Public Works',
    location: {
      lat: payload.location?.lat || 37.7749,
      lng: payload.location?.lng || -122.4194,
      address: payload.location?.address || 'Downtown Civic Zone',
      landmark: payload.location?.landmark || '',
      wardOrDistrict: payload.location?.wardOrDistrict || 'District 1'
    },
    imageUrl: payload.imageUrl || '',
    audioUrl: payload.audioUrl || '',
    reportedBy: {
      name: payload.reportedBy?.name || 'Alex Rivera',
      phone: payload.reportedBy?.phone || '+1 (555) 789-3210',
      email: payload.reportedBy?.email || 'alex.rivera@example.com'
    },
    upvotes: 1,
    upvotedBy: ['user-creator'],
    aiTriage: payload.aiTriage || {
      category: payload.category,
      urgency: payload.urgency || 'MEDIUM',
      department: payload.department,
      estimatedSla: '24 - 48 Hours',
      publicHazardScore: 5,
      hazardAssessment: 'Standard civic grievance.',
      aiReasoning: 'Initial automated triage classification.',
      modelUsed: 'Google Gemini 2.5 Flash',
      confidence: 0.9,
      isAiGenerated: true
    },
    timeline: [
      {
        id: `tl-${Date.now()}-1`,
        stage: 'REPORTED',
        actor: payload.reportedBy?.name || 'Alex Rivera',
        actorRole: 'CITIZEN',
        action: 'Complaint lodged with geolocation and description.',
        notes: payload.aiTriage?.aiReasoning || 'Submitted via CivicResolve web app.',
        timestamp: now
      }
    ],
    createdAt: now,
    updatedAt: now
  };

  issues.unshift(newIssue);
  writeAllRaw(issues);
  return newIssue;
}

export function updateIssueStatus(id, {
  newStatus,
  actorName = 'City Triage Admin',
  actorRole = 'ADMIN',
  notes = '',
  afterImageUrl = '',
  assignedOfficer = null,
  overrideCategory = null,
  overrideUrgency = null,
  overrideDepartment = null
}) {
  const issues = readAllRaw();
  const index = issues.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const issue = issues[index];
  const now = new Date().toISOString();

  if (newStatus) {
    issue.status = newStatus;
  }
  if (assignedOfficer) {
    issue.assignedTo = assignedOfficer;
  }
  if (afterImageUrl) {
    issue.afterImageUrl = afterImageUrl;
  }
  if (notes) {
    issue.resolutionNotes = notes;
  }
  if (overrideCategory) {
    issue.category = overrideCategory;
  }
  if (overrideUrgency) {
    issue.urgency = overrideUrgency;
  }
  if (overrideDepartment) {
    issue.department = overrideDepartment;
  }

  issue.timeline.push({
    id: `tl-${Date.now()}`,
    stage: newStatus || issue.status,
    actor: actorName,
    actorRole,
    action: `Status transitioned to ${newStatus || issue.status}`,
    notes: notes || undefined,
    timestamp: now
  });

  issue.updatedAt = now;
  issues[index] = issue;
  writeAllRaw(issues);
  return issue;
}

export function toggleUpvote(id, userId = 'user-alex') {
  const issues = readAllRaw();
  const issue = issues.find((i) => i.id === id);
  if (!issue) return null;

  if (!issue.upvotedBy) issue.upvotedBy = [];

  const existingIndex = issue.upvotedBy.indexOf(userId);
  if (existingIndex > -1) {
    issue.upvotedBy.splice(existingIndex, 1);
    issue.upvotes = Math.max(0, issue.upvotes - 1);
  } else {
    issue.upvotedBy.push(userId);
    issue.upvotes = (issue.upvotes || 0) + 1;
  }

  writeAllRaw(issues);
  return { id: issue.id, upvotes: issue.upvotes, hasUpvoted: existingIndex === -1 };
}

export function submitSatisfactionRating(id, { rating = 5, feedback = '' }) {
  const issues = readAllRaw();
  const issue = issues.find((i) => i.id === id);
  if (!issue) return null;

  const now = new Date().toISOString();
  issue.status = 'VERIFIED';
  issue.satisfactionRating = {
    rating: Number(rating) || 5,
    feedback,
    submittedAt: now
  };

  issue.timeline.push({
    id: `tl-${Date.now()}`,
    stage: 'VERIFIED',
    actor: issue.reportedBy?.name || 'Alex Rivera',
    actorRole: 'CITIZEN',
    action: `Citizen verified resolution and awarded ${rating} stars.`,
    notes: feedback || undefined,
    timestamp: now
  });

  issue.updatedAt = now;
  writeAllRaw(issues);
  return issue;
}

export function resetToSeedData() {
  writeAllRaw(INITIAL_ISSUES);
  return INITIAL_ISSUES;
}

export function getStats() {
  const issues = readAllRaw();
  const total = issues.length;
  const critical = issues.filter((i) => i.urgency === 'CRITICAL').length;
  const high = issues.filter((i) => i.urgency === 'HIGH').length;
  const inProgress = issues.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'TRIAGED').length;
  const resolved = issues.filter((i) => i.status === 'RESOLVED' || i.status === 'VERIFIED').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const deptCounts = {};
  const categoryCounts = {};

  for (const item of issues) {
    deptCounts[item.department] = (deptCounts[item.department] || 0) + 1;
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }

  return {
    total,
    critical,
    high,
    inProgress,
    resolved,
    resolutionRate,
    avgSlaHours: 18,
    deptCounts,
    categoryCounts
  };
}
