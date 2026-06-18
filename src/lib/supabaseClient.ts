"use client";

import { createClient } from "@supabase/supabase-js";

// .env.local 에 넣은 값을 읽어옵니다.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 설정이 비어 있으면 화면에 친절한 안내를 띄우기 위해 플래그로 둡니다.
export const isSupabaseConfigured = Boolean(url && anonKey);

// 설정이 없을 때 createClient가 에러를 던지지 않도록 더미 값으로 막아둡니다.
export const supabase = createClient(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "placeholder-anon-key",
  {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
);
