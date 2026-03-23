import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getAllUsers } from '../api/authService';

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
  const [facilitySearch, setFacilitySearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState(initialPermissions);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Employee');

  // user management API-integration related states
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const displayedUsers = useMemo(() => users, [users]);

  const visiblePages = useMemo(() => {
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let start = Math.max(pageNumber - 2, 1);
    let end = start + maxVisible - 1;

    if (end > totalPages) {
      end = totalPages;
      start = end - maxVisible + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [pageNumber, totalPages]);

  const fetchUsers = async (searchValue = '', page = 1) => {
    try {
      setLoadingUsers(true);
      setUserError('');

      const params = {
        PageNumber: page,
        PageSize: pageSize,
      };

      if (searchValue.trim()) {
        params.Search = searchValue.trim();
      }

      const res = await getAllUsers(params);
      const result = res.data;

      if (result?.success) {
        const userList = result.data || [];
        setUsers(userList);
        setTotalPages(result.totalPages || 1);

        setSelectedUser((prev) => {
          if (!userList.length) return null;
          if (!prev) return userList[0];

          const stillExists = userList.find((u) => u.id === prev.id);
          return stillExists || userList[0];
        });
      } else {
        setUsers([]);
        setSelectedUser(null);
        setUserError(result?.message || 'Failed to load users.');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      setSelectedUser(null);
      setUserError(
        error?.response?.data?.message || 'Failed to load users.'
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers('', 1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageNumber(1);
      fetchUsers(userSearch, 1);
    }, 400);

    return () => clearTimeout(timer);
  }, [userSearch]);

  useEffect(() => {
    fetchUsers(userSearch, pageNumber);
  }, [pageNumber]);

  const isAdminUser = (role) =>
    role?.toLowerCase?.().trim() === 'admin';

  const [expandedNodes, setExpandedNodes] = useState({
    'retirement-village': false,
    'residential-care': false,
  });

  const filteredPermissionTree = useMemo(() => {
    return filterPermissionTree(permissions, facilitySearch);
  }, [permissions, facilitySearch]);

  const allChecked =
    permissions.length > 0 && permissions.every((node) => node.checked);

  const toggleAllPermissions = (checked) => {
    setPermissions((prev) => setAllChildrenChecked(prev, checked));
  };

  const toggleExpandNode = (id) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const areAllExpanded = useMemo(() => {
    const parentIds = [];

    const collectParentIds = (nodes) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          parentIds.push(node.id);
          collectParentIds(node.children);
        }
      });
    };

    collectParentIds(permissions);

    return (
      parentIds.length > 0 &&
      parentIds.every((id) => expandedNodes[id] === true)
    );
  }, [permissions, expandedNodes]);

  const toggleExpandCollapseAll = () => {
    const allParentIds = {};

    const collectParentIds = (nodes, expandValue) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          allParentIds[node.id] = expandValue;
          collectParentIds(node.children, expandValue);
        }
      });
    };

    collectParentIds(permissions, !areAllExpanded);
    setExpandedNodes(allParentIds);
  };

  useEffect(() => {
    if (facilitySearch.trim()) {
      const allParentIds = {};

      const collectParentIds = (nodes) => {
        nodes.forEach((node) => {
          if (node.children && node.children.length > 0) {
            allParentIds[node.id] = true;
            collectParentIds(node.children);
          }
        });
      };

      collectParentIds(permissions);
      setExpandedNodes(allParentIds);
    }
  }, [facilitySearch, permissions]);

  const userPermissionsMap = {
    June: initialPermissions,
    Sithu: [
      {
        id: 'retirement-village',
        label: 'Retirement Village',
        checked: true,
        children: [
          { id: 'village-1', label: 'Village Name 1', checked: true },
          { id: 'village-2', label: 'Village Name 2', checked: false },
          { id: 'village-3', label: 'Village Name 3', checked: true },
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
    ],
    'Xi Chen': initialPermissions,
    Zhoujian: initialPermissions,
    Jin: initialPermissions,
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);

    const userPermissions =
      userPermissionsMap[user.fullName] ||
      userPermissionsMap[user.username] ||
      initialPermissions;

    setPermissions(JSON.parse(JSON.stringify(userPermissions)));
  };

  const togglePermissionNode = (id, checked) => {
    setPermissions((prev) => updateTree(prev, id, checked));
  };

  const handleSave = () => {
    if (!selectedUser) {
      alert('Please select a user first');
      return;
    }

    console.log('Selected user:', selectedUser);
    console.log('Permissions:', permissions);
    alert(`Permissions saved for ${selectedUser.username}`);
  };

  const handleAddUser = () => {
    if (
      !newUserEmail.trim() ||
      !newUserFullName.trim() ||
      !newUserPassword.trim() ||
      !newUserRole.trim()
    ) {
      alert('Please fill in all required fields');
      return;
    }

    console.log('New user:', {
      email: newUserEmail,
      fullName: newUserFullName,
      password: newUserPassword,
      role: newUserRole,
    });

    alert('User added successfully');

    setNewUserEmail('');
    setNewUserFullName('');
    setNewUserPassword('');
    setNewUserRole('Employee');
    setShowAddUserModal(false);
  };

  const renderPermissionTree = (nodes, level = 0) => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes[node.id] ?? false;

      return (
        <div key={node.id} className={level === 0 ? 'mb-6' : 'mb-3'}>
          <div
            className="flex items-center gap-3"
            style={{ marginLeft: `${level * 28}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpandNode(node.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d9def0] bg-white text-gray-500 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
              >
                {isExpanded ? (
                  <ChevronDown size={16} strokeWidth={2.5} />
                ) : (
                  <ChevronRight size={16} strokeWidth={2.5} />
                )}
              </button>
            ) : (
              <div className="w-8" />
            )}

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={node.checked}
                onChange={(e) => togglePermissionNode(node.id, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span
                className={`text-sm ${level === 0
                  ? 'font-semibold text-[#33406f]'
                  : 'font-medium text-gray-600'
                  }`}
              >
                {node.label}
              </span>
            </label>
          </div>

          {hasChildren && isExpanded && (
            <div className="mt-3">{renderPermissionTree(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#f6f7fb] px-8 py-6">
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1e2b5c]">
            Authorisation Management
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-600">
            Select a user to view and assign permissions.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-[550px_minmax(0,1fr)]">
          {/* Left panel */}
          <div className="flex min-h-[650px] flex-col rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 border-b pb-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-[#2f3a68]">
                  User Name
                </h2>

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
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by email or full name..."
                  className="w-full rounded-xl border border-[#d9def0] bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="flex-1">
              <div className="space-y-1">
                {loadingUsers ? (
                  <div className="px-3 py-3 text-sm text-gray-500">Loading users...</div>
                ) : userError ? (
                  <div className="px-3 py-3 text-sm text-red-500">{userError}</div>
                ) : displayedUsers.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-gray-500">No users found.</div>
                ) : (
                  displayedUsers.map((user) => (
                    <label
                      key={user.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition ${selectedUser?.id === user.id
                        ? 'bg-[#eef0ff] shadow-sm'
                        : 'hover:bg-[#f8f9ff]'
                        }`}
                    >
                      <input
                        type="radio"
                        name="selectedUser"
                        checked={selectedUser?.id === user.id}
                        onChange={() => handleSelectUser(user)}
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />

                      <div className="group relative flex items-center gap-2">
                        <span
                          className={`text-sm ${selectedUser?.id === user.id
                            ? 'font-semibold text-[#2f3a68]'
                            : 'font-medium text-gray-700'
                            }`}
                        >
                          {user.username}
                        </span>

                        {isAdminUser(user.userRole) && (
                          <span className="rounded-full bg-[#ece8ff] px-2 py-0.5 text-[11px] font-semibold text-[#5b3df5]">
                            Admin
                          </span>
                        )}

                        <div className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg group-hover:block">
                          {user.fullName || 'No full name'}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="mt-auto pt-5">
              <div className="flex items-center justify-between rounded-2xl border border-[#e8ebfb] bg-[#f7f8ff] px-3 py-2.5 shadow-sm">
                <button
                  onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                  disabled={pageNumber === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dde2f3] bg-white text-gray-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ‹
                </button>

                <div className="flex items-center gap-2">
                  {visiblePages.map((page) => {
                    const isActive = pageNumber === page;

                    return (
                      <button
                        key={page}
                        onClick={() => setPageNumber(page)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${isActive
                          ? 'bg-[#4f46e5] text-white shadow-md'
                          : 'border border-transparent bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                          }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setPageNumber((prev) => Math.min(prev + 1, totalPages || 1))
                  }
                  disabled={pageNumber === totalPages || totalPages === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dde2f3] bg-white text-gray-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex min-h-[650px] flex-col rounded-2xl border border-[#eceffd] bg-white p-5 shadow-sm">
            <div className="mb-4 border-b pb-4">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">
                Selected user
              </h2>

              {selectedUser ? (
                <div className="rounded-xl border border-[#dfe3ff] bg-[#f3f4ff] px-4 py-3 text-sm text-[#4338ca]">
                  <div className="font-semibold">{selectedUser.username}</div>
                  <div className="mt-1 text-xs text-[#5c6699]">
                    {selectedUser.fullName}
                  </div>
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-500">No user selected</p>
              )}
            </div>

            <div className="mb-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Select facility permission:
              </h3>
            </div>

            <div
              className={`min-h-[470px] rounded-2xl border border-[#e8ebfb] bg-[#f7f8ff] p-5 ${!selectedUser ? 'pointer-events-none opacity-50' : ''
                }`}
            >
              {!selectedUser && (
                <p className="mb-3 text-sm font-medium text-gray-500">
                  Select a user to view and assign permissions.
                </p>
              )}

              <div className="max-h-[470px] overflow-y-auto pr-2">
                <div className="mb-4 flex items-center justify-between">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(e) => toggleAllPermissions(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-semibold text-[#33406f]">All</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleExpandCollapseAll}
                      className="rounded-xl border border-[#d9def0] bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      {areAllExpanded ? 'Collapse All' : 'Expand All'}
                    </button>
                  </div>
                </div>

                {renderPermissionTree(filteredPermissionTree)}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-xl border border-gray-200 bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200">
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-xl bg-[#4f46e5] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338ca]"
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
                  Email
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full rounded-xl border border-[#d9def0] bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-[#d9def0] bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-[#d9def0] bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full rounded-xl border border-[#d9def0] bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="Admin">Admin</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
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