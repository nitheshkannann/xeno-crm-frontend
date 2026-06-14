# Xeno CRM Frontend

Welcome to the **Xeno CRM Frontend** repository. This project is a modern, responsive, and highly interactive web application built to serve as the user interface for the Xeno CRM platform.

## 🚀 Tech Stack

This project leverages a modern React ecosystem to deliver a performant and maintainable application:

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Routing:** React Router v7
- **State Management:** Zustand (global state), React Query (server state & data fetching)
- **Styling:** Tailwind CSS, PostCSS
- **Icons:** Lucide React
- **Charts & Data Visualization:** Recharts
- **Animations:** Framer Motion

## 📁 Project Structure

The codebase is organized as follows:

```
├── public/                 # Static assets
├── src/                    # Source code
│   ├── components/         # Reusable UI components (e.g., Layout, Modals)
│   ├── lib/                # Utility functions and API configuration (api.ts, utils.ts)
│   ├── pages/              # Application routes/pages
│   ├── stores/             # Zustand state stores (e.g., authStore.ts)
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Main application component & routing setup
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles and Tailwind imports
├── Dockerfile.dev          # Docker configuration for development
├── package.json            # Project dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

## ✨ Features & Pages

The application includes the following core modules:

- **🔐 Authentication:** Secure login flow and protected routes.
- **📊 Dashboard:** High-level overview of key metrics and activities.
- **👥 Customers:** Manage customer profiles, details, and history.
- **🛍️ Orders:** Track and manage customer orders.
- **🎯 Segments:** Create and manage customer segments for targeted marketing.
- **📢 Campaigns:** Design, launch, and monitor marketing campaigns.
- **🤖 AI Agent:** Interact with an intelligent agent for automated CRM tasks.
- **🧠 Intelligence:** Advanced insights and predictive analytics.
- **🛒 Abandoned Carts:** Track and recover abandoned shopping carts.
- **📈 Analytics:** Deep dive into platform data and performance metrics.
- **⚙️ Settings:** User preferences and platform configuration.

## 🛠️ Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd xeno-crm-frontend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

### Development Scripts

The following npm scripts are available:

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles TypeScript and builds the application for production.
- `npm run preview`: Previews the production build locally.
- `npm run typecheck`: Runs TypeScript type checking without emitting files.
- `npm run lint`: Runs ESLint to analyze the code for potential errors.

### Running the App Locally

To start the development server, run:

```bash
npm run dev
```

The application will typically be accessible at `http://localhost:5173`.

### Running with Docker

The project includes a `Dockerfile.dev` for containerized development. To build and run using Docker Compose (assuming a `docker-compose.yml` is present in the parent or current directory):

```bash
docker compose up --build
```
