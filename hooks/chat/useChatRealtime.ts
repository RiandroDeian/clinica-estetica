"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useChatRealtime(
  canalId: string,
  onUpdate: () => void
) {
  useEffect(() => {
    if (!canalId) return;

    const channel = supabase
      .channel(`chat-${canalId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_mensagens",
          filter: `canal_id=eq.${canalId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canalId, onUpdate]);
}