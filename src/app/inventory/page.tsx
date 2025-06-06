// THIS FILE IS OBSOLETE AND CAUSES "PARALLEL ROUTES" ERRORS.
// IT SHOULD BE DELETED MANUALLY.
// The active page for the /inventory route is now located at:
// src/app/(main)/inventory/page.tsx

console.error("ERROR: This file (src/app/inventory/page.tsx) is an obsolete placeholder and MUST BE DELETED to resolve routing conflicts. The correct page is src/app/(main)/inventory/page.tsx.");

// Intentionally not exporting a default React component to prevent Next.js from treating it as a page.
// Keeping this file (even if empty or with just an export) can still cause
// "parallel routes" errors in Next.js if not handled carefully by the build process.
// Please remove this file from your project.

export function PleaseDeleteThisFile() {
  return null;
}
