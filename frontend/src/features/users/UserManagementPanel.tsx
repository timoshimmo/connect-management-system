import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { ConfirmModal } from '@/components/ui';
import type { ApiUser } from '@/lib/apiTypes';
import { useUsersQuery, useUpdateUserMutation } from './hooks';
import { UsersTable } from './UsersTable';
import { UserDetailModal } from './UserDetailModal';
import { EditUserModal } from './EditUserModal';
import { DrawingRegisterUsersPanel } from '@/features/drawing-register-users';

type Tab = 'ms-publishing' | 'drawing-register';

/**
 * Controller-only user roster — mounted inline as the "User Management" view
 * in MS Publishing's sidebar, the same way Archive/Pending Assignment/etc.
 * render inline rather than navigating to a separate page. Two distinct
 * account systems (MS Publishing's User collection vs. the Drawing
 * Register's separate DrawingRegisterUser collection — see requirement 3:
 * "Do NOT mix Drawing Register users with MS Publishing users") get their
 * own tab and their own table, never merged into one list.
 */
export function UserManagementPanel() {
  const [tab, setTab] = useState<Tab>('ms-publishing');

  return (
    <div>
      <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-card">
        <button
          type="button"
          onClick={() => setTab('ms-publishing')}
          className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            tab === 'ms-publishing' ? 'bg-brand-700 text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          MS Publishing Users
        </button>
        <button
          type="button"
          onClick={() => setTab('drawing-register')}
          className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            tab === 'drawing-register' ? 'bg-brand-700 text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Drawing Register Users
        </button>
      </div>

      {tab === 'ms-publishing' ? <MSPublishingUsersPanel /> : <DrawingRegisterUsersPanel />}
    </div>
  );
}

function MSPublishingUsersPanel() {
  const { data: users = [], isLoading } = useUsersQuery();
  const updateUser = useUpdateUserMutation();

  const [viewUser, setViewUser] = useState<ApiUser | null>(null);
  const [editUser, setEditUser] = useState<ApiUser | null>(null);
  const [toggleUser, setToggleUser] = useState<ApiUser | null>(null);

  return (
    <>
      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-card">
          Loading users…
        </div>
      ) : (
        <UsersTable
          users={users}
          onView={setViewUser}
          onEdit={setEditUser}
          onToggleStatus={setToggleUser}
          headerAction={
            <Link
              to="/users/new"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
            >
              <UserPlus className="h-3.5 w-3.5" /> New User
            </Link>
          }
        />
      )}

      {viewUser && <UserDetailModal user={viewUser} onClose={() => setViewUser(null)} />}

      {editUser && (
        <EditUserModal
          user={editUser}
          isSubmitting={updateUser.isPending}
          onClose={() => setEditUser(null)}
          onSave={(payload) =>
            updateUser.mutate({ id: editUser.id, ...payload }, { onSuccess: () => setEditUser(null) })
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
                longer be able to sign in. Their account and audit history are kept, and they can be reactivated at
                any time.
              </p>
            ) : (
              <p>
                Reactivate <span className="font-semibold text-gray-800">{toggleUser.name}</span>? They will be able
                to sign in again immediately.
              </p>
            )
          }
        />
      )}
    </>
  );
}
