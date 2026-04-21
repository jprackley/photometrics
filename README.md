# Productivity Tracking Dashboard Prototype

## Overview

This project is a **prototype dashboard** designed for a photography company with a remote workforce responsible for editing and processing images. The goal is to provide visibility into employee productivity, workflow efficiency, and task performance using centralized data tracking and reporting.

The system demonstrates how organizations can leverage data-driven insights to improve operational efficiency, establish benchmarks, and support better decision-making.

---

## Background and Need

The client, Cherished Memories Photography, employs approximately twenty remote workers located overseas. Currently, there is no centralized system to:

- Track employee performance
- Monitor task completion
- Measure image processing time

This lack of visibility makes it difficult to identify inefficiencies and optimize workflows. This project introduces a structured tracking and reporting system to address these challenges.

---

## Project Objectives

- Track which employee completes each editing task
- Measure time spent per task and overall workflow cycle time
- Calculate averages and key performance indicators (KPIs)
- Provide insight into task distribution and efficiency
- Demonstrate the value of a centralized dashboard (proof of concept)

---

## Scope

### In Scope

- Prototype (MVP) web-based dashboard
- Employee task and time tracking
- KPI visualization and reporting
- Metrics including:
  - Task completion rates
  - Time per task
  - Average turnaround time
  - Employee productivity trends

### Out of Scope

- Full production deployment
- Enterprise-level security
- Full system integrations
- Replacement of existing workflow tools

---

## Customers and Stakeholders

**Primary Customer:**  
Cherished Memories Photography

**Key Users:**
- Business owner
- Managers
- Operations leads

**Other Stakeholders:**
- Employees (tracked within the system)

---

## Project Team

- Jonathon Kennedy – Project Manager / Developer  
- Jesse Ackley – Developer / Analyst  
- David Mallett – Developer / Tester

---

## System Requirements

### Functional Requirements

The system supports:

#### Project & Assignment Management
- Create, update, and delete employee assignments

#### Task Management
- Define and categorize task types
- Assign tasks to employees

#### Time Tracking
- Start/stop timers
- Record time per task and project

#### Image Metrics Tracking
- Track total, completed, and remaining images

#### Employee Data Management
- Store and update hourly rates
- Link rates to project costs

#### Reporting
- Employee activity reports
- Project progress reports
- Time utilization reports
- Image processing reports

#### Performance Metrics
- Average time per task
- Average time per image
- Total hours per employee and project

#### Analytics & Decision Support
- Project feasibility insights
- Data-driven decision making

#### Security
- Authentication
- Role-based access control
- Management-only dashboard access

---

### Non-Functional Requirements

#### Performance
- Dashboards load within 2–5 seconds
- Reports generate within 5 seconds
- Supports concurrent users

#### Usability
- Intuitive UI
- Clear dashboard design

#### Reliability
- Accurate and consistent data
- Prevent data loss

#### Security
- Authentication and authorization
- Protection of sensitive data

#### Scalability
- Supports future enhancements
- Handles increased data and users

#### Deployment
- Web-based application
- Accessible via modern browsers
- No installation required

---

## Use Case Scenarios

- Manage project assignments
- Track task activity with timers
- Monitor project progress
- Generate reports
- Analyze efficiency
- Evaluate project feasibility
- Manage employee data
- Secure system access

---

## Assumptions and Constraints

### Assumptions

- Managers are primary users
- Employees do not access dashboards initially
- Time tracking is manual
- System is a prototype
- Web platform prioritized

### Constraints

- Limited timeline
- Small team
- Limited real data
- No project budget
- MVP-focused scope

### Priorities

- Accurate time tracking
- Meaningful reporting
- Clear dashboard interface
- Web accessibility

---

## Technology Stack

- **Frontend:** React
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Visualization:** Chart.js
- **Tools:** GitHub, Postman

---

## Architecture

The system follows a **three-tier architecture**:

1. **Presentation Layer (Frontend)** – User interface and dashboards
2. **Application Layer (Backend)** – Business logic and APIs
3. **Data Layer (Database)** – Structured data storage

### Core Modules

- Authentication
- Project Management
- Task Management
- Time Tracking
- Image Metrics
- Reporting & Analytics

---

## Agile Development Plan

The project is developed using Agile methodology with:

- Daily stand-ups
- Weekly sprint planning
- Iterative development (4 iterations)

### Iteration Highlights

1. Setup environment, authentication, project management
2. Task management and time tracking
3. KPI calculations and dashboard visuals
4. Reporting, testing, and deployment

---

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Limited timeline | High | Focus on MVP features |
| Small team | Medium | Clear roles and communication |
| No real data | Medium | Use mock data |
| Tech inexperience | Medium | Use familiar tools |
| Scope creep | High | Strict scope control |

---

## Project Delivery

- Web-based prototype
- Accessible via browser
- No installation required

### Requirements

- Modern browser (Chrome, Edge, Safari)
- Internet connection
- User authentication

---

## Future Enhancements

- Mobile application
- Cloud deployment
- Integration with external systems

---

## Deliverable

A working prototype dashboard that demonstrates:

- Employee performance tracking
- Workflow efficiency measurement
- KPI reporting and insights
- Improved project planning capabilities

---

## Conclusion

This project delivers a proof-of-concept system that provides visibility into productivity and workflow performance for a remote photography team. It establishes a strong foundation for future expansion into a full production system.
