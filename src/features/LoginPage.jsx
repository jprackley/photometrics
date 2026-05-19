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

export {
    LoginPage,
};
