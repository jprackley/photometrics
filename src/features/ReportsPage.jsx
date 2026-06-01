// -----------------------------------------------------------------------------
// Report Page.
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
    normalizeEmployeeRows,
    normalizeTaskRows,
    normalizeProjectRows,
    normalizeAssignmentRows,
    normalizeTimeEntryRows,
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
    InsightCard,
    DueStatusBadge,
} from "./sharedComponents";


function formatReportDate(value) {
    if (!value) return "";
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return String(value);
    return parsedDate.toLocaleDateString([], { month: "short", day: "2-digit", year: "numeric" });
}

function normalizeProjectDeliveryReportRow(report = {}) {
    const totalImages = Number(report.total_images ?? report.totalImages ?? 0) || 0;
    const completedImages = Number(report.completed_images ?? report.completedImages ?? 0) || 0;
    const remainingImages = Number(report.remaining_images ?? report.remainingImages ?? Math.max(0, totalImages - completedImages)) || 0;
    const assignedEmployees = Array.isArray(report.assigned_employees)
        ? report.assigned_employees
        : Array.isArray(report.assignedEmployees)
            ? report.assignedEmployees
            : [];

    return {
        id: report.report_snapshot_id || report.project_id || report.projectId || report.id,
        snapshotId: report.report_snapshot_id || report.snapshotId,
        projectId: report.project_id || report.projectId,
        name: report.project_name || report.projectName || "Untitled Project",
        client: report.client || "",
        dueDate: formatReportDate(report.due_date || report.dueDate),
        images: formatNumber(totalImages),
        completedImages: formatNumber(completedImages),
        remainingImages: formatNumber(remainingImages),
        progress: normalizeNumber(report.progress),
        status: report.project_status || report.status || "",
        dueStatus: report.due_status === null || report.due_status === undefined ? "NULL" : String(report.due_status),
        openTasks: Number(report.open_tasks ?? report.openTasks ?? 0) || 0,
        reviewItems: Number(report.review_items ?? report.reviewItems ?? 0) || 0,
        assignedTo: assignedEmployees.length ? assignedEmployees.join(", ") : "Unassigned",
        generatedAt: report.generated_at || report.generatedAt || "",
    };
}

function unwrapProjectDeliveryPayload(payload, key) {
    if (!payload) return key === "reports" ? [] : null;
    if (key === "reports") return Array.isArray(payload.reports) ? payload.reports : [];
    return payload.report || payload;
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
    const { data: loadedProjectRows } = useApiPlaceholder(API_ENDPOINTS.projectsList, projects, {
        transformPayload: normalizeProjectRows,
    });
    const localAssignmentFallback = getUseApiDataSetting() ? [] : assignments;
    const { data: loadedAssignmentRows } = useApiPlaceholder(API_ENDPOINTS.assignments, localAssignmentFallback, {
        transformPayload: normalizeAssignmentRows,
    });
    const { data: loadedTaskRows } = useApiPlaceholder(API_ENDPOINTS.tasksList, taskItems, {
        transformPayload: normalizeTaskRows,
    });
    const { data: loadedEmployeeRows } = useApiPlaceholder(API_ENDPOINTS.employees, employees, {
        transformPayload: normalizeEmployeeRows,
    });
    const { data: loadedTimeEntryRows } = useApiPlaceholder(API_ENDPOINTS.timeEntriesList, [], {
        transformPayload: normalizeTimeEntryRows,
        suppressApiError: true,
    });

    const projectRows = Array.isArray(loadedProjectRows) ? loadedProjectRows : [];
    const rawAssignmentRows = Array.isArray(loadedAssignmentRows) ? loadedAssignmentRows : [];
    const rawTaskRows = Array.isArray(loadedTaskRows) ? loadedTaskRows : [];
    const employeeRows = Array.isArray(loadedEmployeeRows) ? loadedEmployeeRows : [];
    const timeEntryRows = Array.isArray(loadedTimeEntryRows) ? loadedTimeEntryRows : [];

    const projectNameById = useMemo(() => new Map(projectRows.map((project) => [project.id, project.name])), [projectRows]);
    const employeeNameById = useMemo(() => new Map(employeeRows.flatMap((employee) => ([
        [employee.id, employee.name],
        [employee.userId, employee.name],
        [employee.backendId, employee.name],
        [employee.employeeId, employee.name],
    ]))), [employeeRows]);

    const taskRows = useMemo(() => rawTaskRows.map((task) => ({
        ...task,
        project: projectNameById.get(task.projectId) || task.project,
        assignedTo: employeeNameById.get(task.assignedToId) || task.assignedTo,
    })), [rawTaskRows, projectNameById, employeeNameById]);

    const assignmentRows = useMemo(() => rawAssignmentRows.map((assignment) => ({
        ...assignment,
        project: projectNameById.get(assignment.projectId) || assignment.project,
        assignedTo: employeeNameById.get(assignment.employeeId || assignment.assignedToId) || assignment.assignedTo,
    })), [rawAssignmentRows, projectNameById, employeeNameById]);

    const [reportType, setReportType] = useState("Project Delivery");
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [projectDeliveryHistoryRows, setProjectDeliveryHistoryRows] = useState([]);
    const [projectDeliveryPreviewRow, setProjectDeliveryPreviewRow] = useState(null);
    const [projectDeliveryMessage, setProjectDeliveryMessage] = useState("");
    const [isProjectDeliveryLoading, setIsProjectDeliveryLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [employeeFilter, setEmployeeFilter] = useState("All Employees");

    const reportData = useMemo(
        () => buildOperationsReportData(projectRows, assignmentRows, taskRows, employeeRows, timeEntryRows),
        [projectRows, assignmentRows, taskRows, employeeRows, timeEntryRows]
    );

    const useLiveProjectDeliveryReport = getUseApiDataSetting();

    const projectSelectOptions = useMemo(() => ([
        { value: "", label: "Select a project" },
        ...projectRows.map((project) => ({
            value: project.backendId || project.id,
            label: project.name,
        })),
    ]), [projectRows]);

    const loadProjectDeliveryHistory = async () => {
        if (!useLiveProjectDeliveryReport) return;
        setIsProjectDeliveryLoading(true);
        setProjectDeliveryMessage("");
        try {
            const payload = await apiRequest("/reports/project_delivery/history");
            const rows = unwrapProjectDeliveryPayload(payload, "reports").map(normalizeProjectDeliveryReportRow);
            setProjectDeliveryHistoryRows(rows);
        } catch (apiError) {
            console.warn("Project Delivery report history could not be loaded.", apiError);
            setProjectDeliveryMessage(apiError?.message || "Project Delivery report history could not be loaded.");
        } finally {
            setIsProjectDeliveryLoading(false);
        }
    };

    const loadProjectDeliveryPreview = async (projectId = selectedProjectId) => {
        if (!projectId) {
            setProjectDeliveryMessage("Select a project before generating a report preview.");
            return;
        }
        setIsProjectDeliveryLoading(true);
        setProjectDeliveryMessage("");
        try {
            const payload = await apiRequest(`/reports/project_delivery/${encodeURIComponent(projectId)}`);
            const row = normalizeProjectDeliveryReportRow(unwrapProjectDeliveryPayload(payload, "report"));
            setProjectDeliveryPreviewRow(row);
        } catch (apiError) {
            console.warn("Project Delivery report preview could not be loaded.", apiError);
            setProjectDeliveryMessage(apiError?.message || "Project Delivery report preview could not be loaded.");
        } finally {
            setIsProjectDeliveryLoading(false);
        }
    };

    const saveProjectDeliverySnapshot = async () => {
        if (!selectedProjectId) {
            setProjectDeliveryMessage("Select a project before saving a report snapshot.");
            return;
        }
        setIsProjectDeliveryLoading(true);
        setProjectDeliveryMessage("");
        try {
            const payload = await apiRequest(`/reports/project_delivery/${encodeURIComponent(selectedProjectId)}/save`, { method: "POST" });
            const row = normalizeProjectDeliveryReportRow(unwrapProjectDeliveryPayload(payload, "report"));
            setProjectDeliveryPreviewRow(row);
            setProjectDeliveryHistoryRows((currentRows) => [row, ...currentRows.filter((existing) => existing.snapshotId !== row.snapshotId)]);
            setProjectDeliveryMessage("Project Delivery report snapshot saved.");
        } catch (apiError) {
            console.warn("Project Delivery report snapshot could not be saved.", apiError);
            setProjectDeliveryMessage(apiError?.message || "Project Delivery report snapshot could not be saved.");
        } finally {
            setIsProjectDeliveryLoading(false);
        }
    };

    useEffect(() => {
        if (!useLiveProjectDeliveryReport) return;
        loadProjectDeliveryHistory();
    }, [useLiveProjectDeliveryReport]);

    useEffect(() => {
        if (!selectedProjectId && projectSelectOptions.length > 1) {
            setSelectedProjectId(projectSelectOptions[1].value);
        }
    }, [projectSelectOptions, selectedProjectId]);

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
            rows: useLiveProjectDeliveryReport
                ? [projectDeliveryPreviewRow, ...projectDeliveryHistoryRows].filter(Boolean)
                : reportData.projectReportRows,
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
    ]), [reportData, useLiveProjectDeliveryReport, projectDeliveryPreviewRow, projectDeliveryHistoryRows]);

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


            {useLiveProjectDeliveryReport && reportType === "Project Delivery" && (
                <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex-1">
                            <label className="mb-2 block text-sm font-bold text-slate-700">Project Delivery API</label>
                            <select
                                value={selectedProjectId}
                                onChange={(event) => setSelectedProjectId(event.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                            >
                                {projectSelectOptions.map((option) => (
                                    <option key={option.value || "empty"} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <p className="mt-2 text-xs text-slate-500">Preview uses GET /api/reports/project_delivery/PROJECT UUID. Save uses POST /api/reports/project_delivery/PROJECT UUID/save. History uses GET /api/reports/project_delivery/history.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => loadProjectDeliveryPreview()}
                                disabled={isProjectDeliveryLoading || !selectedProjectId}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Eye size={16} /> Preview Current Report
                            </button>
                            <button
                                type="button"
                                onClick={saveProjectDeliverySnapshot}
                                disabled={isProjectDeliveryLoading || !selectedProjectId}
                                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Download size={16} /> Save Snapshot
                            </button>
                            <button
                                type="button"
                                onClick={loadProjectDeliveryHistory}
                                disabled={isProjectDeliveryLoading}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Refresh History
                            </button>
                        </div>
                    </div>
                    {projectDeliveryMessage && (
                        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">{projectDeliveryMessage}</p>
                    )}
                </div>
            )}

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
