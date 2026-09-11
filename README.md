# Mini ERP + CRM Operations Portal

A full-stack Mini ERP + CRM Operations Portal developed as a case study project for managing customers, products, inventory, stock movements, and sales challans.

The application provides role-based access for Admin, Sales, Warehouse, and Accounts users.

---

## Project Overview

The Mini ERP + CRM Operations Portal helps a business manage:

- Customer information
- CRM follow-ups
- Product inventory
- Stock IN and OUT movements
- Sales challans
- User authentication
- Role-based authorization
- PostgreSQL database operations
- REST APIs
- Responsive web interface

The project is built using React for the frontend, Node.js + Express.js + TypeScript for the backend, and PostgreSQL for the database.

---

## Features

### Authentication

- User registration
- User login
- Password hashing using bcrypt
- JWT-based authentication
- Protected API routes
- Role-based authorization

### CRM / Customers

- Add customers
- Edit customers
- Search customers
- Filter customers
- View customer details
- Customer status:
  - Lead
  - Active
  - Inactive
- Customer type:
  - Retail
  - Wholesale
  - Distributor
- GST number
- Business details
- Address
- Follow-up date
- Follow-up notes

### Products & Inventory

- Add products
- Edit products
- Search products
- Product categories
- SKU management
- Unit price
- Current stock
- Minimum stock level
- Warehouse location
- Low-stock identification
- Stock IN
- Stock OUT
- Stock movement history

### Sales Challans

- Create sales challan
- Automatically generate challan number
- Add multiple products
- Add product quantities
- Create Draft challan
- Confirm challan
- Cancelled status support
- Stock is reduced when a challan is confirmed
- Prevents negative stock
- Shows insufficient stock error
- Stores product snapshot information in challan items

---

## User Roles

| Role | Main Access |
|------|-------------|
| ADMIN | Full system access |
| SALES | Customers and Sales Challans |
| WAREHOUSE | Products and Stock |
| ACCOUNTS | Accounts-related operations |

Backend role-based middleware is used to restrict protected operations.

---

## Technology Stack

### Frontend

- React
- JavaScript
- CSS
- Vite
- Fetch API

### Backend

- Node.js
- Express.js
- TypeScript
- JWT
- bcryptjs

### Database

- PostgreSQL

### Development Tools

- Visual Studio Code
- Git
- GitHub
- Postman
- pgAdmin

---

## Project Structure

```text
mini-erp-crm/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── customerController.ts
│   │   │   ├── productController.ts
│   │   │   └── challanController.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts
│   │   │   └── roleMiddleware.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── customerRoutes.ts
│   │   │   ├── productRoutes.ts
│   │   │   └── challanRoutes.ts
│   │   │
│   │   └── server.ts
│   │
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── frontend/
│
├── database/
│   └── schema.sql
│
├── postman/
│
├── .gitignore
└── README.md