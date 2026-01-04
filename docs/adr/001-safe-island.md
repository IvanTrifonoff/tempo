# 001. Safe Island Protocol (SDUI)

**Date:** 2026-01-04
**Status:** Accepted

## Context
AI agents and dynamic features often need to modify the UI. Allowing direct DOM manipulation (`document.createElement`) or global CSS modifications leads to:
1.  **Broken Layouts:** Global styles conflict with Tailwind.
2.  **Runtime Errors:** React loses sync with the DOM.
3.  **Security Risks:** Potential XSS if inputs aren't sanitized.

## Decision
We adopted a **Server-Driven UI (SDUI)** approach named "Safe Island".
1.  **Contract:** All dynamic UI is defined as JSON adhering to a strict Zod schema (`SafeManifestSchema`).
2.  **Isolation:** Components are rendered via `SafeRenderer` which maps logical props to predefined Tailwind classes.
3.  **No Direct Access:** Agents/Scripts cannot write HTML or CSS directly.

## Consequences
*   **Positive:** Guaranteed UI stability. Errors are caught by ErrorBoundaries.
*   **Negative:** New UI components must be manually added to the Schema and Renderer before they can be used.
*   **Compliance:** All future AI-generated features MUST use this protocol.
