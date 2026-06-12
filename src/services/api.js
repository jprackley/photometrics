// =============================================================================
// API SERVICE LAYER
// =============================================================================
// Purpose:
// Centralized frontend integration layer responsible for:
//   • API communication and endpoint management
//   • Data normalization between backend and UI models
//   • Dashboard KPI transformations
//   • Authentication and session helpers
//   • Settings persistence and preference management
//   • Reusable React data-loading utilities
//
// Notes:
// This file acts as the contract between the React frontend and backend APIs.
// UI components should consume these helpers instead of calling backend
// endpoints directly.
// =============================================================================

// -----------------------------------------------------------------------------
// Frontend API Service Layer
// -----------------------------------------------------------------------------
// Provides the single source of truth for API configuration, endpoint mapping,
// payload normalization, login bridging, data-source preference storage, and the
// reusable data-loading hook used by page components.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";

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
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api";
const DEFAULT_PAGE_LIMIT = 50;

/**
 * Reads the saved mock/API data-source preference and clears legacy values that caused stale API-only mode.
 */
function getUseApiDataSetting() {
    if (typeof window === "undefined") return DEFAULT_USE_API_DATA;

    try {
        // Clear the old key once so a browser that previously saved API-only mode
        // cannot keep causing a blank screen after the mock-data default is restored.
        window.localStorage.removeItem(LEGACY_API_DATA_SETTING_KEY);

        const savedValue = window.localStorage.getItem(API_DATA_SETTING_KEY);
        if (savedValue === null) return DEFAULT_USE_API_DATA;

        return savedValue === "true";
    } catch (storageError) {
        console.warn("Data-source preference could not be read from localStorage. Using default.", storageError);
        return DEFAULT_USE_API_DATA;
    }
}

/**
 * Persists the mock/API preference and broadcasts the change to active React views.
 */
function saveUseApiDataSetting(value) {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem(API_DATA_SETTING_KEY, String(value));
    } catch (storageError) {
        console.warn("Data-source preference could not be saved to localStorage.", storageError);
    }

    window.dispatchEvent(new CustomEvent(API_DATA_SETTING_EVENT, { detail: value }));
}

/**
 * Adapter function so the frontend matches the backend data.
 */
function formatApiDateForDisplay(value) {
    if (!value) return "";

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return String(value);

    return parsedDate.toLocaleDateString([], {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

/**
 * Formats API date-time values into human-readable timestamps.
 */
function formatApiDateTimeForDisplay(value) {
    if (!value) return "";

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return String(value);

    return parsedDate.toLocaleString([], {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}


/**
 * Converts date input values into API-compatible date-time strings.
 */
function toApiDateTime(value) {
    if (!value) return undefined;

    const stringValue = String(value).trim();
    if (!stringValue) return undefined;

    const parsedDate = new Date(stringValue);
    if (Number.isNaN(parsedDate.getTime())) return undefined;

    return parsedDate.toISOString();
}

/**
 * Checks whether a value looks like a backend UUID.
 */
function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

/**
 * Converts dashboard metric values into safe numbers.
 */
function toMetricNumber(value, fallback = 0) {
    const numberValue = Number.parseFloat(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
}

/**
 * Builds a display name from optional first, middle, and last names.
 */
function buildDisplayName(firstName, middleName, lastName, fallback = "") {
    return [firstName, middleName, lastName]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim() || fallback;
}

/**
 * Splits a full name into editable name parts.
 */
function splitFullName(fullName = "") {
    const parts = String(fullName || "")
        .trim()
        .replace(/\s+/g, " ")
        .split(" ")
        .filter(Boolean);

    if (parts.length === 0) {
        return { firstName: "", middleName: "", lastName: "" };
    }

    if (parts.length === 1) {
        return { firstName: parts[0], middleName: "", lastName: parts[0] };
    }

    return {
        firstName: parts[0],
        middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
        lastName: parts[parts.length - 1],
    };
}

/**
 * Returns the best display name available from a backend employee record.
 */
function getDisplayNameFromApi(record, fallback = "Unnamed Employee") {
    const nameParts = buildDisplayName(record?.first_name, record?.middle_name, record?.last_name);

    return record?.display_name
        || record?.employee_name
        || record?.assigned_to_name
        || record?.name
        || nameParts
        || record?.email
        || fallback;
}

/**
 * Formats long backend identifiers for readable UI display.
 */
function shortBackendId(value, fallback = "Unassigned") {
    if (!value) return fallback;
    return String(value).slice(0, 8);
}

/**
 * Formats the last six characters of an identifier with a prefix.
 */
function lastSixBackendId(value, prefix = "ID") {
    if (!value) return "";
    const compact = String(value).replace(/[^0-9a-z]/gi, "");
    const source = compact || String(value);
    return `${prefix}-${source.slice(-6).toUpperCase()}`;
}

/**
 * Checks whether a backend row is seeded demo data.
 */
function isSeedRecord(record) {
    const searchable = [
        record?.email,
        record?.project_name,
        record?.task_name,
        record?.description,
        record?.notes,
        record?.name,
        record?.display_name,
        record?.employee_name,
        record?.assigned_to_name,
    ].join(" ").toLowerCase();

    return searchable.includes("[seed:photometrics]")
        || searchable.includes("seed.project")
        || searchable.includes("seed task")
        || searchable.includes("seed project")
        || searchable.includes("@photometrics.local");
}

/**
 * Converts supported API payload shapes into an array.
 */
function toArrayPayload(payload) {
    const unwrapped = unwrapApiPayload(payload);
    if (Array.isArray(unwrapped)) return unwrapped;
    return unwrapped ? [unwrapped] : [];
}


const ACCENT_COLOR_HEX_BY_NAME = {
    Violet: "#7c3aed",
    Blue: "#1976d2",
    Green: "#10b981",
    Slate: "#475569",
};

const TIMEZONE_IANA_BY_LABEL = {
    "Pacific Time": "America/Los_Angeles",
    "Eastern Time": "America/New_York",
    "London Time": "Europe/London",
};

const BACKEND_ALLOWED_SETTING_TIMEZONES = new Set(Object.values(TIMEZONE_IANA_BY_LABEL));

const TIMEZONE_LABEL_BY_IANA = Object.fromEntries(
    Object.entries(TIMEZONE_IANA_BY_LABEL).map(([label, value]) => [value, label])
);

/**
 * Converts data to boolean setting.
 */
function toBooleanSetting(value, fallback = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "yes", "on"].includes(normalized)) return true;
        if (["false", "0", "no", "off"].includes(normalized)) return false;
    }

    return fallback;
}

/**
 * Normalizes title option for this feature.
 */
function normalizeTitleOption(value, fallback) {
    if (!value) return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (!normalized) return fallback;

    return normalized
        .split(/[\s_-]+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

/**
 * Normalizes theme option for this feature.
 */
function normalizeThemeOption(value, fallback = "Light") {
    const option = normalizeTitleOption(value, fallback);
    return ["Light", "Dark", "System"].includes(option) ? option : fallback;
}

/**
 * Normalizes accent option for this feature.
 */
function normalizeAccentOption(value, fallback = "Violet") {
    if (!value) return fallback;

    const normalized = String(value).trim();
    const lowered = normalized.toLowerCase();

    if (lowered === "#1976d2" || lowered === "#2563eb" || lowered.includes("blue")) return "Blue";
    if (lowered === "#10b981" || lowered === "#059669" || lowered.includes("green")) return "Green";
    if (lowered === "#475569" || lowered === "#64748b" || lowered.includes("slate")) return "Slate";
    if (lowered === "#7c3aed" || lowered === "#8b5cf6" || lowered.includes("violet") || lowered.includes("purple")) return "Violet";

    return fallback;
}

/**
 * Normalizes timezone option for this feature.
 */
function normalizeTimezoneOption(value, fallback = "Pacific Time") {
    if (!value) return fallback;
    const stringValue = String(value).trim();

    if (TIMEZONE_LABEL_BY_IANA[stringValue]) return TIMEZONE_LABEL_BY_IANA[stringValue];
    if (TIMEZONE_IANA_BY_LABEL[stringValue]) return stringValue;

    const titleValue = normalizeTitleOption(stringValue.replace(/_/g, " "), fallback);
    if (TIMEZONE_IANA_BY_LABEL[titleValue]) return titleValue;

    return fallback;
}

/**
 * Returns first settings record for this feature.
 */
function getFirstSettingsRecord(payload) {
    const unwrapped = unwrapApiPayload(payload);
    if (Array.isArray(unwrapped)) return unwrapped[0] || null;
    return unwrapped || null;
}

/**
 * Maps backend settings into the frontend settings object.
 */
function normalizeBackendSettings(payload, baseSettings = {}, currentUser = null) {
    const record = getFirstSettingsRecord(payload);

    if (!record || typeof record !== "object") {
        return { ...baseSettings };
    }

    const baseCompany = baseSettings.company || {};
    const baseNotifications = baseSettings.notifications || {};
    const baseAppearance = baseSettings.appearance || {};

    const backendNotifications = record.notifications ?? record.notification_enabled ?? record.notifications_enabled;
    const notificationsEnabled = toBooleanSetting(backendNotifications, true);

    return {
        ...baseSettings,
        company: {
            ...baseCompany,
            companyName: record.companyname || record.company_name || record.companyName || baseCompany.companyName || "Photometrics",
            timezone: normalizeTimezoneOption(record.timezone || record.time_zone, baseCompany.timezone || "Pacific Time"),
            language: record.language || baseCompany.language || "en",
        },
        notifications: {
            ...baseNotifications,
            dueDateAlerts: notificationsEnabled,
            reviewQueueAlerts: notificationsEnabled,
            productivityAlerts: notificationsEnabled,
        },
        appearance: {
            ...baseAppearance,
            theme: normalizeThemeOption(record.theme, baseAppearance.theme || "Light"),
            accentColor: normalizeAccentOption(record.accentcolor || record.accent_color || record.accentColor, baseAppearance.accentColor || "Violet"),
            compactTables: toBooleanSetting(record.compacttables ?? record.compact_tables ?? record.compactTables, baseAppearance.compactTables || false),
            showDashboardTips: toBooleanSetting(record.showdashboardtips ?? record.show_dashboard_tips ?? record.showDashboardTips, baseAppearance.showDashboardTips ?? true),
        },
        backend: {
            ...(baseSettings.backend || {}),
            settingId: record.setting_id || record.settingId || baseSettings.backend?.settingId || null,
            userId: record.user_id || record.userId || currentUser?.userId || currentUser?.id || baseSettings.backend?.userId || null,
            createdAt: record.created_at || record.createdAt || baseSettings.backend?.createdAt || null,
            updatedAt: record.updated_at || record.updatedAt || baseSettings.backend?.updatedAt || null,
        },
    };
}

/**
 * Converts frontend settings into the backend settings payload.
 */
function settingsToApiPayload(settings = {}, currentUser = null) {
    const appearance = settings.appearance || {};
    const company = settings.company || {};
    const notifications = settings.notifications || {};
    const backend = settings.backend || {};

    // The backend validator expects camelCase body fields, even though PostgreSQL
    // returns unquoted camelCase columns as lowercase keys such as accentcolor.
    return {
        user_id: backend.userId || currentUser?.userId || currentUser?.id || currentUser?.employeeId,
        theme: ["light", "dark"].includes(String(appearance.theme || "Light").toLowerCase())
            ? String(appearance.theme || "Light").toLowerCase()
            : "light",
        accentColor: ACCENT_COLOR_HEX_BY_NAME[appearance.accentColor] || appearance.accentColor || ACCENT_COLOR_HEX_BY_NAME.Violet,
        compactTables: Boolean(appearance.compactTables),
        showDashboardTips: appearance.showDashboardTips !== false,
        notifications: Boolean(
            notifications.dueDateAlerts
            || notifications.reviewQueueAlerts
            || notifications.productivityAlerts
        ),
        companyName: company.companyName || "Photometrics",
        language: company.language || settings.language || "en",
        timezone: BACKEND_ALLOWED_SETTING_TIMEZONES.has(TIMEZONE_IANA_BY_LABEL[company.timezone] || company.timezone)
            ? (TIMEZONE_IANA_BY_LABEL[company.timezone] || company.timezone)
            : "America/Los_Angeles",
    };
}

const IMAGE_METRICS_NOTE_PREFIX = "[photometrics:image-metrics]";

/**
 * Returns default image metrics for this feature.
 */
function getDefaultImageMetrics(project = {}) {
    const totalImages = toMetricNumber(project.images ?? project.image_count ?? project.totalImages, 0);
    const completedImages = toMetricNumber(project.completedImages ?? project.completed_images, 0);
    const rejectedImages = toMetricNumber(project.rejectedImages ?? project.rejected_images, 0);
    const inProgressImages = toMetricNumber(project.inProgressImages ?? project.in_progress_images, 0);
    const pendingFallback = Math.max(0, totalImages - completedImages - rejectedImages - inProgressImages);

    return {
        totalImages,
        pendingImages: toMetricNumber(project.pendingImages ?? project.pending_images, pendingFallback),
        inProgressImages,
        completedImages,
        rejectedImages,
        deliveredImages: toMetricNumber(project.deliveredImages ?? project.delivered_images, completedImages),
        averageEditMinutes: toMetricNumber(project.averageEditMinutes ?? project.average_edit_minutes, 0),
        reviewNotes: project.reviewNotes || project.review_notes || "",
    };
}

/**
 * Splits project notes and image metrics for this feature.
 */
function splitProjectNotesAndImageMetrics(notes = "", project = {}) {
    const defaultMetrics = getDefaultImageMetrics(project);
    const rawNotes = String(notes || "");
    const markerIndex = rawNotes.indexOf(IMAGE_METRICS_NOTE_PREFIX);

    if (markerIndex === -1) {
        return { visibleNotes: rawNotes, imageMetrics: defaultMetrics };
    }

    const visibleNotes = rawNotes.slice(0, markerIndex).trim();
    const encoded = rawNotes.slice(markerIndex + IMAGE_METRICS_NOTE_PREFIX.length).trim();

    try {
        const parsed = JSON.parse(encoded);
        return {
            visibleNotes,
            imageMetrics: { ...defaultMetrics, ...parsed },
        };
    } catch {
        return { visibleNotes, imageMetrics: defaultMetrics };
    }
}

/**
 * Combines project notes and image metrics for this feature.
 */
function combineProjectNotesAndImageMetrics(notes = "", imageMetrics = {}) {
    const cleanNotes = String(notes || "").split(IMAGE_METRICS_NOTE_PREFIX)[0].trim();
    const metrics = getDefaultImageMetrics(imageMetrics);
    const encodedMetrics = JSON.stringify(metrics);

    return [cleanNotes, `${IMAGE_METRICS_NOTE_PREFIX}${encodedMetrics}`]
        .filter(Boolean)
        .join("\n");
}

/**
 * Maps a backend project into the frontend project row shape.
 */
function projectFromApi(project) {
    const { visibleNotes, imageMetrics } = splitProjectNotesAndImageMetrics(project.notes, project);
    const totalImages = imageMetrics.totalImages || toMetricNumber(project.image_count ?? project.images, 0);
    const completedImages = imageMetrics.completedImages || toMetricNumber(project.completed_images, 0);
    const totalTasks = toMetricNumber(project.total_tasks ?? project.totalTasks, 0);
    const completedTasks = toMetricNumber(project.completed_tasks ?? project.completedTasks, 0);
    const progress = project.progress
        ?? project.progress_percent
        ?? project.percent_complete
        ?? (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : undefined)
        ?? (totalImages > 0 ? Math.round((completedImages / totalImages) * 100) : 0);

    return {
        id: project.project_id || project.id,
        backendId: project.project_id || project.id,
        name: project.project_name || project.name || "Untitled Project",
        clientId: project.client_id || project.clientId || null,
        client: project.client_name
            || project.customer_name
            || project.company_name
            || project.client
            || project.clientName
            || project.client_display_name
            || (project.client_id ? `Client ${String(project.client_id).slice(0, 8)}` : "Unassigned Client"),
        startDate: formatApiDateForDisplay(project.start_time || project.startDate),
        dueDate: formatApiDateForDisplay(project.due_time || project.dueDate),
        status: project.status || "To-Do",
        priority: project.priority || "Normal",
        description: project.description || "",
        notes: visibleNotes,
        images: String(totalImages),
        pendingImages: imageMetrics.pendingImages,
        inProgressImages: imageMetrics.inProgressImages,
        completedImages: imageMetrics.completedImages,
        rejectedImages: imageMetrics.rejectedImages,
        deliveredImages: imageMetrics.deliveredImages,
        averageEditMinutes: imageMetrics.averageEditMinutes,
        reviewNotes: imageMetrics.reviewNotes,
        progress: Number(progress) || 0,
    };
}

/**
 * Maps a backend task into the frontend task row shape.
 */
function taskFromApi(task) {
    return {
        id: task.task_id || task.id,
        backendId: task.task_id || task.id,
        displayId: lastSixBackendId(task.task_id || task.id, "TID"),
        taskName: task.task_name || task.taskName || "Untitled Task",
        projectId: task.project_id || task.projectId || null,
        project: task.project_name || task.project || (task.project_id ? `Project ${String(task.project_id).slice(0, 8)}` : "Unassigned Project"),
        category: task.category || "Other",
        assignedToId: task.assigned_to || task.assignedToId || task.employee_id || task.employeeId || null,
        assignedTo: task.assigned_to_name
            || task.employee_name
            || task.display_name
            || task.assigned_to_display_name
            || task.assigned_to_email
            || task.assignedTo
            || (task.assigned_to ? `Employee ${String(task.assigned_to).slice(0, 8)}` : "Unassigned"),
        dueDate: formatApiDateForDisplay(task.due_time || task.dueDate),
        priority: task.priority || "Normal",
        estimatedHours: Number(task.estimated_hours ?? task.estimatedHours ?? 0) || 0,
        trackedSeconds: Number(task.tracked_seconds ?? task.trackedSeconds ?? task.totalTrackedSeconds ?? 0)
            || Math.round(toMetricNumber(task.total_time ?? task.totalTime ?? task.total_hours ?? task.totalHours, 0) * 3600),
        status: task.status || "To-Do",
        timerStartedAt: task.timerStartedAt || null,
        lastStoppedAt: formatApiDateForDisplay(task.last_stopped_at || task.lastStoppedAt),
    };
}

/**
 * Maps a backend employee into the frontend employee row shape.
 */
function employeeFromApi(employee) {
    const displayName = getDisplayNameFromApi(employee);
    const role = employee.title || employee.role || employee.account_role || "Employee";

    return {
        id: employee.user_id || employee.id,
        backendId: employee.user_id || employee.id,
        employeeId: employee.employee_id || employee.employeeId || employee.user_id || employee.id,
        displayId: lastSixBackendId(employee.employee_id || employee.employeeId || employee.user_id || employee.id, "EMP"),
        userId: employee.user_id || employee.id,
        firstName: employee.first_name || "",
        middleName: employee.middle_name || "",
        lastName: employee.last_name || "",
        displayName,
        name: displayName,
        role,
        title: employee.title || (employee.role && employee.role !== employee.account_role ? employee.role : ""),
        accountRole: employee.account_role || employee.role || "Employee",
        email: employee.email || "",
        phone: employee.phone_number || employee.phone || "",
        status: employee.status || (employee.is_active === false ? "Inactive" : "Active"),
        currentTask: employee.current_task || employee.currentTask || "No active task",
        activeTasks: Number(employee.active_tasks ?? employee.activeTasks ?? 0) || 0,
        completedToday: Number(employee.completed_today ?? employee.completedToday ?? 0) || 0,
        hoursToday: Number(employee.hours_today ?? employee.hoursToday ?? 0) || 0,
        efficiency: Number(employee.efficiency ?? 0) || 0,
        availability: employee.availability || employee.status || (employee.is_active === false ? "Inactive" : "Available"),
    };
}

/**
 * Normalizes project rows for this feature.
 */
function normalizeProjectRows(payload) {
    return toArrayPayload(payload)
        .filter((project) => !isSeedRecord(project))
        .map(projectFromApi);
}

/**
 * Normalizes task rows for this feature.
 */
function normalizeTaskRows(payload) {
    return toArrayPayload(payload)
        .filter((task) => !isSeedRecord(task))
        .map(taskFromApi);
}

/**
 * Normalizes employee rows for this feature.
 */
function normalizeEmployeeRows(payload) {
    return toArrayPayload(payload)
        .filter((employee) => !isSeedRecord(employee))
        .map(employeeFromApi);
}

/**
 * Maps backend assignment fields into the frontend row shape.
 */
function assignmentFromApi(assignment) {
    const employeeId = assignment.employee_id || assignment.assigned_to || assignment.user_id || assignment.employeeId || assignment.assignedToId || null;
    const taskId = assignment.task_id || assignment.id || assignment.taskId;
    const assignedTo = getDisplayNameFromApi(assignment, employeeId ? `Employee ${shortBackendId(employeeId)}` : "Unassigned");

    return {
        id: assignment.id || taskId || `assignment-${shortBackendId(employeeId)}-${shortBackendId(assignment.project_id)}`,
        backendId: assignment.id || taskId,
        employeeId,
        assignedToId: employeeId,
        projectId: assignment.project_id || assignment.projectId || null,
        taskId,
        project: assignment.project_name || assignment.project || (assignment.project_id ? `Project ${shortBackendId(assignment.project_id)}` : "Unassigned Project"),
        taskType: assignment.task_name || assignment.taskType || assignment.category || "Assigned Task",
        assignedTo,
        assignedDate: formatApiDateForDisplay(assignment.assigned_date || assignment.assignedDate || assignment.created_at),
        dueDate: formatApiDateForDisplay(assignment.due_date || assignment.due_time || assignment.dueDate),
        priority: assignment.priority || "Normal",
        status: assignment.status || "Assigned",
    };
}

/**
 * Normalizes assignment rows for this feature.
 */
function normalizeAssignmentRows(payload) {
    return toArrayPayload(payload)
        .filter((assignment) => !isSeedRecord(assignment))
        .filter((assignment) => assignment && (assignment.task_id || assignment.id || assignment.taskId))
        .map(assignmentFromApi);
}

/**
 * Maps backend time entry fields into the frontend row shape.
 */
function timeEntryFromApi(entry) {
    const totalHours = Number(entry.total_time ?? entry.totalTime ?? entry.hours ?? 0) || 0;

    return {
        id: entry.time_entry_id || entry.id,
        backendId: entry.time_entry_id || entry.id,
        taskId: entry.task_id || entry.taskId || null,
        employeeId: entry.employee_id || entry.employeeId || null,
        startTime: entry.start_time || entry.startTime || null,
        endTime: entry.end_time || entry.endTime || null,
        totalHours,
        totalSeconds: totalHours * 3600,
        createdAt: entry.created_at || entry.createdAt || null,
    };
}

/**
 * Normalizes time entry rows for this feature.
 */
function normalizeTimeEntryRows(payload) {
    return toArrayPayload(payload)
        .filter((entry) => !isSeedRecord(entry))
        .map(timeEntryFromApi);
}

const DASHBOARD_COLORS = ["#7c3aed", "#2563eb", "#10b981", "#f59e0b", "#ef4444", "#14b8a6", "#8b5cf6", "#64748b"];

/**
 * Normalizes productivity kpi rows for this feature.
 */
function normalizeProductivityKpiRows(payload) {
    return toArrayPayload(payload)
        .filter((row) => !isSeedRecord(row))
        .map((row, index) => {
            const displayName = getDisplayNameFromApi(row, `Employee ${index + 1}`);
            const completionRate = toMetricNumber(row.completion_rate_percent ?? row.completionRate ?? row.value ?? row.rate);

            return {
                day: displayName,
                name: displayName,
                value: completionRate,
                color: DASHBOARD_COLORS[index % DASHBOARD_COLORS.length],
                userId: row.user_id || row.id,
                assignedTasks: toMetricNumber(row.assigned_tasks ?? row.assignedTasks),
                completedTasks: toMetricNumber(row.completed_tasks ?? row.completedTasks),
                pendingTasks: toMetricNumber(row.pending_tasks ?? row.pendingTasks),
                overdueTasks: toMetricNumber(row.overdue_tasks ?? row.overdueTasks),
                totalHours: toMetricNumber(row.total_hours ?? row.totalHours),
                completionRatePercent: completionRate,
            };
        });
}

/**
 * Normalizes workflow kpi rows for this feature.
 */
function normalizeWorkflowKpiRows(payload) {
    return toArrayPayload(payload)
        .filter((row) => !isSeedRecord(row))
        .map((row, index) => {
            const status = row.status || row.name || `Status ${index + 1}`;
            const count = toMetricNumber(row.count ?? row.value ?? row.total);

            return {
                name: status,
                status,
                value: count,
                count,
                displayValue: String(count),
                color: row.color || DASHBOARD_COLORS[index % DASHBOARD_COLORS.length],
            };
        });
}

/**
 * Normalizes employee activity kpi rows for this feature.
 */
function normalizeEmployeeActivityKpiRows(payload) {
    return toArrayPayload(payload)
        .filter((row) => !isSeedRecord(row))
        .map((row) => {
            const displayName = getDisplayNameFromApi(row);
            const description = String(row.description || "");
            const statusMatch = description.match(/Status:\s*([^\n]+)/i);
            const status = row.status || (statusMatch ? statusMatch[1].trim() : "Updated");
            const taskName = row.task_name || row.taskName;
            const projectName = row.project_name || row.projectName || row.project;
            const activityText = String(
                row.activity
                || (taskName && projectName ? `${taskName} - ${projectName}` : "")
                || taskName
                || projectName
                || row.category
                || row.task_type
                || row.taskType
                || row.workflow_step
                || row.workflowStep
                || "Task Update"
            ).trim();

            return [
                displayName,
                activityText,
                formatApiDateTimeForDisplay(row.updated_at || row.created_at),
                status,
            ];
        });
}

/**
 * Normalizes project progress kpi rows for this feature.
 */
function normalizeProjectProgressKpiRows(payload) {
    return toArrayPayload(payload)
        .filter((row) => !isSeedRecord(row))
        .map((row) => {
            const totalTasks = toMetricNumber(row.total_tasks ?? row.totalTasks);
            const completedTasks = toMetricNumber(row.completed_tasks ?? row.completedTasks);
            const remainingTasks = Math.max(0, totalTasks - completedTasks);

            return [
                row.project_name || row.name || row.project || "Untitled Project",
                totalTasks,
                completedTasks,
                remainingTasks,
                toMetricNumber(row.progress ?? row.progress_percent ?? row.percent_complete),
                row.status || "To-Do",
                formatApiDateForDisplay(row.due_time || row.due_date || row.dueDate),
            ];
        });
}

/**
 * Converts a frontend project row into the backend payload shape.
 */
function projectToApi(project) {
    const payload = {
        project_name: String(project.name || project.project_name || "Untitled Project").trim(),
        description: project.description || undefined,
        status: project.status || "To-Do",
        priority: project.priority || "Normal",
        notes: combineProjectNotesAndImageMetrics(project.notes, project),
        start_time: toApiDateTime(project.startDate || project.start_time),
        shoot_time: toApiDateTime(project.shootDate || project.shoot_time),
        due_time: toApiDateTime(project.dueDate || project.due_time),
        completed_at: toApiDateTime(project.completedAt || project.completed_at),
    };

    const clientId = project.clientId || project.client_id;
    const managerId = project.managedBy || project.managed_by || project.managerId;
    if (isUuid(clientId)) payload.client_id = clientId;
    if (isUuid(managerId)) payload.managed_by = managerId;

    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== ""));
}


/**
 * Returns project image creation batches for this feature.
 */
function getProjectImageCreationBatches(project = {}) {
    const projectId = project.backendId || project.project_id || project.id;
    if (!isUuid(projectId)) return [];

    const statusCounts = [
        { status: "Pending", count: project.pendingImages ?? project.pending_images },
        { status: "In Progress", count: project.inProgressImages ?? project.in_progress_images },
        { status: "Completed", count: project.completedImages ?? project.completed_images },
        // The backend image status enum does not currently include Rejected.
        // Use Cancelled so rejected/manual counts are still represented as image rows.
        { status: "Cancelled", count: project.rejectedImages ?? project.rejected_images },
    ];

    return statusCounts
        .map(({ status, count }) => ({ status, count: Math.max(0, Math.trunc(toMetricNumber(count, 0))) }))
        .filter(({ count }) => count > 0)
        // Backend supports the implicit bulk shape: { project_id, status, count }.
        .map(({ status, count }) => ({ project_id: projectId, status, count }));
}

async function createImagesForProjectMetrics(project = {}) {
    const batches = getProjectImageCreationBatches(project);
    if (batches.length === 0) return [];

    const createdImages = [];

    for (const batch of batches) {
        try {
            // Preferred backend bulk shape: implicit array generation.
            // Example: { project_id, status, count }
            const bulkResponse = await apiRequest(`${API_ENDPOINTS.images}/bulk`, {
                method: "POST",
                body: JSON.stringify(batch),
                suppressApiError: true,
            });
            createdImages.push(...toArrayPayload(bulkResponse));
            continue;
        } catch (bulkError) {
            if (![404, 405].includes(Number(bulkError.status))) {
                throw bulkError;
            }
        }

        // Backward-compatible fallback for the current image route.
        for (let imageIndex = 1; imageIndex <= batch.count; imageIndex += 1) {
            const singleResponse = await apiRequest(API_ENDPOINTS.images, {
                method: "POST",
                body: JSON.stringify({
                    project_id: batch.project_id,
                    status: batch.status,
                    name: `${batch.status} Image ${imageIndex}`,
                    completed: batch.status === "Completed",
                    completed_at: batch.status === "Completed" ? new Date().toISOString() : undefined,
                }),
            });
            createdImages.push(...toArrayPayload(singleResponse));
        }
    }

    return createdImages;
}

/**
 * Converts a frontend employee row into the backend payload shape.
 */
function employeeToApiPayload(employee = {}) {
    const splitName = splitFullName(employee.name || employee.displayName || employee.display_name || "");
    const firstName = String(employee.firstName || employee.first_name || splitName.firstName || "").trim();
    const middleName = String(employee.middleName || employee.middle_name || splitName.middleName || "").trim();
    const lastName = String(employee.lastName || employee.last_name || splitName.lastName || firstName || "Employee").trim();
    const displayName = buildDisplayName(firstName, middleName, lastName, employee.name || employee.email || "Employee");
    const accountRoleValue = employee.accountRole || employee.account_role || employee.role;
    const accountRole = ["Manager", "Employee"].includes(accountRoleValue)
        ? accountRoleValue
        : "Employee";

    return {
        employee_id: employee.employeeId || employee.employee_id || undefined,
        manager_id: employee.managerId || employee.manager_id || undefined,
        first_name: firstName || "New",
        middle_name: middleName || undefined,
        last_name: lastName || "Employee",
        display_name: displayName,
        title: employee.title || (accountRole === employee.role ? undefined : employee.role) || undefined,
        status: employee.status || "Active",
        email: String(employee.email || "").trim(),
        phone_number: employee.phone || employee.phone_number || undefined,
        password_hash: employee.password || employee.password_hash || undefined,
        account_role: accountRole,
        is_active: employee.is_active ?? true,
        is_admin: employee.is_admin ?? accountRole === "Manager",
    };
}

/**
 * Converts a frontend task row into the backend payload shape.
 */
function taskToApiPayload(task = {}) {
    const projectId = task.projectId || task.project_id;
    const assignedTo = task.assignedToId || task.assigned_to || task.employeeId;
    const assignedBy = task.assignedById || task.assigned_by;

    const payload = {
        project_id: isUuid(projectId) ? projectId : undefined,
        task_name: String(task.taskName || task.task_name || task.taskType || "Untitled Task").trim(),
        category: task.category || task.taskCategory || task.taskType || "Other",
        priority: task.priority || "Normal",
        description: task.description || undefined,
        status: task.status || "Assigned",
        progress: task.progress ?? undefined,
        start_time: toApiDateTime(task.startDate || task.assignedDate || task.start_time),
        due_time: toApiDateTime(task.dueDate || task.due_time),
        completed_at: toApiDateTime(task.completedAt || task.completed_at),
        assigned_to: isUuid(assignedTo) ? assignedTo : undefined,
        assigned_by: isUuid(assignedBy) ? assignedBy : undefined,
    };

    if (!["Import", "Cull", "Edit", "Quality Review", "Export", "Delivery", "Other"].includes(payload.category)) {
        payload.category = "Other";
    }

    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== ""));
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
        loginSummary: "/dashboard/login-summary",
    },

    //-----------------------------------------------------------------------
    // Individual KPI endpoints. The frontend calls these without the /api
    // prefix because buildApiUrl adds the configured API base automatically.
    //-----------------------------------------------------------------------
    kpi: {
        projects: {
            active: "/kpi/projects/active?v=true",
            completed: "/kpi/projects/completed?v=true",
            remaining: "/kpi/projects/remaining?v=true",
            total: "/kpi/projects/total?v=true",
        },
        tasks: {
            active: "/kpi/tasks/active?v=true",
            completed: "/kpi/tasks/completed?v=true",
            remaining: "/kpi/tasks/remaining?v=true",
            total: "/kpi/tasks/total?v=true",
        },
        images: {
            active: "/kpi/images/active?v=true",
            completed: "/kpi/images/completed?v=true",
            remaining: "/kpi/images/remaining?v=true",
            total: "/kpi/images/total?v=true",
        },
        employees: {
            // Backend collection uses singular employee for active and plural employees for total.
            active: "/kpi/employees/active?v=true",
            total: "/kpi/employees/total?v=true",
        },
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
    usersList: "/users?all=true",

    //------------------------------------------------------------------
    // CRUD for projects.
    // Frontend expects:
    // Expected operations: list, read by ID, create, patch update, and delete/deactivate.
    // Main project management endpoint.
    // Stores project details, status, deadlines, linked client, assigned employees, uploaded files, etc.
    projects: "/projects",
    projectsList: "/projects?all=true",

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
    // The live backend does not currently expose /assignments reliably.
    // Assignment-style UI rows are derived from task records instead.
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
    // Employee management should use the users table so both login users are visible.
    employees: "/users?all=true",

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
    tasksList: "/tasks?all=true",

    //-----------------------------------------------------------------------
    // Stores clocked work time for tasks/projects.
    // Frontend timer system posts here.
    // Expected fields:
    // employeeId, taskId, startTime, endTime, duration
    //-----------------------------------------------------------------------
    // New backend routes: all time entries live under /tasks/time-entries,
    // and task-specific entries under /tasks/:task_id/time-entries.
    timeEntries: "/tasks/time-entries",
    timeEntriesList: "/tasks/time-entries",

    //-----------------------------------------------------------------------
    // Generated reports endpoint.
    // Used for exporting/filtering:
    // - employee productivity
    // - project progress
    // - time tracking
    // - utilization
    // - client/project summaries
    //------------------------------------------------------------------------
    reports: {
        root: "/reports",
        projectDelivery: "/reports/project_delivery",
        taskTime: "/reports/task_time",
        employeeProductivity: "/reports/employee_productivity",
        assignmentStatus: "/reports/assignment_status",
    },

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
    // Full mounted backend route. buildApiUrl prevents duplicate /api when VITE_API_BASE_URL already ends with /api.
    settings: "/api/settings",
};

/**
 * Sends a JSON request to the configured backend API and throws a clear error when the response fails.
 */
function buildApiUrl(endpoint) {
    const endpointString = String(endpoint || "");
    if (/^https?:\/\//i.test(endpointString)) return endpointString;

    const baseUrl = String(API_BASE_URL || "").replace(/\/$/, "");
    let path = endpointString.startsWith("/") ? endpointString : `/${endpointString}`;

    // Settings is documented and mounted as /api/settings. If the API base already
    // includes /api, do not generate /api/api/settings.
    if (baseUrl.endsWith("/api") && path.startsWith("/api/")) {
        path = path.replace(/^\/api/, "");
    }

    return `${baseUrl}${path}`;
}

/**
 * Sends a JSON API request and converts failed responses into useful JavaScript errors.
 */
function publishApiError(error) {
    if (typeof window === "undefined" || !error) return;

    const apiError = {
        endpoint: error.endpoint || "unknown",
        method: error.method || "GET",
        status: error.status || "NETWORK",
        statusText: error.statusText || "",
        code: error.code || error.status || "API_ERROR",
        message: error.message || "API request failed",
        url: error.url || "",
        timestamp: new Date().toISOString(),
    };

    window.__photometricsApiErrors = [apiError, ...(window.__photometricsApiErrors || [])].slice(0, 10);
    window.dispatchEvent(new CustomEvent("photometrics-api-error", { detail: apiError }));
}

/**
 * Clears any currently displayed global API errors.
 */
function clearPublishedApiErrors() {
    if (typeof window === "undefined") return;

    window.__photometricsApiErrors = [];
    window.dispatchEvent(new CustomEvent("photometrics-api-error", { detail: null }));
}

/**
 * Broadcasts authentication failures to reset stale sessions.
 */
function publishAuthFailure(error) {
    if (typeof window === "undefined") return;

    window.dispatchEvent(new CustomEvent("photometrics-auth-failed", {
        detail: {
            endpoint: error?.endpoint || "unknown",
            method: error?.method || "GET",
            status: error?.status || 401,
            message: error?.message || "Authentication failed",
        },
    }));
}

async function apiRequest(endpoint, options = {}) {
    const method = options.method || "GET";
    const url = buildApiUrl(endpoint);
    const { suppressApiError = false, timeoutMs = 15000, signal, ...fetchOptions } = options;
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller && timeoutMs > 0
        ? setTimeout(() => controller.abort(), timeoutMs)
        : null;

    try {
        const response = await fetch(url, {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(fetchOptions.headers || {}),
            },
            signal: signal || controller?.signal,
            ...fetchOptions,
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (!response.ok) {
            let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
            let errorCode = response.status;

            try {
                const errorPayload = await response.json();
                errorMessage = errorPayload?.error?.message || errorPayload?.message || errorMessage;
                errorCode = errorPayload?.error?.code || errorPayload?.code || errorCode;
            } catch {
                // Some failed responses do not include a JSON body. Keep the status-based message.
            }

            const error = new Error(`${method} ${endpoint} failed: ${errorMessage}`);
            error.status = response.status;
            error.statusText = response.statusText;
            error.code = errorCode;
            error.endpoint = endpoint;
            error.method = method;
            error.url = url;
            if (!suppressApiError) {
                publishApiError(error);
            }
            if (response.status === 401) {
                publishAuthFailure(error);
            }
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
    } catch (requestError) {
        if (!requestError.endpoint) {
            requestError.endpoint = endpoint;
            requestError.method = method;
            requestError.url = url;
            requestError.code = requestError.name === "AbortError" ? "REQUEST_TIMEOUT" : requestError.code || "NETWORK_ERROR";
            requestError.message = requestError.name === "AbortError"
                ? `${method} ${endpoint} timed out. Please try again.`
                : `${method} ${endpoint} failed: ${requestError.message}`;
            if (!suppressApiError) {
                publishApiError(requestError);
            }
        }

        if (timeoutId) clearTimeout(timeoutId);
        throw requestError;
    }
}

/**
 * Normalizes the different payload shapes the backend may return so page components can work with simple arrays or objects.
 */
function unwrapApiPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return payload ?? [];

    // Backend routes currently return resource-named wrappers such as
    // { users: [...] }, { projects: [...] }, { tasks: [...] }, or { settings: [...] }.
    // Normalize those wrappers here so every page receives plain rows/objects.
    const resourceKeys = [
        "data",
        "items",
        "rows",
        "users",
        "user",
        "employees",
        "employee",
        "clients",
        "client",
        "projects",
        "project",
        "tasks",
        "task",
        "assignments",
        "assignment",
        "settings",
        "setting",
        "images",
        "image",
        "time_entries",
        "timeEntries",
        "timeEntry",
    ];

    for (const key of resourceKeys) {
        if (payload[key] !== undefined) return payload[key];
    }

    return payload;
}

const KPI_VALUE_KEYS = ["displayValue", "value", "count", "total", "result", "metricValue", "kpi", "data"];
const KPI_OBJECT_KEYS = ["objects", "records", "rows", "details", "items"];
const KPI_LABEL_KEYS = ["label", "name", "title", "metric", "key"];
const KPI_ARRAY_KEYS = ["kpis", "metrics", "cards", "items", "data"];
const KPI_OBJECT_CONTAINER_KEYS = ["kpis", "metrics", "cards", "summary", "stats"];
const KPI_IGNORED_OBJECT_KEYS = new Set([
    "meta",
    "metadata",
    "pagination",
    "success",
    "message",
    "status",
]);

/**
 * Checks whether plain object is true.
 */
function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Checks whether primitive value is true.
 */
function isPrimitiveValue(value) {
    return value === null || ["string", "number", "boolean"].includes(typeof value);
}

/**
 * Documents the title case kpi label behavior used by this module.
 */
function titleCaseKpiLabel(value) {
    const label = String(value || "KPI")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_.-]+/g, " ")
        .trim();

    if (!label) return "KPI";

    return label
        .split(/\s+/)
        .map((word) => {
            const lower = word.toLowerCase();
            if (["kpi", "id", "api"].includes(lower)) return lower.toUpperCase();
            if (lower === "avg") return "Avg";
            return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
        })
        .join(" ");
}

/**
 * Returns first defined value for this feature.
 */
function getFirstDefinedValue(source, keys) {
    if (!isPlainObject(source)) return undefined;

    for (const key of keys) {
        if (source[key] !== undefined) return source[key];
    }

    return undefined;
}

/**
 * Returns kpi detail objects for this feature.
 */
function getKpiDetailObjects(source) {
    if (!isPlainObject(source)) return [];

    for (const key of KPI_OBJECT_KEYS) {
        if (Array.isArray(source[key])) return source[key];
    }

    return [];
}

/**
 * Returns kpi raw value for this feature.
 */
function getKpiRawValue(source) {
    if (isPrimitiveValue(source)) return source;
    if (!isPlainObject(source)) return undefined;

    for (const key of KPI_VALUE_KEYS) {
        const value = source[key];

        if (key === "data" && (Array.isArray(value) || isPlainObject(value))) continue;
        if (value !== undefined && isPrimitiveValue(value)) return value;
    }

    const primitiveEntry = Object.entries(source).find(([key, value]) => (
        !KPI_LABEL_KEYS.includes(key)
        && !KPI_OBJECT_KEYS.includes(key)
        && !["id", "prefix", "suffix", "unit"].includes(key)
        && isPrimitiveValue(value)
    ));

    return primitiveEntry?.[1];
}

/**
 * Returns kpi label for this feature.
 */
function getKpiLabel(source, fallbackLabel, index) {
    if (Array.isArray(source)) return source[0] || fallbackLabel || `KPI ${index + 1}`;
    if (!isPlainObject(source)) return fallbackLabel || `KPI ${index + 1}`;

    const label = getFirstDefinedValue(source, KPI_LABEL_KEYS);
    return titleCaseKpiLabel(label || fallbackLabel || `KPI ${index + 1}`);
}

/**
 * Formats kpi value for this feature.
 */
function formatKpiValue(rawValue, source) {
    if (isPlainObject(source) && source.displayValue !== undefined) {
        return String(source.displayValue);
    }

    const prefix = isPlainObject(source) && source.prefix ? String(source.prefix) : "";
    const suffix = isPlainObject(source) && (source.suffix || source.unit) ? String(source.suffix || source.unit) : "";

    if (rawValue === null || rawValue === undefined || rawValue === "") return `${prefix}0${suffix}`;

    const formattedValue = typeof rawValue === "number"
        ? rawValue.toLocaleString()
        : String(rawValue);

    return `${prefix}${formattedValue}${suffix}`;
}

/**
 * Normalizes kpi card for this feature.
 */
function normalizeKpiCard(source, index = 0, fallbackLabel) {
    if (Array.isArray(source)) {
        const label = titleCaseKpiLabel(source[0] || fallbackLabel || `KPI ${index + 1}`);
        const rawValue = source[1];
        const objects = Array.isArray(source[2]) ? source[2] : [];

        return {
            id: label,
            label,
            rawValue,
            value: formatKpiValue(rawValue),
            objects,
            source,
        };
    }

    const label = getKpiLabel(source, fallbackLabel, index);
    const rawValue = getKpiRawValue(source);
    const objects = getKpiDetailObjects(source);

    return {
        id: isPlainObject(source) ? source.id || source.key || label : label,
        label,
        rawValue,
        value: formatKpiValue(rawValue, source),
        objects,
        source,
    };
}

/**
 * Returns fallback kpi label for this feature.
 */
function getFallbackKpiLabel(fallbackKpis, index) {
    const fallback = Array.isArray(fallbackKpis) ? fallbackKpis[index] : null;

    if (Array.isArray(fallback)) return fallback[0];
    if (isPlainObject(fallback)) return getFirstDefinedValue(fallback, KPI_LABEL_KEYS);

    return undefined;
}

/**
 * Converts the dashboard KPI API contract into render-ready cards.
 * Supported backend shapes include:
 * - a plain integer such as 12
 * - { label: "Total Projects", value: 12, objects: [...] }
 * - { totalProjects: { value: 12, objects: [...] }, openTasks: 4 }
 * - { kpis: [...] }, { metrics: [...] }, { cards: [...] }, or { data: [...] }
 */
function normalizeDashboardKpis(payload, fallbackKpis = []) {
    if (payload === undefined || payload === null) return [];

    let source = payload;

    if (isPlainObject(source)) {
        const arrayKey = KPI_ARRAY_KEYS.find((key) => Array.isArray(source[key]));

        if (arrayKey) {
            source = source[arrayKey];
        } else {
            const objectContainerKey = KPI_OBJECT_CONTAINER_KEYS.find((key) => isPlainObject(source[key]));

            if (objectContainerKey) {
                source = source[objectContainerKey];
            } else if (isPlainObject(source.data)) {
                source = source.data;
            }
        }
    }

    if (Array.isArray(source)) {
        return source.map((item, index) => normalizeKpiCard(item, index, getFallbackKpiLabel(fallbackKpis, index)));
    }

    if (isPrimitiveValue(source)) {
        return [normalizeKpiCard({ label: getFallbackKpiLabel(fallbackKpis, 0) || "KPI", value: source }, 0)];
    }

    if (isPlainObject(source)) {
        const hasDirectValue = KPI_VALUE_KEYS.some((key) => (
            source[key] !== undefined && (key !== "data" || isPrimitiveValue(source[key]))
        ));

        if (hasDirectValue) {
            return [normalizeKpiCard(source, 0, getFallbackKpiLabel(fallbackKpis, 0))];
        }

        return Object.entries(source)
            .filter(([key]) => !KPI_IGNORED_OBJECT_KEYS.has(key))
            .map(([key, value], index) => {
                const label = titleCaseKpiLabel(key);

                if (isPlainObject(value)) {
                    return normalizeKpiCard({ key, label, ...value }, index, label);
                }

                return normalizeKpiCard({ key, label, value }, index, label);
            });
    }

    return [];
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


const PREVIEW_DATABASE_USERS = [
    {
        user_id: "00000000-0000-4000-8000-000000000001",
        first_name: "Test",
        last_name: "Manager",
        display_name: "Test Manager",
        email: "muser@gmail.com",
        account_role: "Manager",
        is_active: true,
        previewPassword: "password",
    },
    {
        user_id: "00000000-0000-4000-8000-000000000002",
        first_name: "Test",
        last_name: "Employee",
        display_name: "Test Employee",
        email: "euser@gmail.com",
        account_role: "Employee",
        is_active: true,
        previewPassword: "password",
    },
];

/**
 * Returns preview database user for this feature.
 */
function getPreviewDatabaseUser(credentials) {
    const normalizedEmail = String(credentials?.email || "").trim().toLowerCase();
    const password = String(credentials?.password_hash || credentials?.password || "");
    const matchedUser = PREVIEW_DATABASE_USERS.find((user) => user.email.toLowerCase() === normalizedEmail);

    if (!matchedUser || matchedUser.previewPassword !== password) return null;

    const { previewPassword, ...safeUser } = matchedUser;
    return safeUser;
}

/**
 * Provides a temporary database-backed login bridge when the dedicated auth route is not available.
 */
async function loginWithUsersEndpoint(credentials) {
    const payload = await apiRequest(API_ENDPOINTS.usersList);
    const users = unwrapApiPayload(payload) || [];
    const normalizedEmail = String(credentials?.email || "").trim().toLowerCase();
    const matchedUser = users.find((user) => String(user.email || "").trim().toLowerCase() === normalizedEmail);

    if (matchedUser) {
        return { user: normalizeBackendUser(matchedUser), authMode: "users-endpoint" };
    }

    const previewUser = getPreviewDatabaseUser(credentials);
    if (previewUser) {
        return { user: normalizeBackendUser(previewUser), authMode: "api-preview-seed" };
    }

    const error = new Error("No backend user exists for that email address, or the password is incorrect.");
    error.status = 401;
    throw error;
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
function useApiPlaceholder(endpoint, fallbackData, options = {}) {
    const [useApiData, setUseApiData] = useState(getUseApiDataSetting);
    const [data, setData] = useState(() => (getUseApiDataSetting() ? getEmptyDataForFallback(fallbackData) : fallbackData));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const fallbackRef = useRef(fallbackData);
    const optionsRef = useRef(options);

    fallbackRef.current = fallbackData;
    optionsRef.current = options;

    useEffect(() => {
        const syncApiDataSetting = () => setUseApiData(getUseApiDataSetting());

        window.addEventListener("storage", syncApiDataSetting);
        window.addEventListener(API_DATA_SETTING_EVENT, syncApiDataSetting);

        return () => {
            window.removeEventListener("storage", syncApiDataSetting);
            window.removeEventListener(API_DATA_SETTING_EVENT, syncApiDataSetting);
        };
    }, []);

    const loadData = useCallback(async (shouldUpdate = () => true) => {
        if (!useApiData || !endpoint) {
            if (shouldUpdate()) {
                setError(null);
                setData(fallbackRef.current);
            }
            return;
        }

        if (shouldUpdate()) {
            setIsLoading(true);
            setError(null);
            setData(getEmptyDataForFallback(fallbackRef.current));
        }

        try {
            const currentOptions = optionsRef.current || {};
            const payload = await apiRequest(endpoint, {
                suppressApiError: Boolean(currentOptions.suppressApiError),
            });
            const nextData = typeof currentOptions.transformPayload === "function"
                ? currentOptions.transformPayload(payload)
                : currentOptions.unwrap === false
                    ? payload
                    : unwrapApiPayload(payload);

            if (shouldUpdate() && nextData !== undefined) {
                setData(nextData);
            }
        } catch (apiError) {
            if (shouldUpdate()) {
                setError(apiError.message);
                setData(getEmptyDataForFallback(fallbackRef.current));
            }
            console.warn(`API data failed for ${endpoint}. Mock data is disabled while database mode is on.`, apiError);
        } finally {
            if (shouldUpdate()) {
                setIsLoading(false);
            }
        }
    }, [endpoint, useApiData]);

    useEffect(() => {
        let isMounted = true;
        loadData(() => isMounted);

        return () => {
            isMounted = false;
        };
    }, [loadData]);

    const retry = useCallback(() => loadData(), [loadData]);

    return { data, isLoading, error, retry };
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
            const user = normalizeBackendUser(payload?.user || payload);
            return { ...payload, user: user ? { ...user, authMode: payload?.authMode } : user };
        } catch (authError) {
            if (authError.status === 404 || authError.status === 405) {
                console.warn("Auth endpoint is not available. Using /users?all=true as a temporary database-backed login bridge.", authError);
                return loginWithUsersEndpoint(credentials);
            }

            throw authError;
        }
    },
    logout: async (userOrId) => {
        const isLocalOnlyAuth = typeof userOrId === "object"
            && ["api-fallback-seed", "api-preview-seed", "local-session"].includes(userOrId?.authMode);
        const userId = typeof userOrId === "string"
            ? userOrId
            : isLocalOnlyAuth
                ? null
                : userOrId?.userId || userOrId?.user_id || userOrId?.id || userOrId?.employeeId;

        try {
            return await apiRequest(API_ENDPOINTS.auth.logout, {
                method: "POST",
                suppressApiError: true,
            });
        } catch (logoutError) {
            if (!userId || ![404, 405].includes(Number(logoutError.status))) {
                throw logoutError;
            }

            return apiRequest(`${API_ENDPOINTS.auth.logout}/${encodeURIComponent(userId)}`, {
                method: "POST",
                suppressApiError: true,
            });
        }
    },
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
    createImagesForProjectMetrics,
    // Temporarily disabled until task time-entry read routes are confirmed.
    // Timer start/stop remains enabled below because the backend confirmed PATCH /tasks/:id/timer/start and /timer/stop.
    getTaskTimeEntries: async () => [],
    createAssignment: (assignment) => apiPlaceholders.createTask(assignment),
    updateAssignment: (assignmentId, assignment) => apiPlaceholders.updateTask(assignmentId, assignment),
    deleteAssignment: (assignmentId) => apiPlaceholders.deleteTask(assignmentId),
    createEmployee: (employee) => apiRequest(API_ENDPOINTS.users, {
        method: "POST",
        body: JSON.stringify(employeeToApiPayload(employee)),
    }),
    updateEmployee: (employeeId, employee) => apiRequest(`${API_ENDPOINTS.users}/${employeeId}`, {
        method: "PATCH",
        body: JSON.stringify(employeeToApiPayload(employee)),
    }),
    deleteEmployee: (employeeId) => apiRequest(`${API_ENDPOINTS.users}/${employeeId}`, {
        method: "DELETE",
    }),
    getSettings: (currentUser) => {
        const userId = currentUser?.userId || currentUser?.user_id || currentUser?.id || currentUser?.employeeId;
        if (!userId) {
            const error = new Error("Settings cannot be loaded without a user id.");
            error.status = 400;
            throw error;
        }

        // Settings load failures should not raise the global API banner because the
        // settings page already falls back to the last local copy. Saving still uses
        // POST /api/settings, which is the confirmed backend route.
        return apiRequest(`${API_ENDPOINTS.settings}/${encodeURIComponent(userId)}`, {
            suppressApiError: true,
        });
    },
    saveSettings: async (settings, currentUser) => {
        const payload = settingsToApiPayload(settings, currentUser);
        const userId = payload.user_id || settings?.backend?.userId || currentUser?.userId || currentUser?.user_id || currentUser?.id || currentUser?.employeeId;
        const updateEndpoints = userId
            ? [
                { endpoint: `${API_ENDPOINTS.settings}/${encodeURIComponent(userId)}`, method: "PATCH" },
                { endpoint: API_ENDPOINTS.settings, method: "POST" },
            ]
            : [
                { endpoint: API_ENDPOINTS.settings, method: "POST" },
            ];

        let lastError;

        for (let index = 0; index < updateEndpoints.length; index += 1) {
            const { endpoint, method } = updateEndpoints[index];
            const isLastAttempt = index === updateEndpoints.length - 1;

            try {
                return await apiRequest(endpoint, {
                    method,
                    body: JSON.stringify(payload),
                    suppressApiError: !isLastAttempt,
                });
            } catch (settingsError) {
                lastError = settingsError;

                if (![404, 405].includes(Number(settingsError.status))) {
                    throw settingsError;
                }
            }
        }

        throw lastError || new Error("Settings update failed.");
    },
    updateSettings: (settings, currentUser) => apiPlaceholders.saveSettings(settings, currentUser),
    // User settings/profile actions must use the real backend routes. The backend
    // exposes PATCH /users/:id and PATCH/POST /settings, not nested
    // /users/:id/profile, /password, or /preferences routes.
    updateUserProfile: (userId, profile = {}) => {
        const cleanName = String(profile.preferredName || profile.name || "").trim();
        const nameParts = splitFullName(cleanName);
        const payload = {
            first_name: nameParts.firstName || "Employee",
            middle_name: nameParts.middleName || undefined,
            last_name: nameParts.lastName || nameParts.firstName || "Employee",
            display_name: cleanName || profile.email || "Employee",
            email: String(profile.email || "").trim(),
            phone_number: profile.phone || undefined,
            account_role: ["Manager", "Employee"].includes(profile.role) ? profile.role : undefined,
            title: profile.title || undefined,
        };

        return apiRequest(`${API_ENDPOINTS.users}/${encodeURIComponent(userId)}`, {
            method: "PATCH",
            body: JSON.stringify(Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== ""))),
        });
    },
    changeUserPassword: (userId, passwordData = {}) => apiRequest(`${API_ENDPOINTS.users}/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        body: JSON.stringify({ password_hash: passwordData.newPassword || passwordData.password || "" }),
    }),
    updateUserPreferences: (userId, preferences = {}) => apiPlaceholders.saveSettings({
        appearance: preferences,
        company: {},
        notifications: {},
        backend: { userId },
    }, { userId, id: userId }),
    createTask: (task) => apiRequest(API_ENDPOINTS.tasks, {
        method: "POST",
        body: JSON.stringify(taskToApiPayload(task)),
    }),
    updateTask: (taskId, task) => apiRequest(`${API_ENDPOINTS.tasks}/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(taskToApiPayload(task)),
    }),
    deleteTask: (taskId) => apiRequest(`${API_ENDPOINTS.tasks}/${taskId}`, {
        method: "DELETE",
    }),
    startTaskTimer: (taskId, startedAt, user) => apiRequest(`${API_ENDPOINTS.tasks}/${taskId}/timer/start`, {
        method: "PATCH",
        suppressApiError: true,
        body: JSON.stringify({
            startedAt,
            userId: user?.id,
            employeeId: user?.employeeId,
            employeeName: user?.employeeName || user?.name,
        }),
    }),
    stopTaskTimer: (taskId, timeEntry) => apiRequest(`${API_ENDPOINTS.tasks}/${taskId}/timer/stop`, {
        method: "PATCH",
        suppressApiError: true,
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
    clearPublishedApiErrors,
    projectFromApi,
    taskFromApi,
    employeeFromApi,
    normalizeProjectRows,
    normalizeBackendSettings,
    settingsToApiPayload,
    normalizeTaskRows,
    normalizeEmployeeRows,
    normalizeAssignmentRows,
    normalizeTimeEntryRows,
    normalizeProductivityKpiRows,
    normalizeWorkflowKpiRows,
    normalizeEmployeeActivityKpiRows,
    normalizeProjectProgressKpiRows,
    projectToApi,
    employeeToApiPayload,
    taskToApiPayload,
    createImagesForProjectMetrics,
    unwrapApiPayload,
    normalizeDashboardKpis,
    normalizeBackendUser,
    loginWithUsersEndpoint,
    getEmptyDataForFallback,
    useApiPlaceholder,
    apiPlaceholders,
};
