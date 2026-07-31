// Gerado manualmente a partir das migrations em supabase/migrations/
// (equivalente a `supabase gen types typescript`, indisponível sem Docker
// local). Regenerar via CLI assim que houver Docker/PAT disponíveis, ou
// atualizar manualmente a cada nova migration.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      orgs: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          id: string;
          org_id: string;
          email: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_logs: {
        Row: {
          id: string;
          org_id: string | null;
          user_id: string | null;
          provider: string;
          model: string | null;
          task: "text" | "image" | "vision" | "embed";
          status: "success" | "error";
          tokens_input: number | null;
          tokens_output: number | null;
          cost_usd: number;
          latency_ms: number;
          fallback_from: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          user_id?: string | null;
          provider: string;
          model?: string | null;
          task: "text" | "image" | "vision" | "embed";
          status: "success" | "error";
          tokens_input?: number | null;
          tokens_output?: number | null;
          cost_usd?: number;
          latency_ms: number;
          fallback_from?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          user_id?: string | null;
          provider?: string;
          model?: string | null;
          task?: "text" | "image" | "vision" | "embed";
          status?: "success" | "error";
          tokens_input?: number | null;
          tokens_output?: number | null;
          cost_usd?: number;
          latency_ms?: number;
          fallback_from?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_logs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          handles: string[];
          persona: string | null;
          tone: string[];
          goals: string[];
          specialties: string[];
          site: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          handles?: string[];
          persona?: string | null;
          tone?: string[];
          goals?: string[];
          specialties?: string[];
          site?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          handles?: string[];
          persona?: string | null;
          tone?: string[];
          goals?: string[];
          specialties?: string[];
          site?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      brandkits: {
        Row: {
          id: string;
          client_id: string;
          palette: Json;
          gradient: string;
          fonts: Json;
          logo_path: string | null;
          logo_radius: number;
          chrome: Json;
          rules: Json;
          image_style: string | null;
          cta: string;
          style: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          palette: Json;
          gradient: string;
          fonts: Json;
          logo_path?: string | null;
          logo_radius?: number;
          chrome: Json;
          rules: Json;
          image_style?: string | null;
          cta: string;
          style?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          palette?: Json;
          gradient?: string;
          fonts?: Json;
          logo_path?: string | null;
          logo_radius?: number;
          chrome?: Json;
          rules?: Json;
          image_style?: string | null;
          cta?: string;
          style?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brandkits_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: true;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      media: {
        Row: {
          id: string;
          org_id: string;
          path: string;
          kind: string;
          width: number;
          height: number;
          provider: string | null;
          prompt_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          path: string;
          kind: string;
          width: number;
          height: number;
          provider?: string | null;
          prompt_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          path?: string;
          kind?: string;
          width?: number;
          height?: number;
          provider?: string | null;
          prompt_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          org_id: string;
          client_id: string;
          theme: string;
          goal: "educar" | "autoridade" | "converter" | "mito";
          status: "draft" | "running" | "completed" | "failed";
          progress: number;
          slide_count: number;
          ratio: "4:5" | "1:1";
          caption: string | null;
          hashtags: string[];
          cta: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          client_id: string;
          theme: string;
          goal: "educar" | "autoridade" | "converter" | "mito";
          status?: "draft" | "running" | "completed" | "failed";
          progress?: number;
          slide_count: number;
          ratio?: "4:5" | "1:1";
          caption?: string | null;
          hashtags?: string[];
          cta?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          client_id?: string;
          theme?: string;
          goal?: "educar" | "autoridade" | "converter" | "mito";
          status?: "draft" | "running" | "completed" | "failed";
          progress?: number;
          slide_count?: number;
          ratio?: "4:5" | "1:1";
          caption?: string | null;
          hashtags?: string[];
          cta?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      slides: {
        Row: {
          id: string;
          project_id: string;
          index: number;
          archetype_id: string;
          content: Json;
          media_id: string | null;
          overrides: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          index: number;
          archetype_id: string;
          content?: Json;
          media_id?: string | null;
          overrides?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          index?: number;
          archetype_id?: string;
          content?: Json;
          media_id?: string | null;
          overrides?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "slides_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "slides_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          id: string;
          org_id: string;
          project_id: string;
          step: "research" | "copy" | "prompt" | "image" | "render" | "publish" | "completed";
          progress: number;
          attempts: number;
          payload: Json;
          state: "pending" | "running" | "completed" | "failed";
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          project_id: string;
          step?: "research" | "copy" | "prompt" | "image" | "render" | "publish" | "completed";
          progress?: number;
          attempts?: number;
          payload?: Json;
          state?: "pending" | "running" | "completed" | "failed";
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          project_id?: string;
          step?: "research" | "copy" | "prompt" | "image" | "render" | "publish" | "completed";
          progress?: number;
          attempts?: number;
          payload?: Json;
          state?: "pending" | "running" | "completed" | "failed";
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      assets: {
        Row: {
          id: string;
          org_id: string;
          client_id: string;
          path: string;
          mime: string;
          kind: "image" | "pdf" | "font";
          status: "pending" | "analyzed" | "failed";
          width: number | null;
          height: number | null;
          dominant_color: string | null;
          luminance_top: number | null;
          luminance_mid: number | null;
          luminance_bottom: number | null;
          terms: string[];
          excerpts: string[];
          family: string | null;
          error: string | null;
          analyzed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          client_id: string;
          path: string;
          mime: string;
          kind: "image" | "pdf" | "font";
          status?: "pending" | "analyzed" | "failed";
          width?: number | null;
          height?: number | null;
          dominant_color?: string | null;
          luminance_top?: number | null;
          luminance_mid?: number | null;
          luminance_bottom?: number | null;
          terms?: string[];
          excerpts?: string[];
          family?: string | null;
          error?: string | null;
          analyzed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          client_id?: string;
          path?: string;
          mime?: string;
          kind?: "image" | "pdf" | "font";
          status?: "pending" | "analyzed" | "failed";
          width?: number | null;
          height?: number | null;
          dominant_color?: string | null;
          luminance_top?: number | null;
          luminance_mid?: number | null;
          luminance_bottom?: number | null;
          terms?: string[];
          excerpts?: string[];
          family?: string | null;
          error?: string | null;
          analyzed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assets_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assets_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      asset_embeddings: {
        Row: {
          id: string;
          asset_id: string;
          kind: "visual" | "semantic";
          embedding: number[];
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          kind: "visual" | "semantic";
          embedding: number[];
          meta?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          kind?: "visual" | "semantic";
          embedding?: number[];
          meta?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "asset_embeddings_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          id: string;
          org_id: string;
          project_id: string;
          scheduled_at: string;
          status: "scheduled" | "published" | "failed";
          channel_targets: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          project_id: string;
          scheduled_at: string;
          status?: "scheduled" | "published" | "failed";
          channel_targets?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          project_id?: string;
          scheduled_at?: string;
          status?: "scheduled" | "published" | "failed";
          channel_targets?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: true;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_org_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      match_asset_embeddings: {
        Args: {
          p_client_id: string;
          p_kind: string;
          p_query: number[];
          p_match_count?: number;
        };
        Returns: { asset_id: string; similarity: number }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
