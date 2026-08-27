export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: Record<string, {
      Row: Record<string, unknown>;
      Insert: Record<string, unknown>;
      Update: Record<string, unknown>;
      Relationships: [];
    }>;
    Views: Record<string, never>;
    Functions: {
      register_solo: { Args: { payload: Json }; Returns: Json };
      create_team_and_register: { Args: { payload: Json }; Returns: Json };
      join_team_by_code: { Args: { invite_code: string }; Returns: Json };
      leave_current_team: { Args: never; Returns: Json };
      remove_team_member: { Args: { member_user_id: string }; Returns: Json };
      upsert_round_submission: { Args: { payload: Json }; Returns: Json };
      check_in_by_pass: { Args: { token_value: string }; Returns: Json };
    };
    Enums: Record<string, string>;
    CompositeTypes: Record<string, never>;
  };
}
