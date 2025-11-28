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

### B. Row Level Security (RLS) policies

**Critical**: You must enable RLS to prevent cross-team data leaks.

```sql
-- Example: Only show projects if the user is a member of the team
create policy "Team members can see projects"
on projects for select
using (
  auth.uid() in (
    select user_id from team_members where team_id = projects.team_id
  )
);
```

### C. Integrating the Code

1.  **Install SDK**: `npm install @supabase/supabase-js`
2.  **Update `services/storage.ts`**:

Replace the LocalStorage logic with SDK calls.

```typescript
// services/storage.ts (Production Example)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(ENV_URL, ENV_KEY);

export const authService = {
  async login(email) {
    // Supabase Magic Link or OAuth
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  },
  // ...
};

export const dbService = {
  async getProjects(teamId: string) {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('team_id', teamId);
    return data;
  },
  
  async createProject(project) {
    // Map local 'Project' type to DB columns
    const { data } = await supabase
      .from('projects')
      .insert({
        team_id: project.teamId,
        title: project.title,
        content: project // Store the complex task objects in JSONB
      });
    return data;
  }
};
```

### D. Authentication Flow

1.  In `AuthContext.tsx`, replace the `init()` function to use the provider's listener:
    ```typescript
    useEffect(() => {
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          // Fetch profile and team
        } else {
          // Clear state
        }
      });
    }, []);
    ```

---

## 5. AI Integration (`services/gemini.ts`)

We do not use AI to "generate content" but to "provide wisdom".

*   **`generateProjectEssence`**: Distills rough notes into a strategic brief.
*   **`suggestTasks`**: Pragmatic breakdown of work.
*   **`getTaskMentorship`**: Returns JSON with `advice` (strategy) and `steps` (tactics).
*   **`getUncleIrohWisdom`**: Provides emotional/philosophical grounding.

---
*Maintained by Studio Poetics*
