// -----------------------------------------------------------------------------
// Analytics Page.
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
    InsightCard,
    DueStatusBadge,
} from "./sharedComponents";

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

export {
    AnalyticsPage,
};
