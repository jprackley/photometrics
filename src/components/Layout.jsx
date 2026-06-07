// -----------------------------------------------------------------------------
// Shared Layout Components
// -----------------------------------------------------------------------------
// Contains the reusable page chrome used across the authenticated application:
// the company logo, responsive sidebar navigation, notification
// control, and user menu. These components are presentation-focused and receive
// state/action handlers from the application shell.
// -----------------------------------------------------------------------------

import React, { useMemo, useState } from "react";
import cherishedMemoriesLogo from "../assets/cherished-memories-logo.png";
import {
    Bell,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Settings,
    Users,
} from "lucide-react";
import { getAllowedNavItems, canManageContent } from "../utils/accessControl";
import {
    API_ENDPOINTS,
    getUseApiDataSetting,
    normalizeProjectRows,
    normalizeTaskRows,
    useApiPlaceholder,
} from "../services/api";
import { projects, taskItems } from "../data/mockData";

// Company logo component
/**
 * Renders the shared company logo used on the login page and app header.
 */
function Logo({ variant = "header" }) {
    const isLogin = variant === "login";

    return (
        <div
            className={
                isLogin
                    ? "flex w-full items-center justify-center rounded-xl bg-white/95 px-4 py-2 shadow-sm ring-1 ring-slate-200/90"
                    : "flex h-14 w-[220px] items-center justify-center rounded-xl bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200/80 sm:w-[320px]"
            }
        >
            <img
                src={cherishedMemoriesLogo}
                alt="Cherished Memories Photography"
                className={
                    isLogin
                        ? "h-auto max-h-20 w-full max-w-[300px] object-contain"
                        : "h-auto max-h-10 w-full object-contain"
                }
            />
        </div>
    );
}

/**
 * Renders role-filtered navigation links and the logout action in expanded or collapsed mode.
 */
function Sidebar({ isCollapsed, activePage, onPageChange, onLogout, currentUser }) {
    return (
        <aside
            className={`flex w-full shrink-0 flex-col border-b border-slate-200/80 bg-white/95 shadow-sm transition-all duration-300 md:border-b-0 md:border-r ${
                isCollapsed ? "md:w-[84px]" : "md:w-[260px]"
            }`}
        >
            {/* Navigation buttons */}
            <nav className="flex gap-2 overflow-x-auto p-3 md:flex-1 md:flex-col md:gap-1.5 md:overflow-visible md:p-4 md:pt-5">
                {getAllowedNavItems(currentUser).map(({ label, page, icon: Icon }) => (
                    <button
                        key={label}
                        type="button"
                        title={isCollapsed ? label : undefined}
                        onClick={() => onPageChange(page)}

                        // Highlight active page button
                        className={`relative flex min-w-max items-center rounded-lg px-3 py-2.5 text-sm transition hover:bg-slate-100 md:w-full md:text-sm ${
                            isCollapsed ? "gap-2 md:justify-center md:px-0" : "gap-2 md:gap-4 md:px-4 md:text-left"
                        } ${
                            activePage === page
                                ? "bg-violet-50 font-bold text-violet-700 shadow-sm ring-1 ring-violet-100"
                                : "font-semibold text-slate-700"
                        }`}
                    >
                        {activePage === page && !isCollapsed && (
                            <span className="absolute left-0 top-2 h-7 w-1 rounded-r-full bg-violet-600" />
                        )}
                        <Icon size={21} strokeWidth={2} />
                        <span className={isCollapsed ? "md:hidden" : ""}>{label}</span>
                    </button>
                ))}
            </nav>

            {/* Logout button */}
            <button
                type="button"
                title={isCollapsed ? "Logout" : undefined}
                onClick={onLogout}
                className={`m-3 flex min-w-max items-center rounded-lg border border-transparent px-3 py-2.5 text-sm font-bold text-slate-700 hover:border-slate-200 hover:bg-slate-50 md:m-4 ${
                    isCollapsed ? "gap-2 md:justify-center md:px-0" : "gap-2 md:gap-4 md:px-4"
                }`}
            >
                <LogOut size={21} />
                <span className={isCollapsed ? "md:hidden" : ""}>Logout</span>
            </button>
        </aside>
    );
}

/**
 * Parses notification dates defensively so invalid values do not break the header.
 */
function parseNotificationDate(value) {
    if (!value) return null;

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value;
    }

    const textValue = String(value).trim();
    if (!textValue) return null;

    const directDate = new Date(textValue);
    if (!Number.isNaN(directDate.getTime())) {
        return directDate;
    }

    const withCurrentYear = new Date(`${textValue}, ${new Date().getFullYear()}`);
    return Number.isNaN(withCurrentYear.getTime()) ? null : withCurrentYear;
}

/**
 * Checks whether a date falls inside the current calendar week.
 */
function isDateThisWeek(value) {
    const dueDate = parseNotificationDate(value);
    if (!dueDate) return false;

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(startOfToday.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    return dueDate >= startOfToday && dueDate <= endOfWeek;
}

/**
 * Checks whether a task or project status should appear in review-ready counts.
 */
function isReviewReadyStatus(status) {
    return /review/i.test(String(status || ""));
}

/**
 * Returns a singular or plural label based on the supplied count.
 */
function pluralize(count, singular, plural = `${singular}s`) {
    return count === 1 ? singular : plural;
}

/**
 * Builds a compact avatar label from the active user profile.
 */
function getUserInitials(user) {
    const displayName = user?.name || user?.employeeName || user?.email || "User";
    const nameParts = String(displayName)
        .replace(/@.*/, "")
        .split(/[\s._-]+/)
        .filter(Boolean);

    return nameParts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "U";
}

// Top header bar
/**
 * Renders the application header, global search input, notification menu, and user menu.
 */
function Topbar({ isSidebarCollapsed, onToggleSidebar, onPageChange, onLogout, currentUser }) {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isManagerMenuOpen, setIsManagerMenuOpen] = useState(false);

    const localProjectFallback = getUseApiDataSetting() ? [] : projects;
    const localTaskFallback = getUseApiDataSetting() ? [] : taskItems;

    const { data: loadedProjectRows } = useApiPlaceholder(API_ENDPOINTS.projectsList, localProjectFallback, {
        transformPayload: normalizeProjectRows,
    });
    const { data: loadedTaskRows } = useApiPlaceholder(API_ENDPOINTS.tasksList, localTaskFallback, {
        transformPayload: normalizeTaskRows,
    });

    const notifications = useMemo(() => {
        const projectRows = Array.isArray(loadedProjectRows) ? loadedProjectRows : [];
        const taskRows = Array.isArray(loadedTaskRows) ? loadedTaskRows : [];
        const projectsDueThisWeek = projectRows.filter((project) => isDateThisWeek(project.dueDate)).length;
        const tasksReadyForReview = taskRows.filter((task) => isReviewReadyStatus(task.status) || isReviewReadyStatus(task.category)).length;

        const nextNotifications = [];

        if (projectsDueThisWeek > 0) {
            nextNotifications.push({
                key: "projects-due",
                page: "projects",
                message: `${projectsDueThisWeek} ${pluralize(projectsDueThisWeek, "project")} ${projectsDueThisWeek === 1 ? "is" : "are"} due this week`,
            });
        }

        if (tasksReadyForReview > 0) {
            nextNotifications.push({
                key: "tasks-review",
                page: "tasks",
                message: `${tasksReadyForReview} ${pluralize(tasksReadyForReview, "task")} ${tasksReadyForReview === 1 ? "is" : "are"} ready for review`,
            });
        }

        nextNotifications.push({
            key: "project-export",
            page: "projects",
            message: "Project export is available from the Projects tab",
        });

        return nextNotifications;
    }, [loadedProjectRows, loadedTaskRows]);

    const closeMenus = () => {
        setIsNotificationsOpen(false);
        setIsManagerMenuOpen(false);
    };

    const goToPage = (nextPage) => {
        closeMenus();
        onPageChange?.(nextPage);
    };

    const displayName = currentUser?.name || currentUser?.employeeName || currentUser?.email || "Manager";

    return (
        <header className="pm-surface relative z-30 flex min-h-[78px] items-center justify-center border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur md:px-6">

            {/* Centered brand area */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                <Logo />
            </div>

            <div className="absolute left-4 top-1/2 hidden -translate-y-1/2 md:left-6 md:flex">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
                    title={isSidebarCollapsed ? "Expand menu" : "Collapse menu"}
                >
                    {isSidebarCollapsed
                        ? <ChevronRight size={22} />
                        : <ChevronLeft size={22} />}
                </button>
            </div>

            {/* User info area */}
            <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-end gap-3 md:right-6">
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setIsNotificationsOpen((value) => !value);
                            setIsManagerMenuOpen(false);
                        }}
                        className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-100"
                        aria-label="Open notifications"
                        title="Notifications"
                    >
                        <Bell size={21} />
                        {notifications.length > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-violet-600" />
                        )}
                    </button>

                    {isNotificationsOpen && (
                        <div className="pm-elevated absolute right-0 z-40 mt-3 w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-slate-200 bg-white sm:w-80">
                            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-bold">
                                Notifications
                            </div>

                            <div className="divide-y divide-slate-100">
                                {notifications.length > 0 ? notifications.map((notification) => (
                                    <button
                                        key={notification.key}
                                        type="button"
                                        onClick={() => goToPage(notification.page)}
                                        className="block w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        {notification.message}
                                    </button>
                                )) : (
                                    <div className="px-4 py-3 text-sm text-slate-500">
                                        No notifications right now
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => goToPage("reports")}
                                className="w-full border-t border-slate-200 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                            >
                                View notification report
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setIsManagerMenuOpen((value) => !value);
                            setIsNotificationsOpen(false);
                        }}
                        className="pm-user-menu-button flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-2 py-2 shadow-sm transition hover:bg-slate-50"
                        aria-label="Open manager menu"
                        title="Manager menu"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-200 bg-violet-50 text-sm font-bold text-violet-700 shadow-sm sm:h-10 sm:w-10">
                            {getUserInitials(currentUser)}
                        </div>

                        <span className="hidden max-w-[220px] truncate text-sm font-bold text-slate-900 lg:inline">
                            {displayName}
                        </span>
                        <ChevronDown size={16} className="hidden shrink-0 text-slate-500 lg:block" />

                    </button>

                    {isManagerMenuOpen && (
                        <div className="pm-elevated absolute right-0 z-40 mt-3 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white">
                            {canManageContent(currentUser) && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => goToPage("employees")}
                                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold hover:bg-slate-50"
                                    >
                                        <Users size={18} /> Manager Profile
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => goToPage("settings")}
                                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold hover:bg-slate-50"
                                    >
                                        <Settings size={18} /> Account Settings
                                    </button>
                                </>
                            )}

                            {!canManageContent(currentUser) && (
                                <>
                                    <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Employee Access
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => goToPage("settings")}
                                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold hover:bg-slate-50"
                                    >
                                        <Settings size={18} /> My Settings
                                    </button>
                                </>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    closeMenus();
                                    onLogout?.();
                                }}
                                className="flex w-full items-center gap-3 border-t border-slate-200 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                            >
                                <LogOut size={18} /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export { Logo, Sidebar, Topbar };
