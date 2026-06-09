// -----------------------------------------------------------------------------
// Report Page.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import {
    BarChart3,
    Bell,
    Clock,
    Download,
    Eye,
    Folder,
    ListChecks,
} from "lucide-react";


import { Logo } from "../components/Layout";
import {
    API_ENDPOINTS,
    apiRequest,
    getUseApiDataSetting,
    normalizeEmployeeRows,
    normalizeTaskRows,
    normalizeProjectRows,
    useApiPlaceholder,
} from "../services/api";
import {
    employees,
    productivity,
    projects,
    taskItems,
} from "../data/mockData";
import {
    formatDuration,
    formatNumber,
    formatPercent,
    normalizeNumber,
} from "../utils/helpers";
import {
    REPORT_ASSIGNMENT_COLUMNS,
    REPORT_EMPLOYEE_COLUMNS,
    REPORT_PROJECT_COLUMNS,
    REPORT_TIME_COLUMNS,
    buildOperationsReportData,
    downloadFullOperationsReport,
    downloadReportTable,
} from "../utils/reporting";
import {
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


/**
 * Formats report dates consistently across report tables.
 */
function formatReportDate(value) {
    if (!value) return "";
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return String(value);
    return parsedDate.toLocaleDateString([], { month: "short", day: "2-digit", year: "numeric" });
}

/**
 * Normalizes project delivery report row for this feature.
 */
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

/**
 * Extracts project delivery payload for this feature.
 */
function unwrapProjectDeliveryPayload(payload, key) {
    if (!payload) return key === "reports" ? [] : null;
    if (key === "reports") return Array.isArray(payload.reports) ? payload.reports : [];
    return payload.report || payload;
}


/**
 * Formats tracked-time values that may arrive as strings, minutes, or seconds.
 */
function formatTrackedTime(value) {
    if (value === null || value === undefined || value === "") return "0m";
    if (typeof value === "string") return value;
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return String(value);
    // Backend report views store tracked_time as hours or formatted text depending on the view.
    // Treat small decimal values as hours and larger whole values as minutes.
    if (numericValue > 0 && numericValue < 1000 && !Number.isInteger(numericValue)) {
        return formatDuration(Math.round(numericValue * 3600));
    }
    return formatDuration(Math.round(numericValue * 60));
}

/**
 * Normalizes task time report row for this feature.
 */
function normalizeTaskTimeReportRow(report = {}) {
    return {
        id: report.report_snapshot_id || report.task_id || report.taskId || report.id,
        snapshotId: report.report_snapshot_id || report.snapshotId,
        taskId: report.task_id || report.taskId,
        taskName: report.task_name || report.taskName || "Untitled Task",
        project: report.project || report.project_name || report.projectName || "",
        assignedTo: report.assigned_employee || report.assignedEmployee || report.assignedTo || "Unassigned",
        dueDate: formatReportDate(report.due_date || report.dueDate),
        priority: report.priority || "",
        estimatedHours: Number(report.estimated_hours ?? report.estimatedHours ?? 0) || 0,
        trackedTime: formatTrackedTime(report.tracked_time ?? report.trackedTime ?? 0),
        utilization: normalizeNumber(report.utilization),
        status: report.status || "",
        dueStatus: report.due_status === null || report.due_status === undefined ? "NULL" : String(report.due_status),
        generatedAt: report.generated_at || report.generatedAt || "",
    };
}

/**
 * Normalizes employee productivity report row for this feature.
 */
function normalizeEmployeeProductivityReportRow(report = {}) {
    return {
        id: report.report_snapshot_id || report.user_id || report.userId || report.employee_id || report.employeeId || report.id,
        snapshotId: report.report_snapshot_id || report.snapshotId,
        employeeId: report.user_id || report.userId || report.employee_id || report.employeeId,
        name: report.employee_name || report.employeeName || report.name || "Unnamed Employee",
        role: report.role || "Employee",
        assignedTasks: Number(report.assigned_items ?? report.assignedItems ?? report.assigned_tasks ?? report.assignedTasks ?? 0) || 0,
        completedTasks: Number(report.completed_items ?? report.completedItems ?? report.completed_tasks ?? report.completedTasks ?? 0) || 0,
        reviewItems: Number(report.review_items ?? report.reviewItems ?? 0) || 0,
        trackedTime: formatTrackedTime(report.tracked_time ?? report.trackedTime ?? 0),
        hoursToday: Number(report.hours_today ?? report.hoursToday ?? 0) || 0,
        efficiency: normalizeNumber(report.efficiency),
        status: report.status || "",
        generatedAt: report.generated_at || report.generatedAt || "",
    };
}

/**
 * Normalizes assignment status report row for this feature.
 */
function normalizeAssignmentStatusReportRow(report = {}) {
    return {
        id: report.report_snapshot_id || report.task_id || report.taskId || report.id,
        snapshotId: report.report_snapshot_id || report.snapshotId,
        taskId: report.task_id || report.taskId,
        project: report.project || report.project_name || report.projectName || "",
        taskType: report.category || report.task_type || report.taskType || report.task_name || report.taskName || "Task",
        assignedTo: report.assigned_employee || report.assignedEmployee || report.assignedTo || "Unassigned",
        assignedDate: formatReportDate(report.assigned_date || report.assignedDate),
        dueDate: formatReportDate(report.due_date || report.dueDate),
        priority: report.priority || "",
        status: report.status || "",
        dueStatus: report.due_status === null || report.due_status === undefined ? "NULL" : String(report.due_status),
        generatedAt: report.generated_at || report.generatedAt || "",
    };
}

/**
 * Extracts report rows from supported backend response shapes.
 */
function unwrapReportPayload(payload, key) {
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
    const { data: loadedTaskRows } = useApiPlaceholder(API_ENDPOINTS.tasksList, taskItems, {
        transformPayload: normalizeTaskRows,
    });
    const { data: loadedEmployeeRows } = useApiPlaceholder(API_ENDPOINTS.employees, employees, {
        transformPayload: normalizeEmployeeRows,
    });
    const projectRows = Array.isArray(loadedProjectRows) ? loadedProjectRows : [];
    const rawTaskRows = Array.isArray(loadedTaskRows) ? loadedTaskRows : [];
    const employeeRows = Array.isArray(loadedEmployeeRows) ? loadedEmployeeRows : [];

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

    const [reportType, setReportType] = useState("Project Delivery");
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [projectDeliveryHistoryRows, setProjectDeliveryHistoryRows] = useState([]);
    const [projectDeliveryPreviewRow, setProjectDeliveryPreviewRow] = useState(null);
    const [projectDeliveryMessage, setProjectDeliveryMessage] = useState("");
    const [isProjectDeliveryLoading, setIsProjectDeliveryLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [employeeFilter, setEmployeeFilter] = useState("All Employees");

    const reportData = useMemo(
        () => buildOperationsReportData(projectRows, taskRows, employeeRows),
        [projectRows, taskRows, employeeRows]
    );

    const useLiveReports = getUseApiDataSetting();

    const reportApiConfigs = useMemo(() => ({
        "Project Delivery": {
            basePath: "/reports/project_delivery",
            idLabel: "Project",
            selectLabel: "Select a project",
            rows: projectRows,
            getId: (project) => project.backendId || project.projectId || project.id,
            getLabel: (project) => project.name || project.projectName || "Untitled Project",
            normalize: normalizeProjectDeliveryReportRow,
        },
        "Task Time": {
            basePath: "/reports/task_time",
            idLabel: "Task",
            selectLabel: "Select a task",
            rows: taskRows,
            getId: (task) => task.backendId || task.taskId || task.id,
            getLabel: (task) => task.taskName || task.name || "Untitled Task",
            normalize: normalizeTaskTimeReportRow,
        },
        "Employee Productivity": {
            basePath: "/reports/employee_productivity",
            idLabel: "Employee",
            selectLabel: "Select an employee",
            rows: employeeRows,
            getId: (employee) => employee.backendId || employee.userId || employee.employeeId || employee.id,
            getLabel: (employee) => employee.name || employee.employeeName || "Unnamed Employee",
            normalize: normalizeEmployeeProductivityReportRow,
        },
        "Task Assignment Status": {
            basePath: "/reports/assignment_status",
            idLabel: "Task",
            selectLabel: "Select a task",
            rows: taskRows,
            getId: (task) => task.backendId || task.taskId || task.id,
            getLabel: (task) => task.taskName || task.name || "Untitled Task",
            normalize: normalizeAssignmentStatusReportRow,
        },
    }), [projectRows, taskRows, employeeRows]);

    const activeReportApiConfig = reportApiConfigs[reportType];

    const reportSelectOptions = useMemo(() => ([
        { value: "", label: activeReportApiConfig?.selectLabel || "Select a row" },
        ...(activeReportApiConfig?.rows || [])
            .map((row) => ({
                value: activeReportApiConfig.getId(row),
                label: activeReportApiConfig.getLabel(row),
            }))
            .filter((option) => option.value),
    ]), [activeReportApiConfig]);

    const loadReportHistory = async () => {
        if (!useLiveReports || !activeReportApiConfig) return;
        setIsProjectDeliveryLoading(true);
        setProjectDeliveryMessage("");
        try {
            const payload = await apiRequest(`${activeReportApiConfig.basePath}/history`);
            const rows = unwrapReportPayload(payload, "reports").map(activeReportApiConfig.normalize);
            setProjectDeliveryHistoryRows(rows);
        } catch (apiError) {
            console.warn(`${reportType} report history could not be loaded.`, apiError);
            setProjectDeliveryMessage(apiError?.message || `${reportType} report history could not be loaded.`);
        } finally {
            setIsProjectDeliveryLoading(false);
        }
    };

    const loadReportPreview = async (rowId = selectedProjectId) => {
        if (!rowId) {
            setProjectDeliveryMessage(`${activeReportApiConfig?.idLabel || "Item"} is required before generating a report preview.`);
            return;
        }
        if (!activeReportApiConfig) return;
        setIsProjectDeliveryLoading(true);
        setProjectDeliveryMessage("");
        try {
            const payload = await apiRequest(`${activeReportApiConfig.basePath}/${encodeURIComponent(rowId)}`);
            const row = activeReportApiConfig.normalize(unwrapReportPayload(payload, "report"));
            setProjectDeliveryPreviewRow(row);
        } catch (apiError) {
            console.warn(`${reportType} report preview could not be loaded.`, apiError);
            setProjectDeliveryMessage(apiError?.message || `${reportType} report preview could not be loaded.`);
        } finally {
            setIsProjectDeliveryLoading(false);
        }
    };

    const saveReportSnapshot = async () => {
        if (!selectedProjectId) {
            setProjectDeliveryMessage(`${activeReportApiConfig?.idLabel || "Item"} is required before saving a report snapshot.`);
            return;
        }
        if (!activeReportApiConfig) return;
        setIsProjectDeliveryLoading(true);
        setProjectDeliveryMessage("");
        try {
            const payload = await apiRequest(`${activeReportApiConfig.basePath}/${encodeURIComponent(selectedProjectId)}/save`, { method: "POST" });
            const row = activeReportApiConfig.normalize(unwrapReportPayload(payload, "report"));
            setProjectDeliveryPreviewRow(row);
            setProjectDeliveryHistoryRows((currentRows) => [row, ...currentRows.filter((existing) => existing.snapshotId !== row.snapshotId)]);
            setProjectDeliveryMessage(`${reportType} report snapshot saved.`);
        } catch (apiError) {
            console.warn(`${reportType} report snapshot could not be saved.`, apiError);
            setProjectDeliveryMessage(apiError?.message || `${reportType} report snapshot could not be saved.`);
        } finally {
            setIsProjectDeliveryLoading(false);
        }
    };

    useEffect(() => {
        setProjectDeliveryPreviewRow(null);
        setProjectDeliveryHistoryRows([]);
        setProjectDeliveryMessage("");
    }, [reportType]);

    useEffect(() => {
        if (!useLiveReports || !activeReportApiConfig) return;
        loadReportHistory();
    }, [useLiveReports, activeReportApiConfig]);

    useEffect(() => {
        if (!selectedProjectId && reportSelectOptions.length > 1) {
            setSelectedProjectId(reportSelectOptions[1].value);
        }
        if (selectedProjectId && !reportSelectOptions.some((option) => option.value === selectedProjectId)) {
            setSelectedProjectId(reportSelectOptions[1]?.value || "");
        }
    }, [reportSelectOptions, selectedProjectId]);

    const employeeOptions = useMemo(() => {
        const values = [
            ...employeeRows.map((employee) => employee.name),
            ...taskRows.map((task) => task.assignedTo),
        ].filter(Boolean);

        return ["All Employees", ...new Set(values.sort())];
    }, [employeeRows, taskRows]);

    const statusOptions = useMemo(() => {
        const values = [
            ...projectRows.map((project) => project.status),
            ...taskRows.map((task) => task.status),
            "Overdue",
            "Due Soon",
            "Upcoming",
            "On Track",
            "Complete",
        ].filter(Boolean);

        return ["All Status", ...new Set(values.sort())];
    }, [projectRows, taskRows]);

    const reportDefinitions = useMemo(() => ([
        {
            label: "Project Delivery",
            filename: "photometrics-project-delivery-report.csv",
            title: "Project Delivery Report",
            columns: REPORT_PROJECT_COLUMNS,
            rows: useLiveReports && reportType === "Project Delivery"
                ? [projectDeliveryPreviewRow, ...projectDeliveryHistoryRows].filter(Boolean)
                : reportData.projectReportRows,
            searchKeys: ["name", "client", "dueDate", "status", "dueStatus", "assignedTo"],
        },
        {
            label: "Task Time",
            filename: "photometrics-task-time-report.csv",
            title: "Task Time Report",
            columns: REPORT_TIME_COLUMNS,
            rows: useLiveReports && reportType === "Task Time"
                ? [projectDeliveryPreviewRow, ...projectDeliveryHistoryRows].filter(Boolean)
                : reportData.timeReportRows,
            searchKeys: ["taskName", "project", "assignedTo", "dueDate", "priority", "status", "dueStatus"],
        },
        {
            label: "Employee Productivity",
            filename: "photometrics-employee-productivity-report.csv",
            title: "Employee Productivity Report",
            columns: REPORT_EMPLOYEE_COLUMNS,
            rows: useLiveReports && reportType === "Employee Productivity"
                ? [projectDeliveryPreviewRow, ...projectDeliveryHistoryRows].filter(Boolean)
                : reportData.employeeReportRows,
            searchKeys: ["name", "role", "status"],
        },
        {
            label: "Task Assignment Status",
            filename: "photometrics-task-assignment-status-report.csv",
            title: "Task Assignment Status Report",
            columns: REPORT_ASSIGNMENT_COLUMNS,
            rows: useLiveReports && reportType === "Task Assignment Status"
                ? [projectDeliveryPreviewRow, ...projectDeliveryHistoryRows].filter(Boolean)
                : reportData.taskAssignmentReportRows,
            searchKeys: ["id", "project", "taskType", "assignedTo", "dueDate", "priority", "status", "dueStatus"],
        },
    ]), [reportData, useLiveReports, reportType, projectDeliveryPreviewRow, projectDeliveryHistoryRows]);

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
                            Export project delivery, task assignment status, task time, and employee productivity reports from one place.
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
                <InsightCard label="Projects" value={reportData.summary.totalProjects} note={`${reportData.summary.completedProjects} complete`} icon={Folder} tone="blue" />
                <InsightCard label="Completion Rate" value={`${reportData.summary.completionRate}%`} note={`${formatNumber(reportData.summary.completedImages)} images complete`} icon={BarChart3} tone="emerald" />
                <InsightCard label="Images Remaining" value={formatNumber(reportData.summary.remainingImages)} note="Based on project progress" icon={Eye} tone="violet" />
                <InsightCard label="Open Tasks" value={reportData.summary.openTasks} note={`${reportData.summary.completedTasks} task(s) complete`} icon={ListChecks} tone="amber" />
                <InsightCard label="Review Queue" value={reportData.summary.reviewQueue} note="Tasks ready for review" icon={Bell} tone="cyan" />
                <InsightCard label="Tracked Time" value={formatDuration(reportData.summary.totalTrackedSeconds)} note={`${reportData.summary.utilizationRate}% of estimate`} icon={Clock} tone="slate" />
            </div>


            {useLiveReports && activeReportApiConfig && (
                <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex-1">
                            <label className="mb-2 block text-sm font-bold text-slate-700">{reportType} API</label>
                            <select
                                value={selectedProjectId}
                                onChange={(event) => setSelectedProjectId(event.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                            >
                                {reportSelectOptions.map((option) => (
                                    <option key={option.value || "empty"} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <p className="mt-2 text-xs text-slate-500">Preview uses GET /api{activeReportApiConfig.basePath}/ID. Save uses POST /api{activeReportApiConfig.basePath}/ID/save. History uses GET /api{activeReportApiConfig.basePath}/history.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => loadReportPreview()}
                                disabled={isProjectDeliveryLoading || !selectedProjectId}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Eye size={16} /> Preview Current Report
                            </button>
                            <button
                                type="button"
                                onClick={saveReportSnapshot}
                                disabled={isProjectDeliveryLoading || !selectedProjectId}
                                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Download size={16} /> Save Snapshot
                            </button>
                            <button
                                type="button"
                                onClick={loadReportHistory}
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
