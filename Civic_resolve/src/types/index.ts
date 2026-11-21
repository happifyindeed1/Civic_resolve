export type IssueCategory =
  | 'ROADS_BRIDGES'
  | 'SANITATION_WASTE'
  | 'WATER_SEWERAGE'
  | 'ELECTRICAL_LIGHTING'
  | 'PUBLIC_SAFETY'
  | 'PARKS_RECREATION';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IssueStatus =
  | 'REPORTED'
  | 'TRIAGED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'VERIFIED';

export type Department =
  | 'Department of Public Works'
  | 'Municipal Sanitation Board'
  | 'Water Supply & Sewerage Authority'
  | 'City Power & Street Lighting'
  | 'Traffic & Public Safety Bureau'
  | 'Parks & Urban Forestry Dept';

export interface LocationCoords {
  lat: number;
  lng: number;
  address: string;
  landmark?: string;
  wardOrDistrict?: string;
}

export interface TimelineEvent {
  id: string;
  stage: IssueStatus;
  actor: string;
  actorRole: 'CITIZEN' | 'ADMIN' | 'FIELD_OFFICER' | 'AI_SYSTEM';
  action: string;
  notes?: string;
  timestamp: string;
}

export interface GeminiTriageResult {
  category: IssueCategory;
  urgency: UrgencyLevel;
  department: Department;
  estimatedSla: string;
  publicHazardScore: number; // 1 to 10
  hazardAssessment: string;
  aiReasoning: string;
  modelUsed: string;
  confidence: number; // 0.0 to 1.0
  isAiGenerated: boolean;
}

export interface CivicIssue {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: IssueCategory;
  urgency: UrgencyLevel;
  status: IssueStatus;
  department: Department;
  location: LocationCoords;
  imageUrl?: string;
  afterImageUrl?: string;
  resolutionNotes?: string;
  reportedBy: {
    name: string;
    phone?: string;
    email?: string;
  };
  assignedTo?: {
    officerName: string;
    badgeId?: string;
    department: Department;
  };
  upvotes: number;
  upvotedBy: string[]; // User IDs / Session IDs
  timeline: TimelineEvent[];
  aiTriage: GeminiTriageResult;
  satisfactionRating?: {
    rating: number; // 1-5
    feedback?: string;
    submittedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'CITIZEN' | 'ADMIN' | 'FIELD_OFFICER';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  avatar: string;
  department?: Department;
}
