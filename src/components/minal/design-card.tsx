"use client";

import React from "react";
import type { DesignSpec } from "@/lib/types";
import { PackagingInspector } from "./packaging-inspector";

interface Props {
  spec: DesignSpec;
}

export function DesignCard({ spec }: Props) {
  return <PackagingInspector spec={spec} />;
}
