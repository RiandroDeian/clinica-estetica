"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Notificacao = {
  id: string;
  tipo: "agendamento" | "chat" | "faturamento" | "estoque" | "recepcao";
  titulo: string;
  mensagem: string;
  lida: boolean;
  criado_em: string;
};

export function useNotificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);

  const adicionar = useCallback((nova: Omit<Notificacao, "id" | "lida" | "criado_em">) => {
    const notif: Notificacao = {
      id: Math.random().toString(36).slice(2),
      lida: false,
      criado_em: new Date().toISOString(),
      ...nova,
    };
    setNotificacoes(prev => [notif, ...prev].slice(0, 50));
    setNaoLidas(prev => prev + 1);

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(nova.titulo, { body: nova.mensagem, icon: "/logo-moncie-print.jpg" });
    }
  }, []);

  function marcarTodasLidas() {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    setNaoLidas(0);
  }

  function marcarLida(id: string) {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    setNaoLidas(prev => Math.max(0, prev - 1));
  }

  function limpar() {
    setNotificacoes([]);
    setNaoLidas(0);
  }

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const canalAgendamentos = supabase
      .channel("agendamentos-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agendamentos" },
        (payload) => {
          adicionar({
            tipo: "agendamento",
            titulo: "Novo Agendamento",
            mensagem: "Um novo agendamento foi criado no sistema.",
          });
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "agendamentos" },
        (payload: any) => {
          const novo = payload.new;
          if (novo.status === "confirmado") {
            adicionar({ tipo: "recepcao", titulo: "Paciente em Atendimento", mensagem: "Um paciente iniciou o atendimento." });
          } else if (novo.status === "finalizado") {
            adicionar({ tipo: "recepcao", titulo: "Atendimento Finalizado", mensagem: "Um atendimento foi concluido." });
          } else if (novo.status === "cancelado") {
            adicionar({ tipo: "agendamento", titulo: "Agendamento Cancelado", mensagem: "Um agendamento foi cancelado." });
          }
        }
      )
      .subscribe();

    const canalChat = supabase
      .channel("chat-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_mensagens" },
        (payload: any) => {
          adicionar({
            tipo: "chat",
            titulo: "Nova Mensagem",
            mensagem: payload.new.conteudo?.slice(0, 60) ?? "Nova mensagem no chat da equipe.",
          });
        }
      )
      .subscribe();

    const canalFaturamento = supabase
      .channel("faturamento-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "faturamentos" },
        (payload: any) => {
          const valor = Number(payload.new.valor_final ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
          adicionar({
            tipo: "faturamento",
            titulo: "Novo Pagamento",
            mensagem: `Pagamento de ${valor} registrado.`,
          });
        }
      )
      .subscribe();

    const canalEstoque = supabase
      .channel("estoque-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "estoque" },
        (payload: any) => {
          const item = payload.new;
          if (item.quantidade <= item.quantidade_minima) {
            adicionar({
              tipo: "estoque",
              titulo: "Estoque Baixo",
              mensagem: `${item.nome} esta com estoque baixo (${item.quantidade} ${item.unidade}).`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalAgendamentos);
      supabase.removeChannel(canalChat);
      supabase.removeChannel(canalFaturamento);
      supabase.removeChannel(canalEstoque);
    };
  }, [adicionar]);

  return { notificacoes, naoLidas, marcarLida, marcarTodasLidas, limpar };
}