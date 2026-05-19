// -----------------------------------------------------------------------------
// Split from features/Pages.jsx to keep each page easier to maintain.
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

export {
    Dashboard,
};
