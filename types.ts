
export enum ProjectStatus {
  IDEA = 'Idea',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  COMPLETE = 'Complete'
}

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export type ProjectLayout = 'manuscript' | 'kanban';

export type ProjectVisibility = 'private' | 'team';

export interface ProjectPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageCollaborators: boolean;
  userRole: 'owner' | 'collaborator' | 'viewer';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  googleDriveConnected?: boolean;
  googleDriveEmail?: string;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string; // The user ID who owns this team
  members: User[];
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface Invitation {
  id: string;
  teamId: string;
  teamName?: string;
  email: string;
  role: User['role'];
  invitedBy: string;
  invitedByName?: string;
  status: InvitationStatus;
  token: string;
  createdAt: number;
  expiresAt: number;
  acceptedAt?: number;
  declinedAt?: number;
}

export interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  deadline?: string;
  images: string[];
  dependencies: string[]; // IDs of tasks this task depends on
  boardItems?: BoardItem[];
  mentorship?: {
    advice: string;
    steps: string[];
    generatedAt: number;
  };
}

export type BoardItemType = 'text' | 'image' | 'link' | 'audio';

export interface BoardItem {
  id: string;
  type: BoardItemType;
  content: string; // Text content, Image URL/Base64, Link URL, or Audio URL
  meta?: string; // Title for links, or extra metadata
  marginalia: string; // The handwriting note
  createdAt: number;
}

export interface Project {
  id: string;
  teamId: string; // Belongs to a team
  ownerId: string; // Created by
  collaborators: string[]; // User IDs
  visibility: ProjectVisibility; // Project visibility: private or team-wide
  title: string;
  client: string;
  status: ProjectStatus;
  essence: string; // The "Brief" or "Soul" of the project
  layout: ProjectLayout;
  tasks: Task[];
  boardItems: BoardItem[];
  createdAt: number;
}

export type ViewState = 'DASHBOARD' | 'PROJECT_DETAIL';

export interface AIResponse {
  text: string;
  error?: string;
}
