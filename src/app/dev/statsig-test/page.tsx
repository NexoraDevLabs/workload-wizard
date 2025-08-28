import { createFeatureFlag } from "@/flags";

export default async function Page() {
  const enabled = await createFeatureFlag("my_first_gate")(); //Disabled by default, edit in the Statsig console
  return <div>myFeatureFlag is {enabled ? "on" : "off"}</div>;
}
