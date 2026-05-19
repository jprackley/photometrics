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
 * Reusable toggle row for boolean settings.
 */
function SettingToggle({ label, description, checked, onChange }) {
    return (
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
            <span>
                <span className="block text-sm font-bold text-slate-800">{label}</span>
                {description && <span className="mt-1 block text-xs text-slate-500">{description}</span>}
            </span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
        </label>
    );
}

/**
 * Reusable settings card with icon, title, description, and grouped controls.
 */
function SettingsPanel({ title, description, icon: Icon, children }) {
    return (
        <div className="rounded-xl border border-slate-300 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <Icon size={22} />
                </div>
                <div>
                    <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
            </div>
            <div className="space-y-4 p-5">
                {children}
            </div>
        </div>
    );
}

/**
 * Reusable select control for settings options.
 */
function SettingsSelect({ value, onChange, options }) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        >
            {options.map((option) => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    );
}

/**
 * Exports the current settings object as a JSON backup/report.
 */
function downloadSettingsReport(settings) {
    downloadTextFile(
        "photometrics-settings-export.json",
        JSON.stringify(settings, null, 2),
        "application/json;charset=utf-8;"
    );
}

/**
 * Manager settings page for company, workflow, notification, security, backup, and appearance options.
 */
function SettingsPage() {
    const { data: loadedSettings } = useApiPlaceholder(API_ENDPOINTS.settings, settingsData);
    const [settings, setSettings] = useState(() => ({
        ...settingsData,
        dataSource: {
            ...settingsData.dataSource,
            useDatabaseData: getUseApiDataSetting(),
        },
    }));
    const [savedMessage, setSavedMessage] = useState("");

    useEffect(() => {
        if (loadedSettings && typeof loadedSettings === "object" && !Array.isArray(loadedSettings)) {
            setSettings((current) => ({
                ...current,
                ...loadedSettings,
                company: { ...current.company, ...(loadedSettings.company || {}) },
                workflow: { ...current.workflow, ...(loadedSettings.workflow || {}) },
                notifications: { ...current.notifications, ...(loadedSettings.notifications || {}) },
                security: { ...current.security, ...(loadedSettings.security || {}) },
                exportBackup: { ...current.exportBackup, ...(loadedSettings.exportBackup || {}) },
                appearance: { ...current.appearance, ...(loadedSettings.appearance || {}) },
                dataSource: { ...current.dataSource, ...(loadedSettings.dataSource || {}) },
            }));
        }
    }, [loadedSettings]);

    const updateSection = (section, field, value) => {
        setSavedMessage("");

        if (section === "dataSource" && field === "useDatabaseData") {
            saveUseApiDataSetting(value);
        }

        setSettings((current) => ({
            ...current,
            [section]: {
                ...current[section],
                [field]: value,
            },
        }));
    };

    const saveSettings = async () => {
        saveUseApiDataSetting(settings.dataSource.useDatabaseData);

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.updateSettings(settings);
            } catch (apiError) {
                console.warn("Settings API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setSavedMessage(settings.dataSource.useDatabaseData ? "Settings saved. The app will use database/API data only. Mock data will not be used if an API call fails." : "Settings saved. Mock data is enabled for front-end review.");
    };

    const resetSettings = () => {
        saveUseApiDataSetting(DEFAULT_USE_API_DATA);
        setSettings({
            ...settingsData,
            dataSource: {
                ...settingsData.dataSource,
                useDatabaseData: DEFAULT_USE_API_DATA,
            },
        });
        setSavedMessage("Settings reset to default values.");
    };

    const activeNotificationCount = Object.entries(settings.notifications)
        .filter(([, value]) => value === true)
        .length;

    const enabledSecurityCount = [
        settings.security.twoFactorRequired,
        settings.security.roleManagementEnabled,
        settings.security.auditLogging,
    ].filter(Boolean).length;

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">
            <div className="rounded-xl border border-slate-300 bg-white px-5 py-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
                            <Settings size={30} /> Settings
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
                            Manage company profile information, workflow rules, notifications, security, backups, and display preferences for the productivity dashboard.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => downloadSettingsReport(settings)}
                            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            <Download size={16} /> Export Settings
                        </button>
                        <button
                            type="button"
                            onClick={saveSettings}
                            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                        >
                            Save Settings
                        </button>
                    </div>
                </div>

                {savedMessage && (
                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                        {savedMessage}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-300 bg-white p-5 text-center shadow-sm">
                    <div className="text-sm font-bold text-slate-600">Company</div>
                    <div className="mt-3 text-2xl font-bold text-slate-900">{settings.company.companyName}</div>
                </div>
                <div className="rounded-xl border border-slate-300 bg-white p-5 text-center shadow-sm">
                    <div className="text-sm font-bold text-slate-600">Active Alerts</div>
                    <div className="mt-3 text-4xl font-semibold text-violet-700">{activeNotificationCount}</div>
                </div>
                <div className="rounded-xl border border-slate-300 bg-white p-5 text-center shadow-sm">
                    <div className="text-sm font-bold text-slate-600">Security Controls</div>
                    <div className="mt-3 text-4xl font-semibold text-violet-700">{enabledSecurityCount}/3</div>
                </div>
                <div className="rounded-xl border border-slate-300 bg-white p-5 text-center shadow-sm">
                    <div className="text-sm font-bold text-slate-600">Last Backup</div>
                    <div className="mt-3 text-lg font-bold text-slate-900">{settings.exportBackup.lastBackup}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <SettingsPanel
                    title="Data Source"
                    description="Choose whether the app should use front-end mock data or try the backend database APIs."
                    icon={Settings}
                >
                    <SettingToggle
                        label="Use Database Data"
                        description="Turn this on to use only backend API/database data. If an endpoint fails, mock data will not be used unless this setting is turned off."
                        checked={settings.dataSource.useDatabaseData}
                        onChange={(value) => updateSection("dataSource", "useDatabaseData", value)}
                    />
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Current mode: <span className="font-bold text-slate-800">{settings.dataSource.useDatabaseData ? "Database/API only" : "Mock data"}</span>
                    </div>
                </SettingsPanel>

                <SettingsPanel
                    title="Company Profile"
                    description="Controls the company details shown in reports and exported files."
                    icon={Users}
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Company Name">
                            <TextInput value={settings.company.companyName} onChange={(value) => updateSection("company", "companyName", value)} />
                        </FormField>
                        <FormField label="Support Email">
                            <TextInput value={settings.company.supportEmail} onChange={(value) => updateSection("company", "supportEmail", value)} type="email" />
                        </FormField>
                        <FormField label="Phone">
                            <TextInput value={settings.company.phone} onChange={(value) => updateSection("company", "phone", value)} />
                        </FormField>
                        <FormField label="Timezone">
                            <SettingsSelect
                                value={settings.company.timezone}
                                onChange={(value) => updateSection("company", "timezone", value)}
                                options={["Pacific Time", "Mountain Time", "Central Time", "Eastern Time"]}
                            />
                        </FormField>
                        <div className="sm:col-span-2">
                            <FormField label="Address / Location">
                                <TextInput value={settings.company.address} onChange={(value) => updateSection("company", "address", value)} />
                            </FormField>
                        </div>
                    </div>
                </SettingsPanel>

                <SettingsPanel
                    title="Workflow Defaults"
                    description="Default rules used when projects, assignments, and tasks are created."
                    icon={ListChecks}
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Default Due Days">
                            <TextInput value={settings.workflow.defaultDueDays} onChange={(value) => updateSection("workflow", "defaultDueDays", normalizeNumber(value))} type="number" />
                        </FormField>
                        <FormField label="Daily Image Goal">
                            <TextInput value={settings.workflow.dailyImageGoal} onChange={(value) => updateSection("workflow", "dailyImageGoal", normalizeNumber(value))} type="number" />
                        </FormField>
                        <FormField label="Weekly Hour Target">
                            <TextInput value={settings.workflow.weeklyHourTarget} onChange={(value) => updateSection("workflow", "weeklyHourTarget", normalizeNumber(value))} type="number" />
                        </FormField>
                        <div className="space-y-3 sm:col-span-2">
                            <SettingToggle
                                label="Auto Assign Tasks"
                                description="Automatically suggest available employees when new tasks are created."
                                checked={settings.workflow.autoAssignTasks}
                                onChange={(value) => updateSection("workflow", "autoAssignTasks", value)}
                            />
                            <SettingToggle
                                label="Require Review Before Complete"
                                description="Tasks must move through Review before being marked Completed."
                                checked={settings.workflow.requireReviewBeforeComplete}
                                onChange={(value) => updateSection("workflow", "requireReviewBeforeComplete", value)}
                            />
                        </div>
                    </div>
                </SettingsPanel>

                <SettingsPanel
                    title="Notifications"
                    description="Control manager alerts and digest timing."
                    icon={Bell}
                >
                    <div className="space-y-3">
                        <SettingToggle
                            label="Due Date Alerts"
                            description="Notify managers when projects or assignments are close to the due date."
                            checked={settings.notifications.dueDateAlerts}
                            onChange={(value) => updateSection("notifications", "dueDateAlerts", value)}
                        />
                        <SettingToggle
                            label="Review Queue Alerts"
                            description="Notify managers when work is ready for quality review."
                            checked={settings.notifications.reviewQueueAlerts}
                            onChange={(value) => updateSection("notifications", "reviewQueueAlerts", value)}
                        />
                        <SettingToggle
                            label="Productivity Alerts"
                            description="Notify managers when productivity drops below target levels."
                            checked={settings.notifications.productivityAlerts}
                            onChange={(value) => updateSection("notifications", "productivityAlerts", value)}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Email Digest">
                            <SettingsSelect
                                value={settings.notifications.emailDigest}
                                onChange={(value) => updateSection("notifications", "emailDigest", value)}
                                options={["Off", "Daily", "Weekly"]}
                            />
                        </FormField>
                        <FormField label="Manager Summary Time">
                            <TextInput value={settings.notifications.managerSummaryTime} onChange={(value) => updateSection("notifications", "managerSummaryTime", value)} />
                        </FormField>
                    </div>
                </SettingsPanel>

                <SettingsPanel
                    title="Security & Access"
                    description="Manage session rules, access controls, and audit history."
                    icon={Settings}
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Session Timeout Minutes">
                            <TextInput value={settings.security.sessionTimeout} onChange={(value) => updateSection("security", "sessionTimeout", normalizeNumber(value))} type="number" />
                        </FormField>
                        <FormField label="Data Retention Days">
                            <TextInput value={settings.security.dataRetentionDays} onChange={(value) => updateSection("security", "dataRetentionDays", normalizeNumber(value))} type="number" />
                        </FormField>
                    </div>
                    <div className="space-y-3">
                        <SettingToggle
                            label="Require Two Factor Authentication"
                            description="Require an additional verification step when users sign in."
                            checked={settings.security.twoFactorRequired}
                            onChange={(value) => updateSection("security", "twoFactorRequired", value)}
                        />
                        <SettingToggle
                            label="Enable Role Management"
                            description="Allow managers to control employee access by role."
                            checked={settings.security.roleManagementEnabled}
                            onChange={(value) => updateSection("security", "roleManagementEnabled", value)}
                        />
                        <SettingToggle
                            label="Audit Logging"
                            description="Keep a history of major edits, deletes, exports, and setting changes."
                            checked={settings.security.auditLogging}
                            onChange={(value) => updateSection("security", "auditLogging", value)}
                        />
                    </div>
                </SettingsPanel>

                <SettingsPanel
                    title="Export & Backup"
                    description="Control report formats, backup timing, and export permissions."
                    icon={Download}
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Default Export Format">
                            <SettingsSelect
                                value={settings.exportBackup.defaultExportFormat}
                                onChange={(value) => updateSection("exportBackup", "defaultExportFormat", value)}
                                options={["CSV", "Excel", "PDF"]}
                            />
                        </FormField>
                        <FormField label="Backup Frequency">
                            <SettingsSelect
                                value={settings.exportBackup.backupFrequency}
                                onChange={(value) => updateSection("exportBackup", "backupFrequency", value)}
                                options={["Manual", "Daily", "Weekly"]}
                            />
                        </FormField>
                        <div className="sm:col-span-2">
                            <FormField label="Last Backup">
                                <TextInput value={settings.exportBackup.lastBackup} onChange={(value) => updateSection("exportBackup", "lastBackup", value)} />
                            </FormField>
                        </div>
                    </div>
                    <SettingToggle
                        label="Allow CSV Exports"
                        description="Managers can export project, employee, task, and settings data."
                        checked={settings.exportBackup.allowCsvExports}
                        onChange={(value) => updateSection("exportBackup", "allowCsvExports", value)}
                    />
                </SettingsPanel>

                <SettingsPanel
                    title="Appearance"
                    description="Display preferences for the dashboard interface."
                    icon={Sparkles}
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Theme">
                            <SettingsSelect
                                value={settings.appearance.theme}
                                onChange={(value) => updateSection("appearance", "theme", value)}
                                options={["Light", "Dark", "System"]}
                            />
                        </FormField>
                        <FormField label="Accent Color">
                            <SettingsSelect
                                value={settings.appearance.accentColor}
                                onChange={(value) => updateSection("appearance", "accentColor", value)}
                                options={["Violet", "Blue", "Green", "Slate"]}
                            />
                        </FormField>
                    </div>
                    <div className="space-y-3">
                        <SettingToggle
                            label="Compact Tables"
                            description="Reduce row height on data-heavy screens."
                            checked={settings.appearance.compactTables}
                            onChange={(value) => updateSection("appearance", "compactTables", value)}
                        />
                        <SettingToggle
                            label="Show Dashboard Tips"
                            description="Display helpful tips and reminders on dashboard cards."
                            checked={settings.appearance.showDashboardTips}
                            onChange={(value) => updateSection("appearance", "showDashboardTips", value)}
                        />
                    </div>
                </SettingsPanel>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-300 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold">Reset settings</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        This returns the Settings page to the default values, including the default data source mode.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={resetSettings}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Reset Defaults
                </button>
            </div>
        </section>
    );
}


/**
 * Employee self-service settings page for profile and preference updates.
 */
function EmployeeSettingsPage({ currentUser, onUserUpdate }) {
    const [profile, setProfile] = useState({
        name: currentUser?.name || "",
        email: currentUser?.email || "",
        phone: currentUser?.phone || "",
        role: currentUser?.role || "Employee",
        preferredName: currentUser?.name || "",
    });
    const [appearance, setAppearance] = useState({
        theme: currentUser?.preferences?.theme || "Light",
        accentColor: currentUser?.preferences?.accentColor || "Violet",
        compactTables: currentUser?.preferences?.compactTables || false,
        showDashboardTips: currentUser?.preferences?.showDashboardTips ?? true,
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [savedMessage, setSavedMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const updateProfile = (field, value) => {
        setSavedMessage("");
        setErrorMessage("");
        setProfile((current) => ({ ...current, [field]: value }));
    };

    const updateAppearance = (field, value) => {
        setSavedMessage("");
        setErrorMessage("");
        setAppearance((current) => ({ ...current, [field]: value }));
    };

    const updatePasswordField = (field, value) => {
        setSavedMessage("");
        setErrorMessage("");
        setPasswordForm((current) => ({ ...current, [field]: value }));
    };

    const saveProfile = async () => {
        const cleanProfile = {
            ...profile,
            name: profile.name.trim() || currentUser?.name || "Employee",
            preferredName: profile.preferredName.trim() || profile.name.trim() || currentUser?.name || "Employee",
            email: profile.email.trim() || currentUser?.email || "",
        };

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.updateUserProfile(currentUser.id, cleanProfile);
            } catch (apiError) {
                console.warn("Employee profile API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        const nextUser = {
            ...currentUser,
            name: cleanProfile.preferredName || cleanProfile.name,
            email: cleanProfile.email,
            phone: cleanProfile.phone,
            role: cleanProfile.role,
            personalProfile: cleanProfile,
            // Keep employeeName stable because task/assignment security filters use it
            // to match assigned work until the backend switches to employeeId-based joins.
            employeeName: currentUser?.employeeName,
        };
        onUserUpdate?.(nextUser);
        setSavedMessage("Personal information saved locally. Backend endpoint is ready for implementation.");
    };

    const saveAppearance = async () => {
        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.updateUserPreferences(currentUser.id, appearance);
            } catch (apiError) {
                console.warn("Employee preferences API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        const nextUser = {
            ...currentUser,
            preferences: appearance,
        };
        onUserUpdate?.(nextUser);
        setSavedMessage("Appearance preferences saved locally.");
    };

    const changePassword = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setErrorMessage("Please complete all password fields.");
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setErrorMessage("New password must be at least 6 characters.");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setErrorMessage("New password and confirmation do not match.");
            return;
        }

        if (getUseApiDataSetting()) {
            try {
                await apiPlaceholders.changeUserPassword(currentUser.id, passwordForm);
            } catch (apiError) {
                console.warn("Change password API endpoint is not connected yet. Saving locally.", apiError);
            }
        }

        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setErrorMessage("");
        setSavedMessage("Password change saved locally. Backend password endpoint is ready for implementation.");
    };

    return (
        <section className="space-y-5 bg-slate-50 p-3 sm:p-4 lg:p-6">
            <div className="rounded-xl border border-slate-300 bg-white px-5 py-5 shadow-sm">
                <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
                    <Settings size={30} /> My Settings
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
                    Employee settings are limited to your own profile, password, and appearance preferences. Company settings and employee management stay manager-only.
                </p>

                {savedMessage && (
                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                        {savedMessage}
                    </div>
                )}
                {errorMessage && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {errorMessage}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <SettingsPanel
                    title="Personal Information"
                    description="Update the information connected to your employee login."
                    icon={Users}
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Full Name">
                            <TextInput value={profile.name} onChange={(value) => updateProfile("name", value)} />
                        </FormField>
                        <FormField label="Preferred Name">
                            <TextInput value={profile.preferredName} onChange={(value) => updateProfile("preferredName", value)} />
                        </FormField>
                        <FormField label="Email">
                            <TextInput value={profile.email} onChange={(value) => updateProfile("email", value)} type="email" />
                        </FormField>
                        <FormField label="Phone">
                            <TextInput value={profile.phone} onChange={(value) => updateProfile("phone", value)} />
                        </FormField>
                        <FormField label="Role">
                            <TextInput value={profile.role} onChange={(value) => updateProfile("role", value)} />
                        </FormField>
                        <FormField label="Employee ID">
                            <TextInput value={currentUser?.employeeId || ""} onChange={() => {}} />
                        </FormField>
                    </div>
                    <button
                        type="button"
                        onClick={saveProfile}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                    >
                        Save Personal Information
                    </button>
                </SettingsPanel>

                <SettingsPanel
                    title="Change Password"
                    description="Update the password for your own employee login."
                    icon={Lock}
                >
                    <div className="grid grid-cols-1 gap-4">
                        <FormField label="Current Password">
                            <TextInput value={passwordForm.currentPassword} onChange={(value) => updatePasswordField("currentPassword", value)} type="password" />
                        </FormField>
                        <FormField label="New Password">
                            <TextInput value={passwordForm.newPassword} onChange={(value) => updatePasswordField("newPassword", value)} type="password" />
                        </FormField>
                        <FormField label="Confirm New Password">
                            <TextInput value={passwordForm.confirmPassword} onChange={(value) => updatePasswordField("confirmPassword", value)} type="password" />
                        </FormField>
                    </div>
                    <button
                        type="button"
                        onClick={changePassword}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                    >
                        Change Password
                    </button>
                </SettingsPanel>

                <SettingsPanel
                    title="Appearance"
                    description="Choose how your employee dashboard and work pages display."
                    icon={Sparkles}
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Theme">
                            <SettingsSelect
                                value={appearance.theme}
                                onChange={(value) => updateAppearance("theme", value)}
                                options={["Light", "Dark", "System"]}
                            />
                        </FormField>
                        <FormField label="Accent Color">
                            <SettingsSelect
                                value={appearance.accentColor}
                                onChange={(value) => updateAppearance("accentColor", value)}
                                options={["Violet", "Blue", "Green", "Slate"]}
                            />
                        </FormField>
                    </div>
                    <div className="space-y-3">
                        <SettingToggle
                            label="Compact Tables"
                            description="Reduce row height on task and assignment tables."
                            checked={appearance.compactTables}
                            onChange={(value) => updateAppearance("compactTables", value)}
                        />
                        <SettingToggle
                            label="Show Dashboard Tips"
                            description="Show reminders and helper text on your dashboard."
                            checked={appearance.showDashboardTips}
                            onChange={(value) => updateAppearance("showDashboardTips", value)}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={saveAppearance}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                    >
                        Save Appearance
                    </button>
                </SettingsPanel>

                <SettingsPanel
                    title="Access Summary"
                    description="Shows what this employee login can access."
                    icon={ShieldCheck}
                >
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <span className="font-semibold">Access Level</span>
                            <span>Employee</span>
                        </div>
                        <div className="flex justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <span className="font-semibold">Dashboard</span>
                            <span>Assigned work only</span>
                        </div>
                        <div className="flex justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <span className="font-semibold">Projects / Tasks</span>
                            <span>Limited to assigned items</span>
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 font-semibold text-amber-800">
                            Manager-only sections such as Employees, Reports, Analytics, and company Settings are hidden from this login.
                        </div>
                    </div>
                </SettingsPanel>
            </div>
        </section>
    );
}

export {
    SettingsPage,
    EmployeeSettingsPage,
};
