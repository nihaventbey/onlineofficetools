export type ToolStatus = "draft" | "published";
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ToolFaq = { q: string; a: string };

type Tables = {
  tools: {
    Row: {
      id: string;
      slug: string;
      category: string | null;
      status: ToolStatus;
      cover_path: string | null;
      sort_order: number;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      slug: string;
      category?: string | null;
      status?: ToolStatus;
      cover_path?: string | null;
      sort_order?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      slug?: string;
      category?: string | null;
      status?: ToolStatus;
      cover_path?: string | null;
      sort_order?: number;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  tool_translations: {
    Row: {
      id: string;
      tool_id: string;
      locale: string;
      title: string;
      short_description: string;
      seo_title: string | null;
      seo_description: string | null;
      content: string | null;
      faqs: Json;
      howto_steps: Json;
      content_blocks: Json;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      tool_id: string;
      locale: string;
      title: string;
      short_description?: string;
      seo_title?: string | null;
      seo_description?: string | null;
      content?: string | null;
      faqs?: Json;
      howto_steps?: Json;
      content_blocks?: Json;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      tool_id?: string;
      locale?: string;
      title?: string;
      short_description?: string;
      seo_title?: string | null;
      seo_description?: string | null;
      content?: string | null;
      faqs?: Json;
      howto_steps?: Json;
      content_blocks?: Json;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "tool_translations_tool_id_fkey";
        columns: ["tool_id"];
        isOneToOne: false;
        referencedRelation: "tools";
        referencedColumns: ["id"];
      },
    ];
  };
  media: {
    Row: {
      id: string;
      path: string;
      alt_text: string | null;
      mime_type: string | null;
      size_bytes: number | null;
      uploaded_by: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      path: string;
      alt_text?: string | null;
      mime_type?: string | null;
      size_bytes?: number | null;
      uploaded_by?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      path?: string;
      alt_text?: string | null;
      mime_type?: string | null;
      size_bytes?: number | null;
      uploaded_by?: string | null;
      created_at?: string;
    };
    Relationships: [];
  };
  site_settings: {
    Row: {
      id: string;
      key: string;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      key: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      key?: string;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  site_setting_translations: {
    Row: {
      id: string;
      setting_id: string;
      locale: string;
      value: string;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      setting_id: string;
      locale: string;
      value: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      setting_id?: string;
      locale?: string;
      value?: string;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "site_setting_translations_setting_id_fkey";
        columns: ["setting_id"];
        isOneToOne: false;
        referencedRelation: "site_settings";
        referencedColumns: ["id"];
      },
    ];
  };
  tool_revisions: {
    Row: {
      id: string;
      tool_id: string;
      actor_id: string | null;
      snapshot: Json;
      created_at: string;
    };
    Insert: {
      id?: string;
      tool_id: string;
      actor_id?: string | null;
      snapshot: Json;
      created_at?: string;
    };
    Update: {
      id?: string;
      tool_id?: string;
      actor_id?: string | null;
      snapshot?: Json;
      created_at?: string;
    };
    Relationships: [];
  };
  cms_audit_events: {
    Row: {
      id: string;
      actor_id: string | null;
      action: "create" | "update" | "delete" | "restore";
      entity_type: string;
      entity_id: string | null;
      before: Json | null;
      after: Json | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      actor_id?: string | null;
      action: "create" | "update" | "delete" | "restore";
      entity_type: string;
      entity_id?: string | null;
      before?: Json | null;
      after?: Json | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      actor_id?: string | null;
      action?: "create" | "update" | "delete" | "restore";
      entity_type?: string;
      entity_id?: string | null;
      before?: Json | null;
      after?: Json | null;
      created_at?: string;
    };
    Relationships: [];
  };
  tool_feedback_stats: {
    Row: {
      tool_slug: string;
      yes_count: number;
      no_count: number;
      updated_at: string;
    };
    Insert: {
      tool_slug: string;
      yes_count?: number;
      no_count?: number;
      updated_at?: string;
    };
    Update: {
      tool_slug?: string;
      yes_count?: number;
      no_count?: number;
      updated_at?: string;
    };
    Relationships: [];
  };
  tool_feedback_events: {
    Row: {
      id: string;
      tool_slug: string;
      vote: "yes" | "no";
      client_hash: string;
      vote_date: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      tool_slug: string;
      vote: "yes" | "no";
      client_hash: string;
      vote_date?: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      tool_slug?: string;
      vote?: "yes" | "no";
      client_hash?: string;
      vote_date?: string;
      created_at?: string;
    };
    Relationships: [];
  };
};

export type Database = {
  public: {
    Tables: Tables;
    Views: {
      media_public: {
        Row: {
          id: string | null;
          path: string | null;
          alt_text: string | null;
          mime_type: string | null;
          size_bytes: number | null;
          created_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      admin_upsert_tool: {
        Args: { payload: Json };
        Returns: string;
      };
      admin_restore_tool_revision: {
        Args: { revision_id: string };
        Returns: string;
      };
      submit_tool_feedback: {
        Args: { p_slug: string; p_vote: string; p_client_hash: string };
        Returns: Json;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_public_setting_key: {
        Args: { key: string };
        Returns: boolean;
      };
    };
    Enums: {
      tool_status: ToolStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type ToolRow = Tables["tools"]["Row"];
export type ToolTranslationRow = Tables["tool_translations"]["Row"];
export type MediaRow = Tables["media"]["Row"];
export type ToolRevisionRow = Tables["tool_revisions"]["Row"];
export type CmsAuditEventRow = Tables["cms_audit_events"]["Row"];
export type ToolFeedbackStatsRow = Tables["tool_feedback_stats"]["Row"];

export type PublishedTool = ToolRow & {
  translations: ToolTranslationRow[];
};
