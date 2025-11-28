export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          avatar: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          team_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member' | 'viewer';
          created_at: string;
        };
        Insert: {
          team_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member' | 'viewer';
          created_at?: string;
        };
        Update: {
          team_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'member' | 'viewer';
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          team_id: string;
          owner_id: string;
          title: string;
          status: string;
          content: any; // JSONB field for storing project data
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          owner_id: string;
          title: string;
          status?: string;
          content?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          owner_id?: string;
          title?: string;
          status?: string;
          content?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}