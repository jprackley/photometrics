import React, { useEffect, useState } from "react";

// Icons used throughout the UI
import {
    BarChart3,
    Bell,
    ChevronLeft,
    ChevronRight,
    Download,
    Folder,
    LayoutDashboard,
    ListChecks,
    LogOut,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    Settings,
    Sparkles,
    Users,
} from "lucide-react";

// Recharts components for graphs/charts
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
} from "recharts";


// -----------------------------------------------------------------------------
// API PLACEHOLDERS
// -----------------------------------------------------------------------------
// The app is currently using the mock data below so the UI can keep working while
// the backend database is being built. When the backend is ready, set
// VITE_USE_API_DATA=true in your .env file and update VITE_API_BASE_URL if needed.
// Expected API response format can be either a plain array/object or { data: ... }.
const USE_API_DATA = import.meta.env.VITE_USE_API_DATA === "true";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const API_ENDPOINTS = {
    dashboard: {
        kpis: "/dashboard/kpis",
        productivity: "/dashboard/productivity",
        workflow: "/dashboard/workflow",
        employeeActivity: "/dashboard/employee-activity",
        projectProgress: "/dashboard/project-progress",
    },
    projects: "/projects",
    assignments: "/assignments",
    employees: "/employees",
    tasks: "/tasks",
    reports: "/reports",
    analytics: "/analytics",
    settings: "/settings",
};

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

function unwrapApiPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload?.data !== undefined) return payload.data;
    if (payload?.items !== undefined) return payload.items;
    return payload;
}

function useApiPlaceholder(endpoint, fallbackData) {
    const [data, setData] = useState(fallbackData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        if (!USE_API_DATA || !endpoint) {
            setData(fallbackData);
            return undefined;
        }

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
                    setData(fallbackData);
                }

                console.warn(`Using mock data for ${endpoint}.`, apiError);
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
    }, [endpoint, fallbackData]);

    return { data, isLoading, error };
}

// These functions are not wired to forms yet. They are API holders for the
// backend team to connect later when Create, Edit, Delete, and Export are built.
const apiPlaceholders = {
    createProject: (project) => apiRequest(API_ENDPOINTS.projects, {
        method: "POST",
        body: JSON.stringify(project),
    }),
    updateProject: (projectId, project) => apiRequest(`${API_ENDPOINTS.projects}/${projectId}`, {
        method: "PUT",
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
        method: "PUT",
        body: JSON.stringify(assignment),
    }),
    deleteAssignment: (assignmentId) => apiRequest(`${API_ENDPOINTS.assignments}/${assignmentId}`, {
        method: "DELETE",
    }),
};

// Sidebar menu items
const navItems = [
    { label: "Dashboard", page: "dashboard", icon: LayoutDashboard },
    { label: "Projects", page: "projects", icon: Folder },
    { label: "Employees", page: "employees", icon: Users },
    { label: "Tasks", page: "tasks", icon: ListChecks },
    { label: "Reports", page: "reports", icon: BarChart3 },
    { label: "Analytics", page: "analytics", icon: Sparkles },
    { label: "Settings", page: "settings", icon: Settings },
];

// KPI card data
const kpis = [
    ["Total Projects", "12"],
    ["Tasks Completed Today", "45"],
    ["Images Completed", "3,256"],
    ["Average Editing Time", "18m 42s"],
    ["Total Employee Hours", "128.5"],
    ["Efficiency", "87%"],
];

// Productivity chart data
const productivity = [
    { day: "May 12", value: 30, color: "#d9252a" },
    { day: "May 13", value: 45, color: "#7fb347" },
    { day: "May 14", value: 32, color: "#7e57c2" },
    { day: "May 15", value: 44, color: "#35a9d6" },
    { day: "May 16", value: 58, color: "#35a9d6" },
    { day: "May 17", value: 29, color: "#f58a2a" },
    { day: "May 18", value: 48, color: "#0b3d64" },
];

// Workflow pie chart data
const workflow = [
    { name: "Editing", value: 40, color: "#ef233c" },
    { name: "Culling", value: 25, color: "#f5c400" },
    { name: "Review", value: 15, color: "#2fb344" },
    { name: "Completed", value: 20, color: "#2563eb" },
];

// Employee activity table data
const employeeActivity = [
    ["John Doe", "Editing", "2h 15m", "In Progress"],
    ["Jane Doe", "Culling", "1h 05m", "Completed"],
    ["Terry Lee", "Review", "45m", "In Progress"],
    ["David Kim", "Editing", "3h 10m", "In Progress"],
    ["Luis Garcia", "Culling", "1h 30m", "Completed"],
];

// Project progress data
const projectProgress = [
    ["Wedding - Smith", "1200", "900", "300", 75],
    ["Event - Johnson", "800", "650", "150", 81],
    ["Portrait - Sampson", "600", "450", "150", 75],
    ["Graduation - Hathaway", "1000", "800", "200", 80],
    ["Graduation - McDougal", "1000", "100", "900", 10],
];

// Projects table data
const projects = [
    {
        id: "PRJ-1235",
        name: "Graduation - Smith",
        client: "John Smith",
        startDate: "May 01, 2026",
        dueDate: "May 27, 2026",
        images: "1200",
        progress: 50,
        status: "In Progress",
    },
    {
        id: "PRJ-1236",
        name: "Graduation - Miller",
        client: "Steve Miller",
        startDate: "May 01, 2026",
        dueDate: "May 28, 2026",
        images: "800",
        progress: 50,
        status: "In Progress",
    },
    {
        id: "PRJ-1237",
        name: "Graduation - Franklen",
        client: "Jo Franklen",
        startDate: "May 01, 2026",
        dueDate: "May 29, 2026",
        images: "450",
        progress: 50,
        status: "Review",
    },
    {
        id: "PRJ-1238",
        name: "Graduation - Mcdougal",
        client: "Joe Mcdougal",
        startDate: "May 01, 2026",
        dueDate: "May 29, 2026",
        images: "600",
        progress: 100,
        status: "Completed",
    },
    {
        id: "PRJ-1239",
        name: "Graduation - Dunkan",
        client: "Fred Dunkan",
        startDate: "May 01, 2026",
        dueDate: "May 30, 2026",
        images: "300",
        progress: 50,
        status: "In Progress",
    },
];

// Assignment table data
const assignments = [
    {
        id: "ASG-2579",
        project: "Wedding - Smith",
        taskType: "Photo Editing",
        assignedTo: "John Freeman",
        assignedDate: "May 01, 2026",
        dueDate: "May 18, 2026",
        priority: "High",
        status: "In Progress",
    },
    {
        id: "ASG-2580",
        project: "Wedding - Smith",
        taskType: "Culling",
        assignedTo: "Larry Waymer",
        assignedDate: "May 01, 2026",
        dueDate: "May 16, 2026",
        priority: "Medium",
        status: "Completed",
    },
    {
        id: "ASG-2581",
        project: "Graduation - Mcdougal",
        taskType: "Photo Editing",
        assignedTo: "John Doe",
        assignedDate: "May 01, 2026",
        dueDate: "May 20, 2026",
        priority: "High",
        status: "In Progress",
    },
    {
        id: "ASG-2582",
        project: "Graduation - Duncan",
        taskType: "Retouching",
        assignedTo: "Sarah Conner",
        assignedDate: "May 01, 2026",
        dueDate: "May 15, 2026",
        priority: "Medium",
        status: "Review",
    },
    {
        id: "ASG-2583",
        project: "Graduation - Miller",
        taskType: "Color Correction",
        assignedTo: "Susan Conner",
        assignedDate: "May 01, 2026",
        dueDate: "May 8, 2026",
        priority: "High",
        status: "Completed",
    },
];

const placeholderPages = {
    employees: "Employees",
    tasks: "Tasks",
    reports: "Reports",
    analytics: "Analytics",
    settings: "Settings",
};

// Company logo component
function Logo() {
    return (
        <div className="flex items-center justify-center w-full">
            <img
                src="https://chambermaster.blob.core.windows.net/images/customers/2243/members/7487/logos/MEMBER_PAGE_HEADER/CM_final_logo_(2).jpg"
                alt="Company Logo"
                className="h-[70px] w-auto object-contain"
            />
        </div>
    );
}

// Left sidebar navigation
function Sidebar({ isCollapsed, activePage, onPageChange, onToggle }) {
    return (
        <aside
            className={`flex min-h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
                isCollapsed ? "w-[84px]" : "w-[260px]"
            }`}
        >

            {/* Logo section */}
            <div
                className={`flex h-[86px] items-center border-b border-slate-200 px-4 ${
                    isCollapsed ? "justify-center" : "justify-between"
                }`}
            >
                {!isCollapsed && <Logo />}

                {/* Collapse menu button */}
                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white shadow-sm transition hover:bg-slate-100"
                >
                    {isCollapsed
                        ? <ChevronRight size={22} />
                        : <ChevronLeft size={22} />}
                </button>
            </div>

            {/* Navigation buttons */}
            <nav className="flex-1 space-y-3 p-4 pt-6">
                {navItems.map(({ label, page, icon: Icon }) => (
                    <button
                        key={label}
                        type="button"
                        title={isCollapsed ? label : undefined}
                        onClick={() => onPageChange(page)}

                        // Highlight active page button
                        className={`flex w-full items-center rounded-xl py-3 text-lg transition hover:bg-slate-100 ${
                            isCollapsed ? "justify-center px-0" : "gap-4 px-4 text-left"
                        } ${
                            activePage === page
                                ? "bg-slate-100 font-semibold text-violet-700"
                                : "font-medium text-slate-800"
                        }`}
                    >
                        <Icon size={24} strokeWidth={2} />
                        {!isCollapsed && <span>{label}</span>}
                    </button>
                ))}
            </nav>

            {/* Logout button */}
            <button
                title={isCollapsed ? "Logout" : undefined}
                className={`m-4 flex items-center rounded-xl py-3 text-lg font-semibold hover:bg-slate-100 ${
                    isCollapsed ? "justify-center px-0" : "gap-4 px-4"
                }`}
            >
                <LogOut size={24} />
                {!isCollapsed && <span>Logout</span>}
            </button>
        </aside>
    );
}

// Top header bar
function Topbar() {
    return (
        <header className="flex h-[86px] items-center justify-between border-b border-slate-200 bg-white px-8">

            {/* Search bar */}
            <div className="flex w-[380px] items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 shadow-sm">
                <Search size={20} className="text-slate-500" />
                <input className="w-full text-base outline-none" placeholder="Search" />
            </div>

            {/* User info area */}
            <div className="flex items-center gap-6 pr-2">
                <Bell size={24} />

                {/* User profile image */}
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 border-slate-300 bg-slate-100 shadow-sm">
                    <img
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQI6QNyB22A2rTJfdHWecRsPWOH4OlbAUGIhQ&s"
                        alt="Logged in manager"
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="text-lg font-bold">Manager⌄</div>
            </div>
        </header>
    );
}

// Status badge component
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

// Priority badge component
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

// Reusable progress bar component
function ProgressBar({ value }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-3 flex-1 rounded-full border border-slate-300 bg-white">
                <div
                    className="h-full rounded-full bg-violet-600"
                    style={{ width: `${value}%` }}
                />
            </div>

            <span className="w-10 text-xs font-semibold text-slate-700">
                {value}%
            </span>
        </div>
    );
}

// Action buttons used in the Projects tab tables
function RowActions() {
    return (
        <div className="flex items-center justify-center gap-3 text-slate-700">
            <button
                type="button"
                className="rounded-md p-1 hover:bg-slate-100"
                aria-label="Edit row"
            >
                <Pencil size={18} />
            </button>

            <button
                type="button"
                className="rounded-md p-1 hover:bg-slate-100"
                aria-label="More actions"
            >
                <MoreVertical size={18} />
            </button>
        </div>
    );
}

// Select control used in the Projects tab filter bar
function FilterSelect({ label }) {
    return (
        <select
            className="h-10 min-w-[150px] rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none"
            defaultValue={label}
        >
            <option>{label}</option>
        </select>
    );
}

// Pagination footer used by the Projects tab tables
function TableFooter({ text, pages }) {
    return (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
            <span>{text}</span>

            <div className="flex items-center gap-2">
                <button type="button" className="rounded-md p-1 hover:bg-slate-100">
                    <ChevronLeft size={16} />
                </button>

                {pages.map((page) => (
                    <button
                        key={page}
                        type="button"
                        className={`h-7 w-7 rounded-md text-xs font-semibold ${
                            page === 1 ? "bg-violet-600 text-white" : "text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                        {page}
                    </button>
                ))}

                <button type="button" className="rounded-md p-1 hover:bg-slate-100">
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

// Creates colored chart line segments
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
function Dashboard() {
    const { data: dashboardKpis } = useApiPlaceholder(API_ENDPOINTS.dashboard.kpis, kpis);
    const { data: productivityData } = useApiPlaceholder(API_ENDPOINTS.dashboard.productivity, productivity);
    const { data: workflowData } = useApiPlaceholder(API_ENDPOINTS.dashboard.workflow, workflow);
    const { data: employeeActivityData } = useApiPlaceholder(API_ENDPOINTS.dashboard.employeeActivity, employeeActivity);
    const { data: projectProgressData } = useApiPlaceholder(API_ENDPOINTS.dashboard.projectProgress, projectProgress);

    return (
        <section className="space-y-5 bg-slate-50 p-6">

            {/* KPI cards */}
            <div className="grid grid-cols-6 gap-4">
                {dashboardKpis.map(([label, value]) => (
                    <div
                        key={label}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-7 text-center shadow-sm"
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

            {/* Charts section */}
            <div className="grid grid-cols-[1.07fr_0.93fr] gap-5">

                {/* Productivity chart */}
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="mb-2 text-2xl font-bold">
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

                            {/* Colored chart segments */}
                            {productivityData.map((item, index) => (
                                <ColoredLineSegment
                                    key={item.day}
                                    data={productivityData}
                                    segment={item}
                                    index={index}
                                />
                            ))}

                            {/* Invisible line for chart dots */}
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="transparent"
                                strokeWidth={0}
                                label={{
                                    position: "top",
                                    fill: "#111827",
                                    fontSize: 14
                                }}

                                // Custom dots
                                dot={(props) => {
                                    const item = productivityData[props.index];

                                    return (
                                        <circle
                                            cx={props.cx}
                                            cy={props.cy}
                                            r={5}
                                            fill="white"
                                            stroke={item.color}
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
                    <h2 className="mb-2 text-2xl font-bold">
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

            {/* Bottom tables */}
            <div className="grid grid-cols-[0.95fr_1.05fr] gap-5">
                <EmployeeActivityPanel rows={employeeActivityData} />
                <ProjectProgressPanel rows={projectProgressData} />
            </div>
        </section>
    );
}

// Employee activity table
function EmployeeActivityPanel({ rows = employeeActivity }) {
    return (
        <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-2xl font-bold">
                Employee Activity
            </h2>

            <table className="w-full border-collapse text-sm">

                {/* Table header */}
                <thead>
                <tr>
                    {["Employee", "Current Task", "Time Spent", "Status"]
                        .map((h) => (
                            <th
                                key={h}
                                className="border border-slate-300 bg-white p-2 font-bold"
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
                        <td className="border border-slate-300 px-3 py-2">
                            {row[0]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            {row[1]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            {row[2]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            <Badge value={row[3]} />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <button className="mt-4 font-semibold text-blue-600">
                View all employees →
            </button>
        </div>
    );
}

// Project progress table
function ProjectProgressPanel({ rows = projectProgress }) {
    return (
        <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-2xl font-bold">
                Project Progress
            </h2>

            <table className="w-full border-collapse text-sm">

                {/* Table header */}
                <thead>
                <tr>
                    {["Project", "Total Images", "Completed", "Remaining", "Progress"]
                        .map((h) => (
                            <th
                                key={h}
                                className="border border-slate-300 bg-white p-2 font-bold"
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
                        <td className="border border-slate-300 px-3 py-2">
                            {row[0]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            {row[1]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            {row[2]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            {row[3]}
                        </td>

                        {/* Progress bar */}
                        <td className="border border-slate-300 px-3 py-2">
                            <ProgressBar value={row[4]} />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <button className="mt-4 font-semibold text-blue-600">
                View all projects →
            </button>
        </div>
    );
}

// Projects + assignments page
function ProjectsAndAssignments() {
    const { data: projectRows } = useApiPlaceholder(API_ENDPOINTS.projects, projects);
    const { data: assignmentRows } = useApiPlaceholder(API_ENDPOINTS.assignments, assignments);

    const handleApiPlaceholder = (actionName) => {
        console.info(`${actionName} API holder is ready to connect.`, apiPlaceholders);
    };

    return (
        <section className="space-y-5 bg-slate-50 p-6">

            {/* Projects table */}
            <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="flex items-center gap-3 text-2xl font-bold">
                        <Folder size={26} /> Projects
                    </h2>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => handleApiPlaceholder("Export report")}
                            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            <Download size={16} /> Export Report
                        </button>

                        <button
                            type="button"
                            onClick={() => handleApiPlaceholder("Create project")}
                            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                        >
                            <Plus size={16} /> New Project
                        </button>
                    </div>
                </div>

                <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-200 text-slate-800">
                    <tr>
                        {["Project Name", "Client", "Start Date", "Due Date", "Images", "Progress", "Status", "Actions"]
                            .map((h) => (
                                <th key={h} className="border border-slate-300 px-4 py-3 text-left font-bold">
                                    {h}
                                </th>
                            ))}
                    </tr>
                    </thead>

                    <tbody>
                    {projectRows.map((project) => (
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
                                <RowActions />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <TableFooter text={`Showing 1 to ${projectRows.length} of ${projectRows.length} projects`} pages={[1, 2, 3]} />
            </div>

            {/* Assignments table */}
            <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="flex items-center gap-3 text-2xl font-bold">
                        <ListChecks size={26} /> Assignments
                    </h2>

                    <div className="flex items-center gap-3">
                        <FilterSelect label="All Projects" />
                        <FilterSelect label="All Employees" />
                        <FilterSelect label="All Status" />

                        <button
                            type="button"
                            onClick={() => handleApiPlaceholder("Create assignment")}
                            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                        >
                            <Plus size={16} /> New Assignment
                        </button>
                    </div>
                </div>

                <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-200 text-slate-800">
                    <tr>
                        {["Assignment ID", "Project", "Task Type", "Assigned To", "Assigned Date", "Due Date", "Priority", "Status", "Actions"]
                            .map((h) => (
                                <th key={h} className="border border-slate-300 px-4 py-3 text-left font-bold">
                                    {h}
                                </th>
                            ))}
                    </tr>
                    </thead>

                    <tbody>
                    {assignmentRows.map((assignment) => (
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
                                <RowActions />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <TableFooter text={`Showing 1 to ${assignmentRows.length} of ${assignmentRows.length} assignments`} pages={[1, 2, 3, 4, 5]} />
            </div>
        </section>
    );
}

// Placeholder pages for tabs that are not yet built
function PlaceholderPage({ title }) {
    return (
        <section className="bg-slate-50 p-6">
            <div className="rounded-xl border border-slate-300 bg-white p-8 text-center shadow-sm">
                <h1 className="text-3xl font-bold">{title}</h1>
                <p className="mt-3 text-slate-600">
                    This page is ready for future content.
                </p>
            </div>
        </section>
    );
}

// Root app component
export default function App() {

    // Page state controls the sidebar tabs
    const [page, setPage] = useState("dashboard");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <div className="flex">

                {/* Sidebar */}
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    activePage={page}
                    onPageChange={setPage}
                    onToggle={() => setIsSidebarCollapsed((value) => !value)}
                />

                {/* Main content */}
                <main className="min-w-0 flex-1">

                    {/* Top header */}
                    <Topbar />

                    {/* Render selected page */}
                    {page === "dashboard" && <Dashboard />}
                    {page === "projects" && <ProjectsAndAssignments />}
                    {placeholderPages[page] && <PlaceholderPage title={placeholderPages[page]} />}
                </main>
            </div>
        </div>
    );
}
