import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getAllUsers, createUser } from '../api/authService';
import { getUserAccess, updateUserAccess } from '../api/accessService';

function setAllChildrenChecked(nodes, checked) {
  return nodes.map((node) => ({
    ...node,
    checked,
    indeterminate: false,
    children: node.children
      ? setAllChildrenChecked(node.children, checked)
      : undefined,
  }));
}

// update checkbox tree and handle parent-child + indeterminate state
function updateTree(nodes, targetId, checked) {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return {
        ...node,
        checked,
        indeterminate: false, // reset indeterminate when directly toggled
        children: node.children
          ? setAllChildrenChecked(node.children, checked) // update all children
          : undefined,
      };
    }

    if (node.children) {
      const updatedChildren = updateTree(node.children, targetId, checked);
      const checkedChildrenCount = updatedChildren.filter(
        (child) => child.checked
      ).length;
      const totalChildren = updatedChildren.length;

      return {
        ...node,
        children: updatedChildren,
        checked: checkedChildrenCount > 0, // show tick if any child is checked
        indeterminate: false, // never show horizontal line
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


// map API access response into checkbox tree structure
function mapAccessResponseToPermissionTree(accessData) {
  if (!accessData?.surveys) return [];

  return accessData.surveys.map((survey) => {
    const children = (survey.facilities || []).map((facility) => ({
      id: `${survey.surveyId}-${facility.facilityCode}`,
      label: facility.facilityName,
      checked: facility.isGranted,
      indeterminate: false, // default child state
      facilityCode: facility.facilityCode,
      facilityName: facility.facilityName,
      surveyId: survey.surveyId,
    }));

    const checkedChildrenCount = children.filter((child) => child.checked).length;
    const totalChildren = children.length;

    return {
      id: survey.surveyId,
      label: survey.surveyName,
      checked: checkedChildrenCount > 0 || survey.isGranted, // show tick if any child is checked
      indeterminate: false, // never show horizontal line
      allFacilitiesGranted: survey.allFacilitiesGranted,
      children,
    };
  });
}

// build PUT API payload from selected permissions
function buildAccessUpdatePayload(permissions) {
  const surveys = permissions
    .map((survey) => {
      const children = survey.children || [];
      const checkedChildren = children.filter((child) => child.checked);

      if (checkedChildren.length === 0) {
        return null; // skip if nothing selected
      }

      return {
        surveyId: survey.id,
        facilityCodes: checkedChildren.map((child) => child.facilityCode), // send selected facilities
      };
    })
    .filter(Boolean);

  return { surveys };
}


export default function AuthorizationManagementPage() {
  // Stores search input for facility permissions
  const [facilitySearch, setFacilitySearch] = useState('');

  // Stores the currently selected user from the user list
  const [selectedUser, setSelectedUser] = useState(null);

  // Stores whether the logged-in user can access this page
  const [canAccessPage, setCanAccessPage] = useState(false);

  // Stores whether the page access check is still loading
  const [checkingAccess, setCheckingAccess] = useState(true);

  //permissions and loading permissions
  const [permissions, setPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const [originalPermissions, setOriginalPermissions] = useState([]);

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
  const [formErrors, setFormErrors] = useState({});
  const [successToast, setSuccessToast] = useState({
    open: false,
    message: '',
    userName: '',
  });
  const [creatingUser, setCreatingUser] = useState(false);
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

  // Check admin access from stored user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const isActiveAdmin =
      String(user?.userRole || "").toLowerCase() === "admin" &&
      user?.isActive === true;

    setCanAccessPage(isActiveAdmin);
    setCheckingAccess(false);
  }, []);

  useEffect(() => {
    // Load users only after confirming the user is an active admin
    if (canAccessPage) {
      fetchUsers('', 1);
    }
  }, [canAccessPage]);

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

  const selectedUserIsAdmin = isAdminUser(selectedUser?.userRole);

  const [expandedNodes, setExpandedNodes] = useState({
    'retirement-village': false,
    'residential-care': false,
  });

  const filteredPermissionTree = useMemo(() => {
    return filterPermissionTree(permissions, facilitySearch);
  }, [permissions, facilitySearch]);

  // Check whether the current permissions are different from the originally loaded permissions
  // If different, enable Save button; if same, disable it
  const hasChanges = useMemo(() => {
    return JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
  }, [permissions, originalPermissions]);

  const allChecked =
    permissions.length > 0 && permissions.every((node) => node.checked);

  const toggleAllPermissions = (checked) => {
    if (selectedUserIsAdmin) return;
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


  const loadUserPermissions = async (user) => {
    if (!user) return;

    setPermissionError('');
    setLoadingPermissions(true);

    try {
      const res = await getUserAccess(user.id);
      const result = res.data;

      if (result?.success) {
        const mappedPermissions = mapAccessResponseToPermissionTree(result.data);

        const finalPermissions = isAdminUser(user?.userRole)
          ? setAllChildrenChecked(mappedPermissions, true)
          : mappedPermissions;

        setPermissions(finalPermissions);
        setOriginalPermissions(JSON.parse(JSON.stringify(finalPermissions)));
      } else {
        setPermissions([]);
        setPermissionError(result?.message || 'Failed to load permissions.');
      }
    } catch (error) {
      console.error('Failed to fetch user access:', error);
      setPermissions([]);
      setPermissionError(
        error?.response?.data?.message || 'Failed to load permissions.'
      );
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  useEffect(() => {
    if (!selectedUser) return;
    loadUserPermissions(selectedUser);
  }, [selectedUser?.id]);

  const togglePermissionNode = (id, checked) => {
    if (selectedUserIsAdmin) return;
    setPermissions((prev) => updateTree(prev, id, checked));
  };

  const handleCancel = () => {
    setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
    setPermissionError('');
  };
  const handleSave = async () => {
    if (!selectedUser) {
      alert('Please select a user first');
      return;
    }

    try {
      const payload = buildAccessUpdatePayload(permissions);

      const res = await updateUserAccess(selectedUser.id, payload);
      const result = res.data;

      if (result?.success) {
        console.log('Save response:', result);

        setSuccessToast({
          open: true,
          message: result.message || 'Access updated successfully',
          userName: selectedUser.username,
        });

        setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
      }
      else {
        alert(result?.message || 'Failed to save permissions.');
      }
    } catch (error) {
      console.error('Failed to save permissions:', error);
      alert(error?.response?.data?.message || 'Failed to save permissions.');
    }
  };
  useEffect(() => {
    if (!successToast.open) return;

    const timer = setTimeout(() => {
      setSuccessToast({ open: false, message: '', userName: '' });
    }, 5000);

    return () => clearTimeout(timer);
  }, [successToast.open]);


  // Reset all Add User form fields and validation errors
  const resetAddUserForm = () => {
    setNewUserEmail('');        // clear email input
    setNewUserFullName('');     // clear full name input
    setNewUserPassword('');     // clear password input
    setNewUserRole('Employee'); // reset role to default
    setFormErrors({});          // clear all validation / API errors
  };

  // Close modal and discard all unsaved form data
  const handleCloseAddUserModal = () => {
    resetAddUserForm();           // clear inputs + errors
    setShowAddUserModal(false);   // close modal
  };

  // Add user API Integration
  const handleAddUser = async () => {
    setFormErrors({});

    const errors = {};


    // Strong validation patterns
    const namePattern = /^[a-zA-Z\s'-]+$/;   // ONLY letters + space
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // proper email
    // block script / symbols in name
    if (newUserFullName && !namePattern.test(newUserFullName.trim())) {
      errors.fullName = "Only letters and spaces allowed";
    }
    // proper email validation
    if (newUserEmail && !emailPattern.test(newUserEmail.trim())) {
      errors.email = "Enter a valid email";
    }


    if (!newUserEmail.trim()) {
      errors.email = 'Email is required';
    }

    if (!newUserFullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!newUserPassword.trim()) {
      errors.password = 'Password is required';
    } else {
      if (newUserPassword.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      } else if (!/[A-Za-z]/.test(newUserPassword)) {
        errors.password = 'Password must contain a letter';
      } else if (!/[0-9]/.test(newUserPassword)) {
        errors.password = 'Password must contain a number';
      }
    }

    if (!newUserRole.trim()) {
      errors.role = 'Role is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setCreatingUser(true);

      const payload = {
        username: newUserEmail.trim(),
        fullName: newUserFullName.trim(),
        password: newUserPassword.trim(),
        userRole: newUserRole.trim().toLowerCase(),
        isActive: true,
      };

      const res = await createUser(payload);
      const result = res.data;

      if (result?.success) {
        setFormErrors({});

        handleCloseAddUserModal();

        setSuccessToast({
          open: true,
          message: result.message || 'User created successfully',
          userName: newUserFullName.trim() || newUserEmail.trim(),
        });

        setPageNumber(1);
        await fetchUsers(userSearch, 1);
      } else {
        setFormErrors({
          api: result?.message || 'Failed to create user',
        });
      }
    } catch (error) {
      console.error('Failed to create user:', error);

      setFormErrors({
        api: error?.response?.data?.message || 'Failed to create user.',
      });
    } finally {
      setCreatingUser(false);
    }
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
                disabled={selectedUserIsAdmin}
                ref={(el) => {
                  if (el) {
                    el.indeterminate = !!node.indeterminate;
                  }
                }}
                onChange={(e) => togglePermissionNode(node.id, e.target.checked)}
                className={`h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${selectedUserIsAdmin ? 'cursor-not-allowed opacity-70' : ''
                  }`}
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

  // Wait until access check is complete
  if (checkingAccess) {
    return null;
  }

  // Block non-admin or inactive users
  if (!canAccessPage) {
    return <Navigate to="/dashboard" replace />;
  }

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
                  User Management
                </h2>

                <button
                  onClick={() => {
                    setFormErrors({});
                    setShowAddUserModal(true);
                  }}
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

              {selectedUserIsAdmin && (
                <div className="rounded-xl border border-[#dfe3ff] bg-[#f3f4ff] px-4 py-3 text-sm text-[#4f46e5]">
                  This user is an admin. Full permissions are applied by default and cannot be edited here.
                </div>
              )}
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
                      disabled={selectedUserIsAdmin}
                      onChange={(e) => toggleAllPermissions(e.target.checked)}
                      className={`h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${selectedUserIsAdmin ? 'cursor-not-allowed opacity-70' : ''
                        }`}
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

                {loadingPermissions ? (
                  <p className="text-sm text-gray-500">Loading permissions...</p>
                ) : permissionError ? (
                  <p className="text-sm text-red-500">{permissionError}</p>
                ) : (
                  renderPermissionTree(filteredPermissionTree)
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                disabled={!hasChanges || selectedUserIsAdmin}
                className={`rounded-xl border px-5 py-2 text-sm font-medium transition ${!hasChanges || selectedUserIsAdmin
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                    : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || selectedUserIsAdmin}
                className={`rounded-xl px-5 py-2 text-sm font-semibold shadow-sm transition ${hasChanges && !selectedUserIsAdmin
                    ? 'bg-[#4f46e5] text-white hover:bg-[#4338ca]'
                    : 'cursor-not-allowed bg-gray-300 text-gray-500'
                  }`}
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
                onClick={handleCloseAddUserModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {formErrors.api && (
              <div className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-600">
                {formErrors.api}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (!/[<>"'`;(){}]/.test(value)) {
                      setNewUserEmail(value);
                      setFormErrors((prev) => ({ ...prev, email: '', api: '' }));
                    } else {
                      setFormErrors((prev) => ({
                        ...prev,
                        email: 'Invalid characters in email',
                        api: '',
                      }));
                    }
                  }}
                  placeholder="Enter email"
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-100 ${formErrors.email
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-[#d9def0] focus:border-indigo-500'
                    }`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUserFullName}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (/^[a-zA-Z\s'-]*$/.test(value)) {
                      setNewUserFullName(value);
                      setFormErrors((prev) => ({ ...prev, fullName: '', api: '' }));
                    } else {
                      setFormErrors((prev) => ({
                        ...prev,
                        fullName: 'Only letters and spaces allowed',
                        api: '',
                      }));
                    }
                  }}
                  placeholder="Enter full name"
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-100 ${formErrors.fullName
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-[#d9def0] focus:border-indigo-500'
                    }`}
                />
                {formErrors.fullName && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => {
                    setNewUserPassword(e.target.value);
                    setFormErrors((prev) => ({ ...prev, password: '', api: '' }));
                  }}
                  placeholder="Enter password"
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-100 ${formErrors.password
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-[#d9def0] focus:border-indigo-500'
                    }`}
                />
                {formErrors.password && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => {
                    setNewUserRole(e.target.value);
                    setFormErrors((prev) => ({ ...prev, role: '', api: '' }));
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:ring-2 focus:ring-indigo-100 ${formErrors.role
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-[#d9def0] focus:border-indigo-500'
                    }`}
                >
                  <option value="Admin">Admin</option>
                  <option value="Employee">Employee</option>
                </select>
                {formErrors.role && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.role}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCloseAddUserModal}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={creatingUser}
                className="rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creatingUser && (
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                )}
                {creatingUser ? 'Creating...' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {successToast.open && (
        <div className="fixed top-5 right-5 z-50">
          <div className="w-[360px] rounded-2xl border border-[#dfe3ff] bg-white shadow-lg">
            <div className="flex items-start gap-3 p-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2ff]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-[#4f46e5]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <div className="mt-1 text-sm text-gray-600">
                  {successToast.message}{" "}
                  <span className="font-semibold text-[#4f46e5]">
                    "{successToast.userName}"
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSuccessToast({ open: false, message: '', userName: '' })}
                className="ml-2 rounded-lg px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="h-1 w-full overflow-hidden rounded-b-2xl bg-[#eef2ff]">
              <div className="h-full w-full bg-[#4f46e5] animate-[toastbar_5s_linear_forwards]" />
            </div>
          </div>

          <style>{`
            @keyframes toastbar_5s_linear_forwards {
            from { transform: translateX(0%); }
            to { transform: translateX(-100%); }
            }
          `}</style>

        </div>
      )}

    </div>
  );
}