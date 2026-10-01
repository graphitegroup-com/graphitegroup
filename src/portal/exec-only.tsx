"use client";

import type { ReactNode } from "react";
import { isExec } from "./logic";
import { usePortal } from "./store";
import { Card, Empty } from "./ui";

export function ExecOnly({ children }: { children: ReactNode }) {
  const { me } = usePortal();
  if (!isExec(me)) {
    return (
      <Card className="mx-auto max-w-lg">
        <Empty>This area is limited to the executive board.</Empty>
      </Card>
    );
  }
  return <>{children}</>;
}
