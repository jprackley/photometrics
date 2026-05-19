// -----------------------------------------------------------------------------
// Projects and Assignments Page.
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
 * Create/edit form for project records.
 */
function ProjectForm({ initialProject, onCancel, onSave }) {
    const [form, setForm] = useState(initialProject);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave({
            ...form,
            images: String(form.images || "0"),
            progress: Math.max(0, Math.min(100, normalizeNumber(form.progress))),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Project Name">
                    <TextInput value={form.name} onChange={(value) => updateField("name", value)} placeholder="Graduation - Smith" />
                </FormField>

                <FormField label="Client">
                    <TextInput value={form.client} onChange={(value) => updateField("client", value)} placeholder="Client name" />
                </FormField>

                <FormField label="Start Date">
                    <TextInput value={form.startDate} onChange={(value) => updateField("startDate", value)} placeholder="May 01, 2026" />
                </FormField>

                <FormField label="Due Date">
                    <TextInput value={form.dueDate} onChange={(value) => updateField("dueDate", value)} placeholder="May 27, 2026" />
                </FormField>

                <FormField label="Images">
                    <TextInput value={form.images} onChange={(value) => updateField("images", value)} placeholder="1200" type="number" />
                </FormField>

                <FormField label="Progress">
                    <TextInput value={form.progress} onChange={(value) => updateField("progress", value)} placeholder="50" type="number" />
                </FormField>

                <FormField label="Status">
                    <select
                        value={form.status}
                        onChange={(event) => updateField("status", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>In Progress</option>
                        <option>Review</option>
                        <option>Completed</option>
                    </select>
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
                    Save Project
                </button>
            </div>
        </form>
    );
}

/**
 * Create/edit form for assignment records.
 */
function AssignmentForm({ initialAssignment, projectOptions, employeeOptions, onCancel, onSave }) {
    const [form, setForm] = useState(initialAssignment);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Project">
                    <select
                        value={form.project}
                        onChange={(event) => updateField("project", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        {projectOptions.filter((option) => option !== "All Projects").map((project) => (
                            <option key={project}>{project}</option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Task Type">
                    <TextInput value={form.taskType} onChange={(value) => updateField("taskType", value)} placeholder="Photo Editing" />
                </FormField>

                <FormField label="Assigned To">
                    <input
                        list="employee-options"
                        value={form.assignedTo}
                        onChange={(event) => updateField("assignedTo", event.target.value)}
                        placeholder="Employee name"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                    <datalist id="employee-options">
                        {employeeOptions.filter((option) => option !== "All Employees").map((employee) => (
                            <option key={employee} value={employee} />
                        ))}
                    </datalist>
                </FormField>

                <FormField label="Assigned Date">
                    <TextInput value={form.assignedDate} onChange={(value) => updateField("assignedDate", value)} placeholder="May 01, 2026" />
                </FormField>

                <FormField label="Due Date">
                    <TextInput value={form.dueDate} onChange={(value) => updateField("dueDate", value)} placeholder="May 18, 2026" />
                </FormField>

                <FormField label="Priority">
                    <select
                        value={form.priority}
                        onChange={(event) => updateField("priority", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>
                </FormField>

                <FormField label="Status">
                    <select
                        value={form.status}
                        onChange={(event) => updateField("status", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>In Progress</option>
                        <option>Review</option>
                        <option>Completed</option>
                    </select>
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
                    Save Assignment
                </button>
            </div>
        </form>
    );
}

// Projects + assignments page
/**
 * Manager project and assignment management page with sorting, filtering, pagination, export, and modals.
 */
function ProjectsAndAssignments() {
    const { data: loadedProjectRows } = useApiPlaceholder(API_ENDPOINTS.projects, projects);
    const { data: loadedAssignmentRows } = useApiPlaceholder(API_ENDPOINTS.assignments, assignments);

    const [projectRows, setProjectRows] = useState(projects);
    const [assignmentRows, setAssignmentRows] = useState(assignments);
    const [projectSort, setProjectSort] = useState({ key: "name", direction: "asc" });
    const [assignmentSort, setAssignmentSort] = useState({ key: "id", direction: "asc" });
    const [projectPage, setProjectPage] = useState(1);
    const [assignmentPage, setAssignmentPage] = useState(1);
    const [projectFilter, setProjectFilter] = useState("All Projects");
    const [employeeFilter, setEmployeeFilter] = useState("All Employees");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [projectModal, setProjectModal] = useState(null);
    const [assignmentModal, setAssignmentModal] = useState(null);

    useEffect(() => {
        if (Array.isArray(loadedProjectRows)) {
            setProjectRows(loadedProjectRows);
        }
    }, [loadedProjectRows]);

    useEffect(() => {
        if (Array.isArray(loadedAssignmentRows)) {
            setAssignmentRows(loadedAssignmentRows);
        }
    }, [loadedAssignmentRows]);

    const projectOptions = useMemo(
        () => getUniqueOptions(assignmentRows, "project", "All Projects"),
        [assignmentRows]
    );

    const employeeOptions = useMemo(
        () => getUniqueOptions(assignmentRows, "assignedTo", "All Employees"),
        [assignmentRows]
    );

    const statusOptions = useMemo(
        () => getUniqueOptions(assignmentRows, "status", "All Status"),
        [assignmentRows]
    );

    const filteredAssignmentRows = useMemo(() => {
        return assignmentRows.filter((assignment) => {
            const matchesProject = projectFilter === "All Projects" || assignment.project === projectFilter;
            const matchesEmployee = employeeFilter === "All Employees" || assignment.assignedTo === employeeFilter;
            const matchesStatus = statusFilter === "All Status" || assignment.status === statusFilter;
            return matchesProject && matchesEmployee && matchesStatus;
        });
    }, [assignmentRows, projectFilter, employeeFilter, statusFilter]);

    const sortedProjectRows = useMemo(
        () => sortRows(projectRows, projectSort),
        [projectRows, projectSort]
    );

    const sortedAssignmentRows = useMemo(
        () => sortRows(filteredAssignmentRows, assignmentSort),
        [filteredAssignmentRows, assignmentSort]
    );

    const projectTotalPages = getTotalPages(sortedProjectRows.length, PROJECTS_PAGE_SIZE);
    const assignmentTotalPages = getTotalPages(sortedAssignmentRows.length, ASSIGNMENTS_PAGE_SIZE);

    const visibleProjectRows = paginateRows(sortedProjectRows, projectPage, PROJECTS_PAGE_SIZE);
    const visibleAssignmentRows = paginateRows(sortedAssignmentRows, assignmentPage, ASSIGNMENTS_PAGE_SIZE);

    useEffect(() => {
        if (projectPage > projectTotalPages) {
            setProjectPage(projectTotalPages);
        }
    }, [projectPage, projectTotalPages]);

    useEffect(() => {
        if (assignmentPage > assignmentTotalPages) {
            setAssignmentPage(assignmentTotalPages);
        }
    }, [assignmentPage, assignmentTotalPages]);

    const openNewProjectModal = () => {
        setProjectModal({
            mode: "create",
            data: {
                id: generateNextId("PRJ", projectRows),
                name: "",
                client: "",
                startDate: "May 01, 2026",
                dueDate: "May 30, 2026",
                images: "0",
                progress: 0,
                status: "In Progress",
            },
        });
    };

    const openNewAssignmentModal = () => {
        const firstProjectName = projectRows[0]?.name || "";

        setAssignmentModal({
            mode: "create",
            data: {
                id: generateNextId("ASG", assignmentRows),
                project: firstProjectName,
                taskType: "",
                assignedTo: "",
                assignedDate: "May 01, 2026",
                dueDate: "May 30, 2026",
                priority: "Medium",
                status: "In Progress",
            },
        });
    };

    const saveProject = async (project) => {
        const cleanProject = {
            ...project,
            id: project.id || generateNextId("PRJ", projectRows),
            name: project.name.trim() || "Untitled Project",
            client: project.client.trim() || "Unassigned Client",
        };

        if (getUseApiDataSetting()) {
            try {
                if (projectModal.mode === "create") {
                    await apiPlaceholders.createProject(cleanProject);
                } else {
                    await apiPlaceholders.updateProject(cleanProject.id, cleanProject);
                }
            } catch (apiError) {
                console.warn("Project API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setProjectRows((currentRows) => {
            if (projectModal.mode === "create") {
                return [cleanProject, ...currentRows];
            }

            return currentRows.map((row) => row.id === cleanProject.id ? cleanProject : row);
        });
        setProjectPage(1);
        setProjectModal(null);
    };

    const saveAssignment = async (assignment) => {
        const cleanAssignment = {
            ...assignment,
            id: assignment.id || generateNextId("ASG", assignmentRows),
            taskType: assignment.taskType.trim() || "General Task",
            assignedTo: assignment.assignedTo.trim() || "Unassigned",
        };

        if (getUseApiDataSetting()) {
            try {
                if (assignmentModal.mode === "create") {
                    await apiPlaceholders.createAssignment(cleanAssignment);
                } else {
                    await apiPlaceholders.updateAssignment(cleanAssignment.id, cleanAssignment);
                }
            } catch (apiError) {
                console.warn("Assignment API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setAssignmentRows((currentRows) => {
            if (assignmentModal.mode === "create") {
                return [cleanAssignment, ...currentRows];
            }

            return currentRows.map((row) => row.id === cleanAssignment.id ? cleanAssignment : row);
        });
        setAssignmentPage(1);
        setAssignmentModal(null);
    };

    const deleteProject = async (project) => {
        if (!window.confirm(`Delete ${project.name}?`)) return;

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteProject(project.id);
            } catch (apiError) {
                console.warn("Project delete API endpoint is not connected yet. Deleting locally.", apiError);
            }
        }

        setProjectRows((currentRows) => currentRows.filter((row) => row.id !== project.id));
    };

    const deleteAssignment = async (assignment) => {
        if (!window.confirm(`Delete ${assignment.id}?`)) return;

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteAssignment(assignment.id);
            } catch (apiError) {
                console.warn("Assignment delete API endpoint is not connected yet. Deleting locally.", apiError);
            }
        }

        setAssignmentRows((currentRows) => currentRows.filter((row) => row.id !== assignment.id));
    };

    const handleProjectSort = (columnKey) => {
        setProjectSort((currentSort) => getNextSort(currentSort, columnKey));
        setProjectPage(1);
    };

    const handleAssignmentSort = (columnKey) => {
        setAssignmentSort((currentSort) => getNextSort(currentSort, columnKey));
        setAssignmentPage(1);
    };

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">

            {/* Projects table */}
            <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                        <Folder size={26} /> Projects
                    </h2>

                    <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                        <button
                            type="button"
                            onClick={() => downloadProjectsReport(projectRows, assignmentRows)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
                        >
                            <Download size={16} /> Export Report
                        </button>

                        <button
                            type="button"
                            onClick={openNewProjectModal}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 sm:w-auto"
                        >
                            <Plus size={16} /> New Project
                        </button>
                    </div>
                </div>

                <table className="min-w-[900px] w-full border-collapse text-sm">
                    <thead className="bg-slate-200 text-slate-800">
                    <tr>
                        {PROJECT_COLUMNS.map((column) => (
                            <SortableHeader
                                key={column.key}
                                column={column}
                                sortConfig={projectSort}
                                onSort={handleProjectSort}
                            />
                        ))}
                        <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {visibleProjectRows.map((project) => (
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
                                <RowActions
                                    onEdit={() => setProjectModal({ mode: "edit", data: project })}
                                    onDelete={() => deleteProject(project)}
                                />
                            </td>
                        </tr>
                    ))}

                    {visibleProjectRows.length === 0 && (
                        <tr>
                            <td colSpan={8} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                No projects found.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>

                <TableFooter
                    text={getRangeText(projectPage, PROJECTS_PAGE_SIZE, sortedProjectRows.length, "projects")}
                    currentPage={projectPage}
                    totalPages={projectTotalPages}
                    onPageChange={setProjectPage}
                />
            </div>

            {/* Assignments table */}
            <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                        <ListChecks size={26} /> Assignments
                    </h2>

                    <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                        <FilterSelect
                            value={projectFilter}
                            onChange={(value) => {
                                setProjectFilter(value);
                                setAssignmentPage(1);
                            }}
                            options={projectOptions}
                        />
                        <FilterSelect
                            value={employeeFilter}
                            onChange={(value) => {
                                setEmployeeFilter(value);
                                setAssignmentPage(1);
                            }}
                            options={employeeOptions}
                        />
                        <FilterSelect
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(value);
                                setAssignmentPage(1);
                            }}
                            options={statusOptions}
                        />

                        <button
                            type="button"
                            onClick={openNewAssignmentModal}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 sm:w-auto"
                        >
                            <Plus size={16} /> New Assignment
                        </button>
                    </div>
                </div>

                <table className="min-w-[900px] w-full border-collapse text-sm">
                    <thead className="bg-slate-200 text-slate-800">
                    <tr>
                        {ASSIGNMENT_COLUMNS.map((column) => (
                            <SortableHeader
                                key={column.key}
                                column={column}
                                sortConfig={assignmentSort}
                                onSort={handleAssignmentSort}
                            />
                        ))}
                        <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {visibleAssignmentRows.map((assignment) => (
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
                                <RowActions
                                    onEdit={() => setAssignmentModal({ mode: "edit", data: assignment })}
                                    onDelete={() => deleteAssignment(assignment)}
                                />
                            </td>
                        </tr>
                    ))}

                    {visibleAssignmentRows.length === 0 && (
                        <tr>
                            <td colSpan={9} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                No assignments found for the selected filters.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>

                <TableFooter
                    text={getRangeText(assignmentPage, ASSIGNMENTS_PAGE_SIZE, sortedAssignmentRows.length, "assignments")}
                    currentPage={assignmentPage}
                    totalPages={assignmentTotalPages}
                    onPageChange={setAssignmentPage}
                />
            </div>

            {projectModal && (
                <Modal
                    title={projectModal.mode === "create" ? "New Project" : "Edit Project"}
                    onClose={() => setProjectModal(null)}
                >
                    <ProjectForm
                        initialProject={projectModal.data}
                        onCancel={() => setProjectModal(null)}
                        onSave={saveProject}
                    />
                </Modal>
            )}

            {assignmentModal && (
                <Modal
                    title={assignmentModal.mode === "create" ? "New Assignment" : "Edit Assignment"}
                    onClose={() => setAssignmentModal(null)}
                >
                    <AssignmentForm
                        initialAssignment={assignmentModal.data}
                        projectOptions={["All Projects", ...projectRows.map((project) => project.name)]}
                        employeeOptions={employeeOptions}
                        onCancel={() => setAssignmentModal(null)}
                        onSave={saveAssignment}
                    />
                </Modal>
            )}
        </section>
    );
}

/**
 * Role-aware projects page that limits employee users to their assigned projects and assignments.
 */
function ProjectsAndAssignmentsSecure({ currentUser, globalSearch = "" }) {
    const { data: loadedProjectRows } = useApiPlaceholder(API_ENDPOINTS.projects, projects);
    const { data: loadedAssignmentRows } = useApiPlaceholder(API_ENDPOINTS.assignments, assignments);

    const [projectRows, setProjectRows] = useState(projects);
    const [assignmentRows, setAssignmentRows] = useState(assignments);
    const [projectSort, setProjectSort] = useState({ key: "name", direction: "asc" });
    const [assignmentSort, setAssignmentSort] = useState({ key: "id", direction: "asc" });
    const [projectPage, setProjectPage] = useState(1);
    const [assignmentPage, setAssignmentPage] = useState(1);
    const [projectFilter, setProjectFilter] = useState("All Projects");
    const [employeeFilter, setEmployeeFilter] = useState("All Employees");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [projectModal, setProjectModal] = useState(null);
    const [assignmentModal, setAssignmentModal] = useState(null);
    const hasManagerAccess = canManageContent(currentUser);

    useEffect(() => {
        if (Array.isArray(loadedProjectRows)) {
            setProjectRows(loadedProjectRows);
        }
    }, [loadedProjectRows]);

    useEffect(() => {
        if (Array.isArray(loadedAssignmentRows)) {
            setAssignmentRows(loadedAssignmentRows);
        }
    }, [loadedAssignmentRows]);

    const accessibleProjectRows = useMemo(
        () => filterRowsByAccess(projectRows, currentUser, "projects"),
        [projectRows, currentUser]
    );

    const accessibleAssignmentRows = useMemo(
        () => filterRowsByAccess(assignmentRows, currentUser, "assignments"),
        [assignmentRows, currentUser]
    );

    const projectOptions = useMemo(
        () => getUniqueOptions(accessibleAssignmentRows, "project", "All Projects"),
        [accessibleAssignmentRows]
    );

    const employeeOptions = useMemo(
        () => hasManagerAccess
            ? getUniqueOptions(accessibleAssignmentRows, "assignedTo", "All Employees")
            : ["All Employees", currentUser?.employeeName || currentUser?.name].filter(Boolean),
        [accessibleAssignmentRows, hasManagerAccess, currentUser]
    );

    const statusOptions = useMemo(
        () => getUniqueOptions(accessibleAssignmentRows, "status", "All Status"),
        [accessibleAssignmentRows]
    );

    const filteredProjectRows = useMemo(() => {
        return accessibleProjectRows.filter((project) => rowMatchesSearch(project, globalSearch, [
            "id",
            "name",
            "client",
            "startDate",
            "dueDate",
            "images",
            "progress",
            "status",
        ]));
    }, [accessibleProjectRows, globalSearch]);

    const filteredAssignmentRows = useMemo(() => {
        return accessibleAssignmentRows.filter((assignment) => {
            const matchesProject = projectFilter === "All Projects" || assignment.project === projectFilter;
            const matchesEmployee = employeeFilter === "All Employees" || assignment.assignedTo === employeeFilter;
            const matchesStatus = statusFilter === "All Status" || assignment.status === statusFilter;
            const matchesSearch = rowMatchesSearch(assignment, globalSearch, [
                "id",
                "project",
                "taskType",
                "assignedTo",
                "assignedDate",
                "dueDate",
                "priority",
                "status",
            ]);
            return matchesProject && matchesEmployee && matchesStatus && matchesSearch;
        });
    }, [accessibleAssignmentRows, projectFilter, employeeFilter, statusFilter, globalSearch]);

    const sortedProjectRows = useMemo(
        () => sortRows(filteredProjectRows, projectSort),
        [filteredProjectRows, projectSort]
    );

    const sortedAssignmentRows = useMemo(
        () => sortRows(filteredAssignmentRows, assignmentSort),
        [filteredAssignmentRows, assignmentSort]
    );

    const projectTotalPages = getTotalPages(sortedProjectRows.length, PROJECTS_PAGE_SIZE);
    const assignmentTotalPages = getTotalPages(sortedAssignmentRows.length, ASSIGNMENTS_PAGE_SIZE);
    const visibleProjectRows = paginateRows(sortedProjectRows, projectPage, PROJECTS_PAGE_SIZE);
    const visibleAssignmentRows = paginateRows(sortedAssignmentRows, assignmentPage, ASSIGNMENTS_PAGE_SIZE);

    useEffect(() => {
        if (projectPage > projectTotalPages) {
            setProjectPage(projectTotalPages);
        }
    }, [projectPage, projectTotalPages]);

    useEffect(() => {
        if (assignmentPage > assignmentTotalPages) {
            setAssignmentPage(assignmentTotalPages);
        }
    }, [assignmentPage, assignmentTotalPages]);

    const openNewProjectModal = () => {
        if (!hasManagerAccess) return;
        setProjectModal({
            mode: "create",
            data: {
                id: generateNextId("PRJ", projectRows),
                name: "",
                client: "",
                startDate: "May 01, 2026",
                dueDate: "May 30, 2026",
                images: "0",
                progress: 0,
                status: "In Progress",
            },
        });
    };

    const openNewAssignmentModal = () => {
        if (!hasManagerAccess) return;
        const firstProjectName = projectRows[0]?.name || "";
        setAssignmentModal({
            mode: "create",
            data: {
                id: generateNextId("ASG", assignmentRows),
                project: firstProjectName,
                taskType: "",
                assignedTo: "",
                assignedDate: "May 01, 2026",
                dueDate: "May 30, 2026",
                priority: "Medium",
                status: "In Progress",
            },
        });
    };

    const saveProject = async (project) => {
        if (!hasManagerAccess) return;
        const cleanProject = {
            ...project,
            id: project.id || generateNextId("PRJ", projectRows),
            name: project.name.trim() || "Untitled Project",
            client: project.client.trim() || "Unassigned Client",
        };

        if (getUseApiDataSetting()) {
            try {
                if (projectModal.mode === "create") {
                    await apiPlaceholders.createProject(cleanProject);
                } else {
                    await apiPlaceholders.updateProject(cleanProject.id, cleanProject);
                }
            } catch (apiError) {
                console.warn("Project API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setProjectRows((currentRows) => projectModal.mode === "create"
            ? [cleanProject, ...currentRows]
            : currentRows.map((row) => row.id === cleanProject.id ? cleanProject : row)
        );
        setProjectPage(1);
        setProjectModal(null);
    };

    const saveAssignment = async (assignment) => {
        if (!hasManagerAccess) return;
        const cleanAssignment = {
            ...assignment,
            id: assignment.id || generateNextId("ASG", assignmentRows),
            taskType: assignment.taskType.trim() || "General Task",
            assignedTo: assignment.assignedTo.trim() || "Unassigned",
        };

        if (getUseApiDataSetting()) {
            try {
                if (assignmentModal.mode === "create") {
                    await apiPlaceholders.createAssignment(cleanAssignment);
                } else {
                    await apiPlaceholders.updateAssignment(cleanAssignment.id, cleanAssignment);
                }
            } catch (apiError) {
                console.warn("Assignment API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setAssignmentRows((currentRows) => assignmentModal.mode === "create"
            ? [cleanAssignment, ...currentRows]
            : currentRows.map((row) => row.id === cleanAssignment.id ? cleanAssignment : row)
        );
        setAssignmentPage(1);
        setAssignmentModal(null);
    };

    const deleteProject = async (project) => {
        if (!hasManagerAccess || !window.confirm(`Delete ${project.name}?`)) return;
        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteProject(project.id);
            } catch (apiError) {
                console.warn("Project delete API endpoint is not connected yet. Deleting locally.", apiError);
            }
        }
        setProjectRows((currentRows) => currentRows.filter((row) => row.id !== project.id));
    };

    const deleteAssignment = async (assignment) => {
        if (!hasManagerAccess || !window.confirm(`Delete ${assignment.id}?`)) return;
        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteAssignment(assignment.id);
            } catch (apiError) {
                console.warn("Assignment delete API endpoint is not connected yet. Deleting locally.", apiError);
            }
        }
        setAssignmentRows((currentRows) => currentRows.filter((row) => row.id !== assignment.id));
    };

    const handleProjectSort = (columnKey) => {
        setProjectSort((currentSort) => getNextSort(currentSort, columnKey));
        setProjectPage(1);
    };

    const handleAssignmentSort = (columnKey) => {
        setAssignmentSort((currentSort) => getNextSort(currentSort, columnKey));
        setAssignmentPage(1);
    };

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">
            {!hasManagerAccess && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm font-semibold text-violet-800">
                    Employee view: only projects and assignments connected to your login are shown.
                </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                        <Folder size={26} /> Projects
                    </h2>
                    {hasManagerAccess && (
                        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                            <button
                                type="button"
                                onClick={() => downloadProjectsReport(projectRows, assignmentRows)}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
                            >
                                <Download size={16} /> Export Report
                            </button>
                            <button
                                type="button"
                                onClick={openNewProjectModal}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 sm:w-auto"
                            >
                                <Plus size={16} /> New Project
                            </button>
                        </div>
                    )}
                </div>

                {globalSearch && (
                    <div className="border-b border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">
                        Search results for “{globalSearch}”
                    </div>
                )}

                <table className="min-w-[900px] w-full border-collapse text-sm">
                    <thead className="bg-slate-200 text-slate-800">
                    <tr>
                        {PROJECT_COLUMNS.map((column) => (
                            <SortableHeader key={column.key} column={column} sortConfig={projectSort} onSort={handleProjectSort} />
                        ))}
                        {hasManagerAccess && <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>}
                    </tr>
                    </thead>
                    <tbody>
                    {visibleProjectRows.map((project) => (
                        <tr key={project.id} className="hover:bg-slate-50">
                            <td className="border border-slate-300 px-4 py-3">
                                <div className="font-semibold text-slate-900">{project.name}</div>
                                <div className="text-xs text-slate-500">{project.id}</div>
                            </td>
                            <td className="border border-slate-300 px-4 py-3">{project.client}</td>
                            <td className="border border-slate-300 px-4 py-3">{project.startDate}</td>
                            <td className="border border-slate-300 px-4 py-3">{project.dueDate}</td>
                            <td className="border border-slate-300 px-4 py-3 text-center">{project.images}</td>
                            <td className="border border-slate-300 px-4 py-3"><ProgressBar value={project.progress} /></td>
                            <td className="border border-slate-300 px-4 py-3 text-center"><Badge value={project.status} /></td>
                            {hasManagerAccess && (
                                <td className="border border-slate-300 px-4 py-3">
                                    <RowActions onEdit={() => setProjectModal({ mode: "edit", data: project })} onDelete={() => deleteProject(project)} />
                                </td>
                            )}
                        </tr>
                    ))}
                    {visibleProjectRows.length === 0 && (
                        <tr>
                            <td colSpan={hasManagerAccess ? 8 : 7} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                No projects found for the selected access level or search.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                <TableFooter text={getRangeText(projectPage, PROJECTS_PAGE_SIZE, sortedProjectRows.length, "projects")} currentPage={projectPage} totalPages={projectTotalPages} onPageChange={setProjectPage} />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                        <ListChecks size={26} /> Assignments
                    </h2>
                    {hasManagerAccess && (
                        <button
                            type="button"
                            onClick={openNewAssignmentModal}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 sm:w-auto"
                        >
                            <Plus size={16} /> New Assignment
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-5 py-4 md:grid-cols-[auto_auto_auto] md:items-center">
                    <FilterSelect value={projectFilter} onChange={(value) => { setProjectFilter(value); setAssignmentPage(1); }} options={projectOptions} />
                    {hasManagerAccess && (
                        <FilterSelect value={employeeFilter} onChange={(value) => { setEmployeeFilter(value); setAssignmentPage(1); }} options={employeeOptions} />
                    )}
                    <FilterSelect value={statusFilter} onChange={(value) => { setStatusFilter(value); setAssignmentPage(1); }} options={statusOptions} />
                </div>

                <table className="min-w-[900px] w-full border-collapse text-sm">
                    <thead className="bg-slate-200 text-slate-800">
                    <tr>
                        {ASSIGNMENT_COLUMNS.map((column) => (
                            <SortableHeader key={column.key} column={column} sortConfig={assignmentSort} onSort={handleAssignmentSort} />
                        ))}
                        {hasManagerAccess && <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>}
                    </tr>
                    </thead>
                    <tbody>
                    {visibleAssignmentRows.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-slate-50">
                            <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">{assignment.id}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.project}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.taskType}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.assignedTo}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.assignedDate}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.dueDate}</td>
                            <td className="border border-slate-300 px-4 py-3 text-center"><PriorityBadge value={assignment.priority} /></td>
                            <td className="border border-slate-300 px-4 py-3 text-center"><Badge value={assignment.status} /></td>
                            {hasManagerAccess && (
                                <td className="border border-slate-300 px-4 py-3">
                                    <RowActions onEdit={() => setAssignmentModal({ mode: "edit", data: assignment })} onDelete={() => deleteAssignment(assignment)} />
                                </td>
                            )}
                        </tr>
                    ))}
                    {visibleAssignmentRows.length === 0 && (
                        <tr>
                            <td colSpan={hasManagerAccess ? 9 : 8} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                No assignments found for the selected filters.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                <TableFooter text={getRangeText(assignmentPage, ASSIGNMENTS_PAGE_SIZE, sortedAssignmentRows.length, "assignments")} currentPage={assignmentPage} totalPages={assignmentTotalPages} onPageChange={setAssignmentPage} />
            </div>

            {projectModal && (
                <Modal title={projectModal.mode === "create" ? "New Project" : "Edit Project"} onClose={() => setProjectModal(null)}>
                    <ProjectForm initialProject={projectModal.data} onCancel={() => setProjectModal(null)} onSave={saveProject} />
                </Modal>
            )}

            {assignmentModal && (
                <Modal title={assignmentModal.mode === "create" ? "New Assignment" : "Edit Assignment"} onClose={() => setAssignmentModal(null)}>
                    <AssignmentForm initialAssignment={assignmentModal.data} projectOptions={["All Projects", ...projectRows.map((project) => project.name)]} employeeOptions={employeeOptions} onCancel={() => setAssignmentModal(null)} onSave={saveAssignment} />
                </Modal>
            )}
        </section>
    );
}

export {
    ProjectsAndAssignments,
    ProjectsAndAssignmentsSecure,
};
