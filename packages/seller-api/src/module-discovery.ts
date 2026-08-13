import { ref } from "./hateoas/link-ref.js";

export const ModuleDiscovery = {
    "identity": ref.ROOT_INDENTITY,
    "merchant": ref.ROOT_MERCHANT,
    "catalog": ref.ROOT_CATALOG,
    "inventory": ref.ROOT_INVENTORY,
    "pricing": ref.ROOT_PRICING,
    "workflows": ref.ROOT_WORKFLOWS,
} as const; 
export type ModuleDiscoveryType = typeof ModuleDiscovery;
export type ModuleName = keyof ModuleDiscoveryType; 
export type ModuleLink = ModuleDiscoveryType[ModuleName];