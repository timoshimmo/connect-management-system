import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { ConfirmModal } from '@/components/ui';
import type { ApiDrawingRegisterUser } from '@/lib/apiTypes';
import {
  useDrawingRegisterUsersQuery,
  useCreateDrawingRegisterUserMutation,
  useUpdateDrawingRegisterUserMutation,
  useResetDrawingRegisterUserPasswordMutation,
} from './hooks';
import { DrawingRegisterUsersTable } from './DrawingRegisterUsersTable';
import { DrawingRegisterUserDetailModal } from './DrawingRegisterUserDetailModal';
import { EditDrawingRegisterUserModal } from './EditDrawingRegisterUserModal';
import { CreateDrawingRegisterUserModal } from './CreateDrawingRegisterUserModal';
import { ResetDrawingRegisterUserPasswordModal } from './ResetDrawingRegisterUserPasswordModal';

/**
 * Controller-only Drawing Register user roster — the second tab in MS
 * Publishing's User Management view. Self-contained like
 * features/users/UserManagementPanel.tsx: owns its own data fetching and
 * modal state.
 */
export function DrawingRegisterUsersPanel() {
  const { data: users = [], isLoading } = useDrawingRegisterUsersQuery();
  const createUser = useCreateDrawingRegisterUserMutation();
  const updateUser = useUpdateDrawingRegisterUserMutation();
  const resetPassword = useResetDrawingRegisterUserPasswordMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [viewUser, setViewUser] = useState<ApiDrawingRegisterUser | null>(null);
  const [editUser, setEditUser] = useState<ApiDrawingRegisterUser | null>(null);
  const [toggleUser, setToggleUser] = useState<ApiDrawingRegisterUser | null>(null);
  const [resetUser, setResetUser] = useState<ApiDrawingRegisterUser | null>(null);

  return (
    <>
      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-card">
          Loading Drawing Register users…
        </div>
      ) : (
        <DrawingRegisterUsersTable
          users={users}
          onView={setViewUser}
          onEdit={setEditUser}
          onToggleStatus={setToggleUser}
          onResetPassword={setResetUser}
          headerAction={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
            >
              <UserPlus className="h-3.5 w-3.5" /> New User
            </button>
          }
        />
      )}

      {createOpen && (
        <CreateDrawingRegisterUserModal
          isSubmitting={createUser.isPending}
          onClose={() => setCreateOpen(false)}
          onCreate={(payload) => createUser.mutate(payload, { onSuccess: () => setCreateOpen(false) })}
        />
      )}

      {viewUser && <DrawingRegisterUserDetailModal user={viewUser} onClose={() => setViewUser(null)} />}

      {editUser && (
        <EditDrawingRegisterUserModal
          user={editUser}
          isSubmitting={updateUser.isPending}
          onClose={() => setEditUser(null)}
          onSave={(payload) =>
            updateUser.mutate({ id: editUser.id, ...payload }, { onSuccess: () => setEditUser(null) })
          }
        />
      )}

      {resetUser && (
        <ResetDrawingRegisterUserPasswordModal
          user={resetUser}
          isSubmitting={resetPassword.isPending}
          onClose={() => setResetUser(null)}
          onReset={(password) =>
            resetPassword.mutate({ id: resetUser.id, password }, { onSuccess: () => setResetUser(null) })
          }
        />
      )}

      {toggleUser && (
        <ConfirmModal
          title={toggleUser.status === 'Active' ? 'Deactivate User' : 'Activate User'}
          confirmLabel={toggleUser.status === 'Active' ? 'Deactivate' : 'Activate'}
          variant={toggleUser.status === 'Active' ? 'danger' : 'default'}
          isSubmitting={updateUser.isPending}
          onClose={() => setToggleUser(null)}
          onConfirm={() =>
            updateUser.mutate(
              { id: toggleUser.id, status: toggleUser.status === 'Active' ? 'Inactive' : 'Active' },
              { onSuccess: () => setToggleUser(null) }
            )
          }
          message={
            toggleUser.status === 'Active' ? (
              <p>
                Deactivate <span className="font-semibold text-gray-800">{toggleUser.name}</span>? They will no
                longer be able to sign in to the Drawing Register. Their account and audit history are kept, and
                they can be reactivated at any time.
              </p>
            ) : (
              <p>
                Reactivate <span className="font-semibold text-gray-800">{toggleUser.name}</span>? They will be able
                to sign in to the Drawing Register again immediately.
              </p>
            )
          }
        />
      )}
    </>
  );
}
