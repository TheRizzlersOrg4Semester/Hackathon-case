"use client";

import { useEffect } from "react";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6">
      <h1 className="text-2xl font-semibold text-red-700">Something went wrong</h1>
      <p className="text-red-700">A recoverable error occurred while loading the page.</p>
      <button className="rounded-md bg-red-700 px-4 py-2 font-medium text-white" onClick={reset} type="button">
        Try again
      </button>
    </section>
  );
}
