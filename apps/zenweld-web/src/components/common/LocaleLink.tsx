"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useHref } from "@/lib/i18n-client";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/** Otomatik olarak /tr veya /en on eki ekleyen Link. */
export function LocaleLink({ href, ...rest }: Props) {
  const withLocale = useHref();
  return <Link href={withLocale(href)} {...rest} />;
}
