
export enum ProjectStatus {
  IDEA = 'Idea',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  COMPLETE = 'Complete'
}

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export type ProjectLayout = 'manuscript' | 'kanban';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

export interface Team {
  id: string;
  name: string;
  ownerId: string; // The user ID who owns this team
  members: User[];
}

export interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  deadline?: string;
  images: string[];
  dependencies: string[]; // IDs of tasks this task depends on
  boardItems?: BoardItem[];
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
