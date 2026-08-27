"use client";

import { useEffect, useState } from "react";
import { Activity, UserRound, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Metrics {
  totalPlayers: number;
  teamsCount: number;
  soloRegistrations: number;
}

interface MetricRow {
  total_players: number;
  teams_count: number;
  solo_count: number;
}

export function LiveRegistrationMetrics({ initial, enabled }: { initial: Metrics; enabled: boolean }) {
  const [metrics, setMetrics] = useState(initial);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    const channel = supabase
      .channel("public-registration-metrics")
      .on("postgres_changes", { event: "*", schema: "public", table: "registration_metrics", filter: "id=eq.1" }, (payload) => {
        const row = payload.new as unknown as MetricRow;
        if (!row?.total_players && row?.total_players !== 0) return;
        setMetrics({ totalPlayers: row.total_players, teamsCount: row.teams_count, soloRegistrations: row.solo_count });
      })
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => { void supabase.removeChannel(channel); };
  }, [enabled]);

  const entries = [
    { label: "All players", value: metrics.totalPlayers, icon: Activity },
    { label: "Registered teams", value: metrics.teamsCount, icon: UsersRound },
    { label: "Solo registrations", value: metrics.soloRegistrations, icon: UserRound }
  ];

  return <section className="live-metrics" aria-label="Live registration counts">
    <div className="live-metrics-heading"><span>REALM ACTIVITY</span><b className={connected ? "is-connected" : ""}><i />{enabled ? connected ? "LIVE" : "SYNCING" : "PREVIEW"}</b></div>
    <div className="live-metrics-grid" aria-live="polite">
      {entries.map(({ label, value, icon: Icon }) => <article key={label}><Icon aria-hidden="true" /><div><strong>{value.toLocaleString()}</strong><span>{label}</span></div></article>)}
    </div>
  </section>;
}
