# Productivity Tracking Dashboard Prototype

## Overview

In today’s business environment, organizations increasingly rely on data-driven insights to improve operational efficiency and maintain a competitive advantage. Companies that manage distributed teams, especially those operating across multiple countries, face challenges in tracking productivity, measuring performance, and identifying opportunities for improvement.

This project focuses on developing a prototype dashboard for a photography company that employs a remote workforce responsible for editing and processing images. The purpose of the dashboard is to provide visibility into employee productivity, task completion, and processing time. By leveraging performance data, the company can better understand workflow efficiency, establish benchmarks, and make informed decisions to enhance overall operations.

---

## Background and Need

The client is a photography company that relies on a team of approximately twenty remote workers located overseas to edit and process images. Currently, there is no centralized system in place to effectively track employee performance, monitor task completion, or measure the time required for images to move through the production cycle.

One of the primary challenges is the lack of clear performance metrics. The company needs a way to determine how long it takes for images to be processed, how individual employees contribute to overall output, and how to establish realistic performance benchmarks based on collected data. Without this information, it is difficult to identify inefficiencies or optimize workflows.

This project addresses that need by introducing a structured tracking and reporting system that provides visibility into operations and improves productivity.

---

## Project Objectives

- Track which employee completed each assigned editing task  
- Measure time spent on each task and total workflow cycle time  
- Calculate averages and performance KPIs across individuals and teams  
- Provide visibility into task distribution and efficiency  
- Demonstrate the value of a centralized tracking dashboard  

---

## Scope

### In Scope

This project focuses on designing and developing a prototype (MVP) dashboard for internal business use. The system will:

- Collect employee task and time data  
- Display workflow and productivity metrics  
- Provide basic reporting functionality  
- Present KPIs such as:
  - Task completion rates  
  - Time per task  
  - Average turnaround time  
  - Employee productivity trends  

### Out of Scope

- Full production deployment  
- Enterprise-level security implementation  
- Integration with all existing business systems  
- Replacement of current operational workflow tools  

This project is a proof of concept intended to demonstrate value rather than serve as a final system.

---

## Customers and Stakeholders

**Primary Customer:**  
Cherished Memories Photography

**Key Users:**
- Business owner  
- Managers  
- Operations leads  

**Other Stakeholders:**
- Employees whose work activity is tracked  

---

## Project Requirements

The system requirements are derived from project objectives and customer needs. These requirements define the functionality, performance expectations, and behavior of the system.

---

### Functional Requirements

The system shall:

- Allow managers to assign employees to projects and tasks  
- Capture task types (e.g., editing, culling)  
- Provide a start/stop timer for tracking time  
- Store elapsed time for tasks and projects  
- Track image metrics:
  - Total images  
  - Completed images  
  - Remaining images  
- Store hourly rate information for cost analysis  
- Generate reports for:
  - Employee activity  
  - Project progress  
  - Time usage  
  - Image metrics  
- Calculate performance metrics:
  - Average time per task  
  - Average time per image  
  - Total hours worked  
- Provide insights for project feasibility  
- Restrict access to authorized management users  

---

### Non-Functional Requirements

**Performance**
- Dashboards load within 2–5 seconds  
- Support multiple users without performance issues  
- Reports generate within a few seconds  

**Usability**
- Simple and intuitive interface  
- Clear and presentation-ready dashboard  

**Reliability**
- Maintain accurate and consistent data  
- Prevent data loss during normal use  

**Security**
- Role-based access control  
- Protection of sensitive data  

**Scalability**
- Support future integrations  
- Handle increased users and data  

**Deployment**
- Web-based application with future mobile compatibility  

---

### Use Case Scenarios

**Track Task Activity**  
Managers assign tasks and track time using a timer  

**Monitor Project Progress**  
Managers view image metrics and elapsed time  

**Generate Reports**  
Managers analyze productivity and performance data  

**Analyze Efficiency**  
Managers identify bottlenecks using calculated metrics  

**Evaluate Feasibility**  
Managers determine if projects can be completed with available resources  

---

## Assumptions and Constraints

### Assumptions

- Managers are the primary users  
- Employees do not initially access dashboards  
- Time tracking is manual  
- The system is a prototype  
- Web platform is prioritized  
- Used for internal analysis  

### Constraints

- Limited project timeline  
- Small development team  
- Limited access to real data  
- No project budget  
- Scope limited to core functionality  

### Priorities

- Accurate time tracking  
- Meaningful reporting  
- Project feasibility insights  
- Clear dashboard interface  
- Web-based accessibility  

---

## Project Delivery

The system will be delivered as a web-based application accessible through standard internet browsers.

Users will be able to log in and access dashboards, reports, and project data from any device with internet connectivity. No installation is required.

### Requirements

- Modern web browser (Chrome, Edge, Safari)  
- Internet connection  
- User authentication  

### Future Enhancements

- Mobile application support  
- Integration with external systems  
- Scalable architecture  

---

## Deliverable

The final deliverable is a prototype dashboard that demonstrates how a centralized system can:

- Track employee performance  
- Measure workflow efficiency  
- Provide actionable insights  
- Support better project planning  
