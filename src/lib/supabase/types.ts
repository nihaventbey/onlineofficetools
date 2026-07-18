export type ToolStatus = "draft" | "published";

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
};

export type Database = {
  public: {
    Tables: Tables;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      tool_status: ToolStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type ToolRow = Tables["tools"]["Row"];
export type ToolTranslationRow = Tables["tool_translations"]["Row"];
export type MediaRow = Tables["media"]["Row"];

export type PublishedTool = ToolRow & {
  translations: ToolTranslationRow[];
};
