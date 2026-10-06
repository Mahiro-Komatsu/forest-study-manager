import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface CloudStudyData {
  sync_code: string;
  tasks_json: string;
  logs_json: string;
  events_json?: string;
  active_task_id: string;
  updated_at: string;
}

// クラウドからデータを取得
export const fetchCloudData = async (syncCode: string) => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('study_sync_rooms')
      .select('*')
      .eq('sync_code', syncCode)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase fetch error:', error);
      return null;
    }
    return data as CloudStudyData | null;
  } catch (err) {
    console.error('Failed to fetch from Supabase:', err);
    return null;
  }
};

// クラウドにデータを保存・同期
export const saveCloudData = async (
  syncCode: string,
  tasks: any[],
  logs: any[],
  activeTaskId: string,
  events: any[] = []
) => {
  if (!supabase) return false;
  try {
    const payload = {
      sync_code: syncCode,
      tasks_json: JSON.stringify(tasks),
      logs_json: JSON.stringify(logs),
      events_json: JSON.stringify(events),
      active_task_id: activeTaskId,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('study_sync_rooms')
      .upsert(payload, { onConflict: 'sync_code' });

    if (error) {
      console.error('Supabase save error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to save to Supabase:', err);
    return false;
  }
};
