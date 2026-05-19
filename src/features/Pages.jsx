// -----------------------------------------------------------------------------
// Page exports
// -----------------------------------------------------------------------------
// I chopped up the original Pages.jsx file into smaller files so each major screen
// can be maintained independently and changed Pages.jsx into an import hub.
// -----------------------------------------------------------------------------

export { LoginPage } from "./LoginPage";
export { Dashboard } from "./DashboardPage";
export { ReportsPage } from "./ReportsPage";
export { AnalyticsPage } from "./AnalyticsPage";
export {
    ProjectsAndAssignments,
    ProjectsAndAssignmentsSecure,
} from "./ProjectsAndAssignmentsPage";
export { EmployeesPage } from "./EmployeesPage";
export {
    TaskManagementPage,
    TaskManagementPageSecure,
} from "./TaskManagementPage";
export {
    SettingsPage,
    EmployeeSettingsPage,
} from "./SettingsPage";
export { PlaceholderPage } from "./PlaceholderPage";
