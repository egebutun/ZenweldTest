"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const base =
  "w-full rounded-[4px] border border-zw-grey-300 bg-white px-3 py-2.5 text-sm text-zw-ink placeholder:text-zw-grey-400 transition-colors focus:border-zw-red-600 focus:outline-none focus:ring-1 focus:ring-zw-red-600 disabled:bg-zw-grey-100";

export function Label({
  children,
  required,
  htmlFor,
}: {
  children: ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600"
    >
      {children}
      {required && <span className="ml-0.5 text-zw-red-600">*</span>}
    </label>
  );
}

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${base} ${className}`} {...rest} />;
}

export function Textarea({
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${base} min-h-28 ${className}`} {...rest} />;
}

export function Select({
  className = "",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${base} ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function FormRow({
  label,
  required,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label required={required} htmlFor={htmlFor}>
        {label}
      </Label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-zw-grey-500">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-zw-red-600">{error}</p>}
    </div>
  );
}

export function Checkbox({
  label,
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={`flex cursor-pointer items-start gap-2.5 text-sm text-zw-grey-700 ${className}`}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-zw-red-600"
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
}
