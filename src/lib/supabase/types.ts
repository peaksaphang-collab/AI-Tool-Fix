// Hand-written to match supabase/migrations/*.sql
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts

export type ReportStatus = "pending" | "in_progress" | "done" | "cannot_proceed";

export type Urgency = "critical" | "high" | "medium" | "low";

export interface PublicReportStatus {
  tracking_code: string;
  status: ReportStatus;
  urgency: Urgency | null;
  building_name: string;
  room_name: string;
  service_type_name: string | null;
  equipment: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface Database {
  public: {
    Tables: {
      buildings: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: { id?: string; name?: string; created_at?: string };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          building_id: string;
          name: string;
          floor: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          building_id: string;
          name: string;
          floor?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          building_id?: string;
          name?: string;
          floor?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_building_id_fkey";
            columns: ["building_id"];
            isOneToOne: false;
            referencedRelation: "buildings";
            referencedColumns: ["id"];
          },
        ];
      };
      staff: {
        Row: { id: string; full_name: string; created_at: string };
        Insert: { id: string; full_name: string; created_at?: string };
        Update: { id?: string; full_name?: string; created_at?: string };
        Relationships: [];
      };
      service_types: {
        Row: { id: number; name: string };
        Insert: { id: number; name: string };
        Update: { id?: number; name?: string };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          building_id: string;
          room_id: string;
          photo_path: string;
          reporter_name: string | null;
          ai_equipment_type: string | null;
          ai_description: string | null;
          ai_confidence: number | null;
          status: ReportStatus;
          service_type_id: number | null;
          contact_phone: string | null;
          assigned_to: string | null;
          urgency: Urgency | null;
          tracking_code: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          id?: string;
          building_id: string;
          room_id: string;
          photo_path: string;
          reporter_name?: string | null;
          ai_equipment_type?: string | null;
          ai_description?: string | null;
          ai_confidence?: number | null;
          status?: ReportStatus;
          service_type_id?: number | null;
          contact_phone?: string | null;
          assigned_to?: string | null;
          urgency?: Urgency | null;
          tracking_code?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          building_id?: string;
          room_id?: string;
          photo_path?: string;
          reporter_name?: string | null;
          ai_equipment_type?: string | null;
          ai_description?: string | null;
          ai_confidence?: number | null;
          status?: ReportStatus;
          service_type_id?: number | null;
          contact_phone?: string | null;
          assigned_to?: string | null;
          urgency?: Urgency | null;
          tracking_code?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reports_building_id_fkey";
            columns: ["building_id"];
            isOneToOne: false;
            referencedRelation: "buildings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      report_status_history: {
        Row: {
          id: number;
          report_id: string;
          status: ReportStatus;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          id?: number;
          report_id: string;
          status: ReportStatus;
          changed_by?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: number;
          report_id?: string;
          status?: ReportStatus;
          changed_by?: string | null;
          changed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_status_history_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      public_report_status: {
        Args: { code: string };
        Returns: PublicReportStatus[];
      };
      public_repair_stats: {
        Args: Record<string, never>;
        Returns: { done_30d: number; open_now: number; avg_hours: number | null }[];
      };
      public_open_count_for_room: {
        Args: { room: string };
        Returns: number;
      };
    };
    Enums: { report_status: ReportStatus };
    CompositeTypes: Record<string, never>;
  };
}
