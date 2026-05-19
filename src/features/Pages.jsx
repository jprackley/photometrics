// -----------------------------------------------------------------------------
// Page and Feature Components
// -----------------------------------------------------------------------------
// Groups the main user-facing screens for the PhotoMetrics frontend, including
// login, dashboard, project management, employee management, task timers, reports,
// analytics, and settings. Shared layout concerns live in components/Layout.jsx,
// while data access and utility logic live in services and utils modules.
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
    getUseApiDataSetting,
    normalizeBackendUser,
    saveUseApiDataSetting,
    unwrapApiPayload,
    useApiPlaceholder,
} from "../services/api";
import {
    assignments,
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

/**
 * Handles demo and API-backed login, including manager and employee credential shortcuts.
 */
function LoginPage({ onLogin }) {
    const [email, setEmail] = useState("manager@photometrics.com");
    const [password, setPassword] = useState("demo123");
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [useMockLoginData, setUseMockLoginData] = useState(() => !getUseApiDataSetting());
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleMockDataToggle = (checked) => {
        setUseMockLoginData(checked);
        saveUseApiDataSetting(!checked);
        setError("");
        setMessage(checked
            ? "Mock data is enabled. Demo logins will use front-end mock accounts."
            : "Mock data is off. Sign in will use the backend API/database only."
        );
    };

    const fillDemoCredentials = () => {
        setEmail("manager@photometrics.com");
        setPassword("demo123");
        setRememberMe(true);
        setError("");
        setMessage("Manager credentials loaded. Click Sign In for full access.");
    };

    const fillEmployeeCredentials = (employeeUser) => {
        setEmail(employeeUser.email);
        setPassword(employeeUser.password);
        setRememberMe(true);
        setError("");
        setMessage(`${employeeUser.name} credentials loaded. This login only shows assigned jobs.`);
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
            setError("The login API/database request failed. Mock login will not be used unless Use Mock Data is turned on.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
            <div className="w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-[0.88fr_1.12fr]">
                    <section className="bg-[#07111f] px-6 py-7 text-white sm:px-8 lg:px-10">
                        <div className="rounded-2xl border border-white/10 bg-white px-4 py-3 shadow-xl">
                            <Logo />
                        </div>

                        <div className="mt-8">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">
                                Productivity Dashboard
                            </p>
                            <h1 className="mt-4 text-3xl font-black leading-tight text-white lg:text-4xl">
                                Sign in to manage projects, employees, tasks, and reports.
                            </h1>
                            <p className="mt-4 text-sm leading-6 text-slate-300">
                                This login page can use backend authentication or front-end mock accounts. Turn mock data on only when reviewing the app without a live database.
                            </p>
                        </div>

                        <div className="mt-7 grid grid-cols-3 gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center shadow-lg">
                                <div className="text-xl font-black">12</div>
                                <div className="mt-1 text-[11px] text-slate-300">Active projects</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center shadow-lg">
                                <div className="text-xl font-black">45</div>
                                <div className="mt-1 text-[11px] text-slate-300">Tasks today</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center shadow-lg">
                                <div className="text-xl font-black">87%</div>
                                <div className="mt-1 text-[11px] text-slate-300">Efficiency</div>
                            </div>
                        </div>
                    </section>

                    <section className="px-6 py-7 sm:px-8 lg:px-10">
                        <div className="mb-6 text-center sm:text-left">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                                <ShieldCheck size={16} /> Secure manager access
                            </div>
                            <h2 className="text-3xl font-black text-slate-950">Welcome back</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Sign in to continue to the Photometrics dashboard.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="block space-y-2 text-sm font-semibold text-slate-700">
                                <span>Email Address</span>
                                <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
                                    <Mail size={20} className="text-slate-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder="manager@photometrics.com"
                                        className="w-full bg-transparent text-sm outline-none"
                                        autoComplete="email"
                                    />
                                </div>
                            </label>

                            <label className="block space-y-2 text-sm font-semibold text-slate-700">
                                <span>Password</span>
                                <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
                                    <Lock size={20} className="text-slate-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        placeholder="Enter password"
                                        className="w-full bg-transparent text-sm outline-none"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((value) => !value)}
                                        className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </label>

                            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                                <label className="flex items-center gap-2 font-medium text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(event) => setRememberMe(event.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-300"
                                    />
                                    Remember me
                                </label>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setError("");
                                        setMessage("Password reset is pending backend implementation.");
                                    }}
                                    className="font-semibold text-amber-700 hover:text-amber-800"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <label className="flex cursor-pointer items-start justify-between gap-4">
                                    <span>
                                        <span className="block text-sm font-bold text-slate-800">Use Mock Data</span>
                                        <span className="mt-1 block text-xs leading-5 text-slate-600">
                                            When this is off, login uses the backend API/database only and will not fall back to mock accounts if the API fails.
                                        </span>
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={useMockLoginData}
                                        onChange={(event) => handleMockDataToggle(event.target.checked)}
                                        className="mt-1 h-5 w-5 rounded border-slate-300 text-amber-500 focus:ring-amber-300"
                                    />
                                </label>
                                <div className="mt-2 text-xs font-semibold text-slate-500">
                                    Current login mode: {useMockLoginData ? "Mock demo accounts" : "Database/API only"}
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                    {error}
                                </div>
                            )}

                            {message && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e0bd6d] px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-900/10 transition hover:bg-[#efcf83] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isSubmitting ? "Signing In..." : "Sign In"}
                            </button>

                            <button
                                type="button"
                                onClick={fillDemoCredentials}
                                className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
                            >
                                {useMockLoginData ? "Use Demo Login" : "Load Demo Credentials"}
                            </button>
                        </form>

                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            <div className="font-bold text-slate-950">Demo logins</div>
                            <div className="mt-2 grid gap-1">
                                <span>Manager: manager@photometrics.com</span>
                                <span>Password for all demo accounts: demo123</span>
                            </div>

                            <div className="mt-4 max-h-36 space-y-2 overflow-y-auto pr-1">
                                {mockUsers.filter((user) => user.accessLevel === "employee").map((employeeUser) => (
                                    <button
                                        key={employeeUser.id}
                                        type="button"
                                        onClick={() => fillEmployeeCredentials(employeeUser)}
                                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
                                    >
                                        <span>{employeeUser.name}</span>
                                        <span className="truncate text-slate-500">{employeeUser.email}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

// Shared status badge used by tables, cards, and workflow summaries.
/**
 * Displays a status badge with consistent colors for project, task, and assignment states.
 */
function Badge({ value }) {

    // Set badge colors based on status
    const style =
        value === "Completed"
            ? "bg-emerald-100 text-emerald-700"
            : value === "Review"
                ? "bg-amber-100 text-amber-700"
                : "bg-violet-100 text-violet-700";

    return (
        <span className={`rounded-md px-3 py-1 text-xs font-medium ${style}`}>
            {value}
        </span>
    );
}

// Priority badge component.
/**
 * Displays priority labels with visual severity cues for high, medium, and low work items.
 */
function PriorityBadge({ value }) {

    // Set badge colors based on priority
    const style =
        value === "High"
            ? "bg-red-100 text-red-700"
            : value === "Medium"
                ? "bg-orange-100 text-orange-700"
                : "bg-slate-100 text-slate-700";

    return (
        <span className={`rounded-md px-3 py-1 text-xs font-medium ${style}`}>
            {value}
        </span>
    );
}

// Reusable progress bar component.
/**
 * Shows completion progress as a compact or full-width horizontal meter.
 */
function ProgressBar({ value, compact = false }) {
    return (
        <div className={`${compact ? "gap-1.5" : "gap-3"} flex items-center`}>
            <div className="h-3 min-w-0 flex-1 rounded-full border border-slate-300 bg-white">
                <div
                    className="h-full rounded-full bg-violet-600"
                    style={{ width: `${value}%` }}
                />
            </div>

            <span className={`${compact ? "w-7 text-[10px]" : "w-10 text-xs"} shrink-0 font-semibold text-slate-700`}>
                {value}%
            </span>
        </div>
    );
}

// Action buttons used by editable data tables.
/**
 * Provides standard edit and delete controls for table rows.
 */
function RowActions({ onEdit, onDelete }) {
    return (
        <div className="flex items-center justify-center gap-3 text-slate-700">
            <button
                type="button"
                onClick={onEdit}
                className="rounded-md p-1 hover:bg-slate-100"
                aria-label="Edit row"
                title="Edit"
            >
                <Pencil size={18} />
            </button>

            <button
                type="button"
                onClick={onDelete}
                className="rounded-md p-1 hover:bg-red-50 hover:text-red-700"
                aria-label="Delete row"
                title="Delete"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
}

// Select control used in filter bars.
/**
 * Renders a reusable select input for table and report filters.
 */
function FilterSelect({ value, onChange, options }) {
    return (
        <select
            className="h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none hover:bg-slate-50 sm:w-auto sm:min-w-[150px]"
            value={value}
            onChange={(event) => onChange(event.target.value)}
        >
            {options.map((option) => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    );
}

/**
 * Table header button that displays and updates sorting state.
 */
function SortableHeader({ column, sortConfig, onSort }) {
    const isActive = sortConfig.key === column.key;
    const sortIcon = isActive
        ? sortConfig.direction === "asc" ? "↑" : "↓"
        : "↕";

    return (
        <th className="border border-slate-300 px-4 py-3 text-left font-bold">
            <button
                type="button"
                onClick={() => onSort(column.key)}
                className={`flex w-full items-center gap-2 ${column.align === "center" ? "justify-center" : "justify-start"}`}
                title={`Sort by ${column.label}`}
            >
                <span>{column.label}</span>
                <span className={`text-xs ${isActive ? "text-violet-700" : "text-slate-400"}`}>
                    {sortIcon}
                </span>
            </button>
        </th>
    );
}

// Pagination footer used by the Projects tab tables
/**
 * Reusable pagination footer with range text and page navigation.
 */
function TableFooter({ text, currentPage, totalPages, onPageChange }) {
    const pages = buildPageNumbers(totalPages);

    return (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>{text}</span>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    className="rounded-md p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous page"
                >
                    <ChevronLeft size={16} />
                </button>

                {pages.map((pageNumber) => (
                    <button
                        key={pageNumber}
                        type="button"
                        onClick={() => onPageChange(pageNumber)}
                        className={`h-7 w-7 rounded-md text-xs font-semibold ${
                            pageNumber === currentPage
                                ? "bg-violet-600 text-white"
                                : "text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                        {pageNumber}
                    </button>
                ))}

                <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    className="rounded-md p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next page"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

/**
 * Small layout wrapper for labeled form controls.
 */
function FormField({ label, children }) {
    return (
        <label className="space-y-1 text-sm font-semibold text-slate-700">
            <span>{label}</span>
            {children}
        </label>
    );
}

/**
 * Reusable styled text input component.
 */
function TextInput({ value, onChange, placeholder, type = "text" }) {
    return (
        <input
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
    );
}

/**
 * Reusable modal shell for create/edit forms.
 */
function Modal({ title, children, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-3 py-1 text-2xl leading-none hover:bg-slate-100"
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

/**
 * Create/edit form for project records.
 */
function ProjectForm({ initialProject, onCancel, onSave }) {
    const [form, setForm] = useState(initialProject);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave({
            ...form,
            images: String(form.images || "0"),
            progress: Math.max(0, Math.min(100, normalizeNumber(form.progress))),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Project Name">
                    <TextInput value={form.name} onChange={(value) => updateField("name", value)} placeholder="Graduation - Smith" />
                </FormField>

                <FormField label="Client">
                    <TextInput value={form.client} onChange={(value) => updateField("client", value)} placeholder="Client name" />
                </FormField>

                <FormField label="Start Date">
                    <TextInput value={form.startDate} onChange={(value) => updateField("startDate", value)} placeholder="May 01, 2026" />
                </FormField>

                <FormField label="Due Date">
                    <TextInput value={form.dueDate} onChange={(value) => updateField("dueDate", value)} placeholder="May 27, 2026" />
                </FormField>

                <FormField label="Images">
                    <TextInput value={form.images} onChange={(value) => updateField("images", value)} placeholder="1200" type="number" />
                </FormField>

                <FormField label="Progress">
                    <TextInput value={form.progress} onChange={(value) => updateField("progress", value)} placeholder="50" type="number" />
                </FormField>

                <FormField label="Status">
                    <select
                        value={form.status}
                        onChange={(event) => updateField("status", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>In Progress</option>
                        <option>Review</option>
                        <option>Completed</option>
                    </select>
                </FormField>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                >
                    Save Project
                </button>
            </div>
        </form>
    );
}

/**
 * Create/edit form for assignment records.
 */
function AssignmentForm({ initialAssignment, projectOptions, employeeOptions, onCancel, onSave }) {
    const [form, setForm] = useState(initialAssignment);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Project">
                    <select
                        value={form.project}
                        onChange={(event) => updateField("project", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        {projectOptions.filter((option) => option !== "All Projects").map((project) => (
                            <option key={project}>{project}</option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Task Type">
                    <TextInput value={form.taskType} onChange={(value) => updateField("taskType", value)} placeholder="Photo Editing" />
                </FormField>

                <FormField label="Assigned To">
                    <input
                        list="employee-options"
                        value={form.assignedTo}
                        onChange={(event) => updateField("assignedTo", event.target.value)}
                        placeholder="Employee name"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                    <datalist id="employee-options">
                        {employeeOptions.filter((option) => option !== "All Employees").map((employee) => (
                            <option key={employee} value={employee} />
                        ))}
                    </datalist>
                </FormField>

                <FormField label="Assigned Date">
                    <TextInput value={form.assignedDate} onChange={(value) => updateField("assignedDate", value)} placeholder="May 01, 2026" />
                </FormField>

                <FormField label="Due Date">
                    <TextInput value={form.dueDate} onChange={(value) => updateField("dueDate", value)} placeholder="May 18, 2026" />
                </FormField>

                <FormField label="Priority">
                    <select
                        value={form.priority}
                        onChange={(event) => updateField("priority", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>
                </FormField>

                <FormField label="Status">
                    <select
                        value={form.status}
                        onChange={(event) => updateField("status", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>In Progress</option>
                        <option>Review</option>
                        <option>Completed</option>
                    </select>
                </FormField>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                >
                    Save Assignment
                </button>
            </div>
        </form>
    );
}

// Creates colored chart line segments
/**
 * Optional chart helper for rendering individually colored line segments.
 */
function ColoredLineSegment({ data, segment, index }) {

    // Skip last item
    if (index === data.length - 1) return null;

    return (
        <Line
            type="monotone"

            // Only render current + next data point
            dataKey={(row) => {
                const currentIndex = data.findIndex(
                    (item) => item.day === row.day
                );

                return currentIndex === index ||
                currentIndex === index + 1
                    ? row.value
                    : null;
            }}

            stroke={segment.color}
            strokeWidth={6}
            dot={false}
            activeDot={false}
            connectNulls={false}
            legendType="none"
        />
    );
}

// Main dashboard page
/**
 * Main dashboard view. Managers see team metrics; employees see only their own work queue and progress.
 */
function Dashboard({ onPageChange, currentUser }) {
    const { data: dashboardKpis } = useApiPlaceholder(API_ENDPOINTS.dashboard.kpis, kpis);
    const { data: productivityData } = useApiPlaceholder(API_ENDPOINTS.dashboard.productivity, productivity);
    const { data: workflowData } = useApiPlaceholder(API_ENDPOINTS.dashboard.workflow, workflow);
    const { data: employeeActivityData } = useApiPlaceholder(API_ENDPOINTS.dashboard.employeeActivity, employeeActivity);
    const { data: projectProgressData } = useApiPlaceholder(API_ENDPOINTS.dashboard.projectProgress, projectProgress);
    const hasManagerAccess = canManageContent(currentUser);
    const employeeName = currentUser?.employeeName || currentUser?.name;
    const visibleEmployeeActivityData = hasManagerAccess
        ? employeeActivityData
        : employeeActivityData.filter((row) => row[0] === employeeName);
    const assignedProjectNames = getAssignedProjectNames(currentUser, assignments, taskItems);
    const visibleProjectProgressData = hasManagerAccess
        ? projectProgressData
        : projectProgressData.filter((row) => assignedProjectNames.includes(row[0]));
    const assignedTasks = taskItems.filter((task) => isAssignedToUser(task, currentUser));
    const assignedAssignments = assignments.filter((assignment) => isAssignedToUser(assignment, currentUser));
    const visibleKpis = hasManagerAccess ? dashboardKpis : [
        ["My Assigned Tasks", String(assignedTasks.length)],
        ["My Open Tasks", String(assignedTasks.filter((task) => task.status !== "Completed").length)],
        ["My Completed Tasks", String(assignedTasks.filter((task) => task.status === "Completed").length)],
        ["My Review Tasks", String(assignedTasks.filter((task) => task.status === "Review").length)],
        ["My Tracked Time", formatDuration(assignedTasks.reduce((total, task) => total + normalizeNumber(task.trackedSeconds), 0))],
        ["Access Level", "Employee"],
    ];

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">

            {/* KPI cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                {visibleKpis.map(([label, value]) => (
                    <div
                        key={label}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-5 text-center shadow-sm sm:px-5 sm:py-7"
                    >
                        <div className="text-sm font-bold">{label}</div>

                        {/* Highlight efficiency in green */}
                        <div
                            className={`mt-6 text-4xl ${
                                label === "Efficiency"
                                    ? "text-green-700"
                                    : "text-black"
                            }`}
                        >
                            {value}
                        </div>
                    </div>
                ))}
            </div>

            {hasManagerAccess ? (
                <>
            {/* Charts section */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.07fr_0.93fr]">

                {/* Productivity chart */}
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="mb-2 text-xl font-bold sm:text-2xl">
                        Employee Productivity Over Time
                    </h2>

                    <ResponsiveContainer width="100%" height={230}>
                        <LineChart
                            data={productivityData}
                            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="4 4"
                                stroke="#d8dde6"
                            />

                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tickMargin={12}
                            />

                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 60]}
                                ticks={[0, 15, 30, 45, 60]}
                            />

                            <Tooltip />

                            {/* Visible trend line with custom colored data points */}
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#7c3aed"
                                strokeWidth={4}
                                activeDot={{ r: 7 }}
                                label={{
                                    position: "top",
                                    fill: "#111827",
                                    fontSize: 14
                                }}
                                dot={(props) => {
                                    const item = productivityData[props.index];

                                    return (
                                        <circle
                                            cx={props.cx}
                                            cy={props.cy}
                                            r={5}
                                            fill="white"
                                            stroke={item?.color || "#7c3aed"}
                                            strokeWidth={3}
                                        />
                                    );
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Workflow pie chart */}
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="mb-2 text-xl font-bold sm:text-2xl">
                        Workflow Distribution
                    </h2>

                    <div className="flex h-[230px] items-center justify-center gap-16">

                        {/* Pie chart */}
                        <ResponsiveContainer width="40%" height="100%">
                            <PieChart>
                                <Pie
                                    data={workflowData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={92}
                                    label={false}
                                    labelLine={false}
                                    stroke="white"
                                    strokeWidth={4}
                                >
                                    {workflowData.map((item) => (
                                        <Cell
                                            key={item.name}
                                            fill={item.color}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Legend */}
                        <div className="w-64 space-y-5">
                            {workflowData.map((item) => (
                                <div
                                    key={item.name}
                                    className="grid grid-cols-[1fr_auto] items-center gap-8"
                                >
                                    <div
                                        className="flex items-center gap-4"
                                        style={{ color: item.color }}
                                    >
                                        <span
                                            className="h-4 w-4 rounded-full"
                                            style={{
                                                backgroundColor: item.color
                                            }}
                                        />

                                        <span className="text-base font-medium">
                                            {item.name}
                                        </span>
                                    </div>

                                    <strong className="text-base">
                                        {item.value}%
                                    </strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
                </>
            ) : (
                <EmployeeDashboardInsights
                    assignedTasks={assignedTasks}
                    assignedAssignments={assignedAssignments}
                    onPageChange={onPageChange}
                />
            )}

            {hasManagerAccess ? (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                    <EmployeeActivityPanel
                        rows={visibleEmployeeActivityData}
                        onViewAll={() => onPageChange?.("employees")}
                    />
                    <ProjectProgressPanel
                        rows={visibleProjectProgressData}
                        onViewAll={() => onPageChange?.("projects")}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                    <EmployeeAssignmentsPanel
                        rows={assignedAssignments}
                        onViewAll={() => onPageChange?.("projects")}
                    />
                    <ProjectProgressPanel
                        rows={visibleProjectProgressData}
                        onViewAll={() => onPageChange?.("projects")}
                    />
                </div>
            )}
        </section>
    );
}


// Employee-only dashboard cards that do not reveal other employees' productivity data
/**
 * Employee-only dashboard section that avoids exposing other employees' productivity data.
 */
function EmployeeDashboardInsights({ assignedTasks = [], assignedAssignments = [], onPageChange }) {
    const openTasks = assignedTasks.filter((task) => task.status !== "Completed");
    const completedTasks = assignedTasks.filter((task) => task.status === "Completed");
    const reviewTasks = assignedTasks.filter((task) => task.status === "Review");
    const highPriorityTasks = assignedTasks.filter((task) => task.priority === "High");
    const completionRate = assignedTasks.length
        ? Math.round((completedTasks.length / assignedTasks.length) * 100)
        : 0;
    const totalEstimatedHours = assignedTasks.reduce((total, task) => total + normalizeNumber(task.estimatedHours), 0);
    const totalTrackedSeconds = assignedTasks.reduce((total, task) => total + normalizeNumber(task.trackedSeconds), 0);
    const nextTasks = [...openTasks]
        .sort((leftTask, rightTask) => getSortableValue(leftTask, "dueDate") - getSortableValue(rightTask, "dueDate"))
        .slice(0, 4);
    const statusCounts = ["Not Started", "In Progress", "Review", "Completed"].map((status) => ({
        status,
        count: assignedTasks.filter((task) => task.status === status).length,
    }));

    return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.07fr_0.93fr]">
            <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold sm:text-2xl">My Work Queue</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Your next assigned tasks only. Other employees' assignments are hidden.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onPageChange?.("tasks")}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                    >
                        Open My Tasks
                    </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Open</div>
                        <div className="mt-2 text-3xl font-bold text-slate-900">{openTasks.length}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">High Priority</div>
                        <div className="mt-2 text-3xl font-bold text-red-700">{highPriorityTasks.length}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Ready For Review</div>
                        <div className="mt-2 text-3xl font-bold text-amber-700">{reviewTasks.length}</div>
                    </div>
                </div>

                <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-[620px] w-full border-collapse text-sm">
                        <thead className="bg-slate-100 text-slate-700">
                        <tr>
                            <th className="border border-slate-200 px-3 py-2 text-left">Task</th>
                            <th className="border border-slate-200 px-3 py-2 text-left">Project</th>
                            <th className="border border-slate-200 px-3 py-2 text-center">Due</th>
                            <th className="border border-slate-200 px-3 py-2 text-center">Priority</th>
                            <th className="border border-slate-200 px-3 py-2 text-center">Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {nextTasks.length > 0 ? nextTasks.map((task) => (
                            <tr key={task.id} className="hover:bg-slate-50">
                                <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-900">{task.taskName}</td>
                                <td className="border border-slate-200 px-3 py-2">{task.project}</td>
                                <td className="border border-slate-200 px-3 py-2 text-center">{task.dueDate}</td>
                                <td className="border border-slate-200 px-3 py-2 text-center"><PriorityBadge value={task.priority} /></td>
                                <td className="border border-slate-200 px-3 py-2 text-center"><Badge value={task.status} /></td>
                            </tr>
                        )) : (
                            <tr>
                                <td className="border border-slate-200 px-3 py-6 text-center text-slate-500" colSpan={5}>
                                    No open tasks assigned to you right now.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold sm:text-2xl">My Progress Snapshot</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Private view of your workload, completion rate, and tracked time.
                </p>

                <div className="mt-5 space-y-4">
                    <div>
                        <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                            <span>Completion Rate</span>
                            <span>{completionRate}%</span>
                        </div>
                        <ProgressBar value={completionRate} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Tracked Time</div>
                            <div className="mt-2 text-2xl font-bold text-slate-900">{formatDuration(totalTrackedSeconds)}</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Estimated Hours</div>
                            <div className="mt-2 text-2xl font-bold text-slate-900">{totalEstimatedHours}</div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200">
                        {statusCounts.map((item) => (
                            <div key={item.status} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0">
                                <span className="font-semibold text-slate-700">{item.status}</span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800">{item.count}</span>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
                        You have {assignedAssignments.length} assignment records connected to your login.
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Shows the current employee's most recent assignment records.
 */
function EmployeeAssignmentsPanel({ rows = [], onViewAll }) {
    const visibleRows = rows.slice(0, 5);

    return (
        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 text-lg font-bold sm:text-2xl">My Assignments</h2>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-[620px] w-full border-collapse text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                    <tr>
                        {[
                            "Assignment",
                            "Project",
                            "Task Type",
                            "Due Date",
                            "Priority",
                            "Status",
                        ].map((heading) => (
                            <th key={heading} className="border border-slate-200 px-3 py-2 text-left font-bold">
                                {heading}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {visibleRows.length > 0 ? visibleRows.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-slate-50">
                            <td className="border border-slate-200 px-3 py-2 font-semibold">{assignment.id}</td>
                            <td className="border border-slate-200 px-3 py-2">{assignment.project}</td>
                            <td className="border border-slate-200 px-3 py-2">{assignment.taskType}</td>
                            <td className="border border-slate-200 px-3 py-2">{assignment.dueDate}</td>
                            <td className="border border-slate-200 px-3 py-2"><PriorityBadge value={assignment.priority} /></td>
                            <td className="border border-slate-200 px-3 py-2"><Badge value={assignment.status} /></td>
                        </tr>
                    )) : (
                        <tr>
                            <td className="border border-slate-200 px-3 py-6 text-center text-slate-500" colSpan={6}>
                                No assignments are currently assigned to your login.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {onViewAll && (
                <button
                    type="button"
                    onClick={onViewAll}
                    className="mt-4 font-semibold text-blue-600 hover:text-blue-800"
                >
                    View my assignments →
                </button>
            )}
        </div>
    );
}

// Employee activity table
/**
 * Displays manager-facing employee activity in a compact table.
 */
function EmployeeActivityPanel({ rows = employeeActivity, onViewAll }) {
    return (
        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 text-lg font-bold sm:text-2xl">
                Employee Activity
            </h2>

            <table className="w-full table-fixed border-collapse text-xs sm:text-sm">

                {/* Table header */}
                <thead>
                <tr>
                    {["Employee", "Current Task", "Time Spent", "Status"]
                        .map((h) => (
                            <th
                                key={h}
                                className="break-words border border-slate-300 bg-white px-1.5 py-2 font-bold sm:px-2"
                            >
                                {h}
                            </th>
                        ))}
                </tr>
                </thead>

                {/* Table rows */}
                <tbody>
                {rows.map((row) => (
                    <tr key={row[0]}>
                        <td className="break-words border border-slate-300 px-1.5 py-2 sm:px-3">
                            {row[0]}
                        </td>

                        <td className="break-words border border-slate-300 px-1.5 py-2 text-center sm:px-3">
                            {row[1]}
                        </td>

                        <td className="break-words border border-slate-300 px-1.5 py-2 text-center sm:px-3">
                            {row[2]}
                        </td>

                        <td className="break-words border border-slate-300 px-1.5 py-2 text-center sm:px-3">
                            <Badge value={row[3]} />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {onViewAll && (
                <button
                    type="button"
                    onClick={onViewAll}
                    className="mt-4 font-semibold text-blue-600 hover:text-blue-800"
                >
                    View all employees →
                </button>
            )}
        </div>
    );
}

// Project progress table
/**
 * Displays project completion metrics with progress bars.
 */
function ProjectProgressPanel({ rows = projectProgress, onViewAll }) {
    return (
        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 text-lg font-bold sm:text-2xl">
                Project Progress
            </h2>

            <table className="w-full table-fixed border-collapse text-xs sm:text-sm">

                {/* Table header */}
                <thead>
                <tr>
                    {["Project", "Total Images", "Completed", "Remaining", "Progress"]
                        .map((h) => (
                            <th
                                key={h}
                                className="break-words border border-slate-300 bg-white px-1.5 py-2 font-bold sm:px-2"
                            >
                                {h}
                            </th>
                        ))}
                </tr>
                </thead>

                {/* Table rows */}
                <tbody>
                {rows.map((row) => (
                    <tr key={row[0]}>
                        <td className="break-words border border-slate-300 px-1.5 py-2 sm:px-3">
                            {row[0]}
                        </td>

                        <td className="border border-slate-300 px-1.5 py-2 text-center sm:px-3">
                            {row[1]}
                        </td>

                        <td className="border border-slate-300 px-1.5 py-2 text-center sm:px-3">
                            {row[2]}
                        </td>

                        <td className="border border-slate-300 px-1.5 py-2 text-center sm:px-3">
                            {row[3]}
                        </td>

                        {/* Progress bar */}
                        <td className="border border-slate-300 px-1.5 py-2 sm:px-3">
                            <ProgressBar value={row[4]} compact />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {onViewAll && (
                <button
                    type="button"
                    onClick={onViewAll}
                    className="mt-4 font-semibold text-blue-600 hover:text-blue-800"
                >
                    View all projects →
                </button>
            )}
        </div>
    );
}


// Reports page
/**
 * Small metric card used by the Reports and Analytics sections.
 */
function InsightCard({ label, value, note, icon: Icon = BarChart3 }) {
    return (
        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-bold text-slate-600">{label}</div>
                    <div className="mt-3 text-3xl font-bold text-slate-950">{value}</div>
                </div>
                <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
                    <Icon size={24} />
                </div>
            </div>
            {note && <p className="mt-3 text-sm text-slate-500">{note}</p>}
        </div>
    );
}

/**
 * Displays deadline risk in report tables.
 */
function DueStatusBadge({ value }) {
    const style =
        value === "Overdue"
            ? "bg-red-100 text-red-700"
            : value === "Due Soon"
                ? "bg-orange-100 text-orange-700"
                : value === "Upcoming"
                    ? "bg-blue-100 text-blue-700"
                    : value === "Complete"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-700";

    return <span className={`rounded-md px-3 py-1 text-xs font-medium ${style}`}>{value}</span>;
}

/**
 * Shared table for report output.
 */
function ReportTable({ columns, rows, emptyMessage = "No report rows match the current filters." }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-[980px] w-full border-collapse text-sm">
                <thead className="bg-slate-100 text-slate-700">
                <tr>
                    {columns.map((column) => (
                        <th
                            key={column.key}
                            className={`border border-slate-200 px-3 py-3 font-bold ${column.align === "center" ? "text-center" : "text-left"}`}
                        >
                            {column.label}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {rows.length > 0 ? rows.map((row, rowIndex) => (
                    <tr key={row.id || row.name || rowIndex} className="hover:bg-slate-50">
                        {columns.map((column) => {
                            const value = row[column.key];
                            const isCentered = column.align === "center";

                            return (
                                <td
                                    key={`${row.id || row.name || rowIndex}-${column.key}`}
                                    className={`border border-slate-200 px-3 py-3 ${isCentered ? "text-center" : "text-left"}`}
                                >
                                    {column.key === "status" ? (
                                        <Badge value={value} />
                                    ) : column.key === "priority" ? (
                                        <PriorityBadge value={value} />
                                    ) : column.key === "dueStatus" ? (
                                        <DueStatusBadge value={value} />
                                    ) : ["progress", "utilization", "efficiency"].includes(column.key) ? (
                                        <ProgressBar value={formatPercent(normalizeNumber(value))} compact />
                                    ) : (
                                        value
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                )) : (
                    <tr>
                        <td className="border border-slate-200 px-3 py-8 text-center text-slate-500" colSpan={columns.length}>
                            {emptyMessage}
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
}

/**
 * Full Reports page with operational summaries, filters, and CSV exports.
 */
function ReportsPage({ globalSearch = "" }) {
    const { data: loadedProjectRows } = useApiPlaceholder(API_ENDPOINTS.projects, projects);
    const { data: loadedAssignmentRows } = useApiPlaceholder(API_ENDPOINTS.assignments, assignments);
    const { data: loadedTaskRows } = useApiPlaceholder(API_ENDPOINTS.tasks, taskItems);
    const { data: loadedEmployeeRows } = useApiPlaceholder(API_ENDPOINTS.employees, employees);

    const projectRows = Array.isArray(loadedProjectRows) ? loadedProjectRows : [];
    const assignmentRows = Array.isArray(loadedAssignmentRows) ? loadedAssignmentRows : [];
    const taskRows = Array.isArray(loadedTaskRows) ? loadedTaskRows : [];
    const employeeRows = Array.isArray(loadedEmployeeRows) ? loadedEmployeeRows : [];

    const [reportType, setReportType] = useState("Project Delivery");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [employeeFilter, setEmployeeFilter] = useState("All Employees");

    const reportData = useMemo(
        () => buildOperationsReportData(projectRows, assignmentRows, taskRows, employeeRows),
        [projectRows, assignmentRows, taskRows, employeeRows]
    );

    const employeeOptions = useMemo(() => {
        const values = [
            ...employeeRows.map((employee) => employee.name),
            ...assignmentRows.map((assignment) => assignment.assignedTo),
            ...taskRows.map((task) => task.assignedTo),
        ].filter(Boolean);

        return ["All Employees", ...new Set(values.sort())];
    }, [employeeRows, assignmentRows, taskRows]);

    const statusOptions = useMemo(() => {
        const values = [
            ...projectRows.map((project) => project.status),
            ...assignmentRows.map((assignment) => assignment.status),
            ...taskRows.map((task) => task.status),
            "Overdue",
            "Due Soon",
            "Upcoming",
            "On Track",
            "Complete",
        ].filter(Boolean);

        return ["All Status", ...new Set(values.sort())];
    }, [projectRows, assignmentRows, taskRows]);

    const reportDefinitions = useMemo(() => ([
        {
            label: "Project Delivery",
            filename: "photometrics-project-delivery-report.csv",
            title: "Project Delivery Report",
            columns: REPORT_PROJECT_COLUMNS,
            rows: reportData.projectReportRows,
            searchKeys: ["name", "client", "dueDate", "status", "dueStatus", "assignedTo"],
        },
        {
            label: "Task Time",
            filename: "photometrics-task-time-report.csv",
            title: "Task Time Report",
            columns: REPORT_TIME_COLUMNS,
            rows: reportData.timeReportRows,
            searchKeys: ["taskName", "project", "assignedTo", "dueDate", "priority", "status", "dueStatus"],
        },
        {
            label: "Employee Productivity",
            filename: "photometrics-employee-productivity-report.csv",
            title: "Employee Productivity Report",
            columns: REPORT_EMPLOYEE_COLUMNS,
            rows: reportData.employeeReportRows,
            searchKeys: ["name", "role", "status", "availability"],
        },
        {
            label: "Assignment Status",
            filename: "photometrics-assignment-status-report.csv",
            title: "Assignment Status Report",
            columns: REPORT_ASSIGNMENT_COLUMNS,
            rows: reportData.assignmentReportRows,
            searchKeys: ["id", "project", "taskType", "assignedTo", "dueDate", "priority", "status", "dueStatus"],
        },
    ]), [reportData]);

    const activeReport = reportDefinitions.find((report) => report.label === reportType) || reportDefinitions[0];

    const filteredRows = useMemo(() => {
        return activeReport.rows.filter((row) => {
            const matchesSearch = rowMatchesSearch(row, globalSearch, activeReport.searchKeys);
            const matchesStatus = statusFilter === "All Status" || row.status === statusFilter || row.dueStatus === statusFilter;
            const matchesEmployee = employeeFilter === "All Employees"
                || row.assignedTo === employeeFilter
                || String(row.assignedTo || "").includes(employeeFilter)
                || row.name === employeeFilter;

            return matchesSearch && matchesStatus && matchesEmployee;
        });
    }, [activeReport, globalSearch, statusFilter, employeeFilter]);

    const exportCurrentReport = () => {
        downloadReportTable(activeReport.filename, activeReport.title, activeReport.columns, filteredRows);
    };

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">
            <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">Reports</h1>
                        <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
                            Export project delivery, assignment status, task time, and employee productivity reports from one place.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={exportCurrentReport}
                            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-700"
                        >
                            <Download size={18} /> Export Current View
                        </button>
                        <button
                            type="button"
                            onClick={() => downloadFullOperationsReport(reportData)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50"
                        >
                            <Download size={18} /> Export Full Report
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <InsightCard label="Projects" value={reportData.summary.totalProjects} note={`${reportData.summary.completedProjects} complete`} icon={Folder} />
                <InsightCard label="Completion Rate" value={`${reportData.summary.completionRate}%`} note={`${formatNumber(reportData.summary.completedImages)} images complete`} icon={BarChart3} />
                <InsightCard label="Images Remaining" value={formatNumber(reportData.summary.remainingImages)} note="Based on project progress" icon={Eye} />
                <InsightCard label="Open Tasks" value={reportData.summary.openTasks} note={`${reportData.summary.completedTasks} task(s) complete`} icon={ListChecks} />
                <InsightCard label="Review Queue" value={reportData.summary.reviewQueue} note="Tasks and assignments" icon={Bell} />
                <InsightCard label="Tracked Time" value={formatDuration(reportData.summary.totalTrackedSeconds)} note={`${reportData.summary.utilizationRate}% of estimate`} icon={Clock} />
            </div>

            <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <FilterSelect value={reportType} onChange={setReportType} options={reportDefinitions.map((report) => report.label)} />
                        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
                        <FilterSelect value={employeeFilter} onChange={setEmployeeFilter} options={employeeOptions} />
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                        Showing {filteredRows.length} row(s)
                        {globalSearch ? ` matching "${globalSearch}"` : ""}
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">{activeReport.title}</h2>
                        <p className="mt-1 text-sm text-slate-500">Use the filters above, then export the exact view shown below.</p>
                    </div>
                    <button
                        type="button"
                        onClick={exportCurrentReport}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                        <Download size={16} /> CSV
                    </button>
                </div>

                <ReportTable columns={activeReport.columns} rows={filteredRows} />
            </div>
        </section>
    );
}

// Analytics page
/**
 * Compact insight list item used inside analytics cards.
 */
function AnalyticsInsightRow({ label, value, note }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0">
            <div>
                <div className="font-semibold text-slate-800">{label}</div>
                {note && <div className="text-xs text-slate-500">{note}</div>}
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800">{value}</div>
        </div>
    );
}

/**
 * Full Analytics page with charts, trends, and operational insights.
 */
function AnalyticsPage({ globalSearch = "" }) {
    const { data: loadedProjectRows } = useApiPlaceholder(API_ENDPOINTS.projects, projects);
    const { data: loadedAssignmentRows } = useApiPlaceholder(API_ENDPOINTS.assignments, assignments);
    const { data: loadedTaskRows } = useApiPlaceholder(API_ENDPOINTS.tasks, taskItems);
    const { data: loadedEmployeeRows } = useApiPlaceholder(API_ENDPOINTS.employees, employees);
    const { data: productivityData } = useApiPlaceholder(API_ENDPOINTS.dashboard.productivity, productivity);

    const projectRows = Array.isArray(loadedProjectRows) ? loadedProjectRows : [];
    const assignmentRows = Array.isArray(loadedAssignmentRows) ? loadedAssignmentRows : [];
    const taskRows = Array.isArray(loadedTaskRows) ? loadedTaskRows : [];
    const employeeRows = Array.isArray(loadedEmployeeRows) ? loadedEmployeeRows : [];

    const reportData = useMemo(
        () => buildOperationsReportData(projectRows, assignmentRows, taskRows, employeeRows),
        [projectRows, assignmentRows, taskRows, employeeRows]
    );

    const filteredProjects = useMemo(() => {
        const rows = reportData.projectAnalyticsRows.filter((project) => rowMatchesSearch(project, globalSearch, ["name", "status", "dueStatus"]));
        return rows.length ? rows : reportData.projectAnalyticsRows;
    }, [reportData.projectAnalyticsRows, globalSearch]);

    const projectChartData = filteredProjects.slice(0, 8);
    const employeeWorkloadData = reportData.employeeWorkloadData.slice().sort((left, right) => right.assignedTasks - left.assignedTasks).slice(0, 8);
    const topEmployees = reportData.employeeReportRows.slice().sort((left, right) => right.efficiency - left.efficiency).slice(0, 4);
    const heaviestWorkload = reportData.employeeReportRows.slice().sort((left, right) => right.assignedTasks - left.assignedTasks)[0];
    const forecastDays = Math.max(1, Math.ceil(reportData.summary.remainingImages / 500));

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">
            <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">Analytics</h1>
                        <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
                            Review workflow trends, team workload, project progress, deadline risk, and productivity patterns.
                        </p>
                    </div>
                    <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800">
                        Forecast: about {forecastDays} workday(s) to clear remaining images at 500 images per day.
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <InsightCard label="Image Completion" value={`${reportData.summary.completionRate}%`} note={`${formatNumber(reportData.summary.completedImages)} of ${formatNumber(reportData.summary.totalImages)}`} icon={BarChart3} />
                <InsightCard label="Utilization" value={`${reportData.summary.utilizationRate}%`} note="Tracked time vs estimate" icon={Clock} />
                <InsightCard label="Avg. Efficiency" value={`${reportData.summary.averageEfficiency}%`} note="Across active employees" icon={Sparkles} />
                <InsightCard label="Due Risk" value={reportData.riskProjectRows.length} note="Overdue or due soon" icon={Bell} />
                <InsightCard label="Review Items" value={reportData.summary.reviewQueue} note="Needs manager review" icon={Eye} />
                <InsightCard label="Open Tasks" value={reportData.summary.openTasks} note={`${reportData.summary.completedTasks} complete`} icon={ListChecks} />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold sm:text-2xl">Productivity Trend</h2>
                    <p className="mt-1 text-sm text-slate-500">Daily production volume from the dashboard trend feed.</p>
                    <div className="mt-4 h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={productivityData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#d8dde6" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={12} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={4} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold sm:text-2xl">Task Status Mix</h2>
                    <p className="mt-1 text-sm text-slate-500">Where task work currently sits in the pipeline.</p>
                    <div className="mt-4 flex h-[280px] items-center gap-6">
                        <ResponsiveContainer width="55%" height="100%">
                            <PieChart>
                                <Pie data={reportData.taskStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} stroke="white" strokeWidth={4}>
                                    {reportData.taskStatusData.map((item, index) => (
                                        <Cell key={item.name} fill={ANALYTICS_COLORS[index % ANALYTICS_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-3">
                            {reportData.taskStatusData.map((item, index) => (
                                <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ANALYTICS_COLORS[index % ANALYTICS_COLORS.length] }} />
                                        <span className="font-semibold text-slate-700">{item.name}</span>
                                    </div>
                                    <span className="font-bold">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold sm:text-2xl">Project Progress</h2>
                    <p className="mt-1 text-sm text-slate-500">Progress percentage by project. Global search narrows this chart.</p>
                    <div className="mt-4 h-[330px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={projectChartData} margin={{ top: 15, right: 20, left: 0, bottom: 70 }}>
                                <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#d8dde6" />
                                <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Bar dataKey="progress" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold sm:text-2xl">Employee Workload</h2>
                    <p className="mt-1 text-sm text-slate-500">Assigned work items compared with completed work items.</p>
                    <div className="mt-4 h-[330px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={employeeWorkloadData} margin={{ top: 15, right: 20, left: 0, bottom: 70 }}>
                                <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#d8dde6" />
                                <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="assignedTasks" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="completedTasks" fill="#10b981" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold">Deadline Risk</h2>
                    <p className="mt-1 text-sm text-slate-500">Projects that need attention first.</p>
                    <div className="mt-3">
                        {reportData.riskProjectRows.slice(0, 5).length > 0 ? reportData.riskProjectRows.slice(0, 5).map((project) => (
                            <AnalyticsInsightRow key={project.id || project.name} label={project.name} value={`${project.progress}%`} note={`${project.dueStatus} - ${project.dueDate}`} />
                        )) : (
                            <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">No overdue or due-soon projects found.</div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold">Top Efficiency</h2>
                    <p className="mt-1 text-sm text-slate-500">Employees sorted by current efficiency score.</p>
                    <div className="mt-3">
                        {topEmployees.map((employee) => (
                            <AnalyticsInsightRow key={employee.id || employee.name} label={employee.name} value={`${employee.efficiency}%`} note={`${employee.completedTasks} completed item(s)`} />
                        ))}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold">Operational Notes</h2>
                    <p className="mt-1 text-sm text-slate-500">Quick read on capacity and bottlenecks.</p>
                    <div className="mt-3 space-y-3 text-sm text-slate-700">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="font-bold text-slate-950">Highest workload</div>
                            <div className="mt-1">{heaviestWorkload?.name || "No employee data"} has {heaviestWorkload?.assignedTasks || 0} assigned item(s).</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="font-bold text-slate-950">Review bottleneck</div>
                            <div className="mt-1">{reportData.summary.reviewQueue} item(s) are waiting in review.</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="font-bold text-slate-950">Remaining production</div>
                            <div className="mt-1">{formatNumber(reportData.summary.remainingImages)} images remain across active projects.</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Projects + assignments page
/**
 * Manager project and assignment management page with sorting, filtering, pagination, export, and modals.
 */
function ProjectsAndAssignments() {
    const { data: loadedProjectRows } = useApiPlaceholder(API_ENDPOINTS.projects, projects);
    const { data: loadedAssignmentRows } = useApiPlaceholder(API_ENDPOINTS.assignments, assignments);

    const [projectRows, setProjectRows] = useState(projects);
    const [assignmentRows, setAssignmentRows] = useState(assignments);
    const [projectSort, setProjectSort] = useState({ key: "name", direction: "asc" });
    const [assignmentSort, setAssignmentSort] = useState({ key: "id", direction: "asc" });
    const [projectPage, setProjectPage] = useState(1);
    const [assignmentPage, setAssignmentPage] = useState(1);
    const [projectFilter, setProjectFilter] = useState("All Projects");
    const [employeeFilter, setEmployeeFilter] = useState("All Employees");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [projectModal, setProjectModal] = useState(null);
    const [assignmentModal, setAssignmentModal] = useState(null);

    useEffect(() => {
        if (Array.isArray(loadedProjectRows)) {
            setProjectRows(loadedProjectRows);
        }
    }, [loadedProjectRows]);

    useEffect(() => {
        if (Array.isArray(loadedAssignmentRows)) {
            setAssignmentRows(loadedAssignmentRows);
        }
    }, [loadedAssignmentRows]);

    const projectOptions = useMemo(
        () => getUniqueOptions(assignmentRows, "project", "All Projects"),
        [assignmentRows]
    );

    const employeeOptions = useMemo(
        () => getUniqueOptions(assignmentRows, "assignedTo", "All Employees"),
        [assignmentRows]
    );

    const statusOptions = useMemo(
        () => getUniqueOptions(assignmentRows, "status", "All Status"),
        [assignmentRows]
    );

    const filteredAssignmentRows = useMemo(() => {
        return assignmentRows.filter((assignment) => {
            const matchesProject = projectFilter === "All Projects" || assignment.project === projectFilter;
            const matchesEmployee = employeeFilter === "All Employees" || assignment.assignedTo === employeeFilter;
            const matchesStatus = statusFilter === "All Status" || assignment.status === statusFilter;
            return matchesProject && matchesEmployee && matchesStatus;
        });
    }, [assignmentRows, projectFilter, employeeFilter, statusFilter]);

    const sortedProjectRows = useMemo(
        () => sortRows(projectRows, projectSort),
        [projectRows, projectSort]
    );

    const sortedAssignmentRows = useMemo(
        () => sortRows(filteredAssignmentRows, assignmentSort),
        [filteredAssignmentRows, assignmentSort]
    );

    const projectTotalPages = getTotalPages(sortedProjectRows.length, PROJECTS_PAGE_SIZE);
    const assignmentTotalPages = getTotalPages(sortedAssignmentRows.length, ASSIGNMENTS_PAGE_SIZE);

    const visibleProjectRows = paginateRows(sortedProjectRows, projectPage, PROJECTS_PAGE_SIZE);
    const visibleAssignmentRows = paginateRows(sortedAssignmentRows, assignmentPage, ASSIGNMENTS_PAGE_SIZE);

    useEffect(() => {
        if (projectPage > projectTotalPages) {
            setProjectPage(projectTotalPages);
        }
    }, [projectPage, projectTotalPages]);

    useEffect(() => {
        if (assignmentPage > assignmentTotalPages) {
            setAssignmentPage(assignmentTotalPages);
        }
    }, [assignmentPage, assignmentTotalPages]);

    const openNewProjectModal = () => {
        setProjectModal({
            mode: "create",
            data: {
                id: generateNextId("PRJ", projectRows),
                name: "",
                client: "",
                startDate: "May 01, 2026",
                dueDate: "May 30, 2026",
                images: "0",
                progress: 0,
                status: "In Progress",
            },
        });
    };

    const openNewAssignmentModal = () => {
        const firstProjectName = projectRows[0]?.name || "";

        setAssignmentModal({
            mode: "create",
            data: {
                id: generateNextId("ASG", assignmentRows),
                project: firstProjectName,
                taskType: "",
                assignedTo: "",
                assignedDate: "May 01, 2026",
                dueDate: "May 30, 2026",
                priority: "Medium",
                status: "In Progress",
            },
        });
    };

    const saveProject = async (project) => {
        const cleanProject = {
            ...project,
            id: project.id || generateNextId("PRJ", projectRows),
            name: project.name.trim() || "Untitled Project",
            client: project.client.trim() || "Unassigned Client",
        };

        if (getUseApiDataSetting()) {
            try {
                if (projectModal.mode === "create") {
                    await apiPlaceholders.createProject(cleanProject);
                } else {
                    await apiPlaceholders.updateProject(cleanProject.id, cleanProject);
                }
            } catch (apiError) {
                console.warn("Project API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setProjectRows((currentRows) => {
            if (projectModal.mode === "create") {
                return [cleanProject, ...currentRows];
            }

            return currentRows.map((row) => row.id === cleanProject.id ? cleanProject : row);
        });
        setProjectPage(1);
        setProjectModal(null);
    };

    const saveAssignment = async (assignment) => {
        const cleanAssignment = {
            ...assignment,
            id: assignment.id || generateNextId("ASG", assignmentRows),
            taskType: assignment.taskType.trim() || "General Task",
            assignedTo: assignment.assignedTo.trim() || "Unassigned",
        };

        if (getUseApiDataSetting()) {
            try {
                if (assignmentModal.mode === "create") {
                    await apiPlaceholders.createAssignment(cleanAssignment);
                } else {
                    await apiPlaceholders.updateAssignment(cleanAssignment.id, cleanAssignment);
                }
            } catch (apiError) {
                console.warn("Assignment API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setAssignmentRows((currentRows) => {
            if (assignmentModal.mode === "create") {
                return [cleanAssignment, ...currentRows];
            }

            return currentRows.map((row) => row.id === cleanAssignment.id ? cleanAssignment : row);
        });
        setAssignmentPage(1);
        setAssignmentModal(null);
    };

    const deleteProject = async (project) => {
        if (!window.confirm(`Delete ${project.name}?`)) return;

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteProject(project.id);
            } catch (apiError) {
                console.warn("Project delete API endpoint is not connected yet. Deleting locally.", apiError);
            }
        }

        setProjectRows((currentRows) => currentRows.filter((row) => row.id !== project.id));
    };

    const deleteAssignment = async (assignment) => {
        if (!window.confirm(`Delete ${assignment.id}?`)) return;

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteAssignment(assignment.id);
            } catch (apiError) {
                console.warn("Assignment delete API endpoint is not connected yet. Deleting locally.", apiError);
            }
        }

        setAssignmentRows((currentRows) => currentRows.filter((row) => row.id !== assignment.id));
    };

    const handleProjectSort = (columnKey) => {
        setProjectSort((currentSort) => getNextSort(currentSort, columnKey));
        setProjectPage(1);
    };

    const handleAssignmentSort = (columnKey) => {
        setAssignmentSort((currentSort) => getNextSort(currentSort, columnKey));
        setAssignmentPage(1);
    };

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">

            {/* Projects table */}
            <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                        <Folder size={26} /> Projects
                    </h2>

                    <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                        <button
                            type="button"
                            onClick={() => downloadProjectsReport(projectRows, assignmentRows)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
                        >
                            <Download size={16} /> Export Report
                        </button>

                        <button
                            type="button"
                            onClick={openNewProjectModal}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 sm:w-auto"
                        >
                            <Plus size={16} /> New Project
                        </button>
                    </div>
                </div>

                <table className="min-w-[900px] w-full border-collapse text-sm">
                    <thead className="bg-slate-200 text-slate-800">
                    <tr>
                        {PROJECT_COLUMNS.map((column) => (
                            <SortableHeader
                                key={column.key}
                                column={column}
                                sortConfig={projectSort}
                                onSort={handleProjectSort}
                            />
                        ))}
                        <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {visibleProjectRows.map((project) => (
                        <tr key={project.id} className="hover:bg-slate-50">
                            <td className="border border-slate-300 px-4 py-3">
                                <div className="font-semibold text-slate-900">{project.name}</div>
                                <div className="text-xs text-slate-500">{project.id}</div>
                            </td>

                            <td className="border border-slate-300 px-4 py-3">{project.client}</td>
                            <td className="border border-slate-300 px-4 py-3">{project.startDate}</td>
                            <td className="border border-slate-300 px-4 py-3">{project.dueDate}</td>
                            <td className="border border-slate-300 px-4 py-3 text-center">{project.images}</td>

                            <td className="border border-slate-300 px-4 py-3">
                                <ProgressBar value={project.progress} />
                            </td>

                            <td className="border border-slate-300 px-4 py-3 text-center">
                                <Badge value={project.status} />
                            </td>

                            <td className="border border-slate-300 px-4 py-3">
                                <RowActions
                                    onEdit={() => setProjectModal({ mode: "edit", data: project })}
                                    onDelete={() => deleteProject(project)}
                                />
                            </td>
                        </tr>
                    ))}

                    {visibleProjectRows.length === 0 && (
                        <tr>
                            <td colSpan={8} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                No projects found.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>

                <TableFooter
                    text={getRangeText(projectPage, PROJECTS_PAGE_SIZE, sortedProjectRows.length, "projects")}
                    currentPage={projectPage}
                    totalPages={projectTotalPages}
                    onPageChange={setProjectPage}
                />
            </div>

            {/* Assignments table */}
            <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                        <ListChecks size={26} /> Assignments
                    </h2>

                    <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                        <FilterSelect
                            value={projectFilter}
                            onChange={(value) => {
                                setProjectFilter(value);
                                setAssignmentPage(1);
                            }}
                            options={projectOptions}
                        />
                        <FilterSelect
                            value={employeeFilter}
                            onChange={(value) => {
                                setEmployeeFilter(value);
                                setAssignmentPage(1);
                            }}
                            options={employeeOptions}
                        />
                        <FilterSelect
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(value);
                                setAssignmentPage(1);
                            }}
                            options={statusOptions}
                        />

                        <button
                            type="button"
                            onClick={openNewAssignmentModal}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 sm:w-auto"
                        >
                            <Plus size={16} /> New Assignment
                        </button>
                    </div>
                </div>

                <table className="min-w-[900px] w-full border-collapse text-sm">
                    <thead className="bg-slate-200 text-slate-800">
                    <tr>
                        {ASSIGNMENT_COLUMNS.map((column) => (
                            <SortableHeader
                                key={column.key}
                                column={column}
                                sortConfig={assignmentSort}
                                onSort={handleAssignmentSort}
                            />
                        ))}
                        <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {visibleAssignmentRows.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-slate-50">
                            <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">
                                {assignment.id}
                            </td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.project}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.taskType}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.assignedTo}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.assignedDate}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.dueDate}</td>

                            <td className="border border-slate-300 px-4 py-3 text-center">
                                <PriorityBadge value={assignment.priority} />
                            </td>

                            <td className="border border-slate-300 px-4 py-3 text-center">
                                <Badge value={assignment.status} />
                            </td>

                            <td className="border border-slate-300 px-4 py-3">
                                <RowActions
                                    onEdit={() => setAssignmentModal({ mode: "edit", data: assignment })}
                                    onDelete={() => deleteAssignment(assignment)}
                                />
                            </td>
                        </tr>
                    ))}

                    {visibleAssignmentRows.length === 0 && (
                        <tr>
                            <td colSpan={9} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                No assignments found for the selected filters.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>

                <TableFooter
                    text={getRangeText(assignmentPage, ASSIGNMENTS_PAGE_SIZE, sortedAssignmentRows.length, "assignments")}
                    currentPage={assignmentPage}
                    totalPages={assignmentTotalPages}
                    onPageChange={setAssignmentPage}
                />
            </div>

            {projectModal && (
                <Modal
                    title={projectModal.mode === "create" ? "New Project" : "Edit Project"}
                    onClose={() => setProjectModal(null)}
                >
                    <ProjectForm
                        initialProject={projectModal.data}
                        onCancel={() => setProjectModal(null)}
                        onSave={saveProject}
                    />
                </Modal>
            )}

            {assignmentModal && (
                <Modal
                    title={assignmentModal.mode === "create" ? "New Assignment" : "Edit Assignment"}
                    onClose={() => setAssignmentModal(null)}
                >
                    <AssignmentForm
                        initialAssignment={assignmentModal.data}
                        projectOptions={["All Projects", ...projectRows.map((project) => project.name)]}
                        employeeOptions={employeeOptions}
                        onCancel={() => setAssignmentModal(null)}
                        onSave={saveAssignment}
                    />
                </Modal>
            )}
        </section>
    );
}



/**
 * Displays employee availability/status with role-appropriate colors.
 */
function EmployeeStatusBadge({ value }) {
    const style =
        value === "Active"
            ? "bg-emerald-100 text-emerald-700"
            : value === "Review"
                ? "bg-violet-100 text-violet-700"
                : value === "On Break"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-700";

    return (
        <span className={`rounded-md px-3 py-1 text-xs font-medium ${style}`}>
            {value}
        </span>
    );
}

/**
 * Create/edit form for employee records.
 */
function EmployeeForm({ initialEmployee, roleOptions, onCancel, onSave }) {
    const [form, setForm] = useState(initialEmployee);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave({
            ...form,
            activeTasks: normalizeNumber(form.activeTasks),
            completedToday: normalizeNumber(form.completedToday),
            hoursToday: normalizeNumber(form.hoursToday),
            efficiency: Math.max(0, Math.min(100, normalizeNumber(form.efficiency))),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Employee Name">
                    <TextInput value={form.name} onChange={(value) => updateField("name", value)} placeholder="Employee name" />
                </FormField>

                <FormField label="Role">
                    <input
                        list="employee-role-options"
                        value={form.role}
                        onChange={(event) => updateField("role", event.target.value)}
                        placeholder="Photo Editor"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                    <datalist id="employee-role-options">
                        {roleOptions.map((role) => (
                            <option key={role} value={role} />
                        ))}
                    </datalist>
                </FormField>

                <FormField label="Email">
                    <TextInput value={form.email} onChange={(value) => updateField("email", value)} placeholder="employee@company.com" type="email" />
                </FormField>

                <FormField label="Phone">
                    <TextInput value={form.phone} onChange={(value) => updateField("phone", value)} placeholder="(555) 210-1000" />
                </FormField>

                <FormField label="Status">
                    <select
                        value={form.status}
                        onChange={(event) => updateField("status", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>Active</option>
                        <option>Review</option>
                        <option>On Break</option>
                        <option>Offline</option>
                    </select>
                </FormField>

                <FormField label="Availability">
                    <TextInput value={form.availability} onChange={(value) => updateField("availability", value)} placeholder="Available" />
                </FormField>

                <FormField label="Current Task">
                    <TextInput value={form.currentTask} onChange={(value) => updateField("currentTask", value)} placeholder="Current task" />
                </FormField>

                <FormField label="Active Tasks">
                    <TextInput value={form.activeTasks} onChange={(value) => updateField("activeTasks", value)} placeholder="3" type="number" />
                </FormField>

                <FormField label="Completed Today">
                    <TextInput value={form.completedToday} onChange={(value) => updateField("completedToday", value)} placeholder="12" type="number" />
                </FormField>

                <FormField label="Hours Today">
                    <TextInput value={form.hoursToday} onChange={(value) => updateField("hoursToday", value)} placeholder="6.5" type="number" />
                </FormField>

                <FormField label="Efficiency">
                    <TextInput value={form.efficiency} onChange={(value) => updateField("efficiency", value)} placeholder="91" type="number" />
                </FormField>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                >
                    Save Employee
                </button>
            </div>
        </form>
    );
}

/**
 * Manager employee management page with search, filters, summary cards, export, and edit modals.
 */
function EmployeesPage({ globalSearch = "" }) {
    const { data: loadedEmployeeRows } = useApiPlaceholder(API_ENDPOINTS.employees, employees);

    const [employeeRows, setEmployeeRows] = useState(employees);
    const [employeeSort, setEmployeeSort] = useState({ key: "name", direction: "asc" });
    const [employeePage, setEmployeePage] = useState(1);
    const [roleFilter, setRoleFilter] = useState("All Roles");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [employeeModal, setEmployeeModal] = useState(null);

    useEffect(() => {
        if (Array.isArray(loadedEmployeeRows)) {
            setEmployeeRows(loadedEmployeeRows);
        }
    }, [loadedEmployeeRows]);

    const roleOptions = useMemo(
        () => getUniqueOptions(employeeRows, "role", "All Roles"),
        [employeeRows]
    );

    const statusOptions = useMemo(
        () => getUniqueOptions(employeeRows, "status", "All Status"),
        [employeeRows]
    );

    const filteredEmployeeRows = useMemo(() => {
        const searchText = [globalSearch, employeeSearch].filter(Boolean).join(" " ).trim().toLowerCase();

        return employeeRows.filter((employee) => {
            const matchesRole = roleFilter === "All Roles" || employee.role === roleFilter;
            const matchesStatus = statusFilter === "All Status" || employee.status === statusFilter;
            const matchesSearch = !searchText || [
                employee.name,
                employee.id,
                employee.role,
                employee.email,
                employee.currentTask,
                employee.availability,
            ].some((value) => String(value || "").toLowerCase().includes(searchText));

            return matchesRole && matchesStatus && matchesSearch;
        });
    }, [employeeRows, roleFilter, statusFilter, employeeSearch, globalSearch]);

    const sortedEmployeeRows = useMemo(
        () => sortRows(filteredEmployeeRows, employeeSort),
        [filteredEmployeeRows, employeeSort]
    );

    const employeeTotalPages = getTotalPages(sortedEmployeeRows.length, EMPLOYEES_PAGE_SIZE);
    const visibleEmployeeRows = paginateRows(sortedEmployeeRows, employeePage, EMPLOYEES_PAGE_SIZE);
    const totalActiveEmployees = employeeRows.filter((employee) => employee.status === "Active").length;
    const totalHoursToday = employeeRows.reduce((total, employee) => total + normalizeNumber(employee.hoursToday), 0);
    const totalCompletedToday = employeeRows.reduce((total, employee) => total + normalizeNumber(employee.completedToday), 0);
    const averageEfficiency = employeeRows.length
        ? Math.round(employeeRows.reduce((total, employee) => total + normalizeNumber(employee.efficiency), 0) / employeeRows.length)
        : 0;

    useEffect(() => {
        if (employeePage > employeeTotalPages) {
            setEmployeePage(employeeTotalPages);
        }
    }, [employeePage, employeeTotalPages]);

    const handleEmployeeSort = (columnKey) => {
        setEmployeeSort((currentSort) => getNextSort(currentSort, columnKey));
        setEmployeePage(1);
    };

    const openNewEmployeeModal = () => {
        setEmployeeModal({
            mode: "create",
            data: {
                id: generateNextId("EMP", employeeRows),
                name: "",
                role: "Photo Editor",
                email: "",
                phone: "",
                status: "Active",
                currentTask: "",
                activeTasks: 0,
                completedToday: 0,
                hoursToday: 0,
                efficiency: 0,
                availability: "Available",
            },
        });
    };

    const saveEmployee = async (employee) => {
        const cleanEmployee = {
            ...employee,
            id: employee.id || generateNextId("EMP", employeeRows),
            name: employee.name.trim() || "Unnamed Employee",
            role: employee.role.trim() || "Unassigned Role",
            email: employee.email.trim(),
            phone: employee.phone.trim(),
            currentTask: employee.currentTask.trim() || "No active task",
            availability: employee.availability.trim() || employee.status,
        };

        if (getUseApiDataSetting()) {
            try {
                if (employeeModal.mode === "create") {
                    await apiPlaceholders.createEmployee(cleanEmployee);
                } else {
                    await apiPlaceholders.updateEmployee(cleanEmployee.id, cleanEmployee);
                }
            } catch (apiError) {
                console.warn("Employee API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setEmployeeRows((currentRows) => {
            if (employeeModal.mode === "create") {
                return [cleanEmployee, ...currentRows];
            }

            return currentRows.map((row) => row.id === cleanEmployee.id ? cleanEmployee : row);
        });
        setEmployeePage(1);
        setEmployeeModal(null);
    };

    const deleteEmployee = async (employee) => {
        if (!window.confirm(`Delete ${employee.name}?`)) return;

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteEmployee(employee.id);
            } catch (apiError) {
                console.warn("Employee delete API endpoint is not connected yet. Deleting locally.", apiError);
            }
        }

        setEmployeeRows((currentRows) => currentRows.filter((row) => row.id !== employee.id));
    };

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-300 bg-white px-4 py-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold text-slate-600">Total Employees</p>
                            <p className="mt-2 text-3xl font-bold">{employeeRows.length}</p>
                        </div>
                        <Users size={32} className="text-violet-600" />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-300 bg-white px-4 py-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold text-slate-600">Active Now</p>
                            <p className="mt-2 text-3xl font-bold">{totalActiveEmployees}</p>
                        </div>
                        <Play size={32} className="text-violet-600" />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-300 bg-white px-4 py-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold text-slate-600">Completed Today</p>
                            <p className="mt-2 text-3xl font-bold">{totalCompletedToday}</p>
                        </div>
                        <ListChecks size={32} className="text-violet-600" />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-300 bg-white px-4 py-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold text-slate-600">Avg. Efficiency</p>
                            <p className="mt-2 text-3xl font-bold">{averageEfficiency}%</p>
                        </div>
                        <BarChart3 size={32} className="text-violet-600" />
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
                    <div>
                        <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                            <Users size={26} /> Employees
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Manage employee availability, current work, daily output, and productivity.
                        </p>
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
                        <button
                            type="button"
                            onClick={() => downloadEmployeesReport(employeeRows)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
                        >
                            <Download size={16} /> Export Report
                        </button>

                        <button
                            type="button"
                            onClick={openNewEmployeeModal}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 sm:w-auto"
                        >
                            <Plus size={16} /> New Employee
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-4 py-4 md:grid-cols-[1fr_auto_auto] md:items-center lg:px-5">
                    <div className="flex w-full items-center gap-3 rounded-xl border border-slate-300 px-4 py-2 shadow-sm">
                        <Search size={18} className="shrink-0 text-slate-500" />
                        <input
                            value={employeeSearch}
                            onChange={(event) => {
                                setEmployeeSearch(event.target.value);
                                setEmployeePage(1);
                            }}
                            className="w-full text-sm outline-none"
                            placeholder="Search by employee, role, task, email, or availability"
                        />
                    </div>

                    <FilterSelect
                        value={roleFilter}
                        onChange={(value) => {
                            setRoleFilter(value);
                            setEmployeePage(1);
                        }}
                        options={roleOptions}
                    />

                    <FilterSelect
                        value={statusFilter}
                        onChange={(value) => {
                            setStatusFilter(value);
                            setEmployeePage(1);
                        }}
                        options={statusOptions}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-[1100px] w-full border-collapse text-sm">
                        <thead className="bg-slate-200 text-slate-800">
                        <tr>
                            {EMPLOYEE_COLUMNS.map((column) => (
                                <SortableHeader
                                    key={column.key}
                                    column={column}
                                    sortConfig={employeeSort}
                                    onSort={handleEmployeeSort}
                                />
                            ))}
                            <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {visibleEmployeeRows.map((employee) => (
                            <tr key={employee.id} className="hover:bg-slate-50">
                                <td className="border border-slate-300 px-4 py-3">
                                    <div className="font-semibold text-slate-900">{employee.name}</div>
                                    <div className="text-xs text-slate-500">{employee.id}</div>
                                    <div className="text-xs text-slate-500">{employee.email}</div>
                                </td>
                                <td className="border border-slate-300 px-4 py-3 font-medium">{employee.role}</td>
                                <td className="border border-slate-300 px-4 py-3">
                                    <div className="font-medium text-slate-800">{employee.currentTask}</div>
                                    <div className="mt-1 text-xs text-slate-500">{employee.availability}</div>
                                </td>
                                <td className="border border-slate-300 px-4 py-3 text-center font-semibold">{employee.activeTasks}</td>
                                <td className="border border-slate-300 px-4 py-3 text-center font-semibold">{employee.completedToday}</td>
                                <td className="border border-slate-300 px-4 py-3 text-center font-semibold">{employee.hoursToday}</td>
                                <td className="border border-slate-300 px-4 py-3">
                                    <ProgressBar value={normalizeNumber(employee.efficiency)} />
                                </td>
                                <td className="border border-slate-300 px-4 py-3 text-center">
                                    <EmployeeStatusBadge value={employee.status} />
                                </td>
                                <td className="border border-slate-300 px-4 py-3">
                                    <RowActions
                                        onEdit={() => setEmployeeModal({ mode: "edit", data: employee })}
                                        onDelete={() => deleteEmployee(employee)}
                                    />
                                </td>
                            </tr>
                        ))}

                        {visibleEmployeeRows.length === 0 && (
                            <tr>
                                <td colSpan={9} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                    No employees found for the selected filters.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <TableFooter
                    text={getRangeText(employeePage, EMPLOYEES_PAGE_SIZE, sortedEmployeeRows.length, "employees")}
                    currentPage={employeePage}
                    totalPages={employeeTotalPages}
                    onPageChange={setEmployeePage}
                />
            </div>

            <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold sm:text-xl">
                    <Clock size={22} /> Daily Team Snapshot
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-bold text-slate-600">Total Hours Logged Today</p>
                        <p className="mt-2 text-2xl font-bold">{totalHoursToday.toFixed(2)}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-bold text-slate-600">Open Workload</p>
                        <p className="mt-2 text-2xl font-bold">
                            {employeeRows.reduce((total, employee) => total + normalizeNumber(employee.activeTasks), 0)} tasks
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-bold text-slate-600">Employees Needing Attention</p>
                        <p className="mt-2 text-2xl font-bold">
                            {employeeRows.filter((employee) => employee.status !== "Active").length}
                        </p>
                    </div>
                </div>
            </div>

            {employeeModal && (
                <Modal
                    title={employeeModal.mode === "create" ? "New Employee" : "Edit Employee"}
                    onClose={() => setEmployeeModal(null)}
                >
                    <EmployeeForm
                        initialEmployee={employeeModal.data}
                        roleOptions={roleOptions.filter((option) => option !== "All Roles")}
                        onCancel={() => setEmployeeModal(null)}
                        onSave={saveEmployee}
                    />
                </Modal>
            )}
        </section>
    );
}

/**
 * Create/edit form for task records, including estimated and tracked time fields.
 */
function TaskForm({ initialTask, projectOptions, employeeOptions, onCancel, onSave }) {
    const [form, setForm] = useState(initialTask);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave({
            ...form,
            taskName: form.taskName.trim() || "Untitled Task",
            assignedTo: form.assignedTo.trim() || "Unassigned",
            estimatedHours: normalizeNumber(form.estimatedHours),
            trackedSeconds: normalizeNumber(form.trackedSeconds),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Task Name">
                    <TextInput value={form.taskName} onChange={(value) => updateField("taskName", value)} placeholder="Photo Editing Batch 1" />
                </FormField>

                <FormField label="Project">
                    <select
                        value={form.project}
                        onChange={(event) => updateField("project", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        {projectOptions.map((project) => (
                            <option key={project}>{project}</option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Assigned To">
                    <input
                        list="task-employee-options"
                        value={form.assignedTo}
                        onChange={(event) => updateField("assignedTo", event.target.value)}
                        placeholder="Employee name"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                    <datalist id="task-employee-options">
                        {employeeOptions.map((employee) => (
                            <option key={employee} value={employee} />
                        ))}
                    </datalist>
                </FormField>

                <FormField label="Due Date">
                    <TextInput value={form.dueDate} onChange={(value) => updateField("dueDate", value)} placeholder="May 18, 2026" />
                </FormField>

                <FormField label="Estimated Hours">
                    <TextInput value={form.estimatedHours} onChange={(value) => updateField("estimatedHours", value)} placeholder="8" type="number" />
                </FormField>

                <FormField label="Saved Time In Seconds">
                    <TextInput value={form.trackedSeconds} onChange={(value) => updateField("trackedSeconds", value)} placeholder="0" type="number" />
                </FormField>

                <FormField label="Priority">
                    <select
                        value={form.priority}
                        onChange={(event) => updateField("priority", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>
                </FormField>

                <FormField label="Status">
                    <select
                        value={form.status}
                        onChange={(event) => updateField("status", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>Not Started</option>
                        <option>In Progress</option>
                        <option>Review</option>
                        <option>Completed</option>
                    </select>
                </FormField>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                >
                    Save Task
                </button>
            </div>
        </form>
    );
}

/**
 * Timer button used by the original task table to start or stop work tracking.
 */
function TimerControl({ task, currentTime, onStart, onStop, isAnotherTimerRunning }) {
    const isRunning = Boolean(task.timerStartedAt);

    return (
        <div className="flex items-center justify-center gap-2">
            <button
                type="button"
                onClick={() => isRunning ? onStop(task) : onStart(task)}
                disabled={!isRunning && isAnotherTimerRunning}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    isRunning
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-violet-600 text-white hover:bg-violet-700"
                }`}
                title={isRunning ? "Stop timer" : "Start timer"}
            >
                {isRunning ? <Square size={14} /> : <Play size={14} />}
                {isRunning ? "Stop" : "Start"}
            </button>

            <span className={`min-w-[76px] text-xs font-bold ${isRunning ? "text-violet-700" : "text-slate-700"}`}>
                {formatDuration(getLiveTrackedSeconds(task, currentTime))}
            </span>
        </div>
    );
}

/**
 * Manager task management page with timer controls, sorting, filtering, pagination, and CSV export.
 */
function TaskManagementPage() {
    const { data: loadedTaskRows } = useApiPlaceholder(API_ENDPOINTS.tasks, taskItems);
    const [taskRows, setTaskRows] = useState(taskItems);
    const [taskSort, setTaskSort] = useState({ key: "dueDate", direction: "asc" });
    const [taskPage, setTaskPage] = useState(1);
    const [taskSearch, setTaskSearch] = useState("");
    const [projectFilter, setProjectFilter] = useState("All Projects");
    const [employeeFilter, setEmployeeFilter] = useState("All Employees");
    const [priorityFilter, setPriorityFilter] = useState("All Priorities");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [taskModal, setTaskModal] = useState(null);
    const [activeTimerTaskId, setActiveTimerTaskId] = useState(null);
    const [timerTick, setTimerTick] = useState(Date.now());

    useEffect(() => {
        if (Array.isArray(loadedTaskRows)) {
            setTaskRows(loadedTaskRows.map((task) => ({ ...task, timerStartedAt: task.timerStartedAt || null })));
        }
    }, [loadedTaskRows]);

    useEffect(() => {
        if (!activeTimerTaskId) return undefined;

        const intervalId = window.setInterval(() => {
            setTimerTick(Date.now());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [activeTimerTaskId]);

    const projectOptions = useMemo(
        () => getUniqueOptions(taskRows, "project", "All Projects"),
        [taskRows]
    );

    const employeeOptions = useMemo(
        () => getUniqueOptions(taskRows, "assignedTo", "All Employees"),
        [taskRows]
    );

    const priorityOptions = useMemo(
        () => getUniqueOptions(taskRows, "priority", "All Priorities"),
        [taskRows]
    );

    const statusOptions = useMemo(
        () => getUniqueOptions(taskRows, "status", "All Status"),
        [taskRows]
    );

    const filteredTaskRows = useMemo(() => {
        const searchValue = taskSearch.trim().toLowerCase();

        return taskRows.filter((task) => {
            const searchableText = [
                task.id,
                task.taskName,
                task.project,
                task.assignedTo,
                task.dueDate,
                task.priority,
                task.status,
                task.lastStoppedAt,
            ].join(" ").toLowerCase();

            const matchesSearch = !searchValue || searchableText.includes(searchValue);
            const matchesProject = projectFilter === "All Projects" || task.project === projectFilter;
            const matchesEmployee = employeeFilter === "All Employees" || task.assignedTo === employeeFilter;
            const matchesPriority = priorityFilter === "All Priorities" || task.priority === priorityFilter;
            const matchesStatus = statusFilter === "All Status" || task.status === statusFilter;

            return matchesSearch && matchesProject && matchesEmployee && matchesPriority && matchesStatus;
        });
    }, [taskRows, taskSearch, projectFilter, employeeFilter, priorityFilter, statusFilter]);

    const sortedTaskRows = useMemo(
        () => sortRows(filteredTaskRows, taskSort),
        [filteredTaskRows, taskSort]
    );

    const taskTotalPages = getTotalPages(sortedTaskRows.length, TASKS_PAGE_SIZE);
    const visibleTaskRows = paginateRows(sortedTaskRows, taskPage, TASKS_PAGE_SIZE);
    const activeTask = taskRows.find((task) => task.id === activeTimerTaskId);
    const totalTrackedSeconds = taskRows.reduce((total, task) => total + getLiveTrackedSeconds(task, timerTick), 0);
    const completedTasks = taskRows.filter((task) => task.status === "Completed").length;
    const reviewTasks = taskRows.filter((task) => task.status === "Review").length;
    const openTasks = taskRows.filter((task) => task.status !== "Completed").length;
    const highPriorityTasks = taskRows.filter((task) => task.priority === "High" && task.status !== "Completed").length;

    useEffect(() => {
        if (taskPage > taskTotalPages) {
            setTaskPage(taskTotalPages);
        }
    }, [taskPage, taskTotalPages]);

    const handleTaskSort = (columnKey) => {
        setTaskSort((currentSort) => getNextSort(currentSort, columnKey));
        setTaskPage(1);
    };

    const openNewTaskModal = () => {
        const projectNames = projectRowsForTasks();

        setTaskModal({
            mode: "create",
            data: {
                id: generateNextId("TSK", taskRows),
                taskName: "",
                project: projectNames[0] || "Unassigned Project",
                assignedTo: "",
                dueDate: "May 30, 2026",
                priority: "Medium",
                estimatedHours: 1,
                trackedSeconds: 0,
                status: "Not Started",
                timerStartedAt: null,
                lastStoppedAt: "",
            },
        });
    };

    const projectRowsForTasks = () => {
        const taskProjects = taskRows.map((task) => task.project).filter(Boolean);
        const masterProjects = projects.map((project) => project.name).filter(Boolean);
        return [...new Set([...masterProjects, ...taskProjects])].sort();
    };

    const saveTask = async (task) => {
        const cleanTask = {
            ...task,
            id: task.id || generateNextId("TSK", taskRows),
            taskName: task.taskName.trim() || "Untitled Task",
            assignedTo: task.assignedTo.trim() || "Unassigned",
            timerStartedAt: task.timerStartedAt || null,
            trackedSeconds: normalizeNumber(task.trackedSeconds),
        };

        if (getUseApiDataSetting()) {
            try {
                if (taskModal.mode === "create") {
                    await apiPlaceholders.createTask(cleanTask);
                } else {
                    await apiPlaceholders.updateTask(cleanTask.id, cleanTask);
                }
            } catch (apiError) {
                console.warn("Task API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setTaskRows((currentRows) => {
            if (taskModal.mode === "create") {
                return [cleanTask, ...currentRows];
            }

            return currentRows.map((row) => row.id === cleanTask.id ? cleanTask : row);
        });
        setTaskPage(1);
        setTaskModal(null);
    };

    const deleteTask = async (task) => {
        if (!window.confirm(`Delete ${task.taskName}?`)) return;

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteTask(task.id);
            } catch (apiError) {
                console.warn("Task delete API endpoint is not connected yet. Deleting locally.", apiError);
            }
        }

        if (activeTimerTaskId === task.id) {
            setActiveTimerTaskId(null);
        }

        setTaskRows((currentRows) => currentRows.filter((row) => row.id !== task.id));
    };

    const startTimer = async (task) => {
        if (activeTimerTaskId && activeTimerTaskId !== task.id) {
            window.alert("Please stop the active timer before starting another task.");
            return;
        }

        const startedAt = Date.now();

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.startTaskTimer(task.id, new Date(startedAt).toISOString());
            } catch (apiError) {
                console.warn("Start timer API endpoint is not connected yet. Starting locally.", apiError);
            }
        }

        setTaskRows((currentRows) => currentRows.map((row) => (
            row.id === task.id
                ? { ...row, timerStartedAt: startedAt, status: row.status === "Completed" ? "In Progress" : row.status }
                : row
        )));
        setActiveTimerTaskId(task.id);
        setTimerTick(startedAt);
    };

    const stopTimer = async (task) => {
        if (!task.timerStartedAt) return;

        const stoppedAt = Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((stoppedAt - task.timerStartedAt) / 1000));
        const nextTrackedSeconds = normalizeNumber(task.trackedSeconds) + elapsedSeconds;
        const lastStoppedAt = new Date(stoppedAt).toLocaleString([], {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.stopTaskTimer(task.id, {
                    stoppedAt: new Date(stoppedAt).toISOString(),
                    elapsedSeconds,
                    totalTrackedSeconds: nextTrackedSeconds,
                });
            } catch (apiError) {
                console.warn("Stop timer API endpoint is not connected yet. Stopping locally.", apiError);
            }
        }

        setTaskRows((currentRows) => currentRows.map((row) => (
            row.id === task.id
                ? { ...row, trackedSeconds: nextTrackedSeconds, timerStartedAt: null, lastStoppedAt }
                : row
        )));
        setActiveTimerTaskId(null);
        setTimerTick(stoppedAt);
    };

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                    ["Open Tasks", openTasks],
                    ["Completed Tasks", completedTasks],
                    ["In Review", reviewTasks],
                    ["High Priority", highPriorityTasks],
                    ["Total Tracked Time", formatDuration(totalTrackedSeconds)],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-slate-300 bg-white px-4 py-5 text-center shadow-sm sm:px-5 sm:py-6">
                        <div className="text-sm font-bold">{label}</div>
                        <div className={`mt-4 text-3xl ${label === "Total Tracked Time" ? "text-violet-700" : "text-black"}`}>
                            {value}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[380px_1fr]">
                <div className="self-start rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
                    <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                        <Clock size={26} /> Active Time Tracker
                    </h2>

                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                        {activeTask ? (
                            <>
                                <div className="text-sm font-semibold text-slate-500">Currently Tracking</div>
                                <div className="mt-2 text-xl font-bold text-slate-900">{activeTask.taskName}</div>
                                <div className="mt-1 text-sm text-slate-600">{activeTask.project}</div>
                                <div className="mt-5 text-4xl font-bold text-violet-700 sm:text-5xl">
                                    {formatDuration(getLiveTrackedSeconds(activeTask, timerTick))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => stopTimer(activeTask)}
                                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                                >
                                    <Square size={16} /> Stop Timer
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="text-sm font-semibold text-slate-500">No Active Timer</div>
                                <div className="mt-3 text-4xl font-bold text-slate-900">00:00:00</div>
                                <p className="mt-3 text-sm text-slate-600">
                                    Select Start on any task below to begin tracking time.
                                </p>
                            </>
                        )}
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-slate-700">
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="font-semibold">Active Task ID</span>
                            <span>{activeTask?.id || "None"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="font-semibold">Assigned To</span>
                            <span>{activeTask?.assignedTo || "None"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Last Stop</span>
                            <span>{activeTask?.lastStoppedAt || "Not recorded"}</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                            <ListChecks size={26} /> Task Management
                        </h2>

                        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                            <button
                                type="button"
                                onClick={() => downloadTasksReport(taskRows)}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
                            >
                                <Download size={16} /> Export Time Report
                            </button>

                            <button
                                type="button"
                                onClick={openNewTaskModal}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 sm:w-auto"
                            >
                                <Plus size={16} /> New Task
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-5 py-4 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center">
                        <div className="flex w-full items-center gap-3 rounded-xl border border-slate-300 px-4 py-2 shadow-sm">
                            <Search size={18} className="shrink-0 text-slate-500" />
                            <input
                                value={taskSearch}
                                onChange={(event) => {
                                    setTaskSearch(event.target.value);
                                    setTaskPage(1);
                                }}
                                className="w-full text-sm outline-none"
                                placeholder="Search by task, project, employee, due date, priority, or status"
                            />
                        </div>

                        <FilterSelect
                            value={projectFilter}
                            onChange={(value) => {
                                setProjectFilter(value);
                                setTaskPage(1);
                            }}
                            options={projectOptions}
                        />
                        <FilterSelect
                            value={employeeFilter}
                            onChange={(value) => {
                                setEmployeeFilter(value);
                                setTaskPage(1);
                            }}
                            options={employeeOptions}
                        />
                        <FilterSelect
                            value={priorityFilter}
                            onChange={(value) => {
                                setPriorityFilter(value);
                                setTaskPage(1);
                            }}
                            options={priorityOptions}
                        />
                        <FilterSelect
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(value);
                                setTaskPage(1);
                            }}
                            options={statusOptions}
                        />
                    </div>

                    <table className="min-w-[900px] w-full border-collapse text-sm">
                        <thead className="bg-slate-200 text-slate-800">
                        <tr>
                            {TASK_COLUMNS.map((column) => (
                                <SortableHeader
                                    key={column.key}
                                    column={column}
                                    sortConfig={taskSort}
                                    onSort={handleTaskSort}
                                />
                            ))}
                            <th className="border border-slate-300 px-4 py-3 text-center font-bold">Timer</th>
                            <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {visibleTaskRows.map((task) => {
                            const liveTask = taskRows.find((row) => row.id === task.id) || task;
                            const isAnotherTimerRunning = Boolean(activeTimerTaskId && activeTimerTaskId !== liveTask.id);

                            return (
                                <tr key={liveTask.id} className="hover:bg-slate-50">
                                    <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">
                                        {liveTask.id}
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3">
                                        <div className="font-semibold text-slate-900">{liveTask.taskName}</div>
                                        <div className="text-xs text-slate-500">Est. {liveTask.estimatedHours}h</div>
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3">{liveTask.project}</td>
                                    <td className="border border-slate-300 px-4 py-3">{liveTask.assignedTo}</td>
                                    <td className="border border-slate-300 px-4 py-3">{liveTask.dueDate}</td>
                                    <td className="border border-slate-300 px-4 py-3 text-center">
                                        <PriorityBadge value={liveTask.priority} />
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3 text-center font-semibold text-slate-800">
                                        {formatDuration(getLiveTrackedSeconds(liveTask, timerTick))}
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3 text-center">
                                        <Badge value={liveTask.status} />
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3">
                                        <TimerControl
                                            task={liveTask}
                                            currentTime={timerTick}
                                            onStart={startTimer}
                                            onStop={stopTimer}
                                            isAnotherTimerRunning={isAnotherTimerRunning}
                                        />
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3">
                                        <RowActions
                                            onEdit={() => setTaskModal({ mode: "edit", data: liveTask })}
                                            onDelete={() => deleteTask(liveTask)}
                                        />
                                    </td>
                                </tr>
                            );
                        })}

                        {visibleTaskRows.length === 0 && (
                            <tr>
                                <td colSpan={10} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                    No tasks found for the selected filters.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>

                    <TableFooter
                        text={getRangeText(taskPage, TASKS_PAGE_SIZE, sortedTaskRows.length, "tasks")}
                        currentPage={taskPage}
                        totalPages={taskTotalPages}
                        onPageChange={setTaskPage}
                    />
                </div>
            </div>

            {taskModal && (
                <Modal
                    title={taskModal.mode === "create" ? "New Task" : "Edit Task"}
                    onClose={() => setTaskModal(null)}
                >
                    <TaskForm
                        initialTask={taskModal.data}
                        projectOptions={projectRowsForTasks()}
                        employeeOptions={employeeOptions.filter((option) => option !== "All Employees")}
                        onCancel={() => setTaskModal(null)}
                        onSave={saveTask}
                    />
                </Modal>
            )}
        </section>
    );
}



/**
 * Role-aware projects page that limits employee users to their assigned projects and assignments.
 */
function ProjectsAndAssignmentsSecure({ currentUser, globalSearch = "" }) {
    const { data: loadedProjectRows } = useApiPlaceholder(API_ENDPOINTS.projects, projects);
    const { data: loadedAssignmentRows } = useApiPlaceholder(API_ENDPOINTS.assignments, assignments);

    const [projectRows, setProjectRows] = useState(projects);
    const [assignmentRows, setAssignmentRows] = useState(assignments);
    const [projectSort, setProjectSort] = useState({ key: "name", direction: "asc" });
    const [assignmentSort, setAssignmentSort] = useState({ key: "id", direction: "asc" });
    const [projectPage, setProjectPage] = useState(1);
    const [assignmentPage, setAssignmentPage] = useState(1);
    const [projectFilter, setProjectFilter] = useState("All Projects");
    const [employeeFilter, setEmployeeFilter] = useState("All Employees");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [projectModal, setProjectModal] = useState(null);
    const [assignmentModal, setAssignmentModal] = useState(null);
    const hasManagerAccess = canManageContent(currentUser);

    useEffect(() => {
        if (Array.isArray(loadedProjectRows)) {
            setProjectRows(loadedProjectRows);
        }
    }, [loadedProjectRows]);

    useEffect(() => {
        if (Array.isArray(loadedAssignmentRows)) {
            setAssignmentRows(loadedAssignmentRows);
        }
    }, [loadedAssignmentRows]);

    const accessibleProjectRows = useMemo(
        () => filterRowsByAccess(projectRows, currentUser, "projects"),
        [projectRows, currentUser]
    );

    const accessibleAssignmentRows = useMemo(
        () => filterRowsByAccess(assignmentRows, currentUser, "assignments"),
        [assignmentRows, currentUser]
    );

    const projectOptions = useMemo(
        () => getUniqueOptions(accessibleAssignmentRows, "project", "All Projects"),
        [accessibleAssignmentRows]
    );

    const employeeOptions = useMemo(
        () => hasManagerAccess
            ? getUniqueOptions(accessibleAssignmentRows, "assignedTo", "All Employees")
            : ["All Employees", currentUser?.employeeName || currentUser?.name].filter(Boolean),
        [accessibleAssignmentRows, hasManagerAccess, currentUser]
    );

    const statusOptions = useMemo(
        () => getUniqueOptions(accessibleAssignmentRows, "status", "All Status"),
        [accessibleAssignmentRows]
    );

    const filteredProjectRows = useMemo(() => {
        return accessibleProjectRows.filter((project) => rowMatchesSearch(project, globalSearch, [
            "id",
            "name",
            "client",
            "startDate",
            "dueDate",
            "images",
            "progress",
            "status",
        ]));
    }, [accessibleProjectRows, globalSearch]);

    const filteredAssignmentRows = useMemo(() => {
        return accessibleAssignmentRows.filter((assignment) => {
            const matchesProject = projectFilter === "All Projects" || assignment.project === projectFilter;
            const matchesEmployee = employeeFilter === "All Employees" || assignment.assignedTo === employeeFilter;
            const matchesStatus = statusFilter === "All Status" || assignment.status === statusFilter;
            const matchesSearch = rowMatchesSearch(assignment, globalSearch, [
                "id",
                "project",
                "taskType",
                "assignedTo",
                "assignedDate",
                "dueDate",
                "priority",
                "status",
            ]);
            return matchesProject && matchesEmployee && matchesStatus && matchesSearch;
        });
    }, [accessibleAssignmentRows, projectFilter, employeeFilter, statusFilter, globalSearch]);

    const sortedProjectRows = useMemo(
        () => sortRows(filteredProjectRows, projectSort),
        [filteredProjectRows, projectSort]
    );

    const sortedAssignmentRows = useMemo(
        () => sortRows(filteredAssignmentRows, assignmentSort),
        [filteredAssignmentRows, assignmentSort]
    );

    const projectTotalPages = getTotalPages(sortedProjectRows.length, PROJECTS_PAGE_SIZE);
    const assignmentTotalPages = getTotalPages(sortedAssignmentRows.length, ASSIGNMENTS_PAGE_SIZE);
    const visibleProjectRows = paginateRows(sortedProjectRows, projectPage, PROJECTS_PAGE_SIZE);
    const visibleAssignmentRows = paginateRows(sortedAssignmentRows, assignmentPage, ASSIGNMENTS_PAGE_SIZE);

    useEffect(() => {
        if (projectPage > projectTotalPages) {
            setProjectPage(projectTotalPages);
        }
    }, [projectPage, projectTotalPages]);

    useEffect(() => {
        if (assignmentPage > assignmentTotalPages) {
            setAssignmentPage(assignmentTotalPages);
        }
    }, [assignmentPage, assignmentTotalPages]);

    const openNewProjectModal = () => {
        if (!hasManagerAccess) return;
        setProjectModal({
            mode: "create",
            data: {
                id: generateNextId("PRJ", projectRows),
                name: "",
                client: "",
                startDate: "May 01, 2026",
                dueDate: "May 30, 2026",
                images: "0",
                progress: 0,
                status: "In Progress",
            },
        });
    };

    const openNewAssignmentModal = () => {
        if (!hasManagerAccess) return;
        const firstProjectName = projectRows[0]?.name || "";
        setAssignmentModal({
            mode: "create",
            data: {
                id: generateNextId("ASG", assignmentRows),
                project: firstProjectName,
                taskType: "",
                assignedTo: "",
                assignedDate: "May 01, 2026",
                dueDate: "May 30, 2026",
                priority: "Medium",
                status: "In Progress",
            },
        });
    };

    const saveProject = async (project) => {
        if (!hasManagerAccess) return;
        const cleanProject = {
            ...project,
            id: project.id || generateNextId("PRJ", projectRows),
            name: project.name.trim() || "Untitled Project",
            client: project.client.trim() || "Unassigned Client",
        };

        if (getUseApiDataSetting()) {
            try {
                if (projectModal.mode === "create") {
                    await apiPlaceholders.createProject(cleanProject);
                } else {
                    await apiPlaceholders.updateProject(cleanProject.id, cleanProject);
                }
            } catch (apiError) {
                console.warn("Project API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setProjectRows((currentRows) => projectModal.mode === "create"
            ? [cleanProject, ...currentRows]
            : currentRows.map((row) => row.id === cleanProject.id ? cleanProject : row)
        );
        setProjectPage(1);
        setProjectModal(null);
    };

    const saveAssignment = async (assignment) => {
        if (!hasManagerAccess) return;
        const cleanAssignment = {
            ...assignment,
            id: assignment.id || generateNextId("ASG", assignmentRows),
            taskType: assignment.taskType.trim() || "General Task",
            assignedTo: assignment.assignedTo.trim() || "Unassigned",
        };

        if (getUseApiDataSetting()) {
            try {
                if (assignmentModal.mode === "create") {
                    await apiPlaceholders.createAssignment(cleanAssignment);
                } else {
                    await apiPlaceholders.updateAssignment(cleanAssignment.id, cleanAssignment);
                }
            } catch (apiError) {
                console.warn("Assignment API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setAssignmentRows((currentRows) => assignmentModal.mode === "create"
            ? [cleanAssignment, ...currentRows]
            : currentRows.map((row) => row.id === cleanAssignment.id ? cleanAssignment : row)
        );
        setAssignmentPage(1);
        setAssignmentModal(null);
    };

    const deleteProject = async (project) => {
        if (!hasManagerAccess || !window.confirm(`Delete ${project.name}?`)) return;
        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteProject(project.id);
            } catch (apiError) {
                console.warn("Project delete API endpoint is not connected yet. Deleting locally.", apiError);
            }
        }
        setProjectRows((currentRows) => currentRows.filter((row) => row.id !== project.id));
    };

    const deleteAssignment = async (assignment) => {
        if (!hasManagerAccess || !window.confirm(`Delete ${assignment.id}?`)) return;
        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteAssignment(assignment.id);
            } catch (apiError) {
                console.warn("Assignment delete API endpoint is not connected yet. Deleting locally.", apiError);
            }
        }
        setAssignmentRows((currentRows) => currentRows.filter((row) => row.id !== assignment.id));
    };

    const handleProjectSort = (columnKey) => {
        setProjectSort((currentSort) => getNextSort(currentSort, columnKey));
        setProjectPage(1);
    };

    const handleAssignmentSort = (columnKey) => {
        setAssignmentSort((currentSort) => getNextSort(currentSort, columnKey));
        setAssignmentPage(1);
    };

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">
            {!hasManagerAccess && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm font-semibold text-violet-800">
                    Employee view: only projects and assignments connected to your login are shown.
                </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                        <Folder size={26} /> Projects
                    </h2>
                    {hasManagerAccess && (
                        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                            <button
                                type="button"
                                onClick={() => downloadProjectsReport(projectRows, assignmentRows)}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
                            >
                                <Download size={16} /> Export Report
                            </button>
                            <button
                                type="button"
                                onClick={openNewProjectModal}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 sm:w-auto"
                            >
                                <Plus size={16} /> New Project
                            </button>
                        </div>
                    )}
                </div>

                {globalSearch && (
                    <div className="border-b border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">
                        Search results for “{globalSearch}”
                    </div>
                )}

                <table className="min-w-[900px] w-full border-collapse text-sm">
                    <thead className="bg-slate-200 text-slate-800">
                    <tr>
                        {PROJECT_COLUMNS.map((column) => (
                            <SortableHeader key={column.key} column={column} sortConfig={projectSort} onSort={handleProjectSort} />
                        ))}
                        {hasManagerAccess && <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>}
                    </tr>
                    </thead>
                    <tbody>
                    {visibleProjectRows.map((project) => (
                        <tr key={project.id} className="hover:bg-slate-50">
                            <td className="border border-slate-300 px-4 py-3">
                                <div className="font-semibold text-slate-900">{project.name}</div>
                                <div className="text-xs text-slate-500">{project.id}</div>
                            </td>
                            <td className="border border-slate-300 px-4 py-3">{project.client}</td>
                            <td className="border border-slate-300 px-4 py-3">{project.startDate}</td>
                            <td className="border border-slate-300 px-4 py-3">{project.dueDate}</td>
                            <td className="border border-slate-300 px-4 py-3 text-center">{project.images}</td>
                            <td className="border border-slate-300 px-4 py-3"><ProgressBar value={project.progress} /></td>
                            <td className="border border-slate-300 px-4 py-3 text-center"><Badge value={project.status} /></td>
                            {hasManagerAccess && (
                                <td className="border border-slate-300 px-4 py-3">
                                    <RowActions onEdit={() => setProjectModal({ mode: "edit", data: project })} onDelete={() => deleteProject(project)} />
                                </td>
                            )}
                        </tr>
                    ))}
                    {visibleProjectRows.length === 0 && (
                        <tr>
                            <td colSpan={hasManagerAccess ? 8 : 7} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                No projects found for the selected access level or search.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                <TableFooter text={getRangeText(projectPage, PROJECTS_PAGE_SIZE, sortedProjectRows.length, "projects")} currentPage={projectPage} totalPages={projectTotalPages} onPageChange={setProjectPage} />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                        <ListChecks size={26} /> Assignments
                    </h2>
                    {hasManagerAccess && (
                        <button
                            type="button"
                            onClick={openNewAssignmentModal}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 sm:w-auto"
                        >
                            <Plus size={16} /> New Assignment
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-5 py-4 md:grid-cols-[auto_auto_auto] md:items-center">
                    <FilterSelect value={projectFilter} onChange={(value) => { setProjectFilter(value); setAssignmentPage(1); }} options={projectOptions} />
                    {hasManagerAccess && (
                        <FilterSelect value={employeeFilter} onChange={(value) => { setEmployeeFilter(value); setAssignmentPage(1); }} options={employeeOptions} />
                    )}
                    <FilterSelect value={statusFilter} onChange={(value) => { setStatusFilter(value); setAssignmentPage(1); }} options={statusOptions} />
                </div>

                <table className="min-w-[900px] w-full border-collapse text-sm">
                    <thead className="bg-slate-200 text-slate-800">
                    <tr>
                        {ASSIGNMENT_COLUMNS.map((column) => (
                            <SortableHeader key={column.key} column={column} sortConfig={assignmentSort} onSort={handleAssignmentSort} />
                        ))}
                        {hasManagerAccess && <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>}
                    </tr>
                    </thead>
                    <tbody>
                    {visibleAssignmentRows.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-slate-50">
                            <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">{assignment.id}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.project}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.taskType}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.assignedTo}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.assignedDate}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.dueDate}</td>
                            <td className="border border-slate-300 px-4 py-3 text-center"><PriorityBadge value={assignment.priority} /></td>
                            <td className="border border-slate-300 px-4 py-3 text-center"><Badge value={assignment.status} /></td>
                            {hasManagerAccess && (
                                <td className="border border-slate-300 px-4 py-3">
                                    <RowActions onEdit={() => setAssignmentModal({ mode: "edit", data: assignment })} onDelete={() => deleteAssignment(assignment)} />
                                </td>
                            )}
                        </tr>
                    ))}
                    {visibleAssignmentRows.length === 0 && (
                        <tr>
                            <td colSpan={hasManagerAccess ? 9 : 8} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                No assignments found for the selected filters.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                <TableFooter text={getRangeText(assignmentPage, ASSIGNMENTS_PAGE_SIZE, sortedAssignmentRows.length, "assignments")} currentPage={assignmentPage} totalPages={assignmentTotalPages} onPageChange={setAssignmentPage} />
            </div>

            {projectModal && (
                <Modal title={projectModal.mode === "create" ? "New Project" : "Edit Project"} onClose={() => setProjectModal(null)}>
                    <ProjectForm initialProject={projectModal.data} onCancel={() => setProjectModal(null)} onSave={saveProject} />
                </Modal>
            )}

            {assignmentModal && (
                <Modal title={assignmentModal.mode === "create" ? "New Assignment" : "Edit Assignment"} onClose={() => setAssignmentModal(null)}>
                    <AssignmentForm initialAssignment={assignmentModal.data} projectOptions={["All Projects", ...projectRows.map((project) => project.name)]} employeeOptions={employeeOptions} onCancel={() => setAssignmentModal(null)} onSave={saveAssignment} />
                </Modal>
            )}
        </section>
    );
}

/**
 * Role-aware timer button that prevents employees from running timers on tasks they cannot access.
 */
function TimerControlSecure({ task, currentTime, currentUser, onStart, onStop, isAnotherTimerRunning, canUseTimer }) {
    const session = getTaskTimerSession(task, currentUser);
    const isRunning = Boolean(session.startedAt);

    return (
        <div className="flex items-center justify-center gap-2">
            <button
                type="button"
                onClick={() => isRunning ? onStop(task) : onStart(task)}
                disabled={!canUseTimer || (!isRunning && isAnotherTimerRunning)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    isRunning
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-violet-600 text-white hover:bg-violet-700"
                }`}
                title={isRunning ? "Stop your timer" : "Start your timer"}
            >
                {isRunning ? <Square size={14} /> : <Play size={14} />}
                {isRunning ? "Stop" : "Start"}
            </button>
            <span className={`min-w-[76px] text-xs font-bold ${isRunning ? "text-violet-700" : "text-slate-700"}`}>
                {formatDuration(getLiveTrackedSeconds(task, currentTime, currentUser))}
            </span>
        </div>
    );
}

/**
 * Role-aware task page that limits employees to assigned tasks while preserving manager controls.
 */
function TaskManagementPageSecure({ currentUser, globalSearch = "" }) {
    const { data: loadedTaskRows } = useApiPlaceholder(API_ENDPOINTS.tasks, taskItems);
    const [taskRows, setTaskRows] = useState(taskItems.map(normalizeTaskForTimers));
    const [taskSort, setTaskSort] = useState({ key: "dueDate", direction: "asc" });
    const [taskPage, setTaskPage] = useState(1);
    const [taskSearch, setTaskSearch] = useState("");
    const [projectFilter, setProjectFilter] = useState("All Projects");
    const [employeeFilter, setEmployeeFilter] = useState("All Employees");
    const [priorityFilter, setPriorityFilter] = useState("All Priorities");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [taskModal, setTaskModal] = useState(null);
    const [activeTimerTaskId, setActiveTimerTaskId] = useState(null);
    const [timerTick, setTimerTick] = useState(Date.now());
    const hasManagerAccess = canManageContent(currentUser);

    useEffect(() => {
        if (Array.isArray(loadedTaskRows)) {
            setTaskRows(loadedTaskRows.map(normalizeTaskForTimers));
        }
    }, [loadedTaskRows]);

    useEffect(() => {
        const currentUserKey = getTimerUserKey(currentUser);
        const runningTask = taskRows.find((task) => task.timersByUser?.[currentUserKey]?.startedAt);
        setActiveTimerTaskId(runningTask?.id || null);
    }, [taskRows, currentUser]);

    useEffect(() => {
        if (!activeTimerTaskId) return undefined;
        const intervalId = window.setInterval(() => setTimerTick(Date.now()), 1000);
        return () => window.clearInterval(intervalId);
    }, [activeTimerTaskId]);

    const accessibleTaskRows = useMemo(
        () => filterRowsByAccess(taskRows, currentUser, "tasks"),
        [taskRows, currentUser]
    );

    const projectOptions = useMemo(
        () => getUniqueOptions(accessibleTaskRows, "project", "All Projects"),
        [accessibleTaskRows]
    );

    const employeeOptions = useMemo(
        () => hasManagerAccess
            ? getUniqueOptions(accessibleTaskRows, "assignedTo", "All Employees")
            : ["All Employees", currentUser?.employeeName || currentUser?.name].filter(Boolean),
        [accessibleTaskRows, hasManagerAccess, currentUser]
    );

    const priorityOptions = useMemo(
        () => getUniqueOptions(accessibleTaskRows, "priority", "All Priorities"),
        [accessibleTaskRows]
    );

    const statusOptions = useMemo(
        () => getUniqueOptions(accessibleTaskRows, "status", "All Status"),
        [accessibleTaskRows]
    );

    const filteredTaskRows = useMemo(() => {
        const searchValue = [globalSearch, taskSearch].filter(Boolean).join(" ").trim().toLowerCase();

        return accessibleTaskRows.filter((task) => {
            const searchableText = [
                task.id,
                task.taskName,
                task.project,
                task.assignedTo,
                task.dueDate,
                task.priority,
                task.status,
                task.lastStoppedAt,
                task.estimatedHours,
                formatDuration(getLiveTrackedSeconds(task, timerTick, hasManagerAccess ? null : currentUser)),
            ].join(" ").toLowerCase();
            const matchesSearch = !searchValue || searchableText.includes(searchValue);
            const matchesProject = projectFilter === "All Projects" || task.project === projectFilter;
            const matchesEmployee = employeeFilter === "All Employees" || task.assignedTo === employeeFilter;
            const matchesPriority = priorityFilter === "All Priorities" || task.priority === priorityFilter;
            const matchesStatus = statusFilter === "All Status" || task.status === statusFilter;
            return matchesSearch && matchesProject && matchesEmployee && matchesPriority && matchesStatus;
        });
    }, [accessibleTaskRows, globalSearch, taskSearch, projectFilter, employeeFilter, priorityFilter, statusFilter, timerTick, hasManagerAccess, currentUser]);

    const sortedTaskRows = useMemo(
        () => sortRows(filteredTaskRows, taskSort),
        [filteredTaskRows, taskSort]
    );

    const taskTotalPages = getTotalPages(sortedTaskRows.length, TASKS_PAGE_SIZE);
    const visibleTaskRows = paginateRows(sortedTaskRows, taskPage, TASKS_PAGE_SIZE);
    const activeTask = taskRows.find((task) => task.id === activeTimerTaskId);
    const totalTrackedSeconds = accessibleTaskRows.reduce((total, task) => total + getLiveTrackedSeconds(task, timerTick, hasManagerAccess ? null : currentUser), 0);
    const completedTasks = accessibleTaskRows.filter((task) => task.status === "Completed").length;
    const reviewTasks = accessibleTaskRows.filter((task) => task.status === "Review").length;
    const openTasks = accessibleTaskRows.filter((task) => task.status !== "Completed").length;
    const highPriorityTasks = accessibleTaskRows.filter((task) => task.priority === "High" && task.status !== "Completed").length;

    useEffect(() => {
        if (taskPage > taskTotalPages) setTaskPage(taskTotalPages);
    }, [taskPage, taskTotalPages]);

    const handleTaskSort = (columnKey) => {
        setTaskSort((currentSort) => getNextSort(currentSort, columnKey));
        setTaskPage(1);
    };

    const projectRowsForTasks = () => {
        const taskProjects = taskRows.map((task) => task.project).filter(Boolean);
        const masterProjects = projects.map((project) => project.name).filter(Boolean);
        return [...new Set([...masterProjects, ...taskProjects])].sort();
    };

    const openNewTaskModal = () => {
        if (!hasManagerAccess) return;
        const projectNames = projectRowsForTasks();
        setTaskModal({
            mode: "create",
            data: {
                id: generateNextId("TSK", taskRows),
                taskName: "",
                project: projectNames[0] || "Unassigned Project",
                assignedTo: "",
                dueDate: "May 30, 2026",
                priority: "Medium",
                estimatedHours: 1,
                trackedSeconds: 0,
                status: "Not Started",
                timerStartedAt: null,
                lastStoppedAt: "",
                timersByUser: {},
            },
        });
    };

    const saveTask = async (task) => {
        if (!hasManagerAccess) return;
        const cleanTask = normalizeTaskForTimers({
            ...task,
            id: task.id || generateNextId("TSK", taskRows),
            taskName: task.taskName.trim() || "Untitled Task",
            assignedTo: task.assignedTo.trim() || "Unassigned",
            trackedSeconds: normalizeNumber(task.trackedSeconds),
        });

        if (getUseApiDataSetting()) {
            try {
                if (taskModal.mode === "create") {
                    await apiPlaceholders.createTask(cleanTask);
                } else {
                    await apiPlaceholders.updateTask(cleanTask.id, cleanTask);
                }
            } catch (apiError) {
                console.warn("Task API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setTaskRows((currentRows) => taskModal.mode === "create"
            ? [cleanTask, ...currentRows]
            : currentRows.map((row) => row.id === cleanTask.id ? cleanTask : row)
        );
        setTaskPage(1);
        setTaskModal(null);
    };

    const deleteTask = async (task) => {
        if (!hasManagerAccess || !window.confirm(`Delete ${task.taskName}?`)) return;
        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteTask(task.id);
            } catch (apiError) {
                console.warn("Task delete API endpoint is not connected yet. Deleting locally.", apiError);
            }
        }
        setTaskRows((currentRows) => currentRows.filter((row) => row.id !== task.id));
    };

    const startTimer = async (task) => {
        if (!hasManagerAccess && !isAssignedToUser(task, currentUser)) {
            window.alert("You can only start timers on tasks assigned to your login.");
            return;
        }

        if (activeTimerTaskId && activeTimerTaskId !== task.id) {
            window.alert("Please stop your active timer before starting another task.");
            return;
        }

        const startedAt = Date.now();
        const userKey = getTimerUserKey(currentUser);
        const session = getTaskTimerSession(task, currentUser);
        const existingTimers = task.timersByUser || {};
        const hasExistingUserTimer = Boolean(existingTimers[userKey]);
        const timerStartingSeconds = hasExistingUserTimer || Object.keys(existingTimers).length === 0
            ? session.trackedSeconds
            : 0;

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.startTaskTimer(task.id, new Date(startedAt).toISOString(), currentUser);
            } catch (apiError) {
                console.warn("Start timer API endpoint is not connected yet. Starting locally.", apiError);
            }
        }

        setTaskRows((currentRows) => currentRows.map((row) => row.id === task.id
            ? {
                ...row,
                status: row.status === "Completed" ? "In Progress" : row.status,
                timersByUser: {
                    ...(row.timersByUser || {}),
                    [userKey]: {
                        trackedSeconds: timerStartingSeconds,
                        startedAt,
                        lastStoppedAt: session.lastStoppedAt,
                        userName: currentUser?.employeeName || currentUser?.name,
                    },
                },
            }
            : row
        ));
        setActiveTimerTaskId(task.id);
        setTimerTick(startedAt);
    };

    const stopTimer = async (task) => {
        const session = getTaskTimerSession(task, currentUser);
        if (!session.startedAt) return;

        const stoppedAt = Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((stoppedAt - session.startedAt) / 1000));
        const nextTrackedSeconds = session.trackedSeconds + elapsedSeconds;
        const lastStoppedAt = new Date(stoppedAt).toLocaleString([], {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
        const userKey = getTimerUserKey(currentUser);

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.stopTaskTimer(task.id, {
                    userId: currentUser?.id,
                    employeeId: currentUser?.employeeId,
                    employeeName: currentUser?.employeeName || currentUser?.name,
                    stoppedAt: new Date(stoppedAt).toISOString(),
                    elapsedSeconds,
                    userTrackedSeconds: nextTrackedSeconds,
                });
            } catch (apiError) {
                console.warn("Stop timer API endpoint is not connected yet. Stopping locally.", apiError);
            }
        }

        setTaskRows((currentRows) => currentRows.map((row) => row.id === task.id
            ? {
                ...row,
                lastStoppedAt,
                timersByUser: {
                    ...(row.timersByUser || {}),
                    [userKey]: {
                        trackedSeconds: nextTrackedSeconds,
                        startedAt: null,
                        lastStoppedAt,
                        userName: currentUser?.employeeName || currentUser?.name,
                    },
                },
            }
            : row
        ));
        setActiveTimerTaskId(null);
        setTimerTick(stoppedAt);
    };

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">
            {!hasManagerAccess && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm font-semibold text-violet-800">
                    Employee view: timers and task lists are tied to {currentUser?.employeeName || currentUser?.name}. Other employees can log in separately and run their own timers without overwriting yours.
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                    ["Open Tasks", openTasks],
                    ["Completed Tasks", completedTasks],
                    ["In Review", reviewTasks],
                    ["High Priority", highPriorityTasks],
                    [hasManagerAccess ? "Total Tracked Time" : "My Tracked Time", formatDuration(totalTrackedSeconds)],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-slate-300 bg-white px-4 py-5 text-center shadow-sm sm:px-5 sm:py-6">
                        <div className="text-sm font-bold">{label}</div>
                        <div className={`mt-4 text-3xl ${String(label).includes("Tracked") ? "text-violet-700" : "text-black"}`}>{value}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[380px_1fr]">
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="flex items-center gap-3 text-xl font-bold"><Clock size={24} /> Active Timer</h2>
                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                        {activeTask ? (
                            <>
                                <div className="text-sm font-semibold text-slate-500">{activeTask.taskName}</div>
                                <div className="mt-3 text-4xl font-bold text-violet-700">{formatDuration(getLiveTrackedSeconds(activeTask, timerTick, currentUser))}</div>
                                <p className="mt-3 text-sm text-slate-600">Your timer is running for this login only.</p>
                            </>
                        ) : (
                            <>
                                <div className="text-sm font-semibold text-slate-500">No Active Timer</div>
                                <div className="mt-3 text-4xl font-bold text-slate-900">00:00:00</div>
                                <p className="mt-3 text-sm text-slate-600">Select Start on any assigned task to begin tracking time.</p>
                            </>
                        )}
                    </div>
                    <div className="mt-5 space-y-3 text-sm text-slate-700">
                        <div className="flex justify-between border-b border-slate-200 pb-2"><span className="font-semibold">Active Task ID</span><span>{activeTask?.id || "None"}</span></div>
                        <div className="flex justify-between border-b border-slate-200 pb-2"><span className="font-semibold">Logged In As</span><span>{currentUser?.employeeName || currentUser?.name}</span></div>
                        <div className="flex justify-between"><span className="font-semibold">Last Stop</span><span>{activeTask ? getTaskTimerSession(activeTask, currentUser).lastStoppedAt || "Not recorded" : "Not recorded"}</span></div>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl"><ListChecks size={26} /> Task Management</h2>
                        {hasManagerAccess && (
                            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                                <button type="button" onClick={() => downloadTasksReport(accessibleTaskRows)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"><Download size={16} /> Export Time Report</button>
                                <button type="button" onClick={openNewTaskModal} className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 sm:w-auto"><Plus size={16} /> New Task</button>
                            </div>
                        )}
                    </div>

                    <div className={`grid grid-cols-1 gap-3 border-b border-slate-200 px-5 py-4 ${hasManagerAccess ? "md:grid-cols-[1fr_auto_auto_auto_auto]" : "md:grid-cols-[1fr_auto_auto_auto]"} md:items-center`}>
                        <div className="flex w-full items-center gap-3 rounded-xl border border-slate-300 px-4 py-2 shadow-sm">
                            <Search size={18} className="shrink-0 text-slate-500" />
                            <input value={taskSearch} onChange={(event) => { setTaskSearch(event.target.value); setTaskPage(1); }} className="w-full text-sm outline-none" placeholder="Search by task, project, employee, due date, priority, or status" />
                        </div>
                        <FilterSelect value={projectFilter} onChange={(value) => { setProjectFilter(value); setTaskPage(1); }} options={projectOptions} />
                        {hasManagerAccess && <FilterSelect value={employeeFilter} onChange={(value) => { setEmployeeFilter(value); setTaskPage(1); }} options={employeeOptions} />}
                        <FilterSelect value={priorityFilter} onChange={(value) => { setPriorityFilter(value); setTaskPage(1); }} options={priorityOptions} />
                        <FilterSelect value={statusFilter} onChange={(value) => { setStatusFilter(value); setTaskPage(1); }} options={statusOptions} />
                    </div>

                    <table className="min-w-[900px] w-full border-collapse text-sm">
                        <thead className="bg-slate-200 text-slate-800">
                        <tr>
                            {TASK_COLUMNS.map((column) => <SortableHeader key={column.key} column={column} sortConfig={taskSort} onSort={handleTaskSort} />)}
                            <th className="border border-slate-300 px-4 py-3 text-center font-bold">Timer</th>
                            {hasManagerAccess && <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>}
                        </tr>
                        </thead>
                        <tbody>
                        {visibleTaskRows.map((task) => {
                            const liveTask = taskRows.find((row) => row.id === task.id) || task;
                            const isAnotherTimerRunning = Boolean(activeTimerTaskId && activeTimerTaskId !== liveTask.id);
                            const canUseTimer = hasManagerAccess || isAssignedToUser(liveTask, currentUser);
                            return (
                                <tr key={liveTask.id} className="hover:bg-slate-50">
                                    <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">{liveTask.id}</td>
                                    <td className="border border-slate-300 px-4 py-3"><div className="font-semibold text-slate-900">{liveTask.taskName}</div><div className="text-xs text-slate-500">Est. {liveTask.estimatedHours}h</div></td>
                                    <td className="border border-slate-300 px-4 py-3">{liveTask.project}</td>
                                    <td className="border border-slate-300 px-4 py-3">{liveTask.assignedTo}</td>
                                    <td className="border border-slate-300 px-4 py-3">{liveTask.dueDate}</td>
                                    <td className="border border-slate-300 px-4 py-3 text-center"><PriorityBadge value={liveTask.priority} /></td>
                                    <td className="border border-slate-300 px-4 py-3 text-center font-semibold text-slate-800">{formatDuration(getLiveTrackedSeconds(liveTask, timerTick, hasManagerAccess ? null : currentUser))}</td>
                                    <td className="border border-slate-300 px-4 py-3 text-center"><Badge value={liveTask.status} /></td>
                                    <td className="border border-slate-300 px-4 py-3"><TimerControlSecure task={liveTask} currentTime={timerTick} currentUser={currentUser} onStart={startTimer} onStop={stopTimer} isAnotherTimerRunning={isAnotherTimerRunning} canUseTimer={canUseTimer} /></td>
                                    {hasManagerAccess && <td className="border border-slate-300 px-4 py-3"><RowActions onEdit={() => setTaskModal({ mode: "edit", data: liveTask })} onDelete={() => deleteTask(liveTask)} /></td>}
                                </tr>
                            );
                        })}
                        {visibleTaskRows.length === 0 && (
                            <tr><td colSpan={hasManagerAccess ? 10 : 9} className="border border-slate-300 px-4 py-8 text-center text-slate-500">No tasks found for the selected filters or this login.</td></tr>
                        )}
                        </tbody>
                    </table>
                    <TableFooter text={getRangeText(taskPage, TASKS_PAGE_SIZE, sortedTaskRows.length, "tasks")} currentPage={taskPage} totalPages={taskTotalPages} onPageChange={setTaskPage} />
                </div>
            </div>

            {taskModal && (
                <Modal title={taskModal.mode === "create" ? "New Task" : "Edit Task"} onClose={() => setTaskModal(null)}>
                    <TaskForm initialTask={taskModal.data} projectOptions={projectRowsForTasks()} employeeOptions={employeeOptions.filter((option) => option !== "All Employees")} onCancel={() => setTaskModal(null)} onSave={saveTask} />
                </Modal>
            )}
        </section>
    );
}

/**
 * Reusable toggle row for boolean settings.
 */
function SettingToggle({ label, description, checked, onChange }) {
    return (
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
            <span>
                <span className="block text-sm font-bold text-slate-800">{label}</span>
                {description && <span className="mt-1 block text-xs text-slate-500">{description}</span>}
            </span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
        </label>
    );
}

/**
 * Reusable settings card with icon, title, description, and grouped controls.
 */
function SettingsPanel({ title, description, icon: Icon, children }) {
    return (
        <div className="rounded-xl border border-slate-300 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <Icon size={22} />
                </div>
                <div>
                    <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
            </div>
            <div className="space-y-4 p-5">
                {children}
            </div>
        </div>
    );
}

/**
 * Reusable select control for settings options.
 */
function SettingsSelect({ value, onChange, options }) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        >
            {options.map((option) => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    );
}

/**
 * Exports the current settings object as a JSON backup/report.
 */
function downloadSettingsReport(settings) {
    downloadTextFile(
        "photometrics-settings-export.json",
        JSON.stringify(settings, null, 2),
        "application/json;charset=utf-8;"
    );
}

/**
 * Manager settings page for company, workflow, notification, security, backup, and appearance options.
 */
function SettingsPage() {
    const { data: loadedSettings } = useApiPlaceholder(API_ENDPOINTS.settings, settingsData);
    const [settings, setSettings] = useState(() => ({
        ...settingsData,
        dataSource: {
            ...settingsData.dataSource,
            useDatabaseData: getUseApiDataSetting(),
        },
    }));
    const [savedMessage, setSavedMessage] = useState("");

    useEffect(() => {
        if (loadedSettings && typeof loadedSettings === "object" && !Array.isArray(loadedSettings)) {
            setSettings((current) => ({
                ...current,
                ...loadedSettings,
                company: { ...current.company, ...(loadedSettings.company || {}) },
                workflow: { ...current.workflow, ...(loadedSettings.workflow || {}) },
                notifications: { ...current.notifications, ...(loadedSettings.notifications || {}) },
                security: { ...current.security, ...(loadedSettings.security || {}) },
                exportBackup: { ...current.exportBackup, ...(loadedSettings.exportBackup || {}) },
                appearance: { ...current.appearance, ...(loadedSettings.appearance || {}) },
                dataSource: { ...current.dataSource, ...(loadedSettings.dataSource || {}) },
            }));
        }
    }, [loadedSettings]);

    const updateSection = (section, field, value) => {
        setSavedMessage("");

        if (section === "dataSource" && field === "useDatabaseData") {
            saveUseApiDataSetting(value);
        }

        setSettings((current) => ({
            ...current,
            [section]: {
                ...current[section],
                [field]: value,
            },
        }));
    };

    const saveSettings = async () => {
        saveUseApiDataSetting(settings.dataSource.useDatabaseData);

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.updateSettings(settings);
            } catch (apiError) {
                console.warn("Settings API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setSavedMessage(settings.dataSource.useDatabaseData ? "Settings saved. The app will use database/API data only. Mock data will not be used if an API call fails." : "Settings saved. Mock data is enabled for front-end review.");
    };

    const resetSettings = () => {
        saveUseApiDataSetting(DEFAULT_USE_API_DATA);
        setSettings({
            ...settingsData,
            dataSource: {
                ...settingsData.dataSource,
                useDatabaseData: DEFAULT_USE_API_DATA,
            },
        });
        setSavedMessage("Settings reset to default values.");
    };

    const activeNotificationCount = Object.entries(settings.notifications)
        .filter(([, value]) => value === true)
        .length;

    const enabledSecurityCount = [
        settings.security.twoFactorRequired,
        settings.security.roleManagementEnabled,
        settings.security.auditLogging,
    ].filter(Boolean).length;

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">
            <div className="rounded-xl border border-slate-300 bg-white px-5 py-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
                            <Settings size={30} /> Settings
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
                            Manage company profile information, workflow rules, notifications, security, backups, and display preferences for the productivity dashboard.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => downloadSettingsReport(settings)}
                            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            <Download size={16} /> Export Settings
                        </button>
                        <button
                            type="button"
                            onClick={saveSettings}
                            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                        >
                            Save Settings
                        </button>
                    </div>
                </div>

                {savedMessage && (
                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                        {savedMessage}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-300 bg-white p-5 text-center shadow-sm">
                    <div className="text-sm font-bold text-slate-600">Company</div>
                    <div className="mt-3 text-2xl font-bold text-slate-900">{settings.company.companyName}</div>
                </div>
                <div className="rounded-xl border border-slate-300 bg-white p-5 text-center shadow-sm">
                    <div className="text-sm font-bold text-slate-600">Active Alerts</div>
                    <div className="mt-3 text-4xl font-semibold text-violet-700">{activeNotificationCount}</div>
                </div>
                <div className="rounded-xl border border-slate-300 bg-white p-5 text-center shadow-sm">
                    <div className="text-sm font-bold text-slate-600">Security Controls</div>
                    <div className="mt-3 text-4xl font-semibold text-violet-700">{enabledSecurityCount}/3</div>
                </div>
                <div className="rounded-xl border border-slate-300 bg-white p-5 text-center shadow-sm">
                    <div className="text-sm font-bold text-slate-600">Last Backup</div>
                    <div className="mt-3 text-lg font-bold text-slate-900">{settings.exportBackup.lastBackup}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <SettingsPanel
                    title="Data Source"
                    description="Choose whether the app should use front-end mock data or try the backend database APIs."
                    icon={Settings}
                >
                    <SettingToggle
                        label="Use Database Data"
                        description="Turn this on to use only backend API/database data. If an endpoint fails, mock data will not be used unless this setting is turned off."
                        checked={settings.dataSource.useDatabaseData}
                        onChange={(value) => updateSection("dataSource", "useDatabaseData", value)}
                    />
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Current mode: <span className="font-bold text-slate-800">{settings.dataSource.useDatabaseData ? "Database/API only" : "Mock data"}</span>
                    </div>
                </SettingsPanel>

                <SettingsPanel
                    title="Company Profile"
                    description="Controls the company details shown in reports and exported files."
                    icon={Users}
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Company Name">
                            <TextInput value={settings.company.companyName} onChange={(value) => updateSection("company", "companyName", value)} />
                        </FormField>
                        <FormField label="Support Email">
                            <TextInput value={settings.company.supportEmail} onChange={(value) => updateSection("company", "supportEmail", value)} type="email" />
                        </FormField>
                        <FormField label="Phone">
                            <TextInput value={settings.company.phone} onChange={(value) => updateSection("company", "phone", value)} />
                        </FormField>
                        <FormField label="Timezone">
                            <SettingsSelect
                                value={settings.company.timezone}
                                onChange={(value) => updateSection("company", "timezone", value)}
                                options={["Pacific Time", "Mountain Time", "Central Time", "Eastern Time"]}
                            />
                        </FormField>
                        <div className="sm:col-span-2">
                            <FormField label="Address / Location">
                                <TextInput value={settings.company.address} onChange={(value) => updateSection("company", "address", value)} />
                            </FormField>
                        </div>
                    </div>
                </SettingsPanel>

                <SettingsPanel
                    title="Workflow Defaults"
                    description="Default rules used when projects, assignments, and tasks are created."
                    icon={ListChecks}
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Default Due Days">
                            <TextInput value={settings.workflow.defaultDueDays} onChange={(value) => updateSection("workflow", "defaultDueDays", normalizeNumber(value))} type="number" />
                        </FormField>
                        <FormField label="Daily Image Goal">
                            <TextInput value={settings.workflow.dailyImageGoal} onChange={(value) => updateSection("workflow", "dailyImageGoal", normalizeNumber(value))} type="number" />
                        </FormField>
                        <FormField label="Weekly Hour Target">
                            <TextInput value={settings.workflow.weeklyHourTarget} onChange={(value) => updateSection("workflow", "weeklyHourTarget", normalizeNumber(value))} type="number" />
                        </FormField>
                        <div className="space-y-3 sm:col-span-2">
                            <SettingToggle
                                label="Auto Assign Tasks"
                                description="Automatically suggest available employees when new tasks are created."
                                checked={settings.workflow.autoAssignTasks}
                                onChange={(value) => updateSection("workflow", "autoAssignTasks", value)}
                            />
                            <SettingToggle
                                label="Require Review Before Complete"
                                description="Tasks must move through Review before being marked Completed."
                                checked={settings.workflow.requireReviewBeforeComplete}
                                onChange={(value) => updateSection("workflow", "requireReviewBeforeComplete", value)}
                            />
                        </div>
                    </div>
                </SettingsPanel>

                <SettingsPanel
                    title="Notifications"
                    description="Control manager alerts and digest timing."
                    icon={Bell}
                >
                    <div className="space-y-3">
                        <SettingToggle
                            label="Due Date Alerts"
                            description="Notify managers when projects or assignments are close to the due date."
                            checked={settings.notifications.dueDateAlerts}
                            onChange={(value) => updateSection("notifications", "dueDateAlerts", value)}
                        />
                        <SettingToggle
                            label="Review Queue Alerts"
                            description="Notify managers when work is ready for quality review."
                            checked={settings.notifications.reviewQueueAlerts}
                            onChange={(value) => updateSection("notifications", "reviewQueueAlerts", value)}
                        />
                        <SettingToggle
                            label="Productivity Alerts"
                            description="Notify managers when productivity drops below target levels."
                            checked={settings.notifications.productivityAlerts}
                            onChange={(value) => updateSection("notifications", "productivityAlerts", value)}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Email Digest">
                            <SettingsSelect
                                value={settings.notifications.emailDigest}
                                onChange={(value) => updateSection("notifications", "emailDigest", value)}
                                options={["Off", "Daily", "Weekly"]}
                            />
                        </FormField>
                        <FormField label="Manager Summary Time">
                            <TextInput value={settings.notifications.managerSummaryTime} onChange={(value) => updateSection("notifications", "managerSummaryTime", value)} />
                        </FormField>
                    </div>
                </SettingsPanel>

                <SettingsPanel
                    title="Security & Access"
                    description="Manage session rules, access controls, and audit history."
                    icon={Settings}
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Session Timeout Minutes">
                            <TextInput value={settings.security.sessionTimeout} onChange={(value) => updateSection("security", "sessionTimeout", normalizeNumber(value))} type="number" />
                        </FormField>
                        <FormField label="Data Retention Days">
                            <TextInput value={settings.security.dataRetentionDays} onChange={(value) => updateSection("security", "dataRetentionDays", normalizeNumber(value))} type="number" />
                        </FormField>
                    </div>
                    <div className="space-y-3">
                        <SettingToggle
                            label="Require Two Factor Authentication"
                            description="Require an additional verification step when users sign in."
                            checked={settings.security.twoFactorRequired}
                            onChange={(value) => updateSection("security", "twoFactorRequired", value)}
                        />
                        <SettingToggle
                            label="Enable Role Management"
                            description="Allow managers to control employee access by role."
                            checked={settings.security.roleManagementEnabled}
                            onChange={(value) => updateSection("security", "roleManagementEnabled", value)}
                        />
                        <SettingToggle
                            label="Audit Logging"
                            description="Keep a history of major edits, deletes, exports, and setting changes."
                            checked={settings.security.auditLogging}
                            onChange={(value) => updateSection("security", "auditLogging", value)}
                        />
                    </div>
                </SettingsPanel>

                <SettingsPanel
                    title="Export & Backup"
                    description="Control report formats, backup timing, and export permissions."
                    icon={Download}
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Default Export Format">
                            <SettingsSelect
                                value={settings.exportBackup.defaultExportFormat}
                                onChange={(value) => updateSection("exportBackup", "defaultExportFormat", value)}
                                options={["CSV", "Excel", "PDF"]}
                            />
                        </FormField>
                        <FormField label="Backup Frequency">
                            <SettingsSelect
                                value={settings.exportBackup.backupFrequency}
                                onChange={(value) => updateSection("exportBackup", "backupFrequency", value)}
                                options={["Manual", "Daily", "Weekly"]}
                            />
                        </FormField>
                        <div className="sm:col-span-2">
                            <FormField label="Last Backup">
                                <TextInput value={settings.exportBackup.lastBackup} onChange={(value) => updateSection("exportBackup", "lastBackup", value)} />
                            </FormField>
                        </div>
                    </div>
                    <SettingToggle
                        label="Allow CSV Exports"
                        description="Managers can export project, employee, task, and settings data."
                        checked={settings.exportBackup.allowCsvExports}
                        onChange={(value) => updateSection("exportBackup", "allowCsvExports", value)}
                    />
                </SettingsPanel>

                <SettingsPanel
                    title="Appearance"
                    description="Display preferences for the dashboard interface."
                    icon={Sparkles}
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Theme">
                            <SettingsSelect
                                value={settings.appearance.theme}
                                onChange={(value) => updateSection("appearance", "theme", value)}
                                options={["Light", "Dark", "System"]}
                            />
                        </FormField>
                        <FormField label="Accent Color">
                            <SettingsSelect
                                value={settings.appearance.accentColor}
                                onChange={(value) => updateSection("appearance", "accentColor", value)}
                                options={["Violet", "Blue", "Green", "Slate"]}
                            />
                        </FormField>
                    </div>
                    <div className="space-y-3">
                        <SettingToggle
                            label="Compact Tables"
                            description="Reduce row height on data-heavy screens."
                            checked={settings.appearance.compactTables}
                            onChange={(value) => updateSection("appearance", "compactTables", value)}
                        />
                        <SettingToggle
                            label="Show Dashboard Tips"
                            description="Display helpful tips and reminders on dashboard cards."
                            checked={settings.appearance.showDashboardTips}
                            onChange={(value) => updateSection("appearance", "showDashboardTips", value)}
                        />
                    </div>
                </SettingsPanel>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-300 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold">Reset settings</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        This returns the Settings page to the default values, including the default data source mode.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={resetSettings}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Reset Defaults
                </button>
            </div>
        </section>
    );
}


/**
 * Employee self-service settings page for profile and preference updates.
 */
function EmployeeSettingsPage({ currentUser, onUserUpdate }) {
    const [profile, setProfile] = useState({
        name: currentUser?.name || "",
        email: currentUser?.email || "",
        phone: currentUser?.phone || "",
        role: currentUser?.role || "Employee",
        preferredName: currentUser?.name || "",
    });
    const [appearance, setAppearance] = useState({
        theme: currentUser?.preferences?.theme || "Light",
        accentColor: currentUser?.preferences?.accentColor || "Violet",
        compactTables: currentUser?.preferences?.compactTables || false,
        showDashboardTips: currentUser?.preferences?.showDashboardTips ?? true,
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [savedMessage, setSavedMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const updateProfile = (field, value) => {
        setSavedMessage("");
        setErrorMessage("");
        setProfile((current) => ({ ...current, [field]: value }));
    };

    const updateAppearance = (field, value) => {
        setSavedMessage("");
        setErrorMessage("");
        setAppearance((current) => ({ ...current, [field]: value }));
    };

    const updatePasswordField = (field, value) => {
        setSavedMessage("");
        setErrorMessage("");
        setPasswordForm((current) => ({ ...current, [field]: value }));
    };

    const saveProfile = async () => {
        const cleanProfile = {
            ...profile,
            name: profile.name.trim() || currentUser?.name || "Employee",
            preferredName: profile.preferredName.trim() || profile.name.trim() || currentUser?.name || "Employee",
            email: profile.email.trim() || currentUser?.email || "",
        };

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.updateUserProfile(currentUser.id, cleanProfile);
            } catch (apiError) {
                console.warn("Employee profile API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        const nextUser = {
            ...currentUser,
            name: cleanProfile.preferredName || cleanProfile.name,
            email: cleanProfile.email,
            phone: cleanProfile.phone,
            role: cleanProfile.role,
            personalProfile: cleanProfile,
            // Keep employeeName stable because task/assignment security filters use it
            // to match assigned work until the backend switches to employeeId-based joins.
            employeeName: currentUser?.employeeName,
        };
        onUserUpdate?.(nextUser);
        setSavedMessage("Personal information saved locally. Backend endpoint is ready for implementation.");
    };

    const saveAppearance = async () => {
        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.updateUserPreferences(currentUser.id, appearance);
            } catch (apiError) {
                console.warn("Employee preferences API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        const nextUser = {
            ...currentUser,
            preferences: appearance,
        };
        onUserUpdate?.(nextUser);
        setSavedMessage("Appearance preferences saved locally.");
    };

    const changePassword = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setErrorMessage("Please complete all password fields.");
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setErrorMessage("New password must be at least 6 characters.");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setErrorMessage("New password and confirmation do not match.");
            return;
        }

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.changeUserPassword(currentUser.id, passwordForm);
            } catch (apiError) {
                console.warn("Change password API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setErrorMessage("");
        setSavedMessage("Password change saved locally. Backend password endpoint is ready for implementation.");
    };

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">
            <div className="rounded-xl border border-slate-300 bg-white px-5 py-5 shadow-sm">
                <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
                    <Settings size={30} /> My Settings
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
                    Employee settings are limited to your own profile, password, and appearance preferences. Company settings and employee management stay manager-only.
                </p>

                {savedMessage && (
                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                        {savedMessage}
                    </div>
                )}
                {errorMessage && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {errorMessage}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <SettingsPanel
                    title="Personal Information"
                    description="Update the information connected to your employee login."
                    icon={Users}
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Full Name">
                            <TextInput value={profile.name} onChange={(value) => updateProfile("name", value)} />
                        </FormField>
                        <FormField label="Preferred Name">
                            <TextInput value={profile.preferredName} onChange={(value) => updateProfile("preferredName", value)} />
                        </FormField>
                        <FormField label="Email">
                            <TextInput value={profile.email} onChange={(value) => updateProfile("email", value)} type="email" />
                        </FormField>
                        <FormField label="Phone">
                            <TextInput value={profile.phone} onChange={(value) => updateProfile("phone", value)} />
                        </FormField>
                        <FormField label="Role">
                            <TextInput value={profile.role} onChange={(value) => updateProfile("role", value)} />
                        </FormField>
                        <FormField label="Employee ID">
                            <TextInput value={currentUser?.employeeId || ""} onChange={() => {}} />
                        </FormField>
                    </div>
                    <button
                        type="button"
                        onClick={saveProfile}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                    >
                        Save Personal Information
                    </button>
                </SettingsPanel>

                <SettingsPanel
                    title="Change Password"
                    description="Update the password for your own employee login."
                    icon={Lock}
                >
                    <div className="grid grid-cols-1 gap-4">
                        <FormField label="Current Password">
                            <TextInput value={passwordForm.currentPassword} onChange={(value) => updatePasswordField("currentPassword", value)} type="password" />
                        </FormField>
                        <FormField label="New Password">
                            <TextInput value={passwordForm.newPassword} onChange={(value) => updatePasswordField("newPassword", value)} type="password" />
                        </FormField>
                        <FormField label="Confirm New Password">
                            <TextInput value={passwordForm.confirmPassword} onChange={(value) => updatePasswordField("confirmPassword", value)} type="password" />
                        </FormField>
                    </div>
                    <button
                        type="button"
                        onClick={changePassword}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                    >
                        Change Password
                    </button>
                </SettingsPanel>

                <SettingsPanel
                    title="Appearance"
                    description="Choose how your employee dashboard and work pages display."
                    icon={Sparkles}
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Theme">
                            <SettingsSelect
                                value={appearance.theme}
                                onChange={(value) => updateAppearance("theme", value)}
                                options={["Light", "Dark", "System"]}
                            />
                        </FormField>
                        <FormField label="Accent Color">
                            <SettingsSelect
                                value={appearance.accentColor}
                                onChange={(value) => updateAppearance("accentColor", value)}
                                options={["Violet", "Blue", "Green", "Slate"]}
                            />
                        </FormField>
                    </div>
                    <div className="space-y-3">
                        <SettingToggle
                            label="Compact Tables"
                            description="Reduce row height on task and assignment tables."
                            checked={appearance.compactTables}
                            onChange={(value) => updateAppearance("compactTables", value)}
                        />
                        <SettingToggle
                            label="Show Dashboard Tips"
                            description="Show reminders and helper text on your dashboard."
                            checked={appearance.showDashboardTips}
                            onChange={(value) => updateAppearance("showDashboardTips", value)}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={saveAppearance}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                    >
                        Save Appearance
                    </button>
                </SettingsPanel>

                <SettingsPanel
                    title="Access Summary"
                    description="Shows what this employee login can access."
                    icon={ShieldCheck}
                >
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <span className="font-semibold">Access Level</span>
                            <span>Employee</span>
                        </div>
                        <div className="flex justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <span className="font-semibold">Dashboard</span>
                            <span>Assigned work only</span>
                        </div>
                        <div className="flex justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <span className="font-semibold">Projects / Tasks</span>
                            <span>Limited to assigned items</span>
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 font-semibold text-amber-800">
                            Manager-only sections such as Employees, Reports, Analytics, and company Settings are hidden from this login.
                        </div>
                    </div>
                </SettingsPanel>
            </div>
        </section>
    );
}

// Informational pages for sections that are not yet implemented
/**
 * Temporary page shell for sections that are not fully built yet.
 */
function PlaceholderPage({ title }) {
    return (
        <section className="bg-slate-50 p-3 sm:p-4 lg:p-6">
            <div className="rounded-xl border border-slate-300 bg-white p-8 text-center shadow-sm">
                <h1 className="text-xl font-bold sm:text-2xl sm:text-3xl">{title}</h1>
                <p className="mt-3 text-slate-600">
                    This page is ready for future content.
                </p>
            </div>
        </section>
    );
}


export {
    LoginPage,
    Dashboard,
    ReportsPage,
    AnalyticsPage,
    ProjectsAndAssignments,
    ProjectsAndAssignmentsSecure,
    EmployeesPage,
    TaskManagementPage,
    TaskManagementPageSecure,
    SettingsPage,
    EmployeeSettingsPage,
    PlaceholderPage,
};
