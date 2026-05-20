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
import { ErrorBoundary } from "./components/ErrorBoundary";
import { getUseApiDataSetting, apiPlaceholders, clearPublishedApiErrors } from "./services/api";
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

function getApiErrorHelp(error) {
    const endpoint = error?.endpoint || "unknown endpoint";
    const status = Number(error?.status || error?.code);
    const isDashboardEndpoint = endpoint.startsWith("/dashboard/");

    if (status === 404 && isDashboardEndpoint) {
        return {
            title: "Dashboard API route is missing",
            meaning: "The app is in Database/API mode and requested live dashboard data, but the backend does not currently have this dashboard route deployed.",
            impact: "Login can still be successful. The affected dashboard section may show empty live data until the endpoint is implemented or mock data is turned back on.",
            nextStep: "Add the matching Express route under /api/dashboard, or use mock data for dashboard preview while those API endpoints are still being built.",
        };
    }

    if (status === 404) {
        return {
            title: "API route was not found",
            meaning: "The frontend sent a request to an API path that the running backend did not recognize.",
            impact: "Only the feature using this endpoint is affected; the rest of the app can continue running.",
            nextStep: "Check that the frontend endpoint path matches a backend route and that the latest backend deployment includes it.",
        };
    }

    if (status === 401 || status === 403) {
        return {
            title: "Authentication or permission issue",
            meaning: "The backend received the request but rejected it for the current user/session.",
            impact: "The requested data or action was blocked by the API.",
            nextStep: "Confirm the user is logged in with the right role and that any token/session handling is configured for this environment.",
        };
    }

    if (status === 405) {
        return {
            title: "API method is not supported",
            meaning: "The backend route exists, but it does not accept this HTTP method.",
            impact: "The requested action was not completed.",
            nextStep: "Check whether the frontend should use a different method, or add the missing method handler to the backend route.",
        };
    }

    if (status >= 500) {
        return {
            title: "Backend server error",
            meaning: "The backend route ran but failed while processing the request.",
            impact: "The affected feature may be unavailable until the server-side error is fixed.",
            nextStep: "Check the backend logs, database connection, and environment variables for the failing route.",
        };
    }

    return {
        title: "API request failed",
        meaning: "The app tried to use live API data, but the request did not complete successfully.",
        impact: "The affected feature may show empty data or stop that action.",
        nextStep: "Check the route, request payload, backend logs, and environment configuration.",
    };
}


function ApiErrorBanner() {
    const [errors, setErrors] = useState(() => {
        if (typeof window === "undefined") return [];
        return window.__photometricsApiErrors || [];
    });
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const handleApiError = () => {
            setErrors([...(window.__photometricsApiErrors || [])]);
            setIsExpanded(false);
        };
        window.addEventListener("photometrics-api-error", handleApiError);
        return () => window.removeEventListener("photometrics-api-error", handleApiError);
    }, []);

    if (!errors.length) return null;

    const latestError = errors[0];
    const help = getApiErrorHelp(latestError);
    const statusLabel = latestError.statusText
        ? `${latestError.status || latestError.code} ${latestError.statusText}`
        : latestError.status || latestError.code;
    const requestPath = latestError.url || latestError.endpoint;

    return (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <div className="mx-auto flex max-w-7xl flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="font-black">Backend/API issue detected</div>
                        <div className="mt-1">
                            <span className="font-bold">{latestError.method}</span> {latestError.endpoint} returned <span className="font-bold">{statusLabel}</span>: {help.title}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="self-start rounded-lg border border-amber-300 bg-white px-3 py-1 font-bold text-amber-900 transition hover:bg-amber-100"
                            onClick={() => setIsExpanded((value) => !value)}
                        >
                            {isExpanded ? "Hide details" : "More information"}
                        </button>
                        <button
                            type="button"
                            className="self-start rounded-lg border border-amber-300 bg-white px-3 py-1 font-bold text-amber-900 transition hover:bg-amber-100"
                            onClick={() => {
                                window.__photometricsApiErrors = [];
                                setErrors([]);
                            }}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="grid gap-3 rounded-lg border border-amber-200 bg-white/80 p-3 text-amber-950 md:grid-cols-2">
                        <div>
                            <div className="font-black">{help.title}</div>
                            <div className="mt-2 leading-6">{help.meaning}</div>
                            <div className="mt-2 leading-6">{help.impact}</div>
                            <div className="mt-2 font-semibold leading-6">{help.nextStep}</div>
                        </div>
                        <div className="space-y-1 break-words text-xs leading-5">
                            <div><span className="font-bold">Request:</span> {latestError.method} {requestPath}</div>
                            <div><span className="font-bold">Frontend endpoint:</span> {latestError.endpoint}</div>
                            <div><span className="font-bold">Status:</span> {statusLabel}</div>
                            <div><span className="font-bold">Raw message:</span> {latestError.message}</div>
                            <div><span className="font-bold">Recorded:</span> {latestError.timestamp}</div>
                            {errors.length > 1 && (
                                <div>
                                    <span className="font-bold">Recent API issues:</span>
                                    {errors.slice(1, 4).map((error) => (
                                        <div key={`${error.method}-${error.endpoint}-${error.timestamp}`} className="mt-1 pl-3">
                                            {error.method} {error.endpoint} returned {error.status || error.code}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Coordinates authenticated app state, page routing, sidebar behavior, and logout/session handling.
 */
export default function App() {
    const [page, setPage] = useState("dashboard");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [globalSearch, setGlobalSearch] = useState("");
    // Always require authentication on application startup.
    // Persisted sessions are cleared so the app always opens on the login screen.
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        window.localStorage.removeItem("photometrics-session");
    }, []);

    /**
     * Persists the selected user session when requested and resets the workspace to the dashboard.
     */
    const handleLogin = (user, rememberMe) => {
        const nextUser = user || getPublicUser(mockUsers[0]);

        clearPublishedApiErrors();
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
                await apiPlaceholders.logout(currentUser);
            } catch (apiError) {
                console.warn("Logout API endpoint is not connected yet. Logging out locally.", apiError);
            }
        }

        clearPublishedApiErrors();
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
                        <ApiErrorBanner />
                        <ErrorBoundary key={page}>
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
                        </ErrorBoundary>
                    </main>
                </div>
            </div>
        </div>
    );
}
