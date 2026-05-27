import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "../../context/AuthContext.jsx";
import { hasPerm, PERMISSIONS, ROLES } from "../../utils/permissions.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";

import {
  useUsersQuery,
  useAssignRole,
  useRemoveRole,
  useDeleteUser,
} from "../../services/queries.js";

import {
  PageHeader,
  Card,
  CardHeader,
  Button,
  Input,
  Select,
  Field,
  Chip,
  Badge,
  Skeleton,
  SkeletonRow,
  EmptyState,
  ConfirmDialog,
  Modal,
  Breadcrumbs,
} from "../../components/ui.jsx";

// Non-admin roles only — admin can never be assigned via the UI.
const ASSIGNABLE_ROLES = [
  ROLES.USER,
  ROLES.MANAGER,
  ROLES.SECURITY_ANALYST,
  ROLES.AUDITOR,
];

export default function AdminUsers() {
  const navigate = useNavigate();
  const { permissions } = useAuth();

  const canRead = hasPerm(permissions, PERMISSIONS.USER_READ);
  const canAssign = hasPerm(permissions, PERMISSIONS.ROLE_ASSIGN);
  const canDelete = hasPerm(permissions, PERMISSIONS.USER_DELETE);

  // Filter state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const debouncedSearch = useDebouncedValue(search, 250);

  // Fetch
  const { data, isLoading, isFetching, isError, refetch } = useUsersQuery(
    {},
    // We filter client-side; the backend has no search param yet.
  );
  const users = data?.users || [];

  // Modal state
  const [roleModal, setRoleModal] = useState(null); // { user, action: "assign"|"remove" }
  const [deleteTarget, setDeleteTarget] = useState(null);

  const assignRoleM = useAssignRole();
  const removeRoleM = useRemoveRole();
  const deleteUserM = useDeleteUser();

  const filtered = useMemo(() => {
    let list = users;
    if (debouncedSearch.trim()) {
      const s = debouncedSearch.trim().toLowerCase();
      list = list.filter(
        (u) =>
          (u.email || "").toLowerCase().includes(s) ||
          (u.username || "").toLowerCase().includes(s)
      );
    }
    if (roleFilter !== "all") {
      list = list.filter((u) => (u.roles || []).includes(roleFilter));
    }
    return list;
  }, [users, debouncedSearch, roleFilter]);

  if (!canRead) {
    return (
      <NoAccess title="Users" />
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Console", to: "/admin", onClick: () => navigate("/admin") },
          { label: "Users & Roles" },
        ]}
      />

      <PageHeader
        eyebrow="USER MANAGEMENT"
        title="Users & Roles"
        subtitle="Search users, inspect access, assign or remove roles. Every change is audited."
        actions={
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <Card padded>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7">
            <Field label="Search">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or username…"
              />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Role filter">
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All roles</option>
                {[ROLES.ADMIN, ...ASSIGNABLE_ROLES].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="md:col-span-2 flex items-end">
            <div className="w-full text-right text-xs text-white/55">
              {filtered.length} of {users.length}
            </div>
          </div>
        </div>
      </Card>

      {/* List */}
      {isError && (
        <Card padded className="!p-4 border-red-500/30 bg-red-500/5">
          <div className="text-sm text-red-200">
            Failed to load users. Try refreshing.
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search || roleFilter !== "all" ? "No users match your filters" : "No users yet"}
          subtitle={search || roleFilter !== "all" ? "Try clearing your search or role filter." : "Once users sign up, they'll appear here."}
          action={
            (search || roleFilter !== "all") && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((u) => (
              <motion.div
                key={u.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <UserRow
                  user={u}
                  canAssign={canAssign}
                  canDelete={canDelete}
                  onAssign={() => setRoleModal({ user: u, action: "assign" })}
                  onRemove={() => setRoleModal({ user: u, action: "remove" })}
                  onDelete={() => setDeleteTarget(u)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Role modal */}
      <RoleModal
        open={!!roleModal}
        action={roleModal?.action}
        user={roleModal?.user}
        loading={assignRoleM.isPending || removeRoleM.isPending}
        onClose={() => setRoleModal(null)}
        onConfirm={async (roleName) => {
          if (!roleModal) return;
          const { user, action } = roleModal;
          if (action === "assign") {
            await assignRoleM.mutateAsync({ userId: user.id, roleName });
          } else {
            await removeRoleM.mutateAsync({ userId: user.id, roleName });
          }
          setRoleModal(null);
        }}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this user?"
        description={
          deleteTarget && (
            <>
              You're about to delete{" "}
              <span className="text-white font-semibold">
                {deleteTarget.email}
              </span>
              . This wipes their sessions, role assignments, and audit logs.
              This cannot be undone.
            </>
          )
        }
        confirmLabel="Delete user"
        variant="danger"
        loading={deleteUserM.isPending}
        onClose={() => !deleteUserM.isPending && setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteUserM.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function UserRow({ user, canAssign, canDelete, onAssign, onRemove, onDelete }) {
  const userRoles = Array.isArray(user.roles) ? user.roles : [];
  const isAdmin = userRoles.includes(ROLES.ADMIN);

  return (
    <Card padded className="!p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-white font-semibold truncate">{user.email}</div>
            {user.username && (
              <span className="text-white/50 text-sm">@{user.username}</span>
            )}
            {isAdmin && <Badge variant="info">admin</Badge>}
            {user.mfaEnabled && <Badge variant="good">MFA</Badge>}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {userRoles.length ? (
              userRoles.map((r) => <Chip key={r}>{r}</Chip>)
            ) : (
              <span className="text-xs text-white/55">No roles</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {canAssign && (
            <Button size="sm" variant="secondary" onClick={onAssign}>
              Assign role
            </Button>
          )}
          {canAssign && userRoles.some((r) => r !== ROLES.ADMIN) && (
            <Button size="sm" variant="ghost" onClick={onRemove}>
              Remove role
            </Button>
          )}
          {canDelete && !isAdmin && (
            <Button size="sm" variant="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function RoleModal({ open, action, user, loading, onClose, onConfirm }) {
  const [roleName, setRoleName] = useState("");

  React.useEffect(() => {
    if (open) setRoleName("");
  }, [open]);

  if (!user) return null;

  const userRoles = Array.isArray(user.roles) ? user.roles : [];
  const isAssign = action === "assign";

  const roleOptions = isAssign
    ? ASSIGNABLE_ROLES
    : userRoles.filter((r) => r !== ROLES.ADMIN);

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={isAssign ? "Assign a role" : "Remove a role"}
    >
      <p className="text-sm text-white/65">
        {isAssign
          ? "Pick a role to assign. This replaces the user's current non-admin role."
          : "Pick a role to remove. The user keeps their other roles."}
        <span className="block mt-1 text-white/45 text-xs">
          User: <span className="text-white/80">{user.email}</span>
        </span>
      </p>

      <div className="mt-4">
        <Field label="Role">
          <Select
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
          >
            <option value="">Select a role…</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
        {!roleOptions.length && (
          <div className="mt-2 text-xs text-white/55">
            No roles available.
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={isAssign ? "primary" : "danger"}
          loading={loading}
          disabled={!roleName}
          onClick={() => onConfirm(roleName)}
        >
          {isAssign ? "Assign" : "Remove"}
        </Button>
      </div>
    </Modal>
  );
}

function NoAccess({ title }) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} eyebrow="ACCESS DENIED" />
      <Card padded>
        <p className="text-sm text-white/70">
          You don't have permission to view this page. Ask an admin to grant you
          the appropriate permission.
        </p>
      </Card>
    </div>
  );
}
