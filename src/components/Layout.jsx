// -----------------------------------------------------------------------------
// Shared Layout Components
// -----------------------------------------------------------------------------
// Contains the reusable page chrome used across the authenticated application:
// the company logo, responsive sidebar navigation, top search bar, notification
// control, and user menu. These components are presentation-focused and receive
// state/action handlers from the application shell.
// -----------------------------------------------------------------------------

import React, { useState } from "react";
import {
    Bell,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Search,
    Settings,
    Users,
} from "lucide-react";
import { getAllowedNavItems, canManageContent } from "../utils/accessControl";

// Company logo component
/**
 * Renders the shared company logo used on the login page and app header.
 */
function Logo() {
    return (
        <div className="flex items-center justify-start">
            <img
                src="https://chambermaster.blob.core.windows.net/images/customers/2243/members/7487/logos/MEMBER_PAGE_HEADER/CM_final_logo_(2).jpg"
                alt="Company Logo"
                className="h-[56px] w-auto max-w-[230px] object-contain md:h-[70px]"
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
            className={`flex w-full shrink-0 flex-col border-b border-slate-200 bg-white transition-all duration-300 md:border-b-0 md:border-r ${
                isCollapsed ? "md:w-[84px]" : "md:w-[260px]"
            }`}
        >
            {/* Navigation buttons */}
            <nav className="flex gap-2 overflow-x-auto p-3 md:flex-1 md:flex-col md:space-y-3 md:overflow-visible md:p-4 md:pt-6">
                {getAllowedNavItems(currentUser).map(({ label, page, icon: Icon }) => (
                    <button
                        key={label}
                        type="button"
                        title={isCollapsed ? label : undefined}
                        onClick={() => onPageChange(page)}

                        // Highlight active page button
                        className={`flex min-w-max items-center rounded-xl px-3 py-3 text-sm transition hover:bg-slate-100 md:w-full md:text-lg ${
                            isCollapsed ? "gap-2 md:justify-center md:px-0" : "gap-2 md:gap-4 md:px-4 md:text-left"
                        } ${
                            activePage === page
                                ? "bg-slate-100 font-semibold text-violet-700"
                                : "font-medium text-slate-800"
                        }`}
                    >
                        <Icon size={24} strokeWidth={2} />
                        <span className={isCollapsed ? "md:hidden" : ""}>{label}</span>
                    </button>
                ))}
            </nav>

            {/* Logout button */}
            <button
                type="button"
                title={isCollapsed ? "Logout" : undefined}
                onClick={onLogout}
                className={`m-3 flex min-w-max items-center rounded-xl px-3 py-3 text-sm font-semibold hover:bg-slate-100 md:m-4 md:text-lg ${
                    isCollapsed ? "gap-2 md:justify-center md:px-0" : "gap-2 md:gap-4 md:px-4"
                }`}
            >
                <LogOut size={24} />
                <span className={isCollapsed ? "md:hidden" : ""}>Logout</span>
            </button>
        </aside>
    );
}

// Top header bar
/**
 * Renders the application header, global search input, notification menu, and user menu.
 */
function Topbar({ isSidebarCollapsed, onToggleSidebar, onPageChange, onLogout, currentUser, globalSearch, onGlobalSearchChange }) {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isManagerMenuOpen, setIsManagerMenuOpen] = useState(false);

    const notifications = [
        "3 projects are due this week",
        "2 assignments are ready for review",
        "Project export is available from the Projects tab",
    ];

    const closeMenus = () => {
        setIsNotificationsOpen(false);
        setIsManagerMenuOpen(false);
    };

    const goToPage = (nextPage) => {
        closeMenus();
        onPageChange?.(nextPage);
    };

    return (
        <header className="relative z-30 flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:min-h-[86px] md:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-0">

            {/* Brand area now stays in the top bar instead of the collapsible sidebar */}
            <div className="flex w-full flex-col gap-3 md:flex-row md:items-center lg:w-auto lg:flex-1">
                <div className="flex items-center justify-between gap-3 md:justify-start md:gap-4">
                    <Logo />

                    {/* Collapse menu button only controls the left menu width */}
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white shadow-sm transition hover:bg-slate-100 md:flex"
                    >
                        {isSidebarCollapsed
                            ? <ChevronRight size={22} />
                            : <ChevronLeft size={22} />}
                    </button>
                </div>

                {/* Search bar */}
                <div className="flex w-full items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 shadow-sm md:max-w-[380px] lg:ml-4">
                    <Search size={20} className="text-slate-500" />
                    <input
                        value={globalSearch}
                        onChange={(event) => onGlobalSearchChange?.(event.target.value)}
                        className="w-full text-base outline-none"
                        placeholder="Search current page"
                    />
                </div>
            </div>

            {/* User info area */}
            <div className="flex w-full items-center justify-end gap-3 sm:w-auto sm:gap-5 sm:pr-2">
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setIsNotificationsOpen((value) => !value);
                            setIsManagerMenuOpen(false);
                        }}
                        className="relative rounded-xl p-2 transition hover:bg-slate-100"
                        aria-label="Open notifications"
                        title="Notifications"
                    >
                        <Bell size={24} />
                        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-violet-600" />
                    </button>

                    {isNotificationsOpen && (
                        <div className="absolute right-0 z-40 mt-3 w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-80">
                            <div className="border-b border-slate-200 px-4 py-3 font-bold">
                                Notifications
                            </div>

                            <div className="divide-y divide-slate-100">
                                {notifications.map((notification) => (
                                    <button
                                        key={notification}
                                        type="button"
                                        onClick={() => goToPage("projects")}
                                        className="block w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        {notification}
                                    </button>
                                ))}
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
                        className="flex items-center gap-4 rounded-xl px-2 py-1 transition hover:bg-slate-100"
                        aria-label="Open manager menu"
                        title="Manager menu"
                    >
                        {/* User profile image */}
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border-2 border-slate-300 bg-slate-100 shadow-sm sm:h-12 sm:w-12">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQI6QNyB22A2rTJfdHWecRsPWOH4OlbAUGIhQ&s"
                                alt="Logged in manager"
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <span className="hidden text-lg font-bold sm:inline">{currentUser?.name || "Manager"}⌄</span>
                    </button>

                    {isManagerMenuOpen && (
                        <div className="absolute right-0 z-40 mt-3 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
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
