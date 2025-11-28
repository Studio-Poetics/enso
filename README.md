# Enso | The Minimalist Studio

*"Less, but better."* – Kenya Hara

A minimalist project management tool designed for creative studios. Unlike bloated alternatives, Enso focuses on flow, essence, and clarity while leveraging AI as a design mentor.

## ✨ Features

### 🏢 **Teams & Collaboration**
- Multi-user workspaces with role-based access
- Invite team members with different permission levels
- Real-time project synchronization across devices

### 📋 **Project Management**
- **Manuscript View**: Linear, narrative project flow
- **Kanban Board**: Visual task organization
- AI-powered project essence and task suggestions
- Visual mood boards with drag-and-drop

### 🤖 **AI Integration**
- **Project Essence**: Distill rough notes into strategic briefs
- **Smart Tasks**: Pragmatic work breakdown
- **Mentorship**: Strategic advice and tactical steps
- **Uncle Iroh Mode**: Philosophical guidance for creative blocks

### 🔐 **Authentication & Security**
- **Multiple login options**: Email/password, Google OAuth, GitHub OAuth
- **Magic links**: Passwordless authentication option
- **Password recovery**: Secure email-based password reset
- **Row-level security**: Database-level access control
- **Secure sessions**: Automatic token management

## 🚀 Quick Start

### Development (localStorage)
```bash
# Clone and install
git clone <your-repo>
cd enso
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local - set VITE_USE_SUPABASE=false

# Start development server
npm run dev
```

### Production (Supabase + Vercel)
See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete setup instructions.

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Icons**: Lucide React

## 🎨 Design Philosophy

Enso follows Japanese aesthetic principles:

### Color Palette
- **Paper** (`#f4f4f0`): The canvas - primary background
- **Sumi** (`#1a1a1a`): The ink - text and primary elements
- **Vermilion** (`#cd2b1e`): The stamp - accents and flow states
- **Gray** (`#e5e5e5`): The shadow - subtle elements

### Typography
- **Inter**: UI elements, clean and modern
- **Noto Serif JP**: Headings and wisdom text
- **Caveat**: Handwritten notes and marginalia

## 📁 Project Structure

```
enso/
├── components/          # React components
│   ├── LoginScreen.tsx
│   ├── ProjectList.tsx
│   ├── ProjectDetail.tsx
│   └── TeamManageModal.tsx
├── context/             # React contexts
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── services/            # Data services
│   ├── storage.ts       # localStorage implementation
│   ├── supabase-storage.ts # Supabase implementation
│   ├── index.ts         # Service selector
│   └── gemini.ts        # AI integration
├── lib/                 # Utilities
│   └── supabase.ts      # Supabase client
├── types/               # TypeScript types
│   ├── index.ts         # Core types
│   └── database.ts      # Supabase types
├── database/            # Database schema
│   └── schema.sql       # Supabase setup script
└── App.tsx              # Main application
```

## 🔧 Configuration

### Environment Variables

```bash
# Storage backend selection
VITE_USE_SUPABASE=false  # true for production, false for development

# Supabase (production)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Integration
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Storage Backends

Enso supports two storage backends:

1. **localStorage** (Development): Data persists locally, great for testing
2. **Supabase** (Production): Real database with multi-user support

Toggle between them using the `VITE_USE_SUPABASE` environment variable.

## 🏗️ Architecture

### Service Adapter Pattern
The app uses a strict service layer to decouple UI from data storage:

```typescript
// Current implementation automatically chooses:
import { authService, dbService } from './services';

// Based on VITE_USE_SUPABASE environment variable
```

This allows seamless switching between localStorage (development) and Supabase (production) without changing any component code.

## 🧠 AI Features

### Project Essence
Transforms rough ideas into strategic briefs:
```typescript
const essence = await generateProjectEssence(roughNotes);
```

### Task Mentorship
Provides strategic and tactical guidance:
```typescript
const advice = await getTaskMentorship(taskDescription);
// Returns: { advice: "strategic guidance", steps: ["tactical", "steps"] }
```

## 🔒 Security

- **Row Level Security (RLS)**: Database-level access control
- **Role-based permissions**: Owner, Admin, Member, Viewer roles
- **Secure authentication**: Magic link-based login
- **Environment isolation**: Separate dev/prod configurations

## 🚀 Deployment

### Free Tier Setup (Recommended)
- **Supabase**: 500MB database, perfect for small teams
- **Vercel**: 100GB bandwidth/month, custom domains included
- **Total Cost**: $0/month

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions.

## 🎯 Usage Examples

### Getting Started
1. **Sign up** with email/password or OAuth (Google/GitHub)
2. **Verify email** if using email signup
3. **Complete profile** setup for OAuth users

### Team Collaboration
1. **Owner creates team** and invites members via email
2. **Members receive invitations** and can join instantly
3. **Role-based access**: Owner, Admin, Member, Viewer permissions
4. **Real-time collaboration** on shared projects

### Project Workflow
1. **Create project** with AI-generated essence and strategy
2. **Switch views**: Manuscript (linear) or Kanban (visual)
3. **AI mentorship**: Get strategic advice and tactical steps
4. **Track progress** with visual status indicators

### Password Management
1. **Forgot password?** Use the reset link on login screen
2. **Change password** via profile settings (coming soon)
3. **Secure sessions** with automatic token refresh

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Credits

**Design Philosophy**: Kenya Hara (Muji) and traditional Japanese aesthetics
**Created by**: [Studio Poetics](https://poetics.studio)

---

*"Less, but better."* ✨