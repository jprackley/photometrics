// -----------------------------------------------------------------------------
// Projects and Assigned Tasks Page.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import {
    Download,
    Folder,
    ListChecks,
    Plus,
    Search,
} from "lucide-react";


import { Logo } from "../components/Layout";
import {
    API_ENDPOINTS,
    apiPlaceholders,
    getUseApiDataSetting,
    normalizeProjectRows,
    normalizeEmployeeRows,
    normalizeTaskRows,
    projectToApi,
    useApiPlaceholder,
} from "../services/api";
import {
    employees,
    projects,
    taskItems,
    workflow,
} from "../data/mockData";
import {
    ASSIGNMENTS_PAGE_SIZE,
    ASSIGNMENT_COLUMNS,
    PROJECTS_PAGE_SIZE,
    PROJECT_COLUMNS,
    downloadProjectsReport,
    formatTaskId,
    generateNextId,
    getNextSort,
    getRangeText,
    getTotalPages,
    getUniqueOptions,
    normalizeNumber,
    normalizeTaskForTimers,
    paginateRows,
    sortRows,
} from "../utils/helpers";

import {
    canManageContent,
    filterRowsByAccess,
    rowMatchesSearch,
} from "../utils/accessControl";
import { notifyError } from "../utils/notifications";
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
 * Calculates project completion percentage from image workflow counts.
 */
const calculateProjectProgress = (project = {}) => {
    const totalImages = normalizeNumber(project.images);
    const completedImages = normalizeNumber(project.completedImages);

    if (totalImages <= 0) {
        return 0;
    }

    return Math.max(0, Math.min(100, Math.round((completedImages / totalImages) * 100)));
};

const normalizeLookupId = (value) => String(value || "").trim().toLowerCase();

const buildNameLookup = (rows = [], idKeys = [], nameKeys = []) => {
    const lookup = new Map();

    rows.forEach((row) => {
        const name = nameKeys.map((key) => row?.[key]).find(Boolean);
        if (!name) return;

        idKeys
            .map((key) => normalizeLookupId(row?.[key]))
            .filter(Boolean)
            .forEach((id) => lookup.set(id, name));
    });

    return lookup;
};

const getLookupName = (lookup, id, fallback) => {
    const resolvedName = lookup.get(normalizeLookupId(id));
    return resolvedName || fallback;
};

/**
 * Converts a task record into the assignment-table row shape.
 */
function taskToAssignedTaskRow(task = {}) {
    const taskId = task.backendId || task.taskId || task.id;

    return {
        ...task,
        id: task.id || taskId,
        backendId: task.backendId || task.taskId || taskId,
        taskId,
        projectId: task.projectId,
        project: task.project,
        taskType: task.taskName || task.category || task.taskType || "Task",
        assignedToId: task.assignedToId,
        assignedTo: task.assignedTo || "Unassigned",
        assignedDate: task.assignedDate || task.createdAt || "",
        dueDate: task.dueDate,
        priority: task.priority || "Normal",
        status: task.status || "Assigned",
    };
}

const ASSIGNED_TASK_COLUMNS = [
    { label: "Task ID", key: "id" },
    { label: "Project", key: "project" },
    { label: "Task Name", key: "taskType" },
    { label: "Assigned To", key: "assignedTo" },
    { label: "Due Date", key: "dueDate" },
    { label: "Priority", key: "priority", align: "center" },
    { label: "Status", key: "status", align: "center" },
];

/**
 * Create/edit form for project records.
 */
function ProjectForm({ initialProject, onCancel, onSave }) {
    const [form, setForm] = useState({
        pendingImages: 0,
        inProgressImages: 0,
        completedImages: 0,
        rejectedImages: 0,
        deliveredImages: 0,
        averageEditMinutes: 0,
        reviewNotes: "",
        notes: "",
        ...initialProject,
    });

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const updateImageMetric = (field, value) => {
        const cleanValue = value === "" ? "" : Math.max(0, normalizeNumber(value));
        setForm((current) => {
            const next = { ...current, [field]: cleanValue };
            if (["pendingImages", "inProgressImages", "completedImages", "rejectedImages"].includes(field)) {
                const totalImages = ["pendingImages", "inProgressImages", "completedImages", "rejectedImages"]
                    .reduce((total, key) => total + normalizeNumber(next[key]), 0);
                next.images = String(totalImages);
                next.progress = totalImages > 0 ? Math.round((normalizeNumber(next.completedImages) / totalImages) * 100) : 0;
                next.deliveredImages = Math.min(normalizeNumber(next.deliveredImages), normalizeNumber(next.completedImages));
            }
            return next;
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const pendingImages = normalizeNumber(form.pendingImages);
        const inProgressImages = normalizeNumber(form.inProgressImages);
        const completedImages = normalizeNumber(form.completedImages);
        const rejectedImages = normalizeNumber(form.rejectedImages);
        const totalImages = pendingImages + inProgressImages + completedImages + rejectedImages;

        onSave({
            ...form,
            images: String(totalImages || normalizeNumber(form.images)),
            pendingImages,
            inProgressImages,
            completedImages,
            rejectedImages,
            deliveredImages: Math.min(normalizeNumber(form.deliveredImages), completedImages),
            averageEditMinutes: normalizeNumber(form.averageEditMinutes),
            progress: totalImages > 0 ? Math.round((completedImages / totalImages) * 100) : 0,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
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

                <FormField label="Status">
                    <select
                        value={form.status}
                        onChange={(event) => updateField("status", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>To-Do</option>
                        <option>In Progress</option>
                        <option>On Hold</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                        <option>Archived</option>
                    </select>
                </FormField>

                <FormField label="Priority">
                    <select
                        value={form.priority || "Normal"}
                        onChange={(event) => updateField("priority", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>Low</option>
                        <option>Normal</option>
                        <option>High</option>
                        <option>Urgent</option>
                    </select>
                </FormField>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex flex-col gap-1">
                    <h3 className="text-sm font-bold text-slate-900">Image Metrics</h3>
                    <p className="text-xs text-slate-500">Track project image counts by workflow status. Total images and progress are calculated automatically.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FormField label="Pending Images">
                        <TextInput value={form.pendingImages} onChange={(value) => updateImageMetric("pendingImages", value)} placeholder="0" type="number" />
                    </FormField>

                    <FormField label="In Progress Images">
                        <TextInput value={form.inProgressImages} onChange={(value) => updateImageMetric("inProgressImages", value)} placeholder="0" type="number" />
                    </FormField>

                    <FormField label="Completed Images">
                        <TextInput value={form.completedImages} onChange={(value) => updateImageMetric("completedImages", value)} placeholder="0" type="number" />
                    </FormField>

                    <FormField label="Rejected Images">
                        <TextInput value={form.rejectedImages} onChange={(value) => updateImageMetric("rejectedImages", value)} placeholder="0" type="number" />
                    </FormField>

                    <FormField label="Delivered Images">
                        <TextInput value={form.deliveredImages} onChange={(value) => updateImageMetric("deliveredImages", value)} placeholder="0" type="number" />
                    </FormField>

                    <FormField label="Avg Edit Minutes / Image">
                        <TextInput value={form.averageEditMinutes} onChange={(value) => updateImageMetric("averageEditMinutes", value)} placeholder="0" type="number" />
                    </FormField>

                    <FormField label="Total Images">
                        <TextInput value={form.images} onChange={(value) => updateField("images", value)} placeholder="0" type="number" readOnly />
                    </FormField>

                    <FormField label="Progress %">
                        <TextInput value={calculateProjectProgress(form)} placeholder="0" type="number" readOnly />
                    </FormField>

                    <div className="sm:col-span-2 lg:col-span-3">
                        <FormField label="Image Review Notes">
                            <textarea
                                value={form.reviewNotes || ""}
                                onChange={(event) => updateField("reviewNotes", event.target.value)}
                                placeholder="Notes about image quality, retouching, delivery, or review status"
                                className="min-h-[90px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                            />
                        </FormField>
                    </div>
                </div>
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
 * Create/edit form for assigned task records.
 */
function AssignmentForm({ initialAssignment, projectOptions, employeeOptions, onCancel, onSave }) {
    const [form, setForm] = useState(initialAssignment);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const selectedProject = projectOptions.find((project) => project.id === form.projectId || project.name === form.project);
        const selectedEmployee = employeeOptions.find((employee) => employee.id === form.assignedToId || employee.name === form.assignedTo);

        onSave({
            ...form,
            taskName: String(form.taskName || form.taskType || "").trim() || "General Task",
            taskType: String(form.taskName || form.taskType || "").trim() || "General Task",
            projectId: selectedProject?.id || form.projectId,
            project: selectedProject?.name || form.project,
            assignedToId: selectedEmployee?.id || form.assignedToId,
            assignedTo: selectedEmployee?.name || form.assignedTo,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Project">
                    <select
                        value={form.projectId || ""}
                        onChange={(event) => {
                            const selectedProject = projectOptions.find((project) => project.id === event.target.value);
                            updateField("projectId", selectedProject?.id || "");
                            updateField("project", selectedProject?.name || "");
                        }}
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option value="">Select project</option>
                        {projectOptions.map((project) => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Task Name">
                    <TextInput
                        value={form.taskName || form.taskType || ""}
                        onChange={(value) => {
                            updateField("taskName", value);
                            updateField("taskType", value);
                        }}
                        placeholder="Cull gallery"
                    />
                </FormField>

                <FormField label="Assigned To">
                    <select
                        value={form.assignedToId || ""}
                        onChange={(event) => {
                            const selectedEmployee = employeeOptions.find((employee) => employee.id === event.target.value);
                            updateField("assignedToId", selectedEmployee?.id || "");
                            updateField("assignedTo", selectedEmployee?.name || "");
                        }}
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option value="">Select employee</option>
                        {employeeOptions.map((employee) => (
                            <option key={employee.id} value={employee.id}>{employee.name}</option>
                        ))}
                    </select>
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
                        <option>Low</option>
                        <option>Normal</option>
                        <option>High</option>
                        <option>Urgent</option>
                    </select>
                </FormField>

                <FormField label="Status">
                    <select
                        value={form.status}
                        onChange={(event) => updateField("status", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        <option>Assigned</option>
                        <option>To-Do</option>
                        <option>In Progress</option>
                        <option>Paused</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
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
                    Save Assigned Task
                </button>
            </div>
        </form>
    );
}

// Projects + assigned tasks page
/**
 * Manager project and assigned task management page with sorting, filtering, pagination, export, and modals.
 */
function ProjectsAndAssignments() {
    const localAssignmentFallback = getUseApiDataSetting() ? [] : taskItems.map(taskToAssignedTaskRow);
    const { data: loadedProjectRows } = useApiPlaceholder(API_ENDPOINTS.projectsList, projects, {
        transformPayload: normalizeProjectRows,
    });
    const { data: loadedAssignmentRows } = useApiPlaceholder(API_ENDPOINTS.tasksList, localAssignmentFallback, {
        transformPayload: (payload) => normalizeTaskRows(payload).map(taskToAssignedTaskRow),
    });
    const { data: loadedEmployeeRows } = useApiPlaceholder(API_ENDPOINTS.usersList, employees, {
        transformPayload: normalizeEmployeeRows,
    });

    const [projectRows, setProjectRows] = useState(() => (getUseApiDataSetting() ? [] : projects));
    const [assignmentRows, setAssignmentRows] = useState(() => localAssignmentFallback);
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
        () => getUniqueOptions(projectRows, "name", "All Projects"),
        [projectRows]
    );

    const projectSelectOptions = useMemo(
        () => projectRows
            .filter((project) => project.id)
            .map((project) => ({ id: project.backendId || project.id, name: project.name })),
        [projectRows]
    );

    const employeeSelectOptions = useMemo(
        () => (Array.isArray(loadedEmployeeRows) ? loadedEmployeeRows : [])
            .filter((employee) => (employee.userId || employee.id) && (employee.accountRole || employee.role) === "Employee")
            .map((employee) => ({ id: employee.userId || employee.id, name: employee.name || employee.displayName || employee.email })),
        [loadedEmployeeRows]
    );

    const projectNameById = useMemo(
        () => buildNameLookup(
            projectRows,
            ["backendId", "projectId", "project_id", "id"],
            ["name", "projectName", "project_name"]
        ),
        [projectRows]
    );

    const employeeNameById = useMemo(
        () => buildNameLookup(
            Array.isArray(loadedEmployeeRows) ? loadedEmployeeRows : [],
            ["userId", "user_id", "employeeId", "employee_id", "backendId", "id"],
            ["name", "displayName", "display_name", "employeeName", "employee_name", "email"]
        ),
        [loadedEmployeeRows]
    );

    const resolvedAssignmentRows = useMemo(
        () => assignmentRows.map((assignment) => ({
            ...assignment,
            project: getLookupName(projectNameById, assignment.projectId || assignment.project_id, assignment.project),
            assignedTo: getLookupName(employeeNameById, assignment.assignedToId || assignment.assigned_to || assignment.employeeId || assignment.employee_id, assignment.assignedTo),
        })),
        [assignmentRows, projectNameById, employeeNameById]
    );

    const employeeOptions = useMemo(
        () => getUniqueOptions(resolvedAssignmentRows, "assignedTo", "All Employees"),
        [resolvedAssignmentRows]
    );

    const statusOptions = useMemo(
        () => getUniqueOptions(resolvedAssignmentRows, "status", "All Status"),
        [resolvedAssignmentRows]
    );

    const filteredAssignmentRows = useMemo(() => {
        return resolvedAssignmentRows.filter((assignment) => {
            const matchesProject = projectFilter === "All Projects" || assignment.project === projectFilter;
            const matchesEmployee = employeeFilter === "All Employees" || assignment.assignedTo === employeeFilter;
            const matchesStatus = statusFilter === "All Status" || assignment.status === statusFilter;
            return matchesProject && matchesEmployee && matchesStatus;
        });
    }, [resolvedAssignmentRows, projectFilter, employeeFilter, statusFilter]);

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
                pendingImages: 0,
                inProgressImages: 0,
                completedImages: 0,
                rejectedImages: 0,
                deliveredImages: 0,
                averageEditMinutes: 0,
                reviewNotes: "",
                progress: 0,
                priority: "Normal",
                status: "To-Do",
            },
        });
    };

    const openNewAssignmentModal = () => {
        const firstProject = projectRows[0];
        const firstEmployee = employeeSelectOptions[0];

        setAssignmentModal({
            mode: "create",
            data: {
                id: generateNextId("TSK", assignmentRows),
                projectId: firstProject?.backendId || firstProject?.id || "",
                project: firstProject?.name || "",
                taskType: "Other",
                taskName: "Other",
                assignedToId: firstEmployee?.id || "",
                assignedTo: firstEmployee?.name || "",
                dueDate: "May 30, 2026",
                priority: "Normal",
                status: "Assigned",
            },
        });
    };

    const saveProject = async (project) => {
        let cleanProject = {
            ...project,
            id: project.id || generateNextId("PRJ", projectRows),
            name: String(project.name || "").trim() || "Untitled Project",
            client: String(project.client || "").trim() || "Unassigned Client",
        };

        if (getUseApiDataSetting()) {
            try {
                const isCreatingProject = projectModal.mode === "create";
                const savedProject = isCreatingProject
                    ? await apiPlaceholders.createProject(projectToApi(cleanProject))
                    : await apiPlaceholders.updateProject(cleanProject.backendId || cleanProject.id, projectToApi(cleanProject));
                cleanProject = normalizeProjectRows([savedProject])[0] || cleanProject;

                if (isCreatingProject) {
                    try {
                        await apiPlaceholders.createImagesForProjectMetrics({ ...project, ...cleanProject });
                    } catch (imageError) {
                        console.warn("Project saved, but image metrics could not be created.", imageError);
                    }
                }
            } catch (apiError) {
                console.warn("Project API request failed. The project list was not changed.", apiError);
                notifyError(apiError?.message || "Project could not be saved. Please try again.", "Project not saved");
                return;
            }
        }

        setProjectRows((currentRows) => {
            if (projectModal.mode === "create") {
                return [cleanProject, ...currentRows];
            }

            return currentRows.map((row) => (row.backendId || row.id) === (cleanProject.backendId || cleanProject.id) ? cleanProject : row);
        });
        setProjectPage(1);
        setProjectModal(null);
    };

    const saveAssignment = async (assignment) => {
        let cleanAssignment = {
            ...assignment,
            id: assignment.backendId || assignment.taskId || assignment.id || generateNextId("TSK", assignmentRows),
            taskName: assignment.taskName || assignment.taskType || "General Task",
            taskType: String(assignment.taskType || "Other").trim() || "Other",
            category: assignment.category || assignment.taskType || "Other",
            assignedTo: String(assignment.assignedTo || "").trim() || "Unassigned",
        };

        if (getUseApiDataSetting()) {
            try {
                const savedAssignment = assignmentModal.mode === "create"
                    ? await apiPlaceholders.createTask(cleanAssignment)
                    : await apiPlaceholders.updateTask(cleanAssignment.backendId || cleanAssignment.taskId || cleanAssignment.id, cleanAssignment);
                cleanAssignment = taskToAssignedTaskRow(normalizeTaskRows(savedAssignment)[0] || savedAssignment || cleanAssignment);
            } catch (apiError) {
                console.warn("Task API request failed. The assigned task list was not changed.", apiError);
                notifyError(apiError?.message || "Assigned task could not be saved. Please try again.", "Task not saved");
                return;
            }
        }

        setAssignmentRows((currentRows) => {
            if (assignmentModal.mode === "create") {
                return [cleanAssignment, ...currentRows];
            }

            return currentRows.map((row) => (row.backendId || row.taskId || row.id) === (cleanAssignment.backendId || cleanAssignment.taskId || cleanAssignment.id) ? cleanAssignment : row);
        });
        setAssignmentPage(1);
        setAssignmentModal(null);
    };

    const deleteProject = async (project) => {
        if (!window.confirm(`Delete ${project.name}?`)) return;

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteProject(project.backendId || project.id);
            } catch (apiError) {
                console.warn("Project delete API request failed. The project list was not changed.", apiError);
                notifyError(apiError?.message || "Project could not be deleted. Please try again.", "Project not deleted");
                return;
            }
        }

        setProjectRows((currentRows) => currentRows.filter((row) => row.id !== project.id));
    };

    const deleteAssignment = async (assignment) => {
        if (!window.confirm(`Delete ${assignment.taskName || assignment.taskType || assignment.id}?`)) return;

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteTask(assignment.backendId || assignment.taskId || assignment.id);
            } catch (apiError) {
                console.warn("Task delete API request failed. The assigned task list was not changed.", apiError);
                notifyError(apiError?.message || "Assigned task could not be deleted. Please try again.", "Task not deleted");
                return;
            }
        }

        setAssignmentRows((currentRows) => currentRows.filter((row) => (row.backendId || row.taskId || row.id) !== (assignment.backendId || assignment.taskId || assignment.id)));
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
                            onClick={() => downloadProjectsReport(projectRows, resolvedAssignmentRows)}
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
                            </td>

                            <td className="border border-slate-300 px-4 py-3">{project.client}</td>
                            <td className="border border-slate-300 px-4 py-3">{project.startDate}</td>
                            <td className="border border-slate-300 px-4 py-3">{project.dueDate}</td>
                            <td className="border border-slate-300 px-4 py-3 text-center">
                                <div className="font-semibold text-slate-900">{normalizeNumber(project.images)} total</div>
                                <div className="mt-1 text-[11px] leading-4 text-slate-500">
                                    {normalizeNumber(project.completedImages)} complete
                                </div>
                            </td>

                            <td className="border border-slate-300 px-4 py-3">
                                <ProgressBar value={calculateProjectProgress(project)} />
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

            {/* Assigned tasks table */}
            <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                        <ListChecks size={26} /> Assigned Tasks
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
                            <Plus size={16} /> New Assigned Task
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
                        <tr key={assignment.backendId || assignment.id} className="hover:bg-slate-50">
                            <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">
                                {formatTaskId(assignment.displayId || assignment.id)}
                            </td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.project}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.taskType}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.assignedTo}</td>
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
                            <td colSpan={8} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                No assigned tasks found for the selected filters.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>

                <TableFooter
                    text={getRangeText(assignmentPage, ASSIGNMENTS_PAGE_SIZE, sortedAssignmentRows.length, "assigned tasks")}
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
                    title={assignmentModal.mode === "create" ? "New Assigned Task" : "Edit Assigned Task"}
                    onClose={() => setAssignmentModal(null)}
                >
                    <AssignmentForm
                        initialAssignment={assignmentModal.data}
                        projectOptions={projectSelectOptions}
                        employeeOptions={employeeSelectOptions}
                        onCancel={() => setAssignmentModal(null)}
                        onSave={saveAssignment}
                    />
                </Modal>
            )}
        </section>
    );
}

/**
 * Role-aware projects page that limits employee users to projects connected to directly assigned tasks.
 */
function ProjectsAndAssignmentsSecure({ currentUser, globalSearch = "" }) {
    const localTaskFallback = getUseApiDataSetting() ? [] : taskItems;
    const { data: loadedProjectRows } = useApiPlaceholder(API_ENDPOINTS.projectsList, projects, {
        transformPayload: normalizeProjectRows,
    });
    const { data: loadedTaskRows } = useApiPlaceholder(API_ENDPOINTS.tasksList, localTaskFallback, {
        transformPayload: normalizeTaskRows,
    });
    const { data: loadedEmployeeRows } = useApiPlaceholder(API_ENDPOINTS.usersList, employees, {
        transformPayload: normalizeEmployeeRows,
    });

    const [projectRows, setProjectRows] = useState(() => (getUseApiDataSetting() ? [] : projects));
    const [assignmentRows, setAssignmentRows] = useState(() => localTaskFallback.map(taskToAssignedTaskRow));
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
        if (Array.isArray(loadedTaskRows)) {
            setAssignmentRows(loadedTaskRows.map(taskToAssignedTaskRow));
        }
    }, [loadedTaskRows]);

    const projectNameById = useMemo(
        () => buildNameLookup(
            projectRows,
            ["backendId", "projectId", "project_id", "id"],
            ["name", "projectName", "project_name"]
        ),
        [projectRows]
    );

    const employeeNameById = useMemo(
        () => buildNameLookup(
            Array.isArray(loadedEmployeeRows) ? loadedEmployeeRows : [],
            ["userId", "user_id", "employeeId", "employee_id", "backendId", "id"],
            ["name", "displayName", "display_name", "employeeName", "employee_name", "email"]
        ),
        [loadedEmployeeRows]
    );

    const resolvedAssignmentRows = useMemo(
        () => assignmentRows.map((assignment) => ({
            ...assignment,
            project: getLookupName(projectNameById, assignment.projectId || assignment.project_id, assignment.project),
            assignedTo: getLookupName(employeeNameById, assignment.assignedToId || assignment.assigned_to || assignment.employeeId || assignment.employee_id, assignment.assignedTo),
        })),
        [assignmentRows, projectNameById, employeeNameById]
    );

    const accessibleAssignmentRows = useMemo(
        () => filterRowsByAccess(resolvedAssignmentRows, currentUser, "tasks"),
        [resolvedAssignmentRows, currentUser]
    );

    const accessibleProjectRows = useMemo(() => {
        if (hasManagerAccess) return projectRows;

        const assignedProjectNames = [...new Set(accessibleAssignmentRows.map((task) => task.project).filter(Boolean))];
        return projectRows.filter((project) => assignedProjectNames.includes(project.name));
    }, [projectRows, accessibleAssignmentRows, hasManagerAccess]);

    const projectOptions = useMemo(
        () => getUniqueOptions(accessibleProjectRows, "name", "All Projects"),
        [accessibleProjectRows]
    );

    const employeeOptions = useMemo(
        () => hasManagerAccess
            ? getUniqueOptions(accessibleAssignmentRows, "assignedTo", "All Employees")
            : ["All Employees", currentUser?.employeeName || currentUser?.name].filter(Boolean),
        [accessibleAssignmentRows, hasManagerAccess, currentUser]
    );

    const projectSelectOptions = useMemo(
        () => projectRows
            .filter((project) => project.id)
            .map((project) => ({ id: project.backendId || project.id, name: project.name })),
        [projectRows]
    );

    const employeeSelectOptions = useMemo(
        () => (Array.isArray(loadedEmployeeRows) ? loadedEmployeeRows : [])
            .filter((employee) => (employee.userId || employee.id) && (employee.accountRole || employee.role) === "Employee")
            .map((employee) => ({ id: employee.userId || employee.id, name: employee.name || employee.displayName || employee.email })),
        [loadedEmployeeRows]
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
        const firstProject = projectRows[0];
        const firstEmployee = employeeSelectOptions[0];
        setAssignmentModal({
            mode: "create",
        data: {
                id: generateNextId("TSK", assignmentRows),
                projectId: firstProject?.backendId || firstProject?.id || "",
                project: firstProject?.name || "",
                taskType: "Other",
                taskName: "Other",
                assignedToId: firstEmployee?.id || "",
                assignedTo: firstEmployee?.name || "",
                dueDate: "May 30, 2026",
                priority: "Normal",
                status: "Assigned",
            },
        });
    };

    const saveProject = async (project) => {
        if (!hasManagerAccess) return;
        let cleanProject = {
            ...project,
            id: project.id || generateNextId("PRJ", projectRows),
            name: String(project.name || "").trim() || "Untitled Project",
            client: String(project.client || "").trim() || "Unassigned Client",
        };

        if (getUseApiDataSetting()) {
            try {
                const isCreatingProject = projectModal.mode === "create";
                const savedProject = isCreatingProject
                    ? await apiPlaceholders.createProject(projectToApi(cleanProject))
                    : await apiPlaceholders.updateProject(cleanProject.backendId || cleanProject.id, projectToApi(cleanProject));
                cleanProject = normalizeProjectRows([savedProject])[0] || cleanProject;

                if (isCreatingProject) {
                    try {
                        await apiPlaceholders.createImagesForProjectMetrics({ ...project, ...cleanProject });
                    } catch (imageError) {
                        console.warn("Project saved, but image metrics could not be created.", imageError);
                    }
                }
            } catch (apiError) {
                console.warn("Project API request failed. The project list was not changed.", apiError);
                notifyError(apiError?.message || "Project could not be saved. Please try again.", "Project not saved");
                return;
            }
        }

        setProjectRows((currentRows) => {
            if (projectModal.mode === "create") {
                return [cleanProject, ...currentRows];
            }

            return currentRows.map((row) => (row.backendId || row.id) === (cleanProject.backendId || cleanProject.id) ? cleanProject : row);
        });
        setProjectPage(1);
        setProjectModal(null);
    };

    const saveAssignment = async (assignment) => {
        if (!hasManagerAccess) return;
        let cleanAssignment = normalizeTaskForTimers({
            ...assignment,
            id: assignment.backendId || assignment.taskId || assignment.id || generateNextId("TSK", assignmentRows),
            taskName: assignment.taskName || assignment.taskType || "General Task",
            taskType: String(assignment.taskType || "Other").trim() || "Other",
            category: assignment.category || assignment.taskType || "Other",
            assignedTo: String(assignment.assignedTo || "").trim() || "Unassigned",
        });

        if (getUseApiDataSetting()) {
            try {
                const savedAssignment = assignmentModal.mode === "create"
                    ? await apiPlaceholders.createTask(cleanAssignment)
                    : await apiPlaceholders.updateTask(cleanAssignment.backendId || cleanAssignment.taskId || cleanAssignment.id, cleanAssignment);
                cleanAssignment = taskToAssignedTaskRow(normalizeTaskRows(savedAssignment)[0] || savedAssignment || cleanAssignment);
            } catch (apiError) {
                console.warn("Task API request failed. The assigned task list was not changed.", apiError);
                notifyError(apiError?.message || "Assigned task could not be saved. Please try again.", "Task not saved");
                return;
            }
        }

        cleanAssignment = taskToAssignedTaskRow(cleanAssignment);

        setAssignmentRows((currentRows) => {
            if (assignmentModal.mode === "create") {
                return [cleanAssignment, ...currentRows];
            }

            return currentRows.map((row) => (row.backendId || row.taskId || row.id) === (cleanAssignment.backendId || cleanAssignment.taskId || cleanAssignment.id) ? cleanAssignment : row);
        });
        setAssignmentPage(1);
        setAssignmentModal(null);
    };

    const deleteProject = async (project) => {
        if (!hasManagerAccess || !window.confirm(`Delete ${project.name}?`)) return;
        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteProject(project.backendId || project.id);
            } catch (apiError) {
                console.warn("Project delete API request failed. The project list was not changed.", apiError);
                notifyError(apiError?.message || "Project could not be deleted. Please try again.", "Project not deleted");
                return;
            }
        }
        setProjectRows((currentRows) => currentRows.filter((row) => row.id !== project.id));
    };

    const deleteAssignment = async (assignment) => {
        if (!hasManagerAccess || !window.confirm(`Delete ${assignment.taskName || assignment.taskType || assignment.id}?`)) return;
        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteTask(assignment.backendId || assignment.taskId || assignment.id);
            } catch (apiError) {
                console.warn("Task delete API request failed. The assigned task list was not changed.", apiError);
                notifyError(apiError?.message || "Assigned task could not be deleted. Please try again.", "Task not deleted");
                return;
            }
        }
        setAssignmentRows((currentRows) => currentRows.filter((row) => (row.backendId || row.taskId || row.id) !== (assignment.backendId || assignment.taskId || assignment.id)));
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
                    Employee view: only projects connected to tasks assigned directly to your login are shown.
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
                                onClick={() => downloadProjectsReport(projectRows, resolvedAssignmentRows)}
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
                            </td>
                            <td className="border border-slate-300 px-4 py-3">{project.client}</td>
                            <td className="border border-slate-300 px-4 py-3">{project.startDate}</td>
                            <td className="border border-slate-300 px-4 py-3">{project.dueDate}</td>
                            <td className="border border-slate-300 px-4 py-3 text-center">
                                <div className="font-semibold text-slate-900">{normalizeNumber(project.images)} total</div>
                                <div className="mt-1 text-[11px] leading-4 text-slate-500">
                                    {normalizeNumber(project.completedImages)} complete
                                </div>
                            </td>
                            <td className="border border-slate-300 px-4 py-3"><ProgressBar value={calculateProjectProgress(project)} /></td>
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
                        <ListChecks size={26} /> Assigned Tasks
                    </h2>
                    {hasManagerAccess && (
                        <button
                            type="button"
                            onClick={openNewAssignmentModal}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 sm:w-auto"
                        >
                            <Plus size={16} /> New Assigned Task
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
                        {ASSIGNED_TASK_COLUMNS.map((column) => (
                            <SortableHeader key={column.key} column={column} sortConfig={assignmentSort} onSort={handleAssignmentSort} />
                        ))}
                        {hasManagerAccess && <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>}
                    </tr>
                    </thead>
                    <tbody>
                    {visibleAssignmentRows.map((assignment) => (
                        <tr key={assignment.backendId || assignment.id} className="hover:bg-slate-50">
                            <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">{formatTaskId(assignment.displayId || assignment.id)}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.project}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.taskType}</td>
                            <td className="border border-slate-300 px-4 py-3">{assignment.assignedTo}</td>
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
                            <td colSpan={hasManagerAccess ? 8 : 7} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                No assigned tasks found for the selected filters.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                <TableFooter text={getRangeText(assignmentPage, ASSIGNMENTS_PAGE_SIZE, sortedAssignmentRows.length, "assigned tasks")} currentPage={assignmentPage} totalPages={assignmentTotalPages} onPageChange={setAssignmentPage} />
            </div>

            {projectModal && (
                <Modal title={projectModal.mode === "create" ? "New Project" : "Edit Project"} onClose={() => setProjectModal(null)}>
                    <ProjectForm initialProject={projectModal.data} onCancel={() => setProjectModal(null)} onSave={saveProject} />
                </Modal>
            )}

            {assignmentModal && (
                <Modal title={assignmentModal.mode === "create" ? "New Assigned Task" : "Edit Assigned Task"} onClose={() => setAssignmentModal(null)}>
                    <AssignmentForm initialAssignment={assignmentModal.data} projectOptions={projectSelectOptions} employeeOptions={employeeSelectOptions} onCancel={() => setAssignmentModal(null)} onSave={saveAssignment} />
                </Modal>
            )}
        </section>
    );
}

export {
    ProjectsAndAssignments,
    ProjectsAndAssignmentsSecure,
};
