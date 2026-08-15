import {
  Component,
  Suspense,
  useEffect,
  type ComponentType,
  type ReactNode,
  type ErrorInfo,
} from "react";
import { useExtension } from "./extension-registry";
import { ExtensionSlotName } from "@khinemyaezin/seller-contracts";
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

  useEffect(() => {
    if (!groupId || !ExtensionComponent) return;
    return register({ groupId, slotId: name });
  }, [register, groupId, name, ExtensionComponent]);

  if (!ExtensionComponent) return <>{fallback}</>;

  return (
    <ExtensionErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <ExtensionComponent {...props} slotId={name} />
      </Suspense>
    </ExtensionErrorBoundary>
  );
}
