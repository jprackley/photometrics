// -----------------------------------------------------------------------------
// Role-Based Access Utilities
// -----------------------------------------------------------------------------
// Keeps manager/employee permission checks outside of page components so the UI
// can consistently filter navigation items, projects, assignments, and tasks.
// Backend authorization should still protect production API routes.
// -----------------------------------------------------------------------------

import { navItems } from "../config/navigation";
import { assignments, projects, taskItems } from "../data/mockData";

/**
 * Returns true when the current user should receive manager-level UI permissions.
 */
function canManageContent(user) {
    return user?.accessLevel === "manager" || String(user?.role || "").toLowerCase().includes("manager");
}

/**
 * Controls page-level access for managers and employee users.
 */
function canAccessPage(user, page) {
    if (canManageContent(user)) return true;
    return ["dashboard", "projects", "tasks", "settings"].includes(page);
}

/**
 * Filters the sidebar navigation so employees only see permitted pages.
 */
function getAllowedNavItems(user) {
    return navItems.filter((item) => canAccessPage(user, item.page));
}

/**
 * Checks whether a task or assignment belongs to the current employee.
 */
function isAssignedToUser(row, user) {
    if (canManageContent(user)) return true;

    const employeeName = user?.employeeName || user?.name;
    return String(row?.assignedTo || "").toLowerCase() === String(employeeName || "").toLowerCase();
}

/**
 * Finds projects connected to the current user through assignments or tasks.
 */
function getAssignedProjectNames(user, assignmentRows = assignments, taskRows = taskItems) {
    if (canManageContent(user)) {
        return projects.map((project) => project.name);
    }

    const fromAssignments = assignmentRows
        .filter((assignment) => isAssignedToUser(assignment, user))
        .map((assignment) => assignment.project);

    const fromTasks = taskRows
        .filter((task) => isAssignedToUser(task, user))
        .map((task) => task.project);

    return [...new Set([...fromAssignments, ...fromTasks].filter(Boolean))];
}

/**
 * Applies role-based row filtering for secure manager and employee views.
 */
function filterRowsByAccess(rows, user, type) {
    if (canManageContent(user)) return rows;

    if (type === "tasks" || type === "assignments") {
        return rows.filter((row) => isAssignedToUser(row, user));
    }

    if (type === "projects") {
        const assignedProjectNames = getAssignedProjectNames(user);
        return rows.filter((project) => assignedProjectNames.includes(project.name));
    }

    return rows;
}

/**
 * Performs a simple case-insensitive search across selected row fields.
 */
function rowMatchesSearch(row, searchText, keys) {
    const normalizedSearch = String(searchText || "").trim().toLowerCase();
    if (!normalizedSearch) return true;

    const searchableText = keys
        .map((key) => row?.[key])
        .join(" ")
        .toLowerCase();

    return searchableText.includes(normalizedSearch);
}

export {
    canManageContent,
    canAccessPage,
    getAllowedNavItems,
    isAssignedToUser,
    getAssignedProjectNames,
    filterRowsByAccess,
    rowMatchesSearch,
};
