// -----------------------------------------------------------------------------
// PhotoMetrics Frontend Application Shell
// -----------------------------------------------------------------------------
// This module owns the top-level React state for the active page, authenticated
// user session, sidebar collapse behavior, and global page search. Page content
// and reusable UI pieces are intentionally imported from smaller modules so this
// file stays focused on routing and application-level coordination.
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import { Sidebar, Topbar } from "./components/Layout";
import { getUseApiDataSetting, apiPlaceholders } from "./services/api";
import { getPublicUser, mockUsers, placeholderPages } from "./data/mockData";
import { canAccessPage, canManageContent } from "./utils/accessControl";
import {
    AnalyticsPage,
    Dashboard,
    EmployeeSettingsPage,
    EmployeesPage,
    LoginPage,
    PlaceholderPage,
    ProjectsAndAssignmentsSecure,
    ReportsPage,
    SettingsPage,
    TaskManagementPageSecure,
} from "./features/Pages";

/**
 * Coordinates authenticated app state, page routing, sidebar behavior, and logout/session handling.
 */
export default function App() {
    const [page, setPage] = useState("dashboard");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [globalSearch, setGlobalSearch] = useState("");
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const savedUser = window.localStorage.getItem("photometrics-session");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.warn("Saved login session could not be loaded.", error);
            return null;
        }
    });

    /**
     * Persists the selected user session when requested and resets the workspace to the dashboard.
     */
    const handleLogin = (user, rememberMe) => {
        const nextUser = user || getPublicUser(mockUsers[0]);

        setCurrentUser(nextUser);
        setPage("dashboard");
        setGlobalSearch("");

        if (rememberMe) {
            window.localStorage.setItem("photometrics-session", JSON.stringify(nextUser));
        } else {
            window.localStorage.removeItem("photometrics-session");
        }
    };

    /**
     * Updates both React state and local storage after profile or preference changes.
     */
    const updateCurrentUser = (nextUser) => {
        setCurrentUser(nextUser);
        window.localStorage.setItem("photometrics-session", JSON.stringify(nextUser));
    };

    /**
     * Attempts backend logout when API mode is enabled, then clears all local session state.
     */
    const handleLogout = async () => {
        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.logout();
            } catch (apiError) {
                console.warn("Logout API endpoint is not connected yet. Logging out locally.", apiError);
            }
        }

        window.localStorage.removeItem("photometrics-session");
        setCurrentUser(null);
        setPage("dashboard");
        setGlobalSearch("");
        setIsSidebarCollapsed(false);
    };

    useEffect(() => {
        if (currentUser && !canAccessPage(currentUser, page)) {
            setPage("dashboard");
        }
    }, [currentUser, page]);

    /**
     * Prevents users from navigating to pages outside their role permissions.
     */
    const setAuthorizedPage = (nextPage) => {
        setGlobalSearch("");
        setPage(canAccessPage(currentUser, nextPage) ? nextPage : "dashboard");
    };

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <div className="flex min-h-screen flex-col">
                <Topbar
                    isSidebarCollapsed={isSidebarCollapsed}
                    onToggleSidebar={() => setIsSidebarCollapsed((value) => !value)}
                    onPageChange={setAuthorizedPage}
                    onLogout={handleLogout}
                    currentUser={currentUser}
                    globalSearch={globalSearch}
                    onGlobalSearchChange={setGlobalSearch}
                />

                <div className="flex flex-1 flex-col md:flex-row">
                    <Sidebar
                        isCollapsed={isSidebarCollapsed}
                        activePage={page}
                        onPageChange={setAuthorizedPage}
                        onLogout={handleLogout}
                        currentUser={currentUser}
                    />

                    <main className="min-w-0 flex-1 overflow-x-hidden">
                        {page === "dashboard" && <Dashboard onPageChange={setAuthorizedPage} currentUser={currentUser} />}
                        {page === "projects" && <ProjectsAndAssignmentsSecure currentUser={currentUser} globalSearch={globalSearch} />}
                        {page === "employees" && canManageContent(currentUser) && <EmployeesPage globalSearch={globalSearch} />}
                        {page === "tasks" && <TaskManagementPageSecure currentUser={currentUser} globalSearch={globalSearch} />}
                        {page === "reports" && canManageContent(currentUser) && <ReportsPage globalSearch={globalSearch} />}
                        {page === "analytics" && canManageContent(currentUser) && <AnalyticsPage globalSearch={globalSearch} />}
                        {page === "settings" && (canManageContent(currentUser)
                            ? <SettingsPage />
                            : <EmployeeSettingsPage currentUser={currentUser} onUserUpdate={updateCurrentUser} />
                        )}
                        {placeholderPages[page] && <PlaceholderPage title={placeholderPages[page]} />}
                    </main>
                </div>
            </div>
        </div>
    );
}
