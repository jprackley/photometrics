// -----------------------------------------------------------------------------
// Frontend API Service Layer
// -----------------------------------------------------------------------------
// Provides the single source of truth for API configuration, endpoint mapping,
// payload normalization, login bridging, data-source preference storage, and the
// reusable data-loading hook used by page components.
// -----------------------------------------------------------------------------

import { useEffect, useState } from "react";

// -----------------------------------------------------------------------------
// API CONFIGURATION
// -----------------------------------------------------------------------------
// These constants control whether the application reads from live backend API
// routes or from the local mock data sets in this file. The frontend supports
// standard API response shapes such as a plain array/object or an object with a
// top-level data/items property.
// Keep mock data ON by default so the deployed app stays usable while API work is tested.
// Set VITE_USE_API_DATA=true only when you intentionally want API mode as the initial default.
const DEFAULT_USE_API_DATA = String(import.meta.env.VITE_USE_API_DATA || "").toLowerCase() === "true";

// Use a versioned key so any previously-saved API-only preference does not keep forcing
// the app into API mode after this change is deployed.
const LEGACY_API_DATA_SETTING_KEY = "photometrics-use-api-data";
const API_DATA_SETTING_KEY = "photometrics-use-api-data-v2";
const API_DATA_SETTING_EVENT = "photometrics-api-data-setting-changed";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const DEFAULT_PAGE_LIMIT = 50;

/**
 * Reads the saved mock/API data-source preference and clears legacy values that caused stale API-only mode.
 */
function getUseApiDataSetting() {
    if (typeof window === "undefined") return DEFAULT_USE_API_DATA;

    // Clear the old key once so a browser that previously saved API-only mode
    // cannot keep causing a blank screen after the mock-data default is restored.
    window.localStorage.removeItem(LEGACY_API_DATA_SETTING_KEY);

    const savedValue = window.localStorage.getItem(API_DATA_SETTING_KEY);
    if (savedValue === null) return DEFAULT_USE_API_DATA;

    return savedValue === "true";
}

/**
 * Persists the mock/API preference and broadcasts the change to active React views.
 */
function saveUseApiDataSetting(value) {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(API_DATA_SETTING_KEY, String(value));
    window.dispatchEvent(new CustomEvent(API_DATA_SETTING_EVENT, { detail: value }));
}

/**
 * Adapter function so the frontend matches the backend data.
 */
function projectFromApi(project) {
    return {
        id: project.project_id,
        backendId: project.project_id,
        name: project.project_name,
        clientId: project.client_id,
        client: project.client_name || project.client_id || "Unassigned Client",
        startDate: project.start_time,
        dueDate: project.due_time,
        status: project.status,
        priority: project.priority,
        description: project.description || "",
        images: project.images || "0",
        progress: project.progress || 0,
    };
}

function projectToApi(project) {
    return {
        client_id: project.clientId,
        managed_by: project.managedBy || null,
        project_name: project.name,
        description: project.description || "",
        status: project.status,
        priority: project.priority || "Normal",
        start_time: project.startDate,
        due_time: project.dueDate,
    };
}

// Centralized route map for backend resources. Updating routes here keeps the UI components decoupled from backend path changes.
const API_ENDPOINTS = {
    // Authentication endpoints for login/logout and session handling.
    // The frontend expects the login response to include user details and, when available, an auth token or session identifier.
    auth: {
        // Primary authentication route. Until this route is available, the app uses
        // /users?all=true as a temporary database-backed login bridge.
        login: "/login",
        logout: "/logout",
    },
    // Future analytics and dashboard routes. These can be backed by SQL views,
    // reporting tables, or a separate analytics store as the backend evolves.
    
    //---------------------------------------------------------------------------------
    // Dashboard endpoints are read-only aggregated/statistical data.
    // These power charts, KPI cards, graph, workload tracking, and progress widgets.
    // Implemented data source can be optimized independently of the frontend.
    //----------------------------------------------------------------------------------
    dashboard: {
        kpis: "/dashboard/kpis",
        productivity: "/dashboard/productivity",
        workflow: "/dashboard/workflow",
        employeeActivity: "/dashboard/employee-activity",
        projectProgress: "/dashboard/project-progress",
    },

    //-----------------------------------------------------------------
    // CRUD for client accounts.
    // Backend provides:
    // Expected operations: list, read by ID, create, patch update, and delete/deactivate.
    clients: "/clients",

    //-----------------------------------------------------------------
    // CRUD for ALL user accounts.
    // Frontend expects:
    // Expected operations: list, read by ID, create, patch update, and delete/deactivate.
    // Also used for user role and permission metadata.
    users: "/users",

    //------------------------------------------------------------------
    // CRUD for projects.
    // Frontend expects:
    // Expected operations: list, read by ID, create, patch update, and delete/deactivate.
    // Main project management endpoint.
    // Stores project details, status, deadlines, linked client, assigned employees, uploaded files, etc.
    projects: "/projects",

    //------------------------------------------------------------------
    // Image/file upload CRUD for project attachments.
    // Used for project reference images, screenshots, documents, deliverables, etc.
    images: "/images",

    //-----------------------------------------------------------------------
    // Assignment API links employees/users to projects/tasks.
    // Frontend uses this for:
    // - assigning employees to projects
    // - assigning tasks
    // - workload distribution
    // - showing employee project lists
    // Expected relationships:
    // employeeId <-> projectId <-> taskId
    //----------------------------------------------------------------------
    assignments: "/assignments",

    //-----------------------------------------------------------------------
    // This API endpoint will be READ-ONLY. Use "/users" for all user management.
    // Frontend uses it for:
    // - employee directory
    // - employee profile management
    // - productivity tracking
    // - role/title info
    // - availability/status
    // - employee dashboard displays
    //-----------------------------------------------------------------------
    employees: "/employees",

    //-----------------------------------------------------------------------
    // Task CRUD tied to projects and employees.
    // Includes:
    // - task status
    // - priority
    // - due dates
    // - progress %
    // - timer tracking linkage
    //-----------------------------------------------------------------------
    tasks: "/tasks",

    //-----------------------------------------------------------------------
    // Stores clocked work time for tasks/projects.
    // Frontend timer system posts here.
    // Expected fields:
    // employeeId, taskId, startTime, endTime, duration
    //-----------------------------------------------------------------------
    timeEntries: "/time-entries",

    //-----------------------------------------------------------------------
    // Generated reports endpoint.
    // Used for exporting/filtering:
    // - employee productivity
    // - project progress
    // - time tracking
    // - utilization
    // - client/project summaries
    //------------------------------------------------------------------------
    reports: "/reports",

    //------------------------------------------------------------------------
    // Analytics endpoints for graphs, trends, forecasting, workload analysis, etc.
    // Mostly aggregated/calculated data.
    //------------------------------------------------------------------------
    analytics: "/analytics",

    //------------------------------------------------------------------------
    // Application/system settings storage.
    // Frontend currently needs:
    // - theme/dark mode
    // - dashboard preferences
    // - notification preferences
    // - timer behavior
    // - default filters/views
    // - role/permission settings
    // - company settings
    //-------------------------------------------------------------------------
    settings: "/settings",
};

/**
 * Sends a JSON request to the configured backend API and throws a clear error when the response fails.
 */
function buildApiUrl(endpoint) {
    const baseUrl = String(API_BASE_URL || "").replace(/\/$/, "");
    const path = String(endpoint || "").startsWith("/") ? endpoint : `/${endpoint}`;
    return `${baseUrl}${path}`;
}

/**
 * Sends a JSON API request and converts failed responses into useful JavaScript errors.
 */
async function apiRequest(endpoint, options = {}) {
    const response = await fetch(buildApiUrl(endpoint), {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    if (!response.ok) {
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

        try {
            const errorPayload = await response.json();
            errorMessage = errorPayload?.error?.message || errorPayload?.message || errorMessage;
        } catch {
            // Some failed responses do not include a JSON body. Keep the status-based message.
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        return null;
    }

    return response.json();
}

/**
 * Normalizes the different payload shapes the backend may return so page components can work with simple arrays or objects.
 */
function unwrapApiPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload?.data !== undefined) return payload.data;
    if (payload?.items !== undefined) return payload.items;
    return payload;
}

/**
 * Converts backend user fields into the frontend user shape used by auth and access checks.
 */
function normalizeBackendUser(user) {
    if (!user) return null;

    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    const displayName = user.display_name || `${firstName} ${lastName}`.trim() || user.email || "User";
    const role = user.account_role || user.role || user.title || "Employee";
    const accessLevel = user.is_admin || String(role).toLowerCase().includes("manager") || String(role).toLowerCase().includes("admin")
        ? "manager"
        : "employee";

    return {
        ...user,
        id: user.user_id || user.id,
        userId: user.user_id || user.id,
        employeeId: user.employee_id || user.employeeId || user.user_id || user.id,
        employeeName: displayName,
        name: displayName,
        email: user.email,
        role,
        accessLevel,
        title: user.title || role,
        department: user.department || "",
        status: user.status || (user.is_active === false ? "Inactive" : "Active"),
    };
}

/**
 * Provides a temporary database-backed login bridge when the dedicated auth route is not available.
 */
async function loginWithUsersEndpoint(credentials) {
    const payload = await apiRequest(`${API_ENDPOINTS.users}?all=true`);
    const users = unwrapApiPayload(payload) || [];
    const normalizedEmail = String(credentials?.email || "").trim().toLowerCase();
    const matchedUser = users.find((user) => String(user.email || "").trim().toLowerCase() === normalizedEmail);

    if (!matchedUser) {
        const error = new Error("No backend user exists for that email address.");
        error.status = 404;
        throw error;
    }

    return { user: normalizeBackendUser(matchedUser), authMode: "users-endpoint" };
}

/**
 * Returns an empty value that matches the mock/fallback shape so API mode never renders mock records while waiting or after an API failure.
 */
function getEmptyDataForFallback(fallbackData) {
    if (Array.isArray(fallbackData)) return [];
    if (fallbackData && typeof fallbackData === "object") return {};
    return null;
}

/**
 * Reusable data-loading hook. When database/API mode is enabled, it only uses live API data.
 * Mock data is used only when the Data Source setting is unchecked.
 */
function useApiPlaceholder(endpoint, fallbackData) {
    const [useApiData, setUseApiData] = useState(getUseApiDataSetting);
    const [data, setData] = useState(() => (getUseApiDataSetting() ? getEmptyDataForFallback(fallbackData) : fallbackData));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const syncApiDataSetting = () => setUseApiData(getUseApiDataSetting());

        window.addEventListener("storage", syncApiDataSetting);
        window.addEventListener(API_DATA_SETTING_EVENT, syncApiDataSetting);

        return () => {
            window.removeEventListener("storage", syncApiDataSetting);
            window.removeEventListener(API_DATA_SETTING_EVENT, syncApiDataSetting);
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        if (!useApiData || !endpoint) {
            setError(null);
            setData(fallbackData);
            return undefined;
        }

        setData(getEmptyDataForFallback(fallbackData));

        async function loadData() {
            setIsLoading(true);
            setError(null);

            try {
                const payload = await apiRequest(endpoint);
                const nextData = unwrapApiPayload(payload);

                if (isMounted && nextData !== undefined) {
                    setData(nextData);
                }
            } catch (apiError) {
                if (isMounted) {
                    setError(apiError.message);
                    setData(getEmptyDataForFallback(fallbackData));
                }

                console.warn(`API data failed for ${endpoint}. Mock data is disabled while database mode is on.`, apiError);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadData();

        return () => {
            isMounted = false;
        };
    }, [endpoint, fallbackData, useApiData]);

    return { data, isLoading, error };
}

// API action wrappers used by create, update, delete, authentication, settings, and timer workflows.
// Some routes are placeholders until the corresponding backend endpoints are implemented.
const apiPlaceholders = {
    login: async (credentials) => {
        try {
            const response = await apiRequest(API_ENDPOINTS.auth.login, {
                method: "POST",
                body: JSON.stringify(credentials),
            });
            const payload = unwrapApiPayload(response);
            return { ...payload, user: normalizeBackendUser(payload?.user || payload) };
        } catch (authError) {
            if (authError.status === 404 || authError.status === 405) {
                console.warn("Auth endpoint is not available. Using /users?all=true as a temporary database-backed login bridge.", authError);
                return loginWithUsersEndpoint(credentials);
            }

            throw authError;
        }
    },
    logout: () => apiRequest(API_ENDPOINTS.auth.logout, {
        method: "POST",
    }),
    createProject: (project) => apiRequest(API_ENDPOINTS.projects, {
        method: "POST",
        body: JSON.stringify(project),
    }),
    updateProject: (projectId, project) => apiRequest(`${API_ENDPOINTS.projects}/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(project),
    }),
    deleteProject: (projectId) => apiRequest(`${API_ENDPOINTS.projects}/${projectId}`, {
        method: "DELETE",
    }),
    createAssignment: (assignment) => apiRequest(API_ENDPOINTS.assignments, {
        method: "POST",
        body: JSON.stringify(assignment),
    }),
    updateAssignment: (assignmentId, assignment) => apiRequest(`${API_ENDPOINTS.assignments}/${assignmentId}`, {
        method: "PATCH",
        body: JSON.stringify(assignment),
    }),
    deleteAssignment: (assignmentId) => apiRequest(`${API_ENDPOINTS.assignments}/${assignmentId}`, {
        method: "DELETE",
    }),
    createEmployee: (employee) => apiRequest(API_ENDPOINTS.employees, {
        method: "POST",
        body: JSON.stringify(employee),
    }),
    updateEmployee: (employeeId, employee) => apiRequest(`${API_ENDPOINTS.employees}/${employeeId}`, {
        method: "PATCH",
        body: JSON.stringify(employee),
    }),
    deleteEmployee: (employeeId) => apiRequest(`${API_ENDPOINTS.employees}/${employeeId}`, {
        method: "DELETE",
    }),
    updateSettings: (settings) => apiRequest(API_ENDPOINTS.settings, {
        method: "PATCH",
        body: JSON.stringify(settings),
    }),
    updateUserProfile: (userId, profile) => apiRequest(`/users/${userId}/profile`, {
        method: "PATCH",
        body: JSON.stringify(profile),
    }),
    changeUserPassword: (userId, passwordData) => apiRequest(`/users/${userId}/password`, {
        method: "PATCH",
        body: JSON.stringify(passwordData),
    }),
    updateUserPreferences: (userId, preferences) => apiRequest(`/users/${userId}/preferences`, {
        method: "PATCH",
        body: JSON.stringify(preferences),
    }),
    createTask: (task) => apiRequest(API_ENDPOINTS.tasks, {
        method: "POST",
        body: JSON.stringify(task),
    }),
    updateTask: (taskId, task) => apiRequest(`${API_ENDPOINTS.tasks}/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(task),
    }),
    deleteTask: (taskId) => apiRequest(`${API_ENDPOINTS.tasks}/${taskId}`, {
        method: "DELETE",
    }),
    startTaskTimer: (taskId, startedAt, user) => apiRequest(`${API_ENDPOINTS.tasks}/${taskId}/timer/start`, {
        method: "POST",
        body: JSON.stringify({
            startedAt,
            userId: user?.id,
            employeeId: user?.employeeId,
            employeeName: user?.employeeName || user?.name,
        }),
    }),
    stopTaskTimer: (taskId, timeEntry) => apiRequest(`${API_ENDPOINTS.tasks}/${taskId}/timer/stop`, {
        method: "POST",
        body: JSON.stringify(timeEntry),
    }),
};

export {
    DEFAULT_USE_API_DATA,
    LEGACY_API_DATA_SETTING_KEY,
    API_DATA_SETTING_KEY,
    API_DATA_SETTING_EVENT,
    API_BASE_URL,
    DEFAULT_PAGE_LIMIT,
    getUseApiDataSetting,
    saveUseApiDataSetting,
    API_ENDPOINTS,
    buildApiUrl,
    apiRequest,
    unwrapApiPayload,
    normalizeBackendUser,
    loginWithUsersEndpoint,
    getEmptyDataForFallback,
    useApiPlaceholder,
    apiPlaceholders,
};
