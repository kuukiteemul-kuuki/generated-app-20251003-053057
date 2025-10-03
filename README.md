# OK Eki: Road Association Management
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kuukiteemul-kuuki/OK-Eki-0.1)
A sophisticated, minimalist web application for managing Finnish road associations and automating the calculation of road maintenance fees.
OK Eki is a modern, visually stunning web application designed to simplify the management of Finnish private road associations ('tiekunta'). It provides a multi-tiered user system for super administrators, association chairpersons, and individual members. The core functionality revolves around the precise calculation of road maintenance fees based on detailed usage parameters, as specified by the Finnish Transport Infrastructure Agency (MML) guidelines. The application automates the complex process of calculating 'ton-kilometers' (tkm) and distributing costs fairly among members, replacing manual spreadsheets with an intuitive, error-free digital solution.
## Key Features
- **Multi-Role User System:** Dedicated dashboards and views for Super Admins, Association Admins, and individual Members.
- **Road Association Management:** Super Admins can create, view, edit, and delete road associations.
- **Member & Usage Management:** Association Admins can manage members, their properties, and detailed road usage data.
- **Automated Fee Calculation:** Implements the official MML guidelines for calculating road usage units (ton-kilometers) and distributing annual costs.
- **Personal Member Portal:** Members can view their data, calculated units, and annual fees.
- **Modern, Responsive UI:** A clean, intuitive, and visually stunning interface built for all devices.
## Technology Stack
- **Frontend:**
  - [React](https://react.dev/)
  - [Vite](https://vitejs.dev/)
  - [React Router](https://reactrouter.com/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/)
  - [Zustand](https://zustand-demo.pmnd.rs/) for state management
  - [React Hook Form](https://react-hook-form.com/) for form handling
- **Backend:**
  - [Hono](https://hono.dev/) running on [Cloudflare Workers](https://workers.cloudflare.com/)
- **Database:**
  - [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/) for state persistence
- **Language:**
  - [TypeScript](https://www.typescriptlang.org/)
## Getting Started
Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.
### Prerequisites
You need to have the following software installed on your machine:
- [Bun](https://bun.sh/) (v1.0 or higher)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (Cloudflare's CLI tool)
It is recommended to log in to your Cloudflare account:
```bash
wrangler login
```
### Installation
1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd ok-eki
    ```
2.  **Install dependencies:**
    This project uses Bun for package management.
    ```bash
    bun install
    ```
### Running the Development Server
To start the development server, which includes the Vite frontend and the local Wrangler server for the Hono backend, run:
```bash
bun dev
```
This will start the application, typically on `http://localhost:3000`. The frontend will automatically proxy API requests to the local worker backend.
## Project Structure
- `src/`: Contains the React frontend application code.
  - `pages/`: Top-level page components.
  - `components/`: Reusable UI components, including shadcn/ui components.
  - `lib/`: Utility functions and API client.
  - `hooks/`: Custom React hooks.
- `worker/`: Contains the Hono backend code for the Cloudflare Worker.
  - `index.ts`: The entry point for the worker.
  - `user-routes.ts`: API route definitions.
  - `entities.ts`: Data models for Durable Objects.
- `shared/`: Contains TypeScript types and code shared between the frontend and backend.
## Deployment
This application is designed to be deployed to the Cloudflare network.
1.  **Build the application:**
    This command bundles the frontend and backend for production.
    ```bash
    bun build
    ```
2.  **Deploy to Cloudflare:**
    The `deploy` script in `package.json` handles both the build and deployment process.
    ```bash
    bun deploy
    ```
This will deploy your application to your configured Cloudflare account. Wrangler will provide you with the URL of your deployed application.
Alternatively, you can deploy directly from your GitHub repository.
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kuukiteemul-kuuki/OK-Eki-0.1)