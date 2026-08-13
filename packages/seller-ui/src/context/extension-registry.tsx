import { ProductExtensionSlotName } from "@khinemyaezin/seller-contracts";
import { createContext, useContext, type ComponentType } from "react";

export type ExtensionRegistry = Partial<
  Record<ProductExtensionSlotName | string, ComponentType<any>>
>;

export const ExtensionRegistryContext = createContext<ExtensionRegistry>({});

export function useExtensionRegistry(): ExtensionRegistry {
  return useContext(ExtensionRegistryContext);
}

export function useExtension(
  name: ProductExtensionSlotName | string,
): ComponentType<any> | undefined {
  return useExtensionRegistry()[name];
}
