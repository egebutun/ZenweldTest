"use client";

import { createContext, useContext, useId } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/*
 * FormRow'un etiketi icindeki alana baglanir: FormRow bir kimlik (id) uretir,
 * Input, Textarea ve Select bunu kendiliginden alir. Etikete tiklayinca alan
 * secilir, ekran okuyucu alanin adini okur, testler alani etiketiyle bulur.
 */
const FieldIdContext = createContext<string | undefined>(undefined);

/**
 * Icinde bulunulan FormRow'un alan kimligi. Ozel alanlar (ImageField gibi)
 * kendi kutularina vermek icin kullanir; verilen id her zaman onceliklidir.
 */
export function useFieldId(id?: string): string | undefined {
  const fromRow = useContext(FieldIdContext);
  return id ?? fromRow;
}

const base =
  "w-full rounded-[4px] border border-zw-grey-300 bg-white px-3 py-2.5 text-sm text-zw-ink placeholder:text-zw-grey-400 transition-colors focus:border-zw-red-600 focus:outline-none focus:ring-1 focus:ring-zw-red-600 disabled:bg-zw-grey-100";

const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600";

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
    <label htmlFor={htmlFor} className={labelClass}>
      {children}
      {required && <span className="ml-0.5 text-zw-red-600">*</span>}
    </label>
  );
}

export function Input({ className = "", id, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input id={useFieldId(id)} className={`${base} ${className}`} {...rest} />;
}

export function Textarea({
  className = "",
  id,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea id={useFieldId(id)} className={`${base} min-h-28 ${className}`} {...rest} />;
}

export function Select({
  className = "",
  id,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select id={useFieldId(id)} className={`${base} ${className}`} {...rest}>
      {children}
    </select>
  );
}

/**
 * Etiketli form satiri. Etiket icindeki alana kendiliginden baglanir
 * (htmlFor verilirse o kimlik kullanilir). Alan tek bir kutu degilse (dugme
 * grubu, kilitli deger) group verilir: etiket gruba ad olur.
 */
export function FormRow({
  label,
  required,
  hint,
  error,
  htmlFor,
  group,
  children,
}: {
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  group?: boolean;
  children: ReactNode;
}) {
  const auto = useId();
  const id = htmlFor ?? auto;
  const notes = (
    <>
      {hint && !error && <p className="mt-1 text-xs text-zw-grey-500">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-zw-red-600">{error}</p>}
    </>
  );
  if (group) {
    return (
      <div role="group" aria-labelledby={id}>
        <span id={id} className={labelClass}>
          {label}
          {required && <span className="ml-0.5 text-zw-red-600">*</span>}
        </span>
        {children}
        {notes}
      </div>
    );
  }
  return (
    <div>
      <Label required={required} htmlFor={id}>
        {label}
      </Label>
      <FieldIdContext.Provider value={id}>{children}</FieldIdContext.Provider>
      {notes}
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
