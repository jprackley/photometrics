# Productivity Tracking Dashboard Prototype

## Overview

In today’s business environment, organizations increasingly rely on data-driven insights to improve operational efficiency and maintain a competitive advantage. Companies that manage distributed teams, especially those operating across multiple countries, face challenges in tracking productivity, measuring performance, and identifying opportunities for improvement.

This project focuses on developing a prototype dashboard for a photography company that employs a remote workforce responsible for editing and processing images. The purpose of the dashboard is to provide visibility into employee productivity, task completion, and processing time. By leveraging performance data, the company can better understand workflow efficiency, establish benchmarks, and make informed decisions to enhance overall operations. :contentReference[oaicite:0]{index=0}

---

## Background and Need

The client is a photography company that relies on a team of approximately twenty remote workers located overseas to edit and process images. Currently, there is no centralized system in place to effectively track employee performance, monitor task completion, or measure the time required for images to move through the production cycle.

One of the primary challenges is the lack of clear performance metrics. The company needs a way to determine how long it takes for images to be processed, how individual employees contribute to overall output, and how to establish realistic performance benchmarks based on collected data. Without this information, it is difficult to identify inefficiencies or optimize workflows.

This project introduces a structured tracking and reporting system that provides visibility into operations and improves productivity. :contentReference[oaicite:1]{index=1}

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

This project is a proof of concept intended to demonstrate value rather than serve as a final system. :contentReference[oaicite:2]{index=2}

---

## Customers and Stakeholders

Primary Customer  
Cherished Memories Photography  

Key Users  
- Business owner  
- Managers  
- Operations leads  

Other Stakeholders  
- Employees whose work activity is tracked  

---

## Project Team

- Jonathon Kennedy – Project Manager / Developer  
- Jesse Ackley – Developer / Analyst  
- David Mallett – Developer / Tester  

---

## Project Requirements

### Functional Requirements

The system shall:

Project and Assignment Management  
- Allow managers to create, update, and delete employee assignments  

Task Management  
- Capture and categorize task types  
- Assign tasks to employees  

Time Tracking  
- Provide start and stop timers  
- Record time at task and project levels  
- Store elapsed time data  

Image Metrics Tracking  
- Store total, completed, and remaining images  
- Update image counts as work progresses  

Employee Data Management  
- Store and update hourly rates  
- Associate rates with project cost calculations  

Reporting  
- Generate employee activity, project progress, time usage, and image processing reports  

Performance Metrics  
- Calculate and display average time per task  
- Calculate and display average time per image  
- Calculate and display total hours worked per employee and project  

Analytics and Decision Support  
- Provide insights for project feasibility  
- Support decision-making using collected data  

Security and Access Control  
- Restrict system access to authorized users  
- Limit dashboards and reports to management-level users  

---

### Non-Functional Requirements

Performance  
- Dashboards load within 2–5 seconds  
- Reports generate within 5 seconds  
- Support concurrent users without performance degradation  

Usability  
- Intuitive and easy-to-use interface  
- Clear and professional dashboard layout  

Reliability and Data Integrity  
- Maintain accurate and consistent data  
- Prevent data loss during normal operation  

Security  
- Enforce authentication  
- Role-based access control  
- Protect sensitive business data  

Scalability and Flexibility  
- Support future enhancements  
- Handle increasing data volume and users  
- Allow integration with external systems  

Deployment  
- Web-based application  
- Accessible through modern browsers  
- No additional software installation required  

---

## Use Case Scenarios

Manage Project Assignments  
Managers create, update, and delete employee assignments  

Track Task Activity  
Managers assign tasks and track time using timers  

Monitor Project Progress  
Managers review image metrics and progress  

Generate Reports  
Managers analyze system-generated reports  

Analyze Efficiency  
Managers evaluate performance metrics to identify trends  

Evaluate Project Feasibility  
Managers determine if projects can be completed within constraints  

Manage Employee Data  
Managers maintain employee cost and rate data  

Secure System Access  
The system restricts access to authorized users  

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

---

## Future Enhancements

- Mobile application support  
- Integration with external systems  
- Scalable cloud-based architecture  

---

## Deliverable

The final deliverable is a prototype dashboard that demonstrates how a centralized system can:

- Track employee performance  
- Measure workflow efficiency  
- Provide actionable insights  
- Support better project planning  
