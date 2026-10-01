import NextLink from "next/link";
import type { ComponentProps } from "react";
import { STATIC_PREVIEW, previewHref } from "@/lib/preview";

/** next/link everywhere, except the static preview build, where it is a plain relative link. */
export default function Link({ href, prefetch, replace, scroll, ...rest }: ComponentProps<typeof NextLink>) {
  if (STATIC_PREVIEW && typeof href === "string") {
    void prefetch;
    void replace;
    void scroll;
    return <a href={previewHref(href)} {...rest} />;
  }
  return <NextLink href={href} prefetch={prefetch} replace={replace} scroll={scroll} {...rest} />;
}
