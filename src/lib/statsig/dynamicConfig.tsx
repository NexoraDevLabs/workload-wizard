"use client";

import { useDynamicConfig } from "@statsig/react-bindings";

export function DynamicConfigExample() {
  const config = useDynamicConfig("my_dynamic_config");
  return <div>Title: {config.get("title", "Fallback Title")}</div>;
}
