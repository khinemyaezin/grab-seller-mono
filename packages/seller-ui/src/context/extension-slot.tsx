import {
  Suspense,
  useEffect,
  type ComponentType,
  type ReactNode,
} from "react";
import { useExtension } from "./extension-registry";
import { ExtensionSlotName } from "@khinemyaezin/seller-contracts";
import { useSlotProvider } from "./slot-provider";

export type ExtensionSlotProps = {
  name: ExtensionSlotName;
  props?: Record<string, unknown>;
  fallback?: ReactNode;
};

export function ExtensionSlot({
  name,
  props,
  fallback,
}: ExtensionSlotProps) {
  const Component = useExtension(name) as ComponentType<any> | undefined;
  const { register } = useSlotProvider();

  const instanceId = props?.instanceId as string | undefined;

  useEffect(() => {
    if (!instanceId || !Component) return;
    return register({ instanceId, slotId: name });
  }, [register, instanceId, name, Component]);

  if (!Component) return <>{fallback}</>;

  return (
    <Suspense fallback={fallback}>
      <Component {...props} slotId={name} />
    </Suspense>
  );
}

