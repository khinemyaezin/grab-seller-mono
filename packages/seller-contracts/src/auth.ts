import type {
} from "./events/core.js";
import { PlatformEvents } from "./events/index.js";
import type { SellerRuntimeConfig } from "./runtime.js";

export type UserRole = string;

export type AccessContext = {
  assignmentId: string;
  platformCode: string;
  roleCode: string;
  scopeKey: string;
  scopeId: string;
  status: string;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  accessContexts: AccessContext[],
  currentAccessContext?: AccessContext
};

export type User = SessionUser & {
  createdAt?: string;
};

export type LoginCredentials = { email: string; password: string };

export type SessionSnapshot =
  | { status: "loading" }
  | { status: "anonymous" }
  | {
    status: "authenticated";
    user: SessionUser;
    roles: readonly string[];
    permissions: readonly string[];
  };

export interface SessionApi {
  getSnapshot(): SessionSnapshot;
  subscribe(listener: (snapshot: SessionSnapshot) => void): () => void;
  refresh(): Promise<void>;
  logout(): Promise<void>;
}

export interface SellerPlatform {
  readonly version: string;
  readonly session: SessionApi;
  readonly events: PlatformEvents;
  readonly navigation: PlatformNavigation;
  readonly config: Readonly<SellerRuntimeConfig>;
}

export interface PlatformNavigation {
  navigate(path: string, options?: { replace?: boolean }): void;
}

export interface MfeLifecycle<Props = Record<string, unknown>> {
  mount(container: HTMLElement, props: MfeMountProps & Props): MfeHandle;
}

export interface MfeMountProps {
  platform: SellerPlatform;
  basePath: string;
}

export interface MfeHandle {
  unmount(): void;
  update?(props: Partial<MfeMountProps>): void;
}

export type AuthState = {
  snapshot: SessionSnapshot;
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};
