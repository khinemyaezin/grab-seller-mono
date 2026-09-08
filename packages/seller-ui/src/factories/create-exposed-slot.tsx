import { useCallback, useRef, type ComponentType } from "react";
import type {
  ExtensionMountProps,
  SlotWidgetProps,
} from "@khinemyaezin/seller-contracts";
import { EntryLinkProvider } from "../context/entry-link-provider.js";
import { PlatformProvider } from "../context/platform-provider.js";

type ExposedSlotConfig<TContext, TPayload> = {
  defaultSlotId: string;
  Widget: ComponentType<SlotWidgetProps<TContext, TPayload>>;
};

export function createExposedSlot<TContext, TPayload>(
  config: ExposedSlotConfig<TContext, TPayload>,
): ComponentType<ExtensionMountProps> {
  const Widget = config.Widget;

  return function ExposedSlot({
    groupId,
    slotId = config.defaultSlotId,
    context,
    initialValue,
    onChange,
    registerHandle,
    platform,
    entryLink,
  }: ExtensionMountProps) {
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const stableOnChange = useCallback((value: TPayload) => {
      onChangeRef.current?.(value);
    }, []);

    if (!entryLink || !groupId) return null;

    return (
      <PlatformProvider platform={platform}>
        <EntryLinkProvider link={entryLink}>
          <Widget
            groupId={groupId}
            slotId={slotId}
            context={context as TContext | undefined}
            initialValue={initialValue as TPayload | undefined}
            onChange={stableOnChange}
            registerHandle={registerHandle}
          />
        </EntryLinkProvider>
      </PlatformProvider>
    );
  };
}
