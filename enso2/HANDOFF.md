
# Enso | Developer Handoff

**Designed by Studio Poetics**  
*Philosophy: "Less, but better."*

---

## 1. Project Overview
Enso is a minimalist project management tool designed for creative studios. Unlike Jira or Notion, it avoids feature bloat to focus on flow, essence, and clarity. It leans heavily on AI (Gemini) to act as a "Senior Design Mentor" rather than just a text generator.

### Tech Stack
*   **Framework**: React 18
*   **Styling**: Tailwind CSS (Utility-first)
*   **AI**: Google Gemini API (`@google/genai`)
*   **Icons**: Lucide React
*   **State/Auth**: React Context + Service Adapter Pattern

---

## 2. Design System (The "Way of Enso")

The aesthetic is derived from Kenya Hara (Muji) and traditional Japanese aesthetics.

### Color Palette
*   **Paper (`#f4f4f0`)**: The canvas. Used for backgrounds. Never use pure white (`#ffffff`) for backgrounds, only for cards/inputs if necessary for contrast.
*   **Sumi (`#1a1a1a`)**: The ink. Used for primary text and borders. Soft black.
*   **Vermilion (`#cd2b1e`)**: The stamp (Inkan). Used for accents, errors, and "Flow" states.
*   **Gray (`#e5e5e5` / `#9ca3af`)**: The shadow. Used for subtle borders and inactive icons.

### Typography
*   **Inter**: UI Elements, Sans-serif text. (Clean, modern).
*   **Noto Serif JP**: Headings, "Essence", Wisdom. (Editorial, human).
*   **Caveat**: Marginalia, Notes. (Handwritten, organic).

---

## 3. Core Architecture

### `App.tsx`
The root container. Currently manages view state (`DASHBOARD` vs `PROJECT_DETAIL`) and authenticates users via `AuthContext`.

### `ProjectDetail.tsx`
The central controller for a project. It manages two main Views:
1.  **Manuscript (The Scroll)**: Linear, narrative view. `ManuscriptView`.
2.  **Kanban (The Board)**: Column-based view. `KanbanBoard`.

### Service Adapter Pattern
The app uses a strict service layer (`services/storage.ts`) to decouple the UI from the data source.
*   **Current State**: Uses `localStorage` to simulate a database.
*   **Production Goal**: Replace the *internals* of `services/storage.ts` without changing the function signatures.

---

## 4. Backend Implementation Guide (Production)

To move from the current "Simulation" to a real product, we recommend **Supabase** (PostgreSQL) or **Firebase**. Below is the reference architecture for **Supabase**.

### A. Database Schema (SQL)

You need 4 core tables to handle the Team/User structure.

```sql
-- 1. PROFILES (Extends Auth Users)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  avatar text
);

-- 2. TEAMS
create table teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references profiles(id)
);

-- 3. TEAM_MEMBERS (Junction Table)
create table team_members (
  team_id uuid references teams(id),
  user_id uuid references profiles(id),
  role text check (role in ('owner', 'admin', 'member', 'viewer')),
  primary key (team_id, user_id)
);

-- 4. PROJECTS
create table projects (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references teams(id),
  owner_id uuid references profiles(id),
  title text,
  status text,
  content jsonb -- Stores tasks, boardItems, etc. to keep schema flexible
);
```

### B. Integrating the Code

1.  **Install SDK**: `npm install @supabase/supabase-js`
2.  **Update `services/storage.ts`**:

Replace the LocalStorage logic with SDK calls.

---

## 5. Google Drive Integration Strategy (Cloud Storage)

To support unlimited media uploads without quota limits, integrating Google Drive is the recommended path. This requires a **Google Cloud Project**.

### Implementation Steps

1.  **Create Google Cloud Project**: Enable "Google Drive API".
2.  **Create Credentials**: Create an OAuth 2.0 Client ID for Web Application.
3.  **Install Library**: `npm install gapi-script`

### Reference Implementation (`services/googleDrive.ts`)

Replace `services/media.ts` logic with this strategy to upload to Drive instead of LocalStorage.

```typescript
import { gapi } from 'gapi-script';

const CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

export const initGoogleDrive = () => {
  gapi.load('client:auth2', () => {
    gapi.client.init({
      clientId: CLIENT_ID,
      scope: SCOPES,
    });
  });
};

export const uploadFileToDrive = async (file: File): Promise<string> => {
  const authInstance = gapi.auth2.getAuthInstance();
  if (!authInstance.isSignedIn.get()) {
    await authInstance.signIn();
  }

  const accessToken = gapi.auth.getToken().access_token;
  
  const metadata = {
    name: file.name,
    mimeType: file.type,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  const data = await response.json();
  // Return the webViewLink (or thumbnailLink) to store in your app
  return data.webViewLink; 
};
```

---

## 6. AI Integration (`services/gemini.ts`)

We do not use AI to "generate content" but to "provide wisdom".

*   **`generateProjectEssence`**: Distills rough notes into a strategic brief.
*   **`suggestTasks`**: Pragmatic breakdown of work.
*   **`getTaskMentorship`**: Returns JSON with `advice` (strategy) and `steps` (tactics).
*   **`getUncleIrohWisdom`**: Provides emotional/philosophical grounding.

---
*Maintained by Studio Poetics*
