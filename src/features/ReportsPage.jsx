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

export {
    ReportsPage,
};
