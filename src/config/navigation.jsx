// -----------------------------------------------------------------------------
// Navigation Configuration
// -----------------------------------------------------------------------------
// Defines the sidebar menu in one place so page labels, route keys, and icons
// remain consistent across layout rendering and role-based access checks.
// -----------------------------------------------------------------------------

import {
    BarChart3,
    Folder,
    LayoutDashboard,
    ListChecks,
    Settings,
    Sparkles,
    Users,
} from "lucide-react";

// Sidebar menu items
// Sidebar navigation configuration. Each item pairs a display label with a page key and Lucide icon.
const navItems = [
    { label: "Dashboard", page: "dashboard", icon: LayoutDashboard },
    { label: "Projects", page: "projects", icon: Folder },
    { label: "Employees", page: "employees", icon: Users },
    { label: "Tasks", page: "tasks", icon: ListChecks },
    { label: "Reports", page: "reports", icon: BarChart3 },
    { label: "Analytics", page: "analytics", icon: Sparkles },
    { label: "Settings", page: "settings", icon: Settings },
];

export { navItems };
