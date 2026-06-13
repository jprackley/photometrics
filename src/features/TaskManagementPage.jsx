// -----------------------------------------------------------------------------
// Task Management Page.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import {
    Bell,
    Clock,
    Download,
    Eye,
    ListChecks,
    Play,
    Plus,
    Search,
    ShieldCheck,
    Square,
} from "lucide-react";


import { Logo } from "../components/Layout";
import {
    API_ENDPOINTS,
    apiPlaceholders,
    getUseApiDataSetting,
    normalizeEmployeeRows,
    normalizeProjectRows,
    normalizeTaskRows,
    useApiPlaceholder,
} from "../services/api";
import {
    employees,
    projects,
    taskItems,
} from "../data/mockData";
import {
    TASKS_PAGE_SIZE,
    TASK_COLUMNS,
    downloadTasksReport,
    formatDuration,
    formatDurationMinutes,
    formatTaskId,
    generateNextId,
    getLiveTrackedSeconds,
    getNextSort,
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
    canManageContent,
    filterRowsByAccess,
    isAssignedToUser,
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
} from "./sharedComponents";

/**
 * Create/edit form for task records, including estimated and tracked time fields.
 */
function TaskForm({ initialTask, projectOptions, employeeOptions, onCancel, onSave }) {
    const [form, setForm] = useState(initialTask);

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave({
            ...form,
            taskName: form.taskName.trim() || "Untitled Task",
            assignedTo: form.assignedTo.trim() || "Unassigned",
            estimatedHours: normalizeNumber(form.estimatedHours),
            trackedSeconds: normalizeNumber(form.trackedSeconds),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Task Name">
                    <TextInput value={form.taskName} onChange={(value) => updateField("taskName", value)} placeholder="Photo Editing Batch 1" />
                </FormField>

                <FormField label="Project">
                    <select
                        value={form.project}
                        onChange={(event) => updateField("project", event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                        {projectOptions.map((project) => (
                            <option key={project}>{project}</option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Assigned To">
                    <input
                        list="task-employee-options"
                        value={form.assignedTo}
                        onChange={(event) => updateField("assignedTo", event.target.value)}
                        placeholder="Employee name"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />
                    <datalist id="task-employee-options">
                        {employeeOptions.map((employee) => (
                            <option key={employee} value={employee} />
                        ))}
                    </datalist>
                </FormField>

                <FormField label="Due Date">
                    <TextInput value={form.dueDate} onChange={(value) => updateField("dueDate", value)} placeholder="May 18, 2026" />
                </FormField>

                <FormField label="Estimated Hours">
                    <TextInput value={form.estimatedHours} onChange={(value) => updateField("estimatedHours", value)} placeholder="8" type="number" />
                </FormField>

                <FormField label="Saved Time In Seconds">
                    <TextInput value={form.trackedSeconds} onChange={(value) => updateField("trackedSeconds", value)} placeholder="0" type="number" />
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
                    Save Task
                </button>
            </div>
        </form>
    );
}

/**
 * Timer button used by the original task table to start or stop work tracking.
 */
function normalizeLookupText(value = "") {
    return String(value || "").trim().toLowerCase();
}

/**
 * Returns id from named rows for this feature.
 */
function getIdFromNamedRows(name, rows, nameKeys = ["name"], idKeys = ["backendId", "id"]) {
    const normalizedName = normalizeLookupText(name);
    if (!normalizedName) return null;

    const match = (rows || []).find((row) => nameKeys.some((key) => normalizeLookupText(row?.[key]) === normalizedName));
    if (!match) return null;

    for (const key of idKeys) {
        if (match[key]) return match[key];
    }

    return null;
}

/**
 * Resolves project id for task for this feature.
 */
function resolveProjectIdForTask(task, projectRows, taskRows) {
    return task.projectId
        || task.project_id
        || getIdFromNamedRows(task.project, projectRows, ["name", "project"], ["backendId", "projectId", "id"])
        || getIdFromNamedRows(task.project, taskRows, ["project"], ["projectId"]);
}

/**
 * Resolves employee id for task for this feature.
 */
function resolveEmployeeIdForTask(task, employeeRows, taskRows) {
    return task.assignedToId
        || task.assigned_to
        || getIdFromNamedRows(task.assignedTo, employeeRows, ["name", "displayName", "email"], ["userId", "backendId", "id", "employeeId"])
        || getIdFromNamedRows(task.assignedTo, taskRows, ["assignedTo"], ["assignedToId"]);
}

/**
 * Returns the backend task identifier when available.
 */
function getTaskBackendId(task = {}) {
    return task.backendId || task.taskId || task.id;
}

/**
 * Extracts the saved task row from a create/update API response.
 */
function getSavedTaskFromApiResponse(response, fallbackTask) {
    const savedTask = normalizeTaskRows(response)[0];
    return normalizeTaskForTimers(savedTask || fallbackTask);
}

/**
 * Renders task timer controls for the non-secure task table.
 */
function TimerControl({ task, currentTime, onStart, onStop, isAnotherTimerRunning }) {
    const isRunning = Boolean(task.timerStartedAt);

    return (
        <div className="flex items-center justify-center gap-2">
            <button
                type="button"
                onClick={() => isRunning ? onStop(task) : onStart(task)}
                disabled={!isRunning && isAnotherTimerRunning}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    isRunning
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-violet-600 text-white hover:bg-violet-700"
                }`}
                title={isRunning ? "Stop timer" : "Start timer"}
            >
                {isRunning ? <Square size={14} /> : <Play size={14} />}
                {isRunning ? "Stop" : "Start"}
            </button>

            <span className={`min-w-[76px] text-xs font-bold ${isRunning ? "text-violet-700" : "text-slate-700"}`}>
                {formatDuration(getLiveTrackedSeconds(task, currentTime))}
            </span>
        </div>
    );
}

/**
 * Manager task management page with timer controls, sorting, filtering, pagination, and CSV export.
 */
function TaskManagementPage() {
    const { data: loadedTaskRows } = useApiPlaceholder(API_ENDPOINTS.tasksList, taskItems, {
        transformPayload: normalizeTaskRows,
    });
    const { data: loadedProjectRows } = useApiPlaceholder(API_ENDPOINTS.projectsList, projects, {
        transformPayload: normalizeProjectRows,
    });
    const { data: loadedEmployeeRows } = useApiPlaceholder(API_ENDPOINTS.employees, employees, {
        transformPayload: normalizeEmployeeRows,
    });
    const [taskRows, setTaskRows] = useState(taskItems);
    const [taskSort, setTaskSort] = useState({ key: "dueDate", direction: "asc" });
    const [taskPage, setTaskPage] = useState(1);
    const [taskSearch, setTaskSearch] = useState("");
    const [projectFilter, setProjectFilter] = useState("All Projects");
    const [employeeFilter, setEmployeeFilter] = useState("All Employees");
    const [priorityFilter, setPriorityFilter] = useState("All Priorities");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [taskModal, setTaskModal] = useState(null);
    const [activeTimerTaskId, setActiveTimerTaskId] = useState(null);
    const [timerTick, setTimerTick] = useState(Date.now());
    const taskProjectRows = Array.isArray(loadedProjectRows) ? loadedProjectRows : [];
    const taskEmployeeRows = Array.isArray(loadedEmployeeRows) ? loadedEmployeeRows : [];

    useEffect(() => {
        if (!Array.isArray(loadedTaskRows)) return;

        // Build lookup maps so UUIDs in project/assignedTo can be resolved to real names.
        const projectNameById = new Map(
            taskProjectRows.flatMap((p) =>
                [p.backendId, p.id].filter(Boolean).map((id) => [id, p.name])
            )
        );
        const employeeNameById = new Map(
            taskEmployeeRows.flatMap((e) =>
                [e.userId, e.backendId, e.employeeId, e.id].filter(Boolean).map((id) => [id, e.name])
            )
        );

        setTaskRows(loadedTaskRows.map((task) => {
            // Prefer the id-based lookup so the row always shows the canonical
            // project/employee name, regardless of which placeholder the API
            // layer fell back to ("Unknown project", "Unknown employee", a raw
            // "Project <id>"/"Employee <id>", etc.). Fall back to the existing
            // value only when there is no id or no match. This keeps the
            // name-based access filter working so assigned tasks aren't hidden.
            const project =
                (task.projectId && projectNameById.get(task.projectId)) || task.project;

            const assignedTo =
                (task.assignedToId && employeeNameById.get(task.assignedToId)) || task.assignedTo;

            return { ...task, project, assignedTo, timerStartedAt: task.timerStartedAt || null };
        }));
    }, [loadedTaskRows, taskProjectRows, taskEmployeeRows]);

    useEffect(() => {
        if (!activeTimerTaskId) return undefined;

        const intervalId = window.setInterval(() => {
            setTimerTick(Date.now());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [activeTimerTaskId]);

    const projectOptions = useMemo(
        () => getUniqueOptions(taskRows, "project", "All Projects"),
        [taskRows]
    );

    const employeeOptions = useMemo(
        () => getUniqueOptions(taskRows, "assignedTo", "All Employees"),
        [taskRows]
    );

    const priorityOptions = useMemo(
        () => getUniqueOptions(taskRows, "priority", "All Priorities"),
        [taskRows]
    );

    const statusOptions = useMemo(
        () => getUniqueOptions(taskRows, "status", "All Status"),
        [taskRows]
    );

    const filteredTaskRows = useMemo(() => {
        const searchValue = taskSearch.trim().toLowerCase();

        return taskRows.filter((task) => {
            const searchableText = [
                task.id,
                task.taskName,
                task.project,
                task.assignedTo,
                task.dueDate,
                task.priority,
                task.status,
                task.lastStoppedAt,
            ].join(" ").toLowerCase();

            const matchesSearch = !searchValue || searchableText.includes(searchValue);
            const matchesProject = projectFilter === "All Projects" || task.project === projectFilter;
            const matchesEmployee = employeeFilter === "All Employees" || task.assignedTo === employeeFilter;
            const matchesPriority = priorityFilter === "All Priorities" || task.priority === priorityFilter;
            const matchesStatus = statusFilter === "All Status" || task.status === statusFilter;

            return matchesSearch && matchesProject && matchesEmployee && matchesPriority && matchesStatus;
        });
    }, [taskRows, taskSearch, projectFilter, employeeFilter, priorityFilter, statusFilter]);

    const sortedTaskRows = useMemo(
        () => sortRows(filteredTaskRows, taskSort),
        [filteredTaskRows, taskSort]
    );

    const taskTotalPages = getTotalPages(sortedTaskRows.length, TASKS_PAGE_SIZE);
    const visibleTaskRows = paginateRows(sortedTaskRows, taskPage, TASKS_PAGE_SIZE);
    const activeTask = taskRows.find((task) => getTaskBackendId(task) === activeTimerTaskId);
    const totalTrackedSeconds = taskRows.reduce((total, task) => total + getLiveTrackedSeconds(task, timerTick), 0);
    const completedTasks = taskRows.filter((task) => task.status === "Completed").length;
    const reviewTasks = taskRows.filter((task) => task.category === "Quality Review").length;
    const openTasks = taskRows.filter((task) => task.status !== "Completed").length;
    const highPriorityTasks = taskRows.filter((task) => task.priority === "High" && task.status !== "Completed").length;

    useEffect(() => {
        if (taskPage > taskTotalPages) {
            setTaskPage(taskTotalPages);
        }
    }, [taskPage, taskTotalPages]);

    const handleTaskSort = (columnKey) => {
        setTaskSort((currentSort) => getNextSort(currentSort, columnKey));
        setTaskPage(1);
    };

    const openNewTaskModal = () => {
        const projectNames = projectRowsForTasks();

        setTaskModal({
            mode: "create",
            data: {
                id: generateNextId("TSK", taskRows),
                taskName: "",
                project: projectNames[0] || "Unassigned Project",
                assignedTo: "",
                dueDate: "May 30, 2026",
                priority: "Normal",
                estimatedHours: 1,
                trackedSeconds: 0,
                status: "To-Do",
                timerStartedAt: null,
                lastStoppedAt: "",
            },
        });
    };

    const projectRowsForTasks = () => {
        const taskProjects = taskRows.map((task) => task.project).filter(Boolean);
        const masterProjects = taskProjectRows.map((project) => project.name).filter(Boolean);
        return [...new Set([...masterProjects, ...taskProjects])].sort();
    };

    const saveTask = async (task) => {
        const cleanTask = {
            ...task,
            id: task.id || generateNextId("TSK", taskRows),
            projectId: resolveProjectIdForTask(task, taskProjectRows, taskRows),
            assignedToId: resolveEmployeeIdForTask(task, taskEmployeeRows, taskRows),
            taskName: task.taskName.trim() || "Untitled Task",
            assignedTo: task.assignedTo.trim() || "Unassigned",
            timerStartedAt: task.timerStartedAt || null,
            trackedSeconds: normalizeNumber(task.trackedSeconds),
        };

        let savedTask = cleanTask;

        if (getUseApiDataSetting()) {
            try {
                if (taskModal.mode === "create") {
                    const response = await apiPlaceholders.createTask(cleanTask);
                    savedTask = getSavedTaskFromApiResponse(response, cleanTask);
                } else {
                    const response = await apiPlaceholders.updateTask(getTaskBackendId(cleanTask), cleanTask);
                    savedTask = getSavedTaskFromApiResponse(response, cleanTask);
                }
            } catch (apiError) {
                console.warn("Task API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setTaskRows((currentRows) => {
            if (taskModal.mode === "create") {
                return [savedTask, ...currentRows];
            }

            const savedTaskId = getTaskBackendId(savedTask);
            return currentRows.map((row) => getTaskBackendId(row) === savedTaskId ? savedTask : row);
        });
        setTaskPage(1);
        setTaskModal(null);
    };

    const deleteTask = async (task) => {
        if (!window.confirm(`Delete ${task.taskName}?`)) return;

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteTask(getTaskBackendId(task));
            } catch (apiError) {
                console.warn("Task delete API endpoint is not connected yet. Deleting locally.", apiError);
            }
        }

        if (activeTimerTaskId === getTaskBackendId(task)) {
            setActiveTimerTaskId(null);
        }

        const taskId = getTaskBackendId(task);
        setTaskRows((currentRows) => currentRows.filter((row) => getTaskBackendId(row) !== taskId));
    };

    const startTimer = async (task) => {
        const taskId = getTaskBackendId(task);
        if (activeTimerTaskId && activeTimerTaskId !== taskId) {
            window.alert("Please stop the active timer before starting another task.");
            return;
        }

        const startedAt = Date.now();

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.startTaskTimer(taskId, new Date(startedAt).toISOString());
            } catch (apiError) {
                window.alert(apiError?.message || "The timer could not be started because the backend rejected the request.");
                return;
            }
        }

        setTaskRows((currentRows) => currentRows.map((row) => (
            getTaskBackendId(row) === taskId
                ? { ...row, timerStartedAt: startedAt, status: row.status === "Completed" ? "In Progress" : row.status }
                : row
        )));
        setActiveTimerTaskId(taskId);
        setTimerTick(startedAt);
    };

    const stopTimer = async (task) => {
        if (!task.timerStartedAt) return;

        const stoppedAt = Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((stoppedAt - task.timerStartedAt) / 1000));
        const nextTrackedSeconds = normalizeNumber(task.trackedSeconds) + elapsedSeconds;
        const lastStoppedAt = new Date(stoppedAt).toLocaleString([], {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.stopTaskTimer(getTaskBackendId(task), {
                    stoppedAt: new Date(stoppedAt).toISOString(),
                    elapsedSeconds,
                    totalTrackedSeconds: nextTrackedSeconds,
                });
            } catch (apiError) {
                window.alert(apiError?.message || "The timer could not be stopped because the backend rejected the request.");
                return;
            }
        }

        setTaskRows((currentRows) => currentRows.map((row) => (
            getTaskBackendId(row) === getTaskBackendId(task)
                ? { ...row, trackedSeconds: nextTrackedSeconds, timerStartedAt: null, lastStoppedAt }
                : row
        )));
        setActiveTimerTaskId(null);
        setTimerTick(stoppedAt);
    };

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                    { label: "Open Tasks", value: openTasks, icon: ListChecks, tone: "amber" },
                    { label: "Completed Tasks", value: completedTasks, icon: ShieldCheck, tone: "emerald" },
                    { label: "In Review", value: reviewTasks, icon: Eye, tone: "blue" },
                    { label: "High Priority", value: highPriorityTasks, icon: Bell, tone: "amber" },
                    { label: "Total Tracked Time", value: formatDuration(totalTrackedSeconds), icon: Clock, tone: "violet", valueClassName: "text-violet-700" },
                ].map((card) => (
                    <InsightCard key={card.label} {...card} />
                ))}
            </div>

            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[380px_1fr]">
                <div className="self-start rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-5">
                    <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                        <Clock size={26} /> Active Time Tracker
                    </h2>

                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                        {activeTask ? (
                            <>
                                <div className="text-sm font-semibold text-slate-500">Currently Tracking</div>
                                <div className="mt-2 text-xl font-bold text-slate-900">{activeTask.taskName}</div>
                                <div className="mt-1 text-sm text-slate-600">{activeTask.project}</div>
                                <div className="mt-5 text-4xl font-bold text-violet-700 sm:text-5xl">
                                    {formatDuration(getLiveTrackedSeconds(activeTask, timerTick))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => stopTimer(activeTask)}
                                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                                >
                                    <Square size={16} /> Stop Timer
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="text-sm font-semibold text-slate-500">No Active Timer</div>
                                <div className="mt-3 text-4xl font-bold text-slate-900">00:00:00</div>
                                <p className="mt-3 text-sm text-slate-600">
                                    Select Start on any task below to begin tracking time.
                                </p>
                            </>
                        )}
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-slate-700">
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="font-semibold">Active Task ID</span>
                            <span>{activeTask ? formatTaskId(activeTask.displayId || activeTask.id) : "None"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="font-semibold">Assigned To</span>
                            <span>{activeTask?.assignedTo || "None"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Last Stop</span>
                            <span>{activeTask?.lastStoppedAt || "Not recorded"}</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                            <ListChecks size={26} /> Task Management
                        </h2>

                        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                            <button
                                type="button"
                                onClick={() => downloadTasksReport(taskRows)}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
                            >
                                <Download size={16} /> Export Time Report
                            </button>

                            <button
                                type="button"
                                onClick={openNewTaskModal}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 sm:w-auto"
                            >
                                <Plus size={16} /> New Task
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-5 py-4 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center">
                        <div className="flex w-full items-center gap-3 rounded-xl border border-slate-300 px-4 py-2 shadow-sm">
                            <Search size={18} className="shrink-0 text-slate-500" />
                            <input
                                value={taskSearch}
                                onChange={(event) => {
                                    setTaskSearch(event.target.value);
                                    setTaskPage(1);
                                }}
                                className="w-full text-sm outline-none"
                                placeholder="Search by task, project, employee, due date, priority, or status"
                            />
                        </div>

                        <FilterSelect
                            value={projectFilter}
                            onChange={(value) => {
                                setProjectFilter(value);
                                setTaskPage(1);
                            }}
                            options={projectOptions}
                        />
                        <FilterSelect
                            value={employeeFilter}
                            onChange={(value) => {
                                setEmployeeFilter(value);
                                setTaskPage(1);
                            }}
                            options={employeeOptions}
                        />
                        <FilterSelect
                            value={priorityFilter}
                            onChange={(value) => {
                                setPriorityFilter(value);
                                setTaskPage(1);
                            }}
                            options={priorityOptions}
                        />
                        <FilterSelect
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(value);
                                setTaskPage(1);
                            }}
                            options={statusOptions}
                        />
                    </div>

                    <table className="min-w-[900px] w-full border-collapse text-sm">
                        <thead className="bg-slate-200 text-slate-800">
                        <tr>
                            {TASK_COLUMNS.map((column) => (
                                <SortableHeader
                                    key={column.key}
                                    column={column}
                                    sortConfig={taskSort}
                                    onSort={handleTaskSort}
                                />
                            ))}
                            <th className="border border-slate-300 px-4 py-3 text-center font-bold">Timer</th>
                            <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {visibleTaskRows.map((task) => {
                            const liveTask = taskRows.find((row) => getTaskBackendId(row) === getTaskBackendId(task)) || task;
                            const isAnotherTimerRunning = Boolean(activeTimerTaskId && activeTimerTaskId !== getTaskBackendId(liveTask));

                            return (
                                <tr key={liveTask.displayId || liveTask.id} className="hover:bg-slate-50">
                                    <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">
                                        {formatTaskId(liveTask.displayId || liveTask.id)}
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3">
                                        <div className="font-semibold text-slate-900">{liveTask.taskName}</div>
                                        <div className="text-xs text-slate-500">Est. {liveTask.estimatedHours}h</div>
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3">{liveTask.project}</td>
                                    <td className="border border-slate-300 px-4 py-3">{liveTask.assignedTo}</td>
                                    <td className="border border-slate-300 px-4 py-3">{liveTask.dueDate}</td>
                                    <td className="border border-slate-300 px-4 py-3 text-center">
                                        <PriorityBadge value={liveTask.priority} />
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3 text-center font-semibold text-slate-800">
                                        {formatDuration(getLiveTrackedSeconds(liveTask, timerTick))}
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3 text-center">
                                        <Badge value={liveTask.status} />
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3">
                                        <TimerControl
                                            task={liveTask}
                                            currentTime={timerTick}
                                            onStart={startTimer}
                                            onStop={stopTimer}
                                            isAnotherTimerRunning={isAnotherTimerRunning}
                                        />
                                    </td>
                                    <td className="border border-slate-300 px-4 py-3">
                                        <RowActions
                                            onEdit={() => setTaskModal({ mode: "edit", data: liveTask })}
                                            onDelete={() => deleteTask(liveTask)}
                                        />
                                    </td>
                                </tr>
                            );
                        })}

                        {visibleTaskRows.length === 0 && (
                            <tr>
                                <td colSpan={10} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                                    No tasks found for the selected filters.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>

                    <TableFooter
                        text={getRangeText(taskPage, TASKS_PAGE_SIZE, sortedTaskRows.length, "tasks")}
                        currentPage={taskPage}
                        totalPages={taskTotalPages}
                        onPageChange={setTaskPage}
                    />
                </div>
            </div>

            {taskModal && (
                <Modal
                    title={taskModal.mode === "create" ? "New Task" : "Edit Task"}
                    onClose={() => setTaskModal(null)}
                >
                    <TaskForm
                        initialTask={taskModal.data}
                        projectOptions={projectRowsForTasks()}
                        employeeOptions={employeeOptions.filter((option) => option !== "All Employees")}
                        onCancel={() => setTaskModal(null)}
                        onSave={saveTask}
                    />
                </Modal>
            )}
        </section>
    );
}

/**
 * Role-aware timer button that prevents employees from running timers on tasks they cannot access.
 */
function TimerControlSecure({ task, currentTime, currentUser, onStart, onStop, isAnotherTimerRunning, canUseTimer }) {
    const session = getTaskTimerSession(task, currentUser);
    const isRunning = Boolean(session.startedAt);

    return (
        <div className="flex items-center justify-center gap-2">
            <button
                type="button"
                onClick={() => isRunning ? onStop(task) : onStart(task)}
                disabled={!canUseTimer || (!isRunning && isAnotherTimerRunning)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    isRunning
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-violet-600 text-white hover:bg-violet-700"
                }`}
                title={isRunning ? "Stop your timer" : "Start your timer"}
            >
                {isRunning ? <Square size={14} /> : <Play size={14} />}
                {isRunning ? "Stop" : "Start"}
            </button>
            <span className={`min-w-[76px] text-xs font-bold ${isRunning ? "text-violet-700" : "text-slate-700"}`}>
                {formatDurationMinutes(getLiveTrackedSeconds(task, currentTime, currentUser))}
            </span>
        </div>
    );
}

/**
 * Role-aware task page that limits employees to assigned tasks while preserving manager controls.
 */
function TaskManagementPageSecure({ currentUser, globalSearch = "" }) {
    const { data: loadedTaskRows } = useApiPlaceholder(API_ENDPOINTS.tasksList, taskItems, {
        transformPayload: normalizeTaskRows,
    });
    const { data: loadedProjectRows } = useApiPlaceholder(API_ENDPOINTS.projectsList, projects, {
        transformPayload: normalizeProjectRows,
    });
    const { data: loadedEmployeeRows } = useApiPlaceholder(API_ENDPOINTS.employees, employees, {
        transformPayload: normalizeEmployeeRows,
    });
    const [taskRows, setTaskRows] = useState(taskItems.map(normalizeTaskForTimers));
    const [taskSort, setTaskSort] = useState({ key: "dueDate", direction: "asc" });
    const [taskPage, setTaskPage] = useState(1);
    const [taskSearch, setTaskSearch] = useState("");
    const [projectFilter, setProjectFilter] = useState("All Projects");
    const [employeeFilter, setEmployeeFilter] = useState("All Employees");
    const [priorityFilter, setPriorityFilter] = useState("All Priorities");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [taskModal, setTaskModal] = useState(null);
    const [activeTimerTaskId, setActiveTimerTaskId] = useState(null);
    const [timerTick, setTimerTick] = useState(Date.now());
    const taskProjectRows = Array.isArray(loadedProjectRows) ? loadedProjectRows : [];
    const taskEmployeeRows = Array.isArray(loadedEmployeeRows) ? loadedEmployeeRows : [];
    const hasManagerAccess = canManageContent(currentUser);

    useEffect(() => {
        if (!Array.isArray(loadedTaskRows)) return;

        // Resolve UUID-based project/assignee references to real names so the
        // table doesn't show "Unknown project"/"Unknown employee" — the backend
        // tasks endpoint returns ids only, not names.
        const projectNameById = new Map(
            (Array.isArray(loadedProjectRows) ? loadedProjectRows : []).flatMap((p) =>
                [p.backendId, p.id].filter(Boolean).map((id) => [id, p.name])
            )
        );
        const employeeNameById = new Map(
            (Array.isArray(loadedEmployeeRows) ? loadedEmployeeRows : []).flatMap((e) =>
                [e.userId, e.backendId, e.employeeId, e.id].filter(Boolean).map((id) => [id, e.name])
            )
        );

        setTaskRows(loadedTaskRows.map((task) => {
            const row = normalizeTaskForTimers(task);
            return {
                ...row,
                project: (row.projectId && projectNameById.get(row.projectId)) || row.project,
                assignedTo: (row.assignedToId && employeeNameById.get(row.assignedToId)) || row.assignedTo,
            };
        }));
    }, [loadedTaskRows, loadedProjectRows, loadedEmployeeRows]);

    useEffect(() => {
        const currentUserKey = getTimerUserKey(currentUser);
        const runningTask = taskRows.find((task) => task.timersByUser?.[currentUserKey]?.startedAt || getTaskTimerSession(task, currentUser).startedAt);
        setActiveTimerTaskId(runningTask ? getTaskBackendId(runningTask) : null);
    }, [taskRows, currentUser]);

    useEffect(() => {
        if (!activeTimerTaskId) return undefined;
        const intervalId = window.setInterval(() => setTimerTick(Date.now()), 1000);
        return () => window.clearInterval(intervalId);
    }, [activeTimerTaskId]);

    const accessibleTaskRows = useMemo(
        () => filterRowsByAccess(taskRows, currentUser, "tasks"),
        [taskRows, currentUser]
    );

    const projectOptions = useMemo(
        () => getUniqueOptions(accessibleTaskRows, "project", "All Projects"),
        [accessibleTaskRows]
    );

    const employeeOptions = useMemo(
        () => hasManagerAccess
            ? getUniqueOptions(accessibleTaskRows, "assignedTo", "All Employees")
            : ["All Employees", currentUser?.employeeName || currentUser?.name].filter(Boolean),
        [accessibleTaskRows, hasManagerAccess, currentUser]
    );

    const priorityOptions = useMemo(
        () => getUniqueOptions(accessibleTaskRows, "priority", "All Priorities"),
        [accessibleTaskRows]
    );

    const statusOptions = useMemo(
        () => getUniqueOptions(accessibleTaskRows, "status", "All Status"),
        [accessibleTaskRows]
    );

    const filteredTaskRows = useMemo(() => {
        const searchValue = [globalSearch, taskSearch].filter(Boolean).join(" ").trim().toLowerCase();

        return accessibleTaskRows.filter((task) => {
            const searchableText = [
                task.id,
                task.taskName,
                task.project,
                task.assignedTo,
                task.dueDate,
                task.priority,
                task.status,
                task.lastStoppedAt,
                task.estimatedHours,
                formatDuration(getLiveTrackedSeconds(task, timerTick, hasManagerAccess ? null : currentUser)),
            ].join(" ").toLowerCase();
            const matchesSearch = !searchValue || searchableText.includes(searchValue);
            const matchesProject = projectFilter === "All Projects" || task.project === projectFilter;
            const matchesEmployee = employeeFilter === "All Employees" || task.assignedTo === employeeFilter;
            const matchesPriority = priorityFilter === "All Priorities" || task.priority === priorityFilter;
            const matchesStatus = statusFilter === "All Status" || task.status === statusFilter;
            return matchesSearch && matchesProject && matchesEmployee && matchesPriority && matchesStatus;
        });
    }, [accessibleTaskRows, globalSearch, taskSearch, projectFilter, employeeFilter, priorityFilter, statusFilter, timerTick, hasManagerAccess, currentUser]);

    const sortedTaskRows = useMemo(
        () => sortRows(filteredTaskRows, taskSort),
        [filteredTaskRows, taskSort]
    );

    const taskTotalPages = getTotalPages(sortedTaskRows.length, TASKS_PAGE_SIZE);
    const visibleTaskRows = paginateRows(sortedTaskRows, taskPage, TASKS_PAGE_SIZE);
    const activeTask = taskRows.find((task) => getTaskBackendId(task) === activeTimerTaskId);
    const totalTrackedSeconds = accessibleTaskRows.reduce((total, task) => total + getLiveTrackedSeconds(task, timerTick, hasManagerAccess ? null : currentUser), 0);
    const completedTasks = accessibleTaskRows.filter((task) => task.status === "Completed").length;
    const reviewTasks = accessibleTaskRows.filter((task) => task.category === "Quality Review").length;
    const openTasks = accessibleTaskRows.filter((task) => task.status !== "Completed").length;
    const highPriorityTasks = accessibleTaskRows.filter((task) => task.priority === "High" && task.status !== "Completed").length;

    useEffect(() => {
        if (taskPage > taskTotalPages) setTaskPage(taskTotalPages);
    }, [taskPage, taskTotalPages]);

    const handleTaskSort = (columnKey) => {
        setTaskSort((currentSort) => getNextSort(currentSort, columnKey));
        setTaskPage(1);
    };

    const projectRowsForTasks = () => {
        const taskProjects = taskRows.map((task) => task.project).filter(Boolean);
        const masterProjects = taskProjectRows.map((project) => project.name).filter(Boolean);
        return [...new Set([...masterProjects, ...taskProjects])].sort();
    };

    const openNewTaskModal = () => {
        if (!hasManagerAccess) return;
        const projectNames = projectRowsForTasks();
        setTaskModal({
            mode: "create",
            data: {
                id: generateNextId("TSK", taskRows),
                taskName: "",
                project: projectNames[0] || "Unassigned Project",
                assignedTo: "",
                dueDate: "May 30, 2026",
                priority: "Normal",
                estimatedHours: 1,
                trackedSeconds: 0,
                status: "To-Do",
                timerStartedAt: null,
                lastStoppedAt: "",
                timersByUser: {},
            },
        });
    };

    const saveTask = async (task) => {
        if (!hasManagerAccess) return;
        const cleanTask = normalizeTaskForTimers({
            ...task,
            id: task.id || generateNextId("TSK", taskRows),
            projectId: resolveProjectIdForTask(task, taskProjectRows, taskRows),
            assignedToId: resolveEmployeeIdForTask(task, taskEmployeeRows, taskRows),
            taskName: task.taskName.trim() || "Untitled Task",
            assignedTo: task.assignedTo.trim() || "Unassigned",
            trackedSeconds: normalizeNumber(task.trackedSeconds),
        });

        let savedTask = cleanTask;

        if (getUseApiDataSetting()) {
            try {
                if (taskModal.mode === "create") {
                    const response = await apiPlaceholders.createTask(cleanTask);
                    savedTask = getSavedTaskFromApiResponse(response, cleanTask);
                } else {
                    const response = await apiPlaceholders.updateTask(getTaskBackendId(cleanTask), cleanTask);
                    savedTask = getSavedTaskFromApiResponse(response, cleanTask);
                }
            } catch (apiError) {
                console.warn("Task API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setTaskRows((currentRows) => taskModal.mode === "create"
            ? [savedTask, ...currentRows]
            : currentRows.map((row) => getTaskBackendId(row) === getTaskBackendId(savedTask) ? savedTask : row)
        );
        setTaskPage(1);
        setTaskModal(null);
    };

    const deleteTask = async (task) => {
        if (!hasManagerAccess || !window.confirm(`Delete ${task.taskName}?`)) return;
        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.deleteTask(getTaskBackendId(task));
            } catch (apiError) {
                console.warn("Task delete API endpoint is not connected yet. Deleting locally.", apiError);
            }
        }
        const taskId = getTaskBackendId(task);
        setTaskRows((currentRows) => currentRows.filter((row) => getTaskBackendId(row) !== taskId));
    };

    const startTimer = async (task) => {
        if (!hasManagerAccess && !isAssignedToUser(task, currentUser)) {
            window.alert("You can only start timers on tasks assigned to your login.");
            return;
        }

        const taskId = getTaskBackendId(task);
        if (activeTimerTaskId && activeTimerTaskId !== taskId) {
            window.alert("Please stop your active timer before starting another task.");
            return;
        }

        const startedAt = Date.now();
        const userKey = getTimerUserKey(currentUser);
        const session = getTaskTimerSession(task, currentUser);
        const existingTimers = task.timersByUser || {};
        const hasExistingUserTimer = Boolean(existingTimers[userKey]);
        const timerStartingSeconds = hasExistingUserTimer || Object.keys(existingTimers).length === 0
            ? session.trackedSeconds
            : 0;

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.startTaskTimer(taskId, new Date(startedAt).toISOString(), currentUser);
            } catch (apiError) {
                window.alert(apiError?.message || "The timer could not be started because the backend rejected the request.");
                return;
            }
        }

        setTaskRows((currentRows) => currentRows.map((row) => getTaskBackendId(row) === taskId
            ? {
                ...row,
                status: row.status === "Completed" ? "In Progress" : row.status,
                timersByUser: {
                    ...(row.timersByUser || {}),
                    [userKey]: {
                        trackedSeconds: timerStartingSeconds,
                        startedAt,
                        lastStoppedAt: session.lastStoppedAt,
                        userName: currentUser?.employeeName || currentUser?.name,
                    },
                },
            }
            : row
        ));
        setActiveTimerTaskId(taskId);
        setTimerTick(startedAt);
    };

    const stopTimer = async (task) => {
        const session = getTaskTimerSession(task, currentUser);
        if (!session.startedAt) return;

        const stoppedAt = Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((stoppedAt - session.startedAt) / 1000));
        const nextTrackedSeconds = session.trackedSeconds + elapsedSeconds;
        const lastStoppedAt = new Date(stoppedAt).toLocaleString([], {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
        const userKey = getTimerUserKey(currentUser);

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.stopTaskTimer(getTaskBackendId(task), {
                    userId: currentUser?.id,
                    employeeId: currentUser?.employeeId,
                    employeeName: currentUser?.employeeName || currentUser?.name,
                    stoppedAt: new Date(stoppedAt).toISOString(),
                    elapsedSeconds,
                    userTrackedSeconds: nextTrackedSeconds,
                });
            } catch (apiError) {
                window.alert(apiError?.message || "The timer could not be stopped because the backend rejected the request.");
                return;
            }
        }

        setTaskRows((currentRows) => currentRows.map((row) => getTaskBackendId(row) === getTaskBackendId(task)
            ? {
                ...row,
                lastStoppedAt,
                timersByUser: {
                    ...(row.timersByUser || {}),
                    [userKey]: {
                        trackedSeconds: nextTrackedSeconds,
                        startedAt: null,
                        lastStoppedAt,
                        userName: currentUser?.employeeName || currentUser?.name,
                    },
                },
            }
            : row
        ));
        setActiveTimerTaskId(null);
        setTimerTick(stoppedAt);
    };

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">
            {!hasManagerAccess && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm font-semibold text-violet-800">
                    Employee view: timers and task lists are tied to {currentUser?.employeeName || currentUser?.name}. Other employees can log in separately and run their own timers without overwriting yours.
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                    { label: "Open Tasks", value: openTasks, icon: ListChecks, tone: "amber" },
                    { label: "Completed Tasks", value: completedTasks, icon: ShieldCheck, tone: "emerald" },
                    { label: "In Review", value: reviewTasks, icon: Eye, tone: "blue" },
                    { label: "High Priority", value: highPriorityTasks, icon: Bell, tone: "amber" },
                    { label: hasManagerAccess ? "Total Tracked Time" : "My Tracked Time", value: formatDurationMinutes(totalTrackedSeconds), icon: Clock, tone: "violet", valueClassName: "text-violet-700" },
                ].map((card) => (
                    <InsightCard key={card.label} {...card} />
                ))}
            </div>

            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[380px_1fr]">
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="flex items-center gap-3 text-xl font-bold"><Clock size={24} /> Active Timer</h2>
                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
                        {activeTask ? (
                            <>
                                <div className="text-sm font-semibold text-slate-500">{activeTask.taskName}</div>
                                <div className="mt-3 text-4xl font-bold text-violet-700">{formatDuration(getLiveTrackedSeconds(activeTask, timerTick, currentUser))}</div>
                                <p className="mt-3 text-sm text-slate-600">Your timer is running for this login only.</p>
                            </>
                        ) : (
                            <>
                                <div className="text-sm font-semibold text-slate-500">No Active Timer</div>
                                <div className="mt-3 text-4xl font-bold text-slate-900">00:00:00</div>
                                <p className="mt-3 text-sm text-slate-600">Select Start on any assigned task to begin tracking time.</p>
                            </>
                        )}
                    </div>
                    <div className="mt-5 space-y-3 text-sm text-slate-700">
                        <div className="flex justify-between border-b border-slate-200 pb-2"><span className="font-semibold">Active Task ID</span><span>{activeTask ? formatTaskId(activeTask.displayId || activeTask.id) : "None"}</span></div>
                        <div className="flex justify-between border-b border-slate-200 pb-2"><span className="font-semibold">Logged In As</span><span>{currentUser?.employeeName || currentUser?.name}</span></div>
                        <div className="flex justify-between"><span className="font-semibold">Last Stop</span><span>{activeTask ? getTaskTimerSession(activeTask, currentUser).lastStoppedAt || "Not recorded" : "Not recorded"}</span></div>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <h2 className="flex items-center gap-3 text-xl font-bold sm:text-2xl"><ListChecks size={26} /> Task Management</h2>
                        {hasManagerAccess && (
                            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                                <button type="button" onClick={() => downloadTasksReport(accessibleTaskRows)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"><Download size={16} /> Export Time Report</button>
                                <button type="button" onClick={openNewTaskModal} className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 sm:w-auto"><Plus size={16} /> New Task</button>
                            </div>
                        )}
                    </div>

                    <div className={`grid grid-cols-1 gap-3 border-b border-slate-200 px-5 py-4 ${hasManagerAccess ? "md:grid-cols-[1fr_auto_auto_auto_auto]" : "md:grid-cols-[1fr_auto_auto_auto]"} md:items-center`}>
                        <div className="flex w-full items-center gap-3 rounded-xl border border-slate-300 px-4 py-2 shadow-sm">
                            <Search size={18} className="shrink-0 text-slate-500" />
                            <input value={taskSearch} onChange={(event) => { setTaskSearch(event.target.value); setTaskPage(1); }} className="w-full text-sm outline-none" placeholder="Search by task, project, employee, due date, priority, or status" />
                        </div>
                        <FilterSelect value={projectFilter} onChange={(value) => { setProjectFilter(value); setTaskPage(1); }} options={projectOptions} />
                        {hasManagerAccess && <FilterSelect value={employeeFilter} onChange={(value) => { setEmployeeFilter(value); setTaskPage(1); }} options={employeeOptions} />}
                        <FilterSelect value={priorityFilter} onChange={(value) => { setPriorityFilter(value); setTaskPage(1); }} options={priorityOptions} />
                        <FilterSelect value={statusFilter} onChange={(value) => { setStatusFilter(value); setTaskPage(1); }} options={statusOptions} />
                    </div>

                    <table className="min-w-[900px] w-full border-collapse text-sm">
                        <thead className="bg-slate-200 text-slate-800">
                        <tr>
                            {TASK_COLUMNS.map((column) => <SortableHeader key={column.key} column={column} sortConfig={taskSort} onSort={handleTaskSort} />)}
                            <th className="border border-slate-300 px-4 py-3 text-center font-bold">Timer</th>
                            {hasManagerAccess && <th className="border border-slate-300 px-4 py-3 text-center font-bold">Actions</th>}
                        </tr>
                        </thead>
                        <tbody>
                        {visibleTaskRows.map((task) => {
                            const liveTask = taskRows.find((row) => getTaskBackendId(row) === getTaskBackendId(task)) || task;
                            const isAnotherTimerRunning = Boolean(activeTimerTaskId && activeTimerTaskId !== getTaskBackendId(liveTask));
                            const canUseTimer = hasManagerAccess || isAssignedToUser(liveTask, currentUser);
                            return (
                                <tr key={liveTask.displayId || liveTask.id} className="hover:bg-slate-50">
                                    <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">{formatTaskId(liveTask.displayId || liveTask.id)}</td>
                                    <td className="border border-slate-300 px-4 py-3"><div className="font-semibold text-slate-900">{liveTask.taskName}</div><div className="text-xs text-slate-500">Est. {liveTask.estimatedHours}h</div></td>
                                    <td className="border border-slate-300 px-4 py-3">{liveTask.project}</td>
                                    <td className="border border-slate-300 px-4 py-3">{liveTask.assignedTo}</td>
                                    <td className="border border-slate-300 px-4 py-3">{liveTask.dueDate}</td>
                                    <td className="border border-slate-300 px-4 py-3 text-center"><PriorityBadge value={liveTask.priority} /></td>
                                    <td className="border border-slate-300 px-4 py-3 text-center font-semibold text-slate-800">{formatDurationMinutes(getLiveTrackedSeconds(liveTask, timerTick, hasManagerAccess ? null : currentUser))}</td>
                                    <td className="border border-slate-300 px-4 py-3 text-center"><Badge value={liveTask.status} /></td>
                                    <td className="border border-slate-300 px-4 py-3"><TimerControlSecure task={liveTask} currentTime={timerTick} currentUser={currentUser} onStart={startTimer} onStop={stopTimer} isAnotherTimerRunning={isAnotherTimerRunning} canUseTimer={canUseTimer} /></td>
                                    {hasManagerAccess && <td className="border border-slate-300 px-4 py-3"><RowActions onEdit={() => setTaskModal({ mode: "edit", data: liveTask })} onDelete={() => deleteTask(liveTask)} /></td>}
                                </tr>
                            );
                        })}
                        {visibleTaskRows.length === 0 && (
                            <tr><td colSpan={hasManagerAccess ? 10 : 9} className="border border-slate-300 px-4 py-8 text-center text-slate-500">No tasks found for the selected filters or this login.</td></tr>
                        )}
                        </tbody>
                    </table>
                    <TableFooter text={getRangeText(taskPage, TASKS_PAGE_SIZE, sortedTaskRows.length, "tasks")} currentPage={taskPage} totalPages={taskTotalPages} onPageChange={setTaskPage} />
                </div>
            </div>

            {taskModal && (
                <Modal title={taskModal.mode === "create" ? "New Task" : "Edit Task"} onClose={() => setTaskModal(null)}>
                    <TaskForm initialTask={taskModal.data} projectOptions={projectRowsForTasks()} employeeOptions={employeeOptions.filter((option) => option !== "All Employees")} onCancel={() => setTaskModal(null)} onSave={saveTask} />
                </Modal>
            )}
        </section>
    );
}

export {
    TaskManagementPage,
    TaskManagementPageSecure,
};
