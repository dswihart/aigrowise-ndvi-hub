
# Aigrowise NDVI Hub Product Requirements Document (PRD)

### **Section 1: Goals and Background Context**

#### **Goals**

* To provide a secure, centralized platform for Aigrowise clients to store and access their NDVI imagery.
* To ensure strict data privacy and isolation, where each client can only view data associated with their specific location or account.
* To deliver a user-friendly web interface that simplifies viewing and managing agricultural image data.
* To build the application using the Next.js framework and ensure it is deployable as a Digital Ocean Droplet.

#### **Background Context**

Aigrowise provides valuable NDVI imagery to its clients for agricultural monitoring. Currently, the lack of a centralized platform for clients to access this data can lead to inefficient data sharing and difficulty in tracking historical imagery.

This project will create a dedicated web portal, "Aigrowise NDVI Hub," to solve this problem. The hub will serve as a secure, value-added service, giving each client a single point of access to their location-specific data. This will enhance customer satisfaction, improve data accessibility, and provide a professional interface for Aigrowise's services.

#### **Change Log**

| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| Aug 14, 2025 | 1.0 | Initial PRD draft | John (PM) |

---
### **Section 2: Requirements**

#### **Functional Requirements**

* **FR1:** The system must provide a secure login mechanism for clients using a username and password.
* **FR2:** Authenticated users must be able to view a gallery or list of the NDVI images associated with their account.
* **FR3:** The system must enforce strict data isolation, ensuring a client can only ever view data and images assigned to their specific account.
* **FR4:** A separate administrative interface must exist that allows an authorized administrator to upload new NDVI images and associate them with the correct client accounts.

#### **Non-Functional Requirements**

* **NFR1:** The application must be built using the Next.js framework.
* **NFR2:** The application must be configured for deployment on a Digital Ocean Droplet.
* **NFR3:** The website must be accessible and function correctly on all modern, up-to-date web browsers (e.g., Chrome, Firefox, Safari, Edge).
* **NFR4:** The system must ensure the security and confidentiality of all client data, both in transit and at rest.

---
### **Section 3: User Interface Design Goals**

#### **Overall UX Vision**

The user experience should be clean, professional, and intuitive. The primary goal is to provide clients with effortless and secure access to their NDVI imagery. The interface should inspire confidence and be straightforward to navigate, requiring minimal to no training for new users.

#### **Key Interaction Paradigms**

* **Client View**: A simple, secure login followed by a gallery or dashboard view of their images. Users should be able to easily view thumbnails and click to see a larger version.
* **Admin View**: A distinct administrative area for managing clients and uploading imagery. The workflow for uploading and assigning an image to a client must be efficient and error-proof.

#### **Core Screens and Views**

* Client Login Screen
* Client Image Gallery
* Admin Login Screen
* Admin Dashboard
* Image Upload Form

#### **Accessibility: WCAG AA**

The application should meet WCAG 2.1 Level AA standards.

#### **Branding**

The design will need to incorporate the official Aigrowise corporate branding.

#### **Target Device and Platforms: Web Responsive**

The application must be fully responsive and provide a seamless experience on all common device sizes.

---
### **Section 4: Technical Assumptions**

#### **Repository Structure: Monorepo**

A monorepo is recommended to simplify dependency management and ensure consistency between the API and the user interface.

#### **Service Architecture: Monolithic Application**

The application will be a single, unified project where the frontend and backend API routes are developed and deployed together, which is the standard approach for Next.js.

#### **Testing Requirements: Unit + Integration Tests**

The project will include unit tests for individual components and integration tests to ensure different parts of the application work together correctly.

#### **Additional Technical Assumptions and Requests**

* **Database**: The application will require a relational database (e.g., PostgreSQL or MySQL).
* **Image Storage**: The application should use a dedicated object storage service, such as DigitalOcean Spaces.

---
### **Section 5: Epic List**

* **Epic 1: Foundational Setup & Client Authentication**: Establish the core Next.js project, set up the database, and implement a complete, secure login and registration system for clients.
* **Epic 2: Image Management & Admin Functionality**: Develop the administrative interface for uploading images and associating them with clients, and display the correct images in the client's gallery.
* **Epic 3: Deployment & Production Readiness**: Configure the application for a production environment on a Digital Ocean Droplet, including setting up the production database, object storage, and final security hardening.

---
### **Epic 1 Details: Foundational Setup & Client Authentication**

* **Story 1.1: Project Initialization**: Initialize a new Next.js project with TypeScript and Tailwind CSS.
* **Story 1.2: Database Setup and Connection**: Set up a PostgreSQL database and connect it to the Next.js application using Prisma.
* **Story 1.3: User Registration and Login API**: Create secure API endpoints for user registration and login.
* **Story 1.4: Login User Interface**: Create a clean login page for users to enter their credentials.
* **Story 1.5: Protected Dashboard Page**: Create a private dashboard page accessible only to logged-in users, with a logout function.

---
### **Epic 2 Details: Image Management & Admin Functionality**

* **Story 2.1: Implement Admin Role**: Add a `role` to the User model to distinguish between clients and administrators.
* **Story 2.2: Create Protected Admin Area**: Create a private admin section accessible only to admin users.
* **Story 2.3: Image Database Model**: Create a database model for storing image metadata and associating it with a client.
* **Story 2.4: Admin Image Upload UI**: Create an interface for administrators to upload images and assign them to clients.
* **Story 2.5: Display Images in Client Dashboard**: Update the client dashboard to display a gallery of their assigned images.

---
### **Epic 3 Details: Deployment & Production Readiness**

* **Story 3.1: Production Configuration**: Prepare the application's configuration for a secure production environment.
* **Story 3.2: Infrastructure Provisioning**: Provision the necessary cloud infrastructure on Digital Ocean.
* **Story 3.3: Web Server & Process Management**: Configure a web server (Nginx) and process manager (PM2) on the Droplet.
* **Story 3.4: Deployment Process**: Create a simple, repeatable process to deploy the application.

