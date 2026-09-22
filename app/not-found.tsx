"use client";

import Error from "next/error";

// 404 for addresses outside /en and /fr (e.g. a wrong /api/... URL).
// Needs its own <html> because app/layout.tsx only passes pages through.
export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <Error statusCode={404} />
      </body>
    </html>
  );
}
