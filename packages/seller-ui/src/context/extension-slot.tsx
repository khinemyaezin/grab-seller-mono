import {
  Component,
  Suspense,
  useCallback,
  useLayoutEffect,
  type ComponentType,
  type ReactNode,
  type ErrorInfo,
} from "react";
import { useExtension } from "./extension-registry";
import {
  type SlotHandle,
  type SlotPresentationVariant,
} from "@khinemyaezin/seller-contracts";
import { useSlotProvider } from "./slot-provider";

export type ExtensionSlotProps = {
  name: string;
  optional?: boolean;
  variant?: SlotPresentationVariant;
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
  optional,
  variant,
  props,
  fallback,
}: ExtensionSlotProps) {
  const ExtensionComponent = useExtension(name) as ComponentType<any> | undefined;
  const { declare, register } = useSlotProvider();
  const groupId = props?.groupId as string | undefined;

  useLayoutEffect(() => {
    if (!groupId) return;
    return declare({ groupId, slotId: name, optional });
  }, [declare, groupId, name, optional]);

  const registerHandle = useCallback(
    (handle: SlotHandle) => {
      if (!groupId) return;
      return register({ groupId, slotId: name, handle });
    },
    [groupId, name, register],
  );

  if (!ExtensionComponent) return <>{fallback}</>;

  return (
    <ExtensionErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <ExtensionComponent
          {...props}
          slotId={name}
          variant={variant}
          registerHandle={registerHandle}
        />
      </Suspense>
    </ExtensionErrorBoundary>
  );
}
