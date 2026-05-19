// -----------------------------------------------------------------------------
// Shared Components.
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
};
