// -----------------------------------------------------------------------------
// Shared Components.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import {
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
} from "lucide-react";


import {
    workflow,
} from "../data/mockData";
import {
    buildPageNumbers,
} from "../utils/helpers";


// Shared status badge used by tables, cards, and workflow summaries.
/**
 * Displays a status badge with consistent colors for project, task, and assignment states.
 */
function Badge({ value }) {

    // Set badge colors based on status
    const style =
        value === "Completed"
            ? "bg-emerald-100 text-emerald-700"
            : ["Paused", "On Hold", "Quality Review"].includes(value)
                ? "bg-amber-100 text-amber-700"
                : ["Cancelled", "Archived", "Rejected"].includes(value)
                    ? "bg-red-100 text-red-700"
                    : "bg-violet-100 text-violet-700";

    return (
        <span className={`inline-flex min-h-6 items-center rounded-full px-3 py-1 text-xs font-bold ${style}`}>
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
        value === "Urgent"
            ? "bg-red-100 text-red-700"
            : value === "High"
                ? "bg-orange-100 text-orange-700"
                : value === "Normal"
                    ? "bg-violet-100 text-violet-700"
                    : "bg-slate-100 text-slate-700";

    return (
        <span className={`inline-flex min-h-6 items-center rounded-full px-3 py-1 text-xs font-bold ${style}`}>
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
            <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                <div
                    className="h-full rounded-full bg-violet-600 shadow-sm"
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
        <div className="flex items-center justify-center gap-2 text-slate-700">
            <button
                type="button"
                onClick={onEdit}
                className="rounded-lg border border-transparent p-1.5 hover:border-slate-200 hover:bg-slate-100"
                aria-label="Edit row"
                title="Edit"
            >
                <Pencil size={17} />
            </button>

            <button
                type="button"
                onClick={onDelete}
                className="rounded-lg border border-transparent p-1.5 hover:border-red-100 hover:bg-red-50 hover:text-red-700"
                aria-label="Delete row"
                title="Delete"
            >
                <Trash2 size={17} />
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
            className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:bg-slate-50 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 sm:w-auto sm:min-w-[150px]"
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
        <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
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
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-semibold">{text}</span>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    className="rounded-lg border border-transparent p-1 hover:border-slate-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous page"
                >
                    <ChevronLeft size={16} />
                </button>

                {pages.map((pageNumber) => (
                    <button
                        key={pageNumber}
                        type="button"
                        onClick={() => onPageChange(pageNumber)}
                        className={`h-7 w-7 rounded-lg text-xs font-bold ${
                            pageNumber === currentPage
                                ? "bg-violet-600 text-white"
                                : "border border-transparent text-slate-700 hover:border-slate-200 hover:bg-white"
                        }`}
                    >
                        {pageNumber}
                    </button>
                ))}

                <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    className="rounded-lg border border-transparent p-1 hover:border-slate-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
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
        <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            <span>{label}</span>
            {children}
        </label>
    );
}

/**
 * Reusable styled text input component.
 */
function TextInput({ value, onChange, placeholder, type = "text", ...inputProps }) {
    return (
        <input
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            {...inputProps}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50 read-only:bg-slate-50"
        />
    );
}

/**
 * Reusable modal shell for create/edit forms.
 */
function Modal({ title, children, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div className="pm-elevated max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-transparent px-3 py-1 text-2xl leading-none hover:border-slate-200 hover:bg-slate-100"
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
 * Small metric card used by dashboard and report sections.
 */
function InsightCard({
    label,
    value,
    note,
    icon: Icon = BarChart3,
    tone = "violet",
    valueClassName = "",
    className = "",
}) {
    const toneStyles = {
        blue: {
            border: "border-blue-100",
            icon: "bg-blue-50 text-blue-700",
            value: "text-blue-900",
        },
        amber: {
            border: "border-amber-100",
            icon: "bg-amber-50 text-amber-700",
            value: "text-amber-900",
        },
        emerald: {
            border: "border-emerald-100",
            icon: "bg-emerald-50 text-emerald-700",
            value: "text-emerald-900",
        },
        cyan: {
            border: "border-cyan-100",
            icon: "bg-cyan-50 text-cyan-700",
            value: "text-cyan-900",
        },
        violet: {
            border: "border-violet-100",
            icon: "bg-violet-50 text-violet-700",
            value: "text-violet-900",
        },
        slate: {
            border: "border-slate-200",
            icon: "bg-slate-100 text-slate-700",
            value: "text-slate-950",
        },
    };
    const cardTone = toneStyles[tone] || toneStyles.violet;
    const valueTitle = typeof value === "string" || typeof value === "number" ? String(value) : undefined;

    return (
        <article className={`pm-surface rounded-lg border ${cardTone.border} bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md ${className}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-600">{label}</p>
                    <p
                        className={`mt-3 min-w-0 truncate text-3xl font-bold leading-none ${cardTone.value} ${valueClassName}`}
                        title={valueTitle}
                    >
                        {value}
                    </p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-black/5 ${cardTone.icon}`}>
                    <Icon size={20} />
                </div>
            </div>
            {note && <p className="mt-3 truncate text-sm text-slate-500">{note}</p>}
        </article>
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

    return <span className={`inline-flex min-h-6 items-center rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>;
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
