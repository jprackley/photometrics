// -----------------------------------------------------------------------------
// Login Page.
// -----------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import {
    BarChart3,
    Bell,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Eye,
    EyeOff,
    Folder,
    ListChecks,
    Lock,
    Mail,
    MoreVertical,
    Pencil,
    Play,
    Plus,
    Search,
    Settings,
    ShieldCheck,
    Sparkles,
    Square,
    Trash2,
    Users,
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
} from "recharts";

import { Logo } from "../components/Layout";
import {
    API_ENDPOINTS,
    DEFAULT_USE_API_DATA,
    apiPlaceholders,
    apiRequest,
    getUseApiDataSetting,
    normalizeBackendUser,
    saveUseApiDataSetting,
    unwrapApiPayload,
    useApiPlaceholder,
} from "../services/api";
import {
    employees,
    employeeActivity,
    findMockUserByEmail,
    getPublicUser,
    kpis,
    mockUsers,
    placeholderPages,
    productivity,
    projectProgress,
    projects,
    settingsData,
    taskItems,
    workflow,
} from "../data/mockData";
import {
    ASSIGNMENTS_PAGE_SIZE,
    ASSIGNMENT_COLUMNS,
    EMPLOYEES_PAGE_SIZE,
    EMPLOYEE_COLUMNS,
    PROJECTS_PAGE_SIZE,
    PROJECT_COLUMNS,
    TASKS_PAGE_SIZE,
    TASK_COLUMNS,
    buildPageNumbers,
    downloadEmployeesReport,
    downloadTextFile,
    downloadProjectsReport,
    downloadTasksReport,
    formatDuration,
    formatNumber,
    formatPercent,
    generateNextId,
    getLiveTrackedSeconds,
    getNextSort,
    getSortableValue,
    getRangeText,
    getTimerUserKey,
    getTaskTimerSession,
    getTotalPages,
    getUniqueOptions,
    normalizeNumber,
    normalizeTaskForTimers,
    paginateRows,
    sortRows,
} from "../utils/helpers";
import {
    ANALYTICS_COLORS,
    REPORT_ASSIGNMENT_COLUMNS,
    REPORT_EMPLOYEE_COLUMNS,
    REPORT_PROJECT_COLUMNS,
    REPORT_TIME_COLUMNS,
    buildOperationsReportData,
    downloadFullOperationsReport,
    downloadReportTable,
} from "../utils/reporting";
import {
    canManageContent,
    filterRowsByAccess,
    getAssignedProjectNames,
    isAssignedToUser,
    rowMatchesSearch,
} from "../utils/accessControl";
import {
    Badge,
    PriorityBadge,
    ProgressBar,
    RowActions,
    FilterSelect,
    SortableHeader,
    TableFooter,
    FormField,
    TextInput,
    Modal,
} from "./sharedComponents";

/**
 * Renders decorative SVG artwork for the left side of the login experience.
 */
function LoginHeroGraphic() {
    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-24 flex items-end justify-center overflow-hidden">
            <div className="absolute left-1/2 top-12 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
            <svg
                viewBox="0 0 760 560"
                className="relative z-10 h-[520px] w-[760px] max-w-none translate-x-[-6%]"
                role="img"
                aria-label="Photometrics login illustration"
            >
                <defs>
                    <linearGradient id="loginHeroBlue" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                    <filter id="loginHeroGlow" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <path
                    d="M65 435C128 473 226 474 305 426C389 375 403 299 475 262C558 219 646 252 715 306V560H65Z"
                    fill="url(#loginHeroBlue)"
                    opacity="0.9"
                />
                <path
                    d="M176 328C204 260 272 224 347 249C409 270 430 327 401 372C371 419 299 434 240 407C192 385 162 363 176 328Z"
                    fill="#02050d"
                    stroke="#60a5fa"
                    strokeWidth="5"
                />
                <path
                    d="M250 247C260 176 301 124 371 112C438 101 500 133 525 194C546 246 527 302 488 337"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="5"
                    strokeLinecap="round"
                />
                <path
                    d="M309 112L508 139L494 188L292 161Z"
                    fill="#02050d"
                    stroke="#60a5fa"
                    strokeWidth="5"
                    strokeLinejoin="round"
                />
                <path
                    d="M312 104L322 57M343 108L354 49M377 113L388 51M414 117L425 62"
                    stroke="#60a5fa"
                    strokeWidth="5"
                    strokeLinecap="round"
                />
                <path
                    d="M253 336C282 313 320 310 350 329C384 350 386 391 357 413"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="5"
                    strokeLinecap="round"
                />
                <path
                    d="M291 334C296 316 315 305 333 310C350 315 359 332 353 349C347 367 329 377 311 371C294 366 285 351 291 334Z"
                    fill="#02050d"
                    stroke="#60a5fa"
                    strokeWidth="5"
                />
                <circle cx="333" cy="337" r="9" fill="#60a5fa" />
                <path
                    d="M141 318L71 300L38 397C82 421 135 415 179 384Z"
                    fill="#02050d"
                    stroke="#60a5fa"
                    strokeWidth="5"
                    strokeLinejoin="round"
                />
                <circle cx="99" cy="294" r="13" fill="#02050d" stroke="#60a5fa" strokeWidth="5" />
                <circle cx="58" cy="283" r="13" fill="#02050d" stroke="#60a5fa" strokeWidth="5" />
                <path
                    d="M512 190C534 202 548 225 552 252M530 174C563 194 583 226 585 264M238 230C217 240 197 255 183 278"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="5"
                    strokeLinecap="round"
                    opacity="0.95"
                />
                <path
                    d="M428 367C462 352 496 353 527 372M451 347C473 357 490 371 503 389M449 390C477 388 501 398 522 419"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="5"
                    strokeLinecap="round"
                />
                <path
                    d="M522 373C540 362 557 359 573 363M502 389C520 393 536 402 549 416M522 419C539 427 551 439 559 454"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="4"
                    strokeLinecap="round"
                />
                <path
                    d="M238 409L206 456L252 481"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M410 425C453 432 489 455 514 493"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="5"
                    strokeLinecap="round"
                />
                <path
                    d="M156 281C177 246 209 221 247 208"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.75"
                    filter="url(#loginHeroGlow)"
                />
            </svg>
        </div>
    );
}


function getMockLoginSummary() {
    const totalTasks = taskItems.filter((task) => task.status !== "Cancelled").length;
    const completedTasks = taskItems.filter((task) => task.status === "Completed").length;
    const openTasks = taskItems.filter((task) => task.status !== "Completed" && task.status !== "Cancelled").length;

    return {
        projects: projects.length,
        openTasks,
        efficiency: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100,
    };
}

function formatLoginSummaryValue(value, suffix = "") {
    if (value === null || value === undefined) return "—";

    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return `${value}${suffix}`;

    return `${numberValue.toLocaleString()}${suffix}`;
}

/**
 * Handles demo and API-backed login, including manager and employee credential shortcuts.
 */
function LoginPage({ onLogin }) {
    const initialUseMockLoginData = useMemo(() => !getUseApiDataSetting(), []);
    const [email, setEmail] = useState(initialUseMockLoginData ? "manager@photometrics.com" : "muser@gmail.com");
    const [password, setPassword] = useState(initialUseMockLoginData ? "demo123" : "password");
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [useMockLoginData, setUseMockLoginData] = useState(initialUseMockLoginData);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loginSummary, setLoginSummary] = useState(() => getMockLoginSummary());

    useEffect(() => {
        let isMounted = true;

        async function loadLoginSummary() {
            if (useMockLoginData) {
                setLoginSummary(getMockLoginSummary());
                return;
            }

            try {
                const summary = await apiRequest(API_ENDPOINTS.dashboard.loginSummary, { suppressApiError: true });

                if (isMounted && summary) {
                    setLoginSummary({
                        projects: Number(summary.projects) || 0,
                        openTasks: Number(summary.openTasks) || 0,
                        efficiency: Number(summary.efficiency) || 0,
                    });
                }
            } catch (summaryError) {
                console.warn("Login summary API failed. Falling back to mock summary values.", summaryError);
                if (isMounted) {
                    setLoginSummary(getMockLoginSummary());
                }
            }
        }

        loadLoginSummary();

        return () => {
            isMounted = false;
        };
    }, [useMockLoginData]);

    const handleMockDataToggle = (checked) => {
        setUseMockLoginData(checked);
        saveUseApiDataSetting(!checked);
        setEmail(checked ? "manager@photometrics.com" : "muser@gmail.com");
        setPassword(checked ? "demo123" : "password");
        setError("");
        setMessage(checked
            ? "Demo access is enabled."
            : "Database access is enabled."
        );
    };

    const fillDemoCredentials = () => {
        setEmail("manager@photometrics.com");
        setPassword("demo123");
        setRememberMe(true);
        setError("");
        setMessage("Demo manager credentials loaded.");
    };

    const fillEmployeeCredentials = (employeeUser) => {
        setEmail(employeeUser.email);
        setPassword(employeeUser.password);
        setRememberMe(true);
        setError("");
        setMessage(`${employeeUser.name} demo credentials loaded.`);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!email.trim() || !password.trim()) {
            setError("Enter both an email and password to continue.");
            return;
        }

        setIsSubmitting(true);

        try {
            let user = null;

            if (!useMockLoginData) {
                const response = await apiPlaceholders.login({
                    email: email.trim(),
                    password_hash: password,
                    rememberMe,
                });
                const payload = unwrapApiPayload(response);
                user = normalizeBackendUser(payload?.user || payload);
            } else {
                const matchedUser = findMockUserByEmail(email);
                if (!matchedUser || matchedUser.password !== password) {
                    setError("Invalid demo login. Use the manager login or one of the employee logins listed below.");
                    return;
                }
                user = getPublicUser(matchedUser);
            }

            onLogin?.(getPublicUser(normalizeBackendUser(user) || user), rememberMe);
        } catch (apiError) {
            console.warn("Login API failed while mock data is turned off. Mock login fallback is disabled.", apiError);
            const apiMessage = apiError?.message || "The login API/database request failed.";
            setError(`${apiMessage} Enable demo access to use mock accounts.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const employeeDemoUsers = mockUsers.filter((user) => user.accessLevel === "employee");
    const loginModeLabel = useMockLoginData ? "Demo accounts" : "Database";

    return (
        <main className="min-h-screen bg-[#eef2f6] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                    <div className="grid min-h-[690px] grid-cols-1 lg:grid-cols-[minmax(340px,0.9fr)_minmax(460px,1.1fr)]">
                        <section className="relative overflow-hidden bg-[#0b1320] px-6 py-7 text-white sm:px-8 lg:px-10">
                            <div className="absolute inset-x-0 bottom-0 h-44 bg-[#162236]" />
                            <div className="absolute -right-24 top-24 h-72 w-72 rounded-full border border-white/10" />
                            <div className="absolute -right-10 top-40 h-32 w-32 rounded-full bg-[#d6b768]/20 blur-2xl" />

                            <div className="relative z-10 flex h-full flex-col">
                                <div className="max-w-[380px] rounded-2xl border border-white/10 bg-white/95 p-2 shadow-xl shadow-black/20">
                                    <Logo variant="login" />
                                </div>

                                <div className="mt-10 max-w-md">
                                    <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e8cf8b]">
                                        <ShieldCheck size={16} />
                                        Studio console
                                    </div>
                                    <h1 className="mt-5 text-4xl font-bold leading-tight tracking-normal text-white">
                                        Photometrics operations, in one secure workspace.
                                    </h1>
                                    <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
                                        Manage active photography projects, assigned task work, employee output, and delivery progress.
                                    </p>
                                </div>

                                <div className="mt-auto grid gap-3 pt-10 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                                    {[
                                        ["Projects", formatLoginSummaryValue(loginSummary.projects)],
                                        ["Open tasks", formatLoginSummaryValue(loginSummary.openTasks)],
                                        ["Efficiency", formatLoginSummaryValue(loginSummary.efficiency, "%")],
                                    ].map(([label, value]) => (
                                        <div key={label} className="rounded-lg border border-white/10 bg-white/10 p-4">
                                            <div className="text-2xl font-bold text-white">{value}</div>
                                            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-300">{label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="flex items-center px-6 py-8 sm:px-8 lg:px-12">
                            <div className="mx-auto w-full max-w-[520px]">
                                <div className="mb-7">
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                                        <Lock size={15} />
                                        {loginModeLabel}
                                    </div>
                                    <h2 className="text-3xl font-bold tracking-normal text-slate-950">Sign in</h2>
                                    <p className="mt-2 text-sm text-slate-600">
                                        Access the Photometrics dashboard.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <label className="block space-y-2 text-sm font-bold text-slate-700">
                                        <span>Email</span>
                                        <div className="flex h-12 items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 text-slate-950 shadow-sm focus-within:border-[#c7a34b] focus-within:ring-2 focus-within:ring-[#f5e7bf]">
                                            <Mail size={18} className="shrink-0 text-slate-400" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                placeholder="muser@gmail.com"
                                                className="w-full bg-transparent text-sm font-semibold outline-none"
                                                autoComplete="email"
                                            />
                                        </div>
                                    </label>

                                    <label className="block space-y-2 text-sm font-bold text-slate-700">
                                        <span>Password</span>
                                        <div className="flex h-12 items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 text-slate-950 shadow-sm focus-within:border-[#c7a34b] focus-within:ring-2 focus-within:ring-[#f5e7bf]">
                                            <Lock size={18} className="shrink-0 text-slate-400" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(event) => setPassword(event.target.value)}
                                                placeholder="Enter password"
                                                className="w-full bg-transparent text-sm font-semibold outline-none"
                                                autoComplete="current-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((value) => !value)}
                                                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </label>

                                    <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                                        <label className="flex items-center gap-2 font-semibold text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(event) => setRememberMe(event.target.checked)}
                                                className="h-4 w-4 accent-[#c7a34b]"
                                            />
                                            Remember me
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setError("");
                                                setMessage("Password reset is pending backend implementation.");
                                            }}
                                            className="font-bold text-[#9a6b12] hover:text-[#73500d]"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>

                                    {error && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                            {error}
                                        </div>
                                    )}

                                    {message && (
                                        <div className="rounded-lg border border-[#ead8a8] bg-[#fff8e7] px-4 py-3 text-sm font-semibold text-[#77520f]">
                                            {message}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#d7b55f] px-5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-[#e5c872] disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {isSubmitting ? "Signing in" : "Sign in"}
                                    </button>
                                </form>

                                <details className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                    <summary className="cursor-pointer select-none font-bold text-slate-900">
                                        Testing access
                                    </summary>

                                    <div className="mt-4 space-y-4">
                                        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-3 py-3">
                                            <span>
                                                <span className="block text-sm font-bold text-slate-800">Demo accounts</span>
                                                <span className="mt-1 block text-xs text-slate-500">
                                                    Current mode: {loginModeLabel}
                                                </span>
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={useMockLoginData}
                                                onChange={(event) => handleMockDataToggle(event.target.checked)}
                                                className="h-5 w-5 accent-[#c7a34b]"
                                            />
                                        </label>

                                        <button
                                            type="button"
                                            onClick={fillDemoCredentials}
                                            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-100"
                                        >
                                            Load demo manager
                                        </button>

                                        <div className="grid gap-2">
                                            {employeeDemoUsers.map((employeeUser) => (
                                                <button
                                                    key={employeeUser.id}
                                                    type="button"
                                                    onClick={() => fillEmployeeCredentials(employeeUser)}
                                                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:border-[#d7b55f] hover:bg-[#fff8e7]"
                                                >
                                                    <span className="truncate">{employeeUser.name}</span>
                                                    <span className="truncate text-slate-500">{employeeUser.email}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}

export {
    LoginPage,
};
