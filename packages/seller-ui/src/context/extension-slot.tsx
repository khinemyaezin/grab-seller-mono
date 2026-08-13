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

  const groupId = props?.groupId as string | undefined;

  useEffect(() => {
    if (!groupId || !Component) return;
    return register({ groupId, slotId: name });
  }, [register, groupId, name, Component]);

  if (!Component) return <>{fallback}</>;

  return (
    <Suspense fallback={fallback}>
      <Component {...props} slotId={name} />
    </Suspense>
  );
}

