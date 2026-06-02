// -----------------------------------------------------------------------------
// Employee Page.
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
    normalizeEmployeeRows,
    normalizeTaskRows,
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
 * Displays employee availability/status with role-appropriate colors.
 */

const DEFAULT_JOB_TITLE_OPTIONS = [
    "Photo Editor",
    "Senior Photo Editor",
    "Photographer",
    "Lead Photographer",
    "Photography Assistant",
    "Image Retoucher",
    "Senior Retoucher",
    "Quality Control Specialist",
    "Production Coordinator",
    "Project Coordinator",
    "Project Manager",
    "Studio Manager",
    "Operations Manager",
    "Client Services Representative",
    "Account Manager",
    "Sales Representative",
    "Administrator",
    "Manager",
    "Employee",
];

function formatPhoneNumber(value = "") {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 10);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;

    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function getEmployeeJobTitle(employee = {}) {
    const title = String(employee.title || "").trim();
    const role = String(employee.role || "").trim();
    const accountRole = String(employee.accountRole || employee.account_role || "").trim();

    if (title) return title;
    if (role && role !== accountRole) return role;
    return "Photo Editor";
}

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
function getEmployeeNameParts(employee = {}) {
    const existingName = String(employee.name || employee.displayName || employee.display_name || "").trim();
    const parts = existingName.split(/\s+/).filter(Boolean);

    return {
        firstName: employee.firstName || employee.first_name || parts[0] || "",
        middleName: employee.middleName || employee.middle_name || (parts.length > 2 ? parts.slice(1, -1).join(" ") : ""),
        lastName: employee.lastName || employee.last_name || (parts.length > 1 ? parts[parts.length - 1] : ""),
    };
}

function buildEmployeeDisplayName(form = {}) {
    return [form.firstName, form.middleName, form.lastName]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
}

function EmployeeForm({ initialEmployee, roleOptions, onCancel, onSave }) {
    const [form, setForm] = useState(() => {
        const nameParts = getEmployeeNameParts(initialEmployee);
        const accountRole = ["Manager", "Employee"].includes(initialEmployee.accountRole || initialEmployee.account_role || initialEmployee.role)
            ? (initialEmployee.accountRole || initialEmployee.account_role || initialEmployee.role)
            : "Employee";

        return {
            ...initialEmployee,
            ...nameParts,
            accountRole,
            role: getEmployeeJobTitle(initialEmployee),
            title: getEmployeeJobTitle(initialEmployee),
            password: initialEmployee.password || "",
        };
    });

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const displayName = buildEmployeeDisplayName(form);

        onSave({
            ...form,
            name: displayName,
            displayName,
            role: form.title || form.role || "Photo Editor",
            activeTasks: normalizeNumber(form.activeTasks),
            completedToday: normalizeNumber(form.completedToday),
            hoursToday: normalizeNumber(form.hoursToday),
            efficiency: Math.max(0, Math.min(100, normalizeNumber(form.efficiency))),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="First Name">
                    <TextInput value={form.firstName} onChange={(value) => updateField("firstName", value)} placeholder="First name" />
                </FormField>

                <FormField label="Middle Name">
                    <TextInput value={form.middleName} onChange={(value) => updateField("middleName", value)} placeholder="Middle name or initial" />
                </FormField>

                <FormField label="Last Name">
                    <TextInput value={form.lastName} onChange={(value) => updateField("lastName", value)} placeholder="Last name" />
                </FormField>

                <FormField label="Account Role">
                    <select
                        value={form.accountRole}
                        onChange={(event) => updateField("accountRole", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>Employee</option>
                        <option>Manager</option>
                    </select>
                </FormField>

                <FormField label="Job Title">
                    <select
                        value={form.title || form.role || "Photo Editor"}
                        onChange={(event) => {
                            updateField("title", event.target.value);
                            updateField("role", event.target.value);
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        {roleOptions.map((role) => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Email">
                    <TextInput value={form.email} onChange={(value) => updateField("email", value)} placeholder="employee@company.com" type="email" />
                </FormField>

                <FormField label="Temporary Password">
                    <TextInput value={form.password} onChange={(value) => updateField("password", value)} placeholder="Leave blank unless creating or changing password" type="password" />
                </FormField>

                <FormField label="Phone">
                    <TextInput
                        value={form.phone}
                        onChange={(value) => updateField("phone", formatPhoneNumber(value))}
                        placeholder="(555) 210-1000"
                        inputMode="tel"
                    />
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
    const { data: loadedEmployeeRows } = useApiPlaceholder(API_ENDPOINTS.employees, employees, {
        transformPayload: normalizeEmployeeRows,
    });
    const { data: loadedTaskRows } = useApiPlaceholder(API_ENDPOINTS.tasksList, taskItems, {
        transformPayload: normalizeTaskRows,
    });

    const [employeeRows, setEmployeeRows] = useState(employees);
    const [employeeSort, setEmployeeSort] = useState({ key: "name", direction: "asc" });
    const [employeePage, setEmployeePage] = useState(1);
    const [roleFilter, setRoleFilter] = useState("All Roles");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [employeeModal, setEmployeeModal] = useState(null);

    useEffect(() => {
        if (!Array.isArray(loadedEmployeeRows)) return;

        const taskRows = Array.isArray(loadedTaskRows) ? loadedTaskRows : [];
        const today = new Date().toDateString();
        const isOpenStatus = (status) => !["completed", "complete", "cancelled"].includes(String(status || "").toLowerCase());

        setEmployeeRows(loadedEmployeeRows.map((employee) => {
            const employeeKeys = new Set([
                employee.userId,
                employee.backendId,
                employee.employeeId,
                employee.id,
                employee.name,
                employee.displayName,
                employee.email,
            ].filter(Boolean).map((value) => String(value).toLowerCase()));

            const employeeTasks = taskRows.filter((task) => {
                const taskKeys = [task.assignedToId, task.employeeId, task.assignedTo, task.assigned_to_email]
                    .filter(Boolean)
                    .map((value) => String(value).toLowerCase());
                return taskKeys.some((value) => employeeKeys.has(value));
            });

            const openTasks = employeeTasks.filter((task) => isOpenStatus(task.status));
            const completedToday = employeeTasks.filter((task) => {
                if (String(task.status || "").toLowerCase() !== "completed") return false;
                const dateValue = task.completedAt || task.completed_at || task.lastStoppedAt || task.dueDate;
                const parsed = new Date(dateValue);
                return !Number.isNaN(parsed.getTime()) && parsed.toDateString() === today;
            }).length;
            const trackedSeconds = employeeTasks.reduce((total, task) => total + Number(task.trackedSeconds || 0), 0);
            const completedTasks = employeeTasks.filter((task) => String(task.status || "").toLowerCase() === "completed").length;

            return {
                ...employee,
                currentTask: openTasks[0]?.taskName || employee.currentTask || "No active task",
                activeTasks: openTasks.length,
                completedToday: completedToday || employee.completedToday || 0,
                hoursToday: trackedSeconds ? Number((trackedSeconds / 3600).toFixed(2)) : employee.hoursToday || 0,
                efficiency: employeeTasks.length ? Math.round((completedTasks / employeeTasks.length) * 100) : employee.efficiency || 0,
            };
        }));
    }, [loadedEmployeeRows, loadedTaskRows]);

    const roleOptions = useMemo(() => {
        const existingTitles = employeeRows
            .map((employee) => getEmployeeJobTitle(employee))
            .filter(Boolean);

        return Array.from(new Set([...DEFAULT_JOB_TITLE_OPTIONS, ...existingTitles])).sort((left, right) => left.localeCompare(right));
    }, [employeeRows]);

    const roleFilterOptions = useMemo(
        () => ["All Roles", ...roleOptions],
        [roleOptions]
    );

    const statusOptions = useMemo(
        () => getUniqueOptions(employeeRows, "status", "All Status"),
        [employeeRows]
    );

    const filteredEmployeeRows = useMemo(() => {
        const searchText = [globalSearch, employeeSearch].filter(Boolean).join(" " ).trim().toLowerCase();

        return employeeRows.filter((employee) => {
            const employeeTitle = getEmployeeJobTitle(employee);
            const matchesRole = roleFilter === "All Roles" || employeeTitle === roleFilter;
            const matchesStatus = statusFilter === "All Status" || employee.status === statusFilter;
            const matchesSearch = !searchText || [
                employee.name,
                employee.id,
                getEmployeeJobTitle(employee),
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
                firstName: "",
                middleName: "",
                lastName: "",
                name: "",
                displayName: "",
                accountRole: "Employee",
                role: "Employee",
                title: "Photo Editor",
                email: "",
                password: "password",
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
        const displayName = buildEmployeeDisplayName(employee) || employee.name?.trim() || "Unnamed Employee";
        const cleanEmployee = {
            ...employee,
            id: employee.id || generateNextId("EMP", employeeRows),
            firstName: String(employee.firstName || "").trim() || displayName.split(" ")[0] || "New",
            middleName: String(employee.middleName || "").trim(),
            lastName: String(employee.lastName || "").trim() || displayName.split(" ").slice(-1)[0] || "Employee",
            name: displayName,
            displayName,
            accountRole: employee.accountRole || "Employee",
            role: employee.title || employee.role || "Photo Editor",
            title: employee.title || employee.role || "Photo Editor",
            email: String(employee.email || "").trim(),
            password: employeeModal.mode === "create" ? (employee.password || "password") : employee.password,
            phone: formatPhoneNumber(employee.phone || ""),
            currentTask: String(employee.currentTask || "").trim() || "No active task",
            availability: String(employee.availability || "").trim() || employee.status,
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
                                    <div className="text-xs text-slate-500">{employee.displayId || employee.id}</div>
                                    <div className="text-xs text-slate-500">{employee.email}</div>
                                </td>
                                <td className="border border-slate-300 px-4 py-3 font-medium">{getEmployeeJobTitle(employee)}</td>
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
                        roleOptions={roleOptions}
                        onCancel={() => setEmployeeModal(null)}
                        onSave={saveEmployee}
                    />
                </Modal>
            )}
        </section>
    );
}

export {
    EmployeesPage,
};
