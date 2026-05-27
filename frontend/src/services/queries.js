// Centralized React Query hooks + mutations.
// Every admin page goes through these so cache invalidation is consistent
// and we get near-real-time updates "for free" via polling + refetchOnFocus.

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  assignRole,
  removeRole,
  listSessions,
  revokeSession,
  listAuditLogs,
  grantTempPermission,
  listTempPermissions,
  revokeTempPermission,
} from "./adminService.js";

import { getAdminSummary, getMe } from "./iamService.js";

/* -------------------------------------------------------------------------- */
/*                                Query keys                                  */
/* -------------------------------------------------------------------------- */

export const qk = {
  me: ["me"],
  summary: ["admin", "summary"],
  users: (params = {}) => ["admin", "users", params],
  sessions: (params = {}) => ["admin", "sessions", params],
  audit: (params = {}) => ["admin", "auditLogs", params],
  temp: (params = {}) => ["admin", "tempPermissions", params],
};

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function errMsg(err, fallback) {
  return err?.response?.data?.error || err?.message || fallback;
}

/* -------------------------------------------------------------------------- */
/*                                  Queries                                   */
/* -------------------------------------------------------------------------- */

export function useMe(options = {}) {
  return useQuery({
    queryKey: qk.me,
    queryFn: getMe,
    staleTime: 60_000,
    ...options,
  });
}

export function useAdminSummary(options = {}) {
  return useQuery({
    queryKey: qk.summary,
    queryFn: getAdminSummary,
    refetchInterval: 15_000, // live-feeling dashboard
    staleTime: 5_000,
    ...options,
  });
}

export function useUsersQuery(params = {}) {
  return useQuery({
    queryKey: qk.users(params),
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}

export function useSessionsQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: qk.sessions(params),
    queryFn: () => listSessions(params),
    placeholderData: keepPreviousData,
    refetchInterval: 10_000, // sessions tab feels live
    staleTime: 5_000,
    ...options,
  });
}

export function useAuditLogsQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: qk.audit(params),
    queryFn: () => listAuditLogs(params),
    placeholderData: keepPreviousData,
    refetchInterval: 12_000,
    staleTime: 5_000,
    ...options,
  });
}

export function useTempPermissionsQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: qk.temp(params),
    queryFn: () => listTempPermissions(params),
    placeholderData: keepPreviousData,
    refetchInterval: 8_000, // shortest TTL of the four
    staleTime: 3_000,
    ...options,
  });
}

/* -------------------------------------------------------------------------- */
/*                                Mutations                                   */
/* -------------------------------------------------------------------------- */

// User mutations
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success("User created");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: qk.summary });
    },
    onError: (err) => toast.error(errMsg(err, "Could not create user")),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => updateUser(id, patch),
    onSuccess: () => {
      toast.success("User updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => toast.error(errMsg(err, "Update failed")),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: qk.summary });
    },
    onError: (err) => toast.error(errMsg(err, "Delete failed")),
  });
}

// Role mutations
export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleName }) => assignRole(userId, roleName),
    onSuccess: (_data, vars) => {
      toast.success(`Assigned role: ${vars.roleName}`);
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: qk.me });
    },
    onError: (err) => toast.error(errMsg(err, "Assign failed")),
  });
}

export function useRemoveRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleName }) => removeRole(userId, roleName),
    onSuccess: (_data, vars) => {
      toast.success(`Removed role: ${vars.roleName}`);
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: qk.me });
    },
    onError: (err) => toast.error(errMsg(err, "Remove failed")),
  });
}

// Session mutations (optimistic)
export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => revokeSession(payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ["admin", "sessions"] });
      const snapshots = qc.getQueriesData({ queryKey: ["admin", "sessions"] });
      // Optimistically flip the active flag everywhere this session appears.
      snapshots.forEach(([key, data]) => {
        if (!data?.sessions) return;
        const patched = {
          ...data,
          sessions: data.sessions.map((s) =>
            (payload.sessionId && s.id === payload.sessionId) ||
            (payload.refreshTokenId && s.refreshTokenId === payload.refreshTokenId)
              ? { ...s, active: false }
              : s
          ),
        };
        qc.setQueryData(key, patched);
      });
      return { snapshots };
    },
    onError: (err, _vars, ctx) => {
      // Roll back on failure.
      ctx?.snapshots?.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(errMsg(err, "Revoke failed"));
    },
    onSuccess: () => {
      toast.success("Session revoked");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "sessions"] });
      qc.invalidateQueries({ queryKey: ["admin", "auditLogs"] });
      qc.invalidateQueries({ queryKey: qk.summary });
    },
  });
}

// Temp permission mutations
export function useGrantTempPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => grantTempPermission(payload),
    onSuccess: () => {
      toast.success("Temporary permission granted");
      qc.invalidateQueries({ queryKey: ["admin", "tempPermissions"] });
      qc.invalidateQueries({ queryKey: ["admin", "auditLogs"] });
      qc.invalidateQueries({ queryKey: qk.summary });
    },
    onError: (err) => toast.error(errMsg(err, "Grant failed")),
  });
}

export function useRevokeTempPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (grantId) => revokeTempPermission({ grantId }),
    onMutate: async (grantId) => {
      await qc.cancelQueries({ queryKey: ["admin", "tempPermissions"] });
      const snapshots = qc.getQueriesData({
        queryKey: ["admin", "tempPermissions"],
      });
      snapshots.forEach(([key, data]) => {
        if (!data?.grants) return;
        const patched = {
          ...data,
          grants: data.grants.filter((g) => g.id !== grantId),
        };
        qc.setQueryData(key, patched);
      });
      return { snapshots };
    },
    onError: (err, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(errMsg(err, "Revoke failed"));
    },
    onSuccess: () => {
      toast.success("Temporary permission revoked");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tempPermissions"] });
      qc.invalidateQueries({ queryKey: ["admin", "auditLogs"] });
      qc.invalidateQueries({ queryKey: qk.summary });
    },
  });
}
