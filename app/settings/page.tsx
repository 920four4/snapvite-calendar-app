"use client";

import dynamic from "next/dynamic";

// Disable SSR since Supabase browser client requires runtime env vars and window
const SettingsClient = dynamic(() => import("./SettingsClient"), { ssr: false });

export default function SettingsPage() {
  return <SettingsClient />;
}
