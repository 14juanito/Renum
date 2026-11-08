"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/form";

export function Submit({ children, className = "btn-primary", name, value }: { children: React.ReactNode; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value}>
      {pending ? "Veuillez patienter…" : children}
    </button>
  );
}

export function ActionForm({
  action, children, className,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode | ((state: ActionState) => React.ReactNode);
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {state?.error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{state.error}</div>}
      {state?.ok && (
        <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {state.ok}
          {state.demoCode && <code className="ml-2 select-all rounded bg-white px-2 py-0.5 font-mono font-bold">{state.demoCode}</code>}
        </div>
      )}
      {typeof children === "function" ? children(state) : children}
    </form>
  );
}

export function ConfirmButton({ children, message, className = "btn-secondary btn-sm" }: { children: React.ReactNode; message: string; className?: string }) {
  return (
    <button type="submit" className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
