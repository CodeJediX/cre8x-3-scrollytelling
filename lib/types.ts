export type RegistrationType = "solo" | "team";
export type EligibilityStatus = "pending" | "eligible" | "rejected";
export type RegistrationStatus = "pending_email_verification" | "pending_eligibility_review" | "registered" | "rejected";
export type RoundStatus = "coming_soon" | "open" | "closed" | "completed";
export type SubmissionStatus = "draft" | "submitted" | "under_review" | "finalist" | "not_selected" | "winner";
export type Priority = "normal" | "important" | "urgent";

export interface CompetitionRound {
  id: string;
  round_name: string;
  round_slug: string;
  description: string;
  opening_date: string | null;
  closing_date: string | null;
  visibility: boolean;
  status: RoundStatus;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: Priority;
  published_at: string;
}

export interface PublicContent {
  heroAnnouncement: string;
  registrationOpen: boolean;
  capacity: number;
  registeredPeople: number;
  teamsCount: number;
  soloRegistrations: number;
  milestoneLabel: string;
  milestoneDate: string;
  finaleDate: string;
  venue: string;
  rounds: CompetitionRound[];
  announcements: Announcement[];
  previewMode: boolean;
}

export interface DashboardData {
  profile: {
    fullName: string;
    email: string;
    university: string | null;
    profileImage: string | null;
  };
  registration: {
    participantCode: string;
    type: RegistrationType;
    status: RegistrationStatus;
    eligibility: EligibilityStatus;
    currentStage: string;
  } | null;
  team: {
    id: string;
    name: string;
    code: string;
    isLeader: boolean;
    members: Array<{ id: string; name: string; role: "leader" | "member" }>;
  } | null;
  notifications: Array<{ id: string; title: string; message: string; read: boolean; createdAt: string }>;
  announcements: Announcement[];
  rounds: CompetitionRound[];
  submissions: Array<{
    id: string;
    roundId: string;
    title: string;
    description: string | null;
    figmaUrl: string | null;
    prototypeUrl: string | null;
    supportingUrl: string | null;
    status: SubmissionStatus;
    submittedAt: string | null;
  }>;
  pass: {
    token: string;
    checkedIn: boolean;
    checkedInAt: string | null;
  } | null;
  teamChangesLocked: boolean;
  previewMode?: boolean;
}
