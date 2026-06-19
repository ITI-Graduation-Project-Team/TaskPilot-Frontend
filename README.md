# taskPilotFront

TaskPilot is a robust, multi-tenant Agile project management platform designed to streamline workflows, manage teams, and integrate AI-driven insights. This repository contains the Frontend application.

##  Tech Stack & Setup
* **Framework:** Angular 17+ (Standalone Components)
* **Styling:** Tailwind CSS & SCSS
* **Architecture:** Feature-Sliced Design (FSD)
* **Performance:** Strict Lazy Loading for all primary routes

##  Design System & Color Palette
The project uses a strict, custom color palette configured in Tailwind. 
* **Primary:** `#D51C39` (Action buttons, highlights)
* **Secondary:** `#121338` (Text, headers, main backgrounds)
* **Light:** `#F6F6F6` (App background)
* **White:** `#FAFAFA` (Card backgrounds)
* **Accent:** `#DECCCC` (Secondary borders, subtle highlights)

##  Architecture: Feature-Sliced Design (FSD)
To ensure maximum scalability, this project strictly follows the FSD methodology. 
Modules can only import from layers below them.

### Layers Overview:
1. **`shared/`**: Reusable UI components and API interceptors.
2. **`entities/`**: Core business models (User, Project, Task).
3. **`features/`**: User interactions and business logic.
4. **`widgets/`**: Complex UI blocks composing entities and features.
5. **`pages/`**: Routable views (Lazy Loaded).
6. **`app/`**: Global application settings and routing.

##  Coding Conventions
* **Naming Convention:** `camelCase` is strictly enforced for all folder names, files, variables, and class names across the project.
* **Comments:** English ONLY for all inline code comments and documentation.

##  Quick Start

1. Clone the repository and navigate to the directory:
   ```bash
   cd taskPilotFront