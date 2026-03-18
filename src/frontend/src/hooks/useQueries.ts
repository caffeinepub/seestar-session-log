import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ObservingSession } from "../backend.d";
import { useActor } from "./useActor";

export function useGetStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSessions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSessions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSession(id: number) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSession(id);
    },
    enabled: !!actor && !isFetching && id > 0,
  });
}

export function useCreateSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: ObservingSession) => {
      if (!actor) throw new Error("Not connected");
      return actor.createSession(session);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      session,
    }: { id: number; session: ObservingSession }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateSession(id, session);
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["session", id] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteSession(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
