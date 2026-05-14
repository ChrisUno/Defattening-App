# CLAUDE.md - i-want-to-build-a-web-application-where-a-number-o

This file provides guidance to Claude Code (claude.ai/code) when working with this project.

## Project Overview

**Name**: i-want-to-build-a-web-application-where-a-number-o
**Description**: A modern React application
**Author**: Unosquare
**Created**: 2026-05-14T10:16:29.946Z

This is a React application built with Vite, TypeScript, and Tailwind CSS. It was generated from the Unosquare Design template system.

## Technology Stack

- **React 19**: Component-based UI framework
- **Vite 6**: Fast build tool with HMR
- **TypeScript 5.7**: Type-safe JavaScript
- **Tailwind CSS 4**: Utility-first CSS framework
- **framer-motion**: Animation library
- **zustand**: Lightweight state management
- **@tanstack/react-query**: Async data management
- **recharts**: Charting library
- **lucide-react**: Icon library
- **react-router 7**: Client-side routing
- **cookie** + **set-cookie-parser**: Required by react-router (do not remove)
- **turbo-stream**: Required by react-router (do not remove)
- **clsx**: Conditional CSS classnames
- **date-fns**: Date formatting utilities
- **@faker-js/faker**: Mock data generation
- **ESLint 9**: Code linting (flat config)


## Project Structure

```
i-want-to-build-a-web-application-where-a-number-o/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   ├── index.css       # Global styles with Tailwind
│   └── App.css         # Component-specific styles
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
└── eslint.config.js    # ESLint configuration
```

**IMPORTANT**: Do NOT run `npm install` or `npm ci` or `npm build` commands. When you need to add dependencies, modify the `package.json` file directly. The preview service automatically installs dependencies when you view the application.

**IMPORTANT - Documentation Files**:
- Do NOT create README.md, CHANGELOG.md, CONTRIBUTING.md, or any other documentation files in the root directory unless explicitly requested by the user
- Do NOT create markdown files summarizing work completed, listing changes, or documenting features after finishing tasks
- Only create documentation files when the user specifically asks for documentation
- If you need to communicate changes or completion status, output the information directly to the user rather than creating a file

## Component Guidelines

### Creating New Components

1. Create components in `src/components/` directory
2. Use TypeScript interfaces for props
3. Follow React hooks best practices
4. Use Tailwind CSS for styling

Example component structure:
```typescript
interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

const MyComponent = ({ title, onAction }: MyComponentProps) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold">{title}</h2>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Action
        </button>
      )}
    </div>
  );
};

export default MyComponent;
```

## Styling with Tailwind CSS

This project uses Tailwind CSS for styling. Key conventions:

- Use utility classes for layout and spacing
- Create component classes in App.css for complex, reusable styles
- Follow mobile-first responsive design
- Use Tailwind's color palette for consistency

Common patterns:
```jsx
// Page container — every page must wrap content with horizontal padding
<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">

// Card container — always include internal padding
<div className="bg-white rounded-lg shadow-md p-6">

// Button
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">

// Responsive grid — always include gap
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**IMPORTANT**: Content must never touch the viewport edges. Always wrap page content in a container with horizontal padding (`px-6` minimum). Cards and sections must have internal padding (`p-6` minimum).

## State Management

- **zustand** for client-side shared state (replaces useContext/useReducer)
- **@tanstack/react-query** for server/async state (data fetching, caching, mutations)
- **useState** for simple local component state only

Prefer zustand over useContext/useReducer for any state shared across components.
Use @tanstack/react-query for all data fetching rather than manual useEffect + useState patterns.

## Comment Guidelines

**NO COMMENTS** in production code unless absolutely critical. Write self-documenting code with descriptive names.

### Acceptable Comments (Very Rare):
- **Complex algorithm explanations**: Only when the logic cannot be clarified through better function/variable names
- **Temporary workarounds**: With issue references (e.g., `// TODO: Fix when API supports X (ticket #123)`)
- **Legal/license headers**: If required by company policy
- **Critical security warnings**: Where security implications aren't obvious from code

### NEVER Add Comments For:
- **Obvious action descriptions**: `// Set loading state`, `// Call API`, `// Update component`
- **Component section markers**: `// State`, `// Effects`, `// Event handlers`
- **JSDoc for internal functions**: Only for public library APIs
- **What the code does**: Comments that repeat what the code clearly shows
- **Variable assignments**: `// Store user data`, `// Initialize state`

### Examples of Bad Comments to Avoid:
```typescript
// Set loading to true
setLoading(true);

// Call the API to get courses
const courses = await getCourses();

// Update the state with courses
setCourses(courses);

// Set loading to false
setLoading(false);
```

### Write Self-Documenting Code Instead:
```typescript
const loadCourses = async () => {
  setLoading(true);
  const courses = await getCourses();
  setCourses(courses);
  setLoading(false);
};
```

## TypeScript Best Practices

- Define interfaces for all props and state
- Use type inference where possible
- Avoid using `any` type
- Export types from a central `types.ts` file for reuse

## Performance Optimization

- Use React.memo for expensive components
- Implement lazy loading with React.lazy()
- Optimize images and assets
- Use production builds for deployment

## Common Tasks

### Adding a New Page/Route
1. react-router is already installed
2. Create page components in `src/pages/`
3. Add routes in App.tsx

### Adding Icons
1. lucide-react is already installed
2. Import and use icons as components: `import { Icon } from 'lucide-react'`

### Managing Dependencies

**CRITICAL**: The cloud preview build will fail if any imported package is missing from package.json.

The template includes these pre-installed packages — **do NOT remove any of them**:
- **react**, **react-dom** (^19), **react-router** (^7) — Core framework
- **cookie**, **set-cookie-parser**, **turbo-stream** — Required by react-router (internal deps — do not remove)
- **lucide-react** — Icons
- **@faker-js/faker** — Realistic mock data generation
- **clsx** — Conditional CSS classnames
- **date-fns** — Date formatting utilities
- **recharts** — Charting library
- **zustand** — Lightweight state management
- **@tanstack/react-query** — Async data management
- **framer-motion** — Animations (motion-dom and motion-utils are internal deps — do not remove)
- **tailwindcss** (^4), **vite** (^6), **typescript** (^5.7) — Dev tooling

When adding NEW packages not listed above:
1. Use the **Edit** tool to add them to `dependencies` in `package.json` (never recreate the file)
2. Add the dependency BEFORE writing any import that uses it
3. Never run `npm install` — the preview service installs automatically
4. Before finishing, verify every import in your source files has a matching package.json entry

## Troubleshooting

### Common Issues

**Port already in use**: Change port in vite.config.ts
**Module not found**: Check imports and verify package.json dependencies are correct
**TypeScript errors**: Check type definitions and interfaces
**Styling not applied**: Ensure Tailwind is properly configured

## Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [TypeScript Documentation](https://www.typescriptlang.org)

## Important Notes

- **No Backwards Compatibility Needed**: This application has not yet been released to production, so backwards compatibility is not a concern when implementing new features or making changes.
- **Don't write markdown files to the root directory**: Unless explicilty asked to do so.

---

Generated by Unosquare Design Template System