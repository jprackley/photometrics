// -----------------------------------------------------------------------------
// Page exports
// -----------------------------------------------------------------------------
// The original Pages.jsx file was split into smaller files so each major screen
// can be maintained independently while App.jsx can keep importing from this hub.
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
