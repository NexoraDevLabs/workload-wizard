"use client";

import { useParameterStore } from "@statsig/react-bindings";

export function ParameterStoreExample() {
  const store = useParameterStore("my_param_store");
  return <div>Title: {store.get("title", "Fallback Title")}</div>;
}
