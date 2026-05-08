import React from "react";

// Icons used throughout the UI
import {
    Bell,
    BarChart3,
    Folder,
    LayoutDashboard,
    ListChecks,
    LogOut,
    Search,
    Settings,
    Sparkles,
    Users,
} from "lucide-react";

// Recharts components for graphs/charts
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
} from "recharts";

// Sidebar menu items
const navItems = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Projects", icon: Folder },
    { label: "Employees", icon: Users },
    { label: "Tasks", icon: ListChecks },
    { label: "Reports", icon: BarChart3 },
    { label: "Analytics", icon: Sparkles },
    { label: "Settings", icon: Settings },
];

// KPI card data
const kpis = [
    ["Total Projects", "12"],
    ["Tasks Completed Today", "45"],
    ["Images Completed", "3,256"],
    ["Average Editing Time", "18m 42s"],
    ["Total Employee Hours", "128.5"],
    ["Efficiency", "87%"],
];

// Productivity chart data
const productivity = [
    { day: "May 12", value: 30, color: "#d9252a" },
    { day: "May 13", value: 45, color: "#7fb347" },
    { day: "May 14", value: 32, color: "#7e57c2" },
    { day: "May 15", value: 44, color: "#35a9d6" },
    { day: "May 16", value: 58, color: "#35a9d6" },
    { day: "May 17", value: 29, color: "#f58a2a" },
    { day: "May 18", value: 48, color: "#0b3d64" },
];

// Workflow pie chart data
const workflow = [
    { name: "Editing", value: 40, color: "#ef233c" },
    { name: "Culling", value: 25, color: "#f5c400" },
    { name: "Review", value: 15, color: "#2fb344" },
    { name: "Completed", value: 20, color: "#2563eb" },
];

// Employee activity table data
const employeeActivity = [
    ["John Doe", "Editing", "2h 15m", "In Progress"],
    ["Jane Doe", "Culling", "1h 05m", "Completed"],
    ["Terry Lee", "Review", "45m", "In Progress"],
    ["David Kim", "Editing", "3h 10m", "In Progress"],
    ["Luis Garcia", "Culling", "1h 30m", "Completed"],
];

// Project progress data
const projectProgress = [
    ["Wedding - Smith", "1200", "900", "300", 75],
    ["Event - Johnson", "800", "650", "150", 81],
    ["Portrait - Sampson", "600", "450", "150", 75],
    ["Graduation - Hathaway", "1000", "800", "200", 80],
    ["Graduation - McDougal", "1000", "100", "900", 10],
];

// Projects table data
const projects = [
    ["Graduation - Smith", "John Smith", "May 01, 2026", "May 27, 2026", "1200", 50, "In Progress"],
    ["Graduation - Miller", "Steve Miller", "May 01, 2026", "May 28, 2026", "800", 50, "In Progress"],
    ["Graduation - Franklen", "Jo Franklen", "May 01, 2026", "May 29, 2026", "450", 50, "Review"],
    ["Graduation - Mcdougal", "Joe Mcdougal", "May 01, 2026", "May 29, 2026", "600", 100, "Completed"],
    ["Graduation - Dunkan", "Fred Dunkan", "May 01, 2026", "May 30, 2026", "300", 50, "In Progress"],
];

// Assignment table data
const assignments = [
    ["ASG-2579", "Wedding - Smith", "Photo Editing", "John Freeman", "May 01, 2026", "May 18, 2026", "High", "In Progress"],
    ["ASG-2580", "Wedding - Smith", "Culling", "Larry Waymer", "May 01, 2026", "May 16, 2026", "Medium", "Completed"],
    ["ASG-2581", "Graduation - Mcdougal", "Photo Editing", "John Doe", "May 01, 2026", "May 20, 2026", "High", "In Progress"],
    ["ASG-2582", "Graduation - Duncan", "Retouching", "Sarah Conner", "May 01, 2026", "May 15, 2026", "Medium", "Review"],
    ["ASG-2583", "Graduation - Miller", "Color Correction", "Susan Conner", "May 01, 2026", "May 8, 2026", "High", "Completed"],
];

// Company logo component
function Logo() {
    return (
        <div className="flex items-center justify-center w-full">
            <img
                src="https://chambermaster.blob.core.windows.net/images/customers/2243/members/7487/logos/MEMBER_PAGE_HEADER/CM_final_logo_(2).jpg"
                alt="Company Logo"
                className="h-[70px] w-auto object-contain"
            />
        </div>
    );
}

// Left sidebar navigation
function Sidebar() {
    return (
        <aside className="flex min-h-screen w-[260px] flex-col border-r border-slate-200 bg-white">

            {/* Logo section */}
            <div className="flex h-[86px] items-center border-b border-slate-200 px-5">
                <Logo />
            </div>

            {/* Navigation buttons */}
            <nav className="flex-1 space-y-3 p-4 pt-6">
                {navItems.map(({ label, icon: Icon }, index) => (
                    <button
                        key={label}

                        // Highlight dashboard button
                        className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-lg transition hover:bg-slate-100 ${
                            index === 0 ? "bg-slate-100 font-semibold" : "font-medium"
                        }`}
                    >
                        <Icon size={24} strokeWidth={2} />
                        {label}
                    </button>
                ))}
            </nav>

            {/* Logout button */}
            <button className="m-4 flex items-center gap-4 rounded-xl px-4 py-3 text-lg font-semibold hover:bg-slate-100">
                <LogOut size={24} /> Logout
            </button>
        </aside>
    );
}

// Top header bar
function Topbar() {
    return (
        <header className="flex h-[86px] items-center justify-between border-b border-slate-200 bg-white px-8">

            {/* Search bar */}
            <div className="flex w-[380px] items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 shadow-sm">
                <Search size={20} className="text-slate-500" />
                <input className="w-full text-base outline-none" placeholder="Search" />
            </div>

            {/* User info area */}
            <div className="flex items-center gap-6 pr-2">
                <Bell size={24} />

                {/* User profile image */}
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 border-slate-300 bg-slate-100 shadow-sm">
                    <img
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQI6QNyB22A2rTJfdHWecRsPWOH4OlbAUGIhQ&s"
                        alt="Logged in manager"
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="text-lg font-bold">Manager⌄</div>
            </div>
        </header>
    );
}

// Status badge component
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

// Creates colored chart line segments
function ColoredLineSegment({ segment, index }) {

    // Skip last item
    if (index === productivity.length - 1) return null;

    return (
        <Line
            type="monotone"

            // Only render current + next data point
            dataKey={(row) => {
                const currentIndex = productivity.findIndex(
                    (item) => item.day === row.day
                );

                return currentIndex === index ||
                currentIndex === index + 1
                    ? row.value
                    : null;
            }}

            stroke={segment.color}
            strokeWidth={6}
            dot={false}
            activeDot={false}
            connectNulls={false}
            legendType="none"
        />
    );
}

// Main dashboard page
function Dashboard() {
    return (
        <section className="space-y-5 bg-slate-50 p-6">

            {/* KPI cards */}
            <div className="grid grid-cols-6 gap-4">
                {kpis.map(([label, value]) => (
                    <div
                        key={label}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-7 text-center shadow-sm"
                    >
                        <div className="text-sm font-bold">{label}</div>

                        {/* Highlight efficiency in green */}
                        <div
                            className={`mt-6 text-4xl ${
                                label === "Efficiency"
                                    ? "text-green-700"
                                    : "text-black"
                            }`}
                        >
                            {value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-[1.07fr_0.93fr] gap-5">

                {/* Productivity chart */}
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="mb-2 text-2xl font-bold">
                        Employee Productivity Over Time
                    </h2>

                    <ResponsiveContainer width="100%" height={230}>
                        <LineChart
                            data={productivity}
                            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="4 4"
                                stroke="#d8dde6"
                            />

                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tickMargin={12}
                            />

                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 60]}
                                ticks={[0, 15, 30, 45, 60]}
                            />

                            <Tooltip />

                            {/* Colored chart segments */}
                            {productivity.map((item, index) => (
                                <ColoredLineSegment
                                    key={item.day}
                                    segment={item}
                                    index={index}
                                />
                            ))}

                            {/* Invisible line for chart dots */}
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="transparent"
                                strokeWidth={0}
                                label={{
                                    position: "top",
                                    fill: "#111827",
                                    fontSize: 14
                                }}

                                // Custom dots
                                dot={(props) => {
                                    const item = productivity[props.index];

                                    return (
                                        <circle
                                            cx={props.cx}
                                            cy={props.cy}
                                            r={5}
                                            fill="white"
                                            stroke={item.color}
                                            strokeWidth={3}
                                        />
                                    );
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Workflow pie chart */}
                <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <h2 className="mb-2 text-2xl font-bold">
                        Workflow Distribution
                    </h2>

                    <div className="flex h-[230px] items-center justify-center gap-16">

                        {/* Pie chart */}
                        <ResponsiveContainer width="40%" height="100%">
                            <PieChart>
                                <Pie
                                    data={workflow}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={92}
                                    label={false}
                                    labelLine={false}
                                    stroke="white"
                                    strokeWidth={4}
                                >
                                    {workflow.map((item) => (
                                        <Cell
                                            key={item.name}
                                            fill={item.color}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Legend */}
                        <div className="w-64 space-y-5">
                            {workflow.map((item) => (
                                <div
                                    key={item.name}
                                    className="grid grid-cols-[1fr_auto] items-center gap-8"
                                >
                                    <div
                                        className="flex items-center gap-4"
                                        style={{ color: item.color }}
                                    >
                                        <span
                                            className="h-4 w-4 rounded-full"
                                            style={{
                                                backgroundColor: item.color
                                            }}
                                        />

                                        <span className="text-base font-medium">
                                            {item.name}
                                        </span>
                                    </div>

                                    <strong className="text-base">
                                        {item.value}%
                                    </strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom tables */}
            <div className="grid grid-cols-[0.95fr_1.05fr] gap-5">
                <EmployeeActivityPanel />
                <ProjectProgressPanel />
            </div>
        </section>
    );
}

// Employee activity table
function EmployeeActivityPanel() {
    return (
        <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-2xl font-bold">
                Employee Activity
            </h2>

            <table className="w-full border-collapse text-sm">

                {/* Table header */}
                <thead>
                <tr>
                    {["Employee", "Current Task", "Time Spent", "Status"]
                        .map((h) => (
                            <th
                                key={h}
                                className="border border-slate-300 bg-white p-2 font-bold"
                            >
                                {h}
                            </th>
                        ))}
                </tr>
                </thead>

                {/* Table rows */}
                <tbody>
                {employeeActivity.map((row) => (
                    <tr key={row[0]}>
                        <td className="border border-slate-300 px-3 py-2">
                            {row[0]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            {row[1]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            {row[2]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            <Badge value={row[3]} />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <button className="mt-4 font-semibold text-blue-600">
                View all employees →
            </button>
        </div>
    );
}

// Project progress table
function ProjectProgressPanel() {
    return (
        <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-2xl font-bold">
                Project Progress
            </h2>

            <table className="w-full border-collapse text-sm">

                {/* Table header */}
                <thead>
                <tr>
                    {["Project", "Total Images", "Completed", "Remaining", "Progress"]
                        .map((h) => (
                            <th
                                key={h}
                                className="border border-slate-300 bg-white p-2 font-bold"
                            >
                                {h}
                            </th>
                        ))}
                </tr>
                </thead>

                {/* Table rows */}
                <tbody>
                {projectProgress.map((row) => (
                    <tr key={row[0]}>
                        <td className="border border-slate-300 px-3 py-2">
                            {row[0]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            {row[1]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            {row[2]}
                        </td>

                        <td className="border border-slate-300 px-3 py-2 text-center">
                            {row[3]}
                        </td>

                        {/* Progress bar */}
                        <td className="border border-slate-300 px-3 py-2">
                            <div className="flex items-center gap-3">

                                <div className="h-3 flex-1 rounded bg-slate-100">
                                    <div
                                        className="h-full rounded bg-violet-600"
                                        style={{ width: `${row[4]}%` }}
                                    />
                                </div>

                                <span>{row[4]}%</span>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <button className="mt-4 font-semibold text-blue-600">
                View all projects →
            </button>
        </div>
    );
}

// Projects + assignments page
function ProjectsAndAssignments() {
    return (
        <section className="space-y-4 p-4">

            {/* Projects table */}
            <div className="rounded-xl border bg-white p-3 shadow-sm">

                <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <Folder /> Projects
                </h2>

                <table className="mt-3 w-full text-sm">

                    <thead className="bg-slate-200">
                    <tr>
                        {[
                            "Project Name",
                            "Client",
                            "Start Date",
                            "Due Date",
                            "Images",
                            "Progress",
                            "Status",
                        ].map((h) => (
                            <th key={h} className="p-3 text-left">
                                {h}
                            </th>
                        ))}
                    </tr>
                    </thead>

                    <tbody>
                    {projects.map((row) => (
                        <tr key={row[0]} className="border-b">

                            {row.map((cell, i) => (
                                <td key={i} className="p-3">

                                    {/* Show badge for status column */}
                                    {i === 6
                                        ? <Badge value={cell} />
                                        : cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Assignments table */}
            <div className="rounded-xl border bg-white p-3 shadow-sm">

                <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <Users /> Assignments
                </h2>

                <table className="mt-3 w-full text-sm">

                    <thead className="bg-slate-200">
                    <tr>
                        {[
                            "Assignment ID",
                            "Project",
                            "Task Type",
                            "Assigned To",
                            "Assigned Date",
                            "Due Date",
                            "Priority",
                            "Status",
                        ].map((h) => (
                            <th key={h} className="p-3 text-left">
                                {h}
                            </th>
                        ))}
                    </tr>
                    </thead>

                    <tbody>
                    {assignments.map((row) => (
                        <tr key={row[0]} className="border-b">

                            {row.map((cell, i) => (
                                <td key={i} className="p-3">

                                    {/* Status badge */}
                                    {i === 7
                                        ? <Badge value={cell} />
                                        : cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

// Root app component
export default function App() {

    // Temporary page state
    const page = "dashboard";

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <div className="flex">

                {/* Sidebar */}
                <Sidebar />

                {/* Main content */}
                <main className="flex-1">

                    {/* Top header */}
                    <Topbar />

                    {/* Render page */}
                    {page === "dashboard"
                        ? <Dashboard />
                        : <ProjectsAndAssignments />}
                </main>
            </div>
        </div>
    );
}