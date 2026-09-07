import {
  Component,
  Suspense,
  useCallback,
  type ComponentType,
  type ReactNode,
  type ErrorInfo,
} from "react";
import { useExtension } from "./extension-registry";
import { ExtensionSlotName, type SlotHandle } from "@khinemyaezin/seller-contracts";
import { useSlotProvider } from "./slot-provider";

export type ExtensionSlotProps = {
  name: ExtensionSlotName;
  props?: Record<string, unknown>;
  fallback?: ReactNode;
};

class ExtensionErrorBoundary extends Component<
  { fallback?: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ExtensionSlot failed to render:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <>{this.props.fallback}</>;
    }
    return this.props.children;
  }
}

export function ExtensionSlot({
  name,
  props,
  fallback,
}: ExtensionSlotProps) {
  const ExtensionComponent = useExtension(name) as ComponentType<any> | undefined;
  const { register } = useSlotProvider();

  const groupId = props?.groupId as string | undefined;

  const registerHandle = useCallback((handle: SlotHandle) => {
    if (!groupId) return;
    return register({ groupId, slotId: name, handle });
  }, [groupId, name, register]);

  if (!ExtensionComponent) return <>{fallback}</>;

  return (
    <ExtensionErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <ExtensionComponent {...props} slotId={name} registerHandle={registerHandle} />
      </Suspense>
    </ExtensionErrorBoundary>
  );
}
