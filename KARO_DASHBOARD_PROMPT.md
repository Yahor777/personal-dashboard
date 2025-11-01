## Prompt for Building "Karo Dashboard"

### **Project Overview**

**Goal:** Create a complete, production-ready personal dashboard application named "Karo Dashboard."

**Core Concept:** A modern, minimalist, and highly-functional web application that serves as a central hub for a user's digital life. It should be built with a modular architecture, allowing for easy expansion and customization. The primary user interface should be clean, intuitive, and aesthetically pleasing, with smooth animations and a responsive design that works flawlessly on both desktop and mobile devices.

### **Tech Stack**

*   **Framework:** React
*   **Build Tool:** Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** shadcn/ui (pre-configured)
*   **Icons:** lucide-react
*   **Animations:** framer-motion (or motion/react)

### **Core Architecture & Layout**

The application's shell (`App.tsx`) should orchestrate the main layout and state.

1.  **Main Layout:** A two-column layout.
    *   **Left Column:** A persistent, collapsible `Sidebar` for navigation.
    *   **Right Column:** A vertical flex container with a `Header` at the top and a `main` content area below it that fills the remaining space.
2.  **State Management:**
    *   Use React hooks (`useState`, `useEffect`, `useMemo`) for local and global state.
    *   Persist essential user settings (current theme, last visited page) to `localStorage`.
3.  **Routing:** Implement a simple client-side page switching mechanism controlled by state (e.g., `currentPage`). Do not use a formal routing library like React Router. The `App.tsx` will conditionally render page components based on this state.

### **Key Components & Their Functionality**

1.  **`Header.tsx`**
    *   A sticky header that stays at the top of the viewport.
    *   **Search Button:** Triggers the `CommandPalette`. Displays "Search..." text and a `⌘K` keyboard shortcut hint.
    *   **Notification Center:** A dropdown menu triggered by a bell icon. It should show a badge with the count of unread notifications, list notifications with read/unread states, and include "Mark all as read" and "Clear all" actions.
    *   **Theme Toggle:** A button to switch between 'light' and 'dark' modes.
    *   **User Menu:** A dropdown with links to "Settings" and a "Log Out" action.

2.  **`Sidebar.tsx`**
    *   A collapsible navigation menu with sections (e.g., "Main," "Tools," "System").
    *   Each section should be a collapsible group.
    *   Navigation items should have an icon and a label.
    *   The currently active page link should be visually highlighted (e.g., with a different background color).
    *   Use `motion/react` for a subtle hover animation on navigation items.

3.  **`CommandPalette.tsx`**
    *   A modal dialog that opens when triggered by the Header search button or the `⌘K` / `Ctrl+K` keyboard shortcut.
    *   It should allow users to fuzzy-search and navigate to all available pages and perform quick actions (e.g., "Create new task").

### **Pages & Modules**

Create the following page components under `src/components/pages/`:

*   **`Dashboard.tsx`**: The main landing page. Can contain a summary or widgets.
*   **`TasksKanban.tsx`**: A Kanban board for task management.
*   **`Analytics.tsx`**: A page for displaying charts and data visualizations (use `recharts`).
*   **`CS2Tracker.tsx`**: A module for tracking game statistics.
*   **`OLXSearch.tsx`**: A tool for searching on a marketplace.
*   **`PCBuilder.tsx`**: A tool to configure PC components.
*   **`AIAssistant.tsx`**:
    *   A chat interface for interacting with an AI.
    *   It should display a history of messages.
    *   Include a dropdown to select the AI model.
    *   Show a warning if API keys are not configured in Settings.
    *   The core logic for sending messages should be abstracted into `src/lib/ai-settings.ts`.
*   **`PythonLearning.tsx`**: A module for educational content.
*   **`Gallery.tsx`**: An image gallery with filtering and search capabilities.
*   **`ImportExport.tsx`**: A page for importing and exporting user data as JSON.
*   **`Settings.tsx`**:
    *   **Appearance Tab:** Theme (Light/Dark), Accent Color, Font Style.
    *   **AI Tab:**
        *   Select AI Provider (e.g., 'OpenRouter', 'Custom').
        *   Conditionally show input fields for API keys and URLs based on the selected provider.
        *   Allow model selection.
        *   A "Save" button to persist these settings.

### **UI/UX & Design System**

*   **Theme:**
    *   Implement a robust light/dark mode system.
    *   Define all colors, fonts, radii, and other design tokens as CSS variables in `src/styles/globals.css`.
    *   The `dark` class on the `<html>` element should toggle the theme.
*   **Component Library:** All UI elements (buttons, cards, inputs, dialogs, etc.) must be built using pre-styled components from the `shadcn/ui` library located in `src/components/ui`.
*   **Responsiveness:** The layout must adapt gracefully to smaller screen sizes. The sidebar should collapse into a hamburger menu on mobile.
*   **Feedback:** Use the `sonner` component for unobtrusive toast notifications for actions like "Settings saved" or "API Error."

### **File Structure**

Organize the project using the following directory structure:

```
src/
├── components/
│   ├── pages/         # Page components
│   └── ui/            # shadcn/ui components
├── lib/
│   ├── ai-settings.ts # Logic for AI interaction
│   └── utils.ts       # General utility functions
├── styles/
│   └── globals.css    # Global styles and CSS variables
├── App.tsx            # Main app component / shell
└── main.tsx           # Application entry point
```

---

**Final Instruction:** Based on this detailed prompt, generate the complete, interconnected, and fully functional "Karo Dashboard" application. Ensure the code is clean, well-documented, and follows React best practices.