import React, { useMemo, useState } from 'react';

const mockUsers = [
  { id: 1, name: 'June' },
  { id: 2, name: 'Sithu' },
  { id: 3, name: 'Xi Chen' },
  { id: 4, name: 'Zhoujian' },
  { id: 5, name: 'Jin' },
];

const initialPermissions = [
  {
    id: 'retirement-village',
    label: 'Retirement Village',
    checked: false,
    children: [
      { id: 'village-1', label: 'Village Name 1', checked: false },
      { id: 'village-2', label: 'Village Name 2', checked: false },
      { id: 'village-3', label: 'Village Name 3', checked: false },
    ],
  },
  {
    id: 'residential-care',
    label: 'Residential Care',
    checked: false,
    children: [
      { id: 'name-a', label: 'Name A', checked: false },
      { id: 'name-b', label: 'Name B', checked: false },
      { id: 'name-c', label: 'Name C', checked: false },
      { id: 'name-d', label: 'Name D', checked: false },
    ],
  },
];

function setAllChildrenChecked(nodes, checked) {
  return nodes.map((node) => ({
    ...node,
    checked,
    children: node.children
      ? setAllChildrenChecked(node.children, checked)
      : undefined,
  }));
}

function updateTree(nodes, targetId, checked) {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return {
        ...node,
        checked,
        children: node.children
          ? setAllChildrenChecked(node.children, checked)
          : undefined,
      };
    }

    if (node.children) {
      const updatedChildren = updateTree(node.children, targetId, checked);
      const allChildrenChecked = updatedChildren.every((child) => child.checked);

      return {
        ...node,
        children: updatedChildren,
        checked: allChildrenChecked,
      };
    }

    return node;
  });
}

function filterPermissionTree(nodes, searchTerm) {
  if (!searchTerm.trim()) return nodes;

  return nodes
    .map((node) => {
      const matchesSelf = node.label
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const filteredChildren = node.children
        ? filterPermissionTree(node.children, searchTerm)
        : [];

      if (matchesSelf || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    })
    .filter(Boolean);
}

export default function AuthorizationManagementPage() {
  const [searchUser, setSearchUser] = useState('');
  const [facilitySearch, setFacilitySearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [permissions, setPermissions] = useState(initialPermissions);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Regional Manager');

  const filteredUsers = useMemo(() => {
    return mockUsers.filter((user) =>
      user.name.toLowerCase().includes(searchUser.toLowerCase())
    );
  }, [searchUser]);

  const filteredPermissionTree = useMemo(() => {
    return filterPermissionTree(permissions, facilitySearch);
  }, [permissions, facilitySearch]);

  const allChecked =
    permissions.length > 0 && permissions.every((node) => node.checked);

  const toggleAllPermissions = (checked) => {
    setPermissions((prev) => setAllChildrenChecked(prev, checked));
  };

  const toggleSelectedUser = (name) => {
    setSelectedUsers((prev) =>
      prev.includes(name)
        ? prev.filter((u) => u !== name)
        : [...prev, name]
    );
  };

  const removeSelectedUser = (name) => {
    setSelectedUsers((prev) => prev.filter((u) => u !== name));
  };

  const togglePermissionNode = (id, checked) => {
    setPermissions((prev) => updateTree(prev, id, checked));
  };

  const handleSave = () => {
    console.log('Selected users:', selectedUsers);
    console.log('Permissions:', permissions);
    alert('Permissions saved');
  };

  const handleAddUser = () => {
    if (!newUserName.trim() || !newUserPassword.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    console.log('New user:', {
      name: newUserName,
      password: newUserPassword,
      role: newUserRole,
    });

    alert('User added successfully');

    setNewUserName('');
    newUserPassword('');
    setNewUserRole('Regional Manager');
    setShowAddUserModal(false);
  };

  const renderPermissionTree = (nodes, level = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className={level === 0 ? 'mb-6' : 'mb-3'}>
        <label
          className="flex items-center gap-3"
          style={{ marginLeft: `${level * 28}px` }}
        >
          <input
            type="checkbox"
            checked={node.checked}
            onChange={(e) => togglePermissionNode(node.id, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span
            className={`text-sm ${level === 0
              ? 'font-medium text-gray-700'
              : 'font-normal text-gray-500'
              }`}
          >
            {node.label}
          </span>
        </label>

        {node.children && node.children.length > 0 && (
          <div className="mt-3">{renderPermissionTree(node.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen w-full bg-[#f6f7fb] px-8 py-6">
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#1f2a5a]">
            Authorisation Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Select one or more users to assign their permissions.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-[550px_minmax(0,1fr)]">
          {/* Left panel */}
          <div className="min-h-[650px] rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 border-b pb-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">User Name</h2>

                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="rounded-lg bg-[#4f46e5] px-3 py-2 text-sm font-medium text-white shadow hover:bg-[#4338ca]"
                >
                  + Add User
                </button>
              </div>

              <div className="w-full">
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Search for users..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 hover:bg-[#f8f9ff]"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.name)}
                    onChange={() => toggleSelectedUser(user.name)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{user.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="min-h-[650px] rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">
                Selected users:
              </h2>

              <div className="flex min-h-[52px] flex-wrap gap-2 border-b pb-4">
                {selectedUsers.length > 0 ? (
                  selectedUsers.map((user) => (
                    <div
                      key={user}
                      className="flex items-center gap-2 rounded-full bg-[#eef0ff] px-3 py-1.5 text-sm text-[#4f46e5]"
                    >
                      <span>{user}</span>
                      <button
                        onClick={() => removeSelectedUser(user)}
                        className="text-xs text-gray-500 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No users selected</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Select facility permission:
              </h3>

              {/* <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <input
                  type="text"
                  value={facilitySearch}
                  onChange={(e) => setFacilitySearch(e.target.value)}
                  placeholder="Search for facilities..."
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />

                <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500">
                  <option>Service Type</option>
                  <option>Experience</option>
                  <option>Day Club</option>
                  <option>Journey</option>
                </select>
              </div> */}
            </div>

            <div className="min-h-[470px] rounded-xl bg-[#f8f9ff] p-4">
              <div className="max-h-[470px] overflow-y-auto pr-2">
                <div className="mb-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(e) => toggleAllPermissions(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">All</span>
                  </label>
                </div>

                {renderPermissionTree(filteredPermissionTree)}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-lg bg-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-[#4f46e5] px-5 py-2 text-sm font-medium text-white hover:bg-[#4338ca]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Add User</h2>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  User Name
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter user name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => newUserPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  <option>Admin</option>
                  <option>Senior Leader</option>
                  <option>Regional Manager</option>
                </select>
              </div> */}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338ca]"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}