import { createContext, useContext, type ComponentType } from "react";

export type ExtensionRegistry = Partial<Record<string, ComponentType<any>>>;

export const ExtensionRegistryContext = createContext<ExtensionRegistry>({});

export function useExtensionRegistry(): ExtensionRegistry {
  return useContext(ExtensionRegistryContext);
}

export function useExtension(name: string): ComponentType<any> | undefined {
  return useExtensionRegistry()[name];
}
