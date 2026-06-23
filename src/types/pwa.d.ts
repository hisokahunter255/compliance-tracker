/// <reference types="vite-plugin-pwa/client" />
declare module "virtual:pwa-register" {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (r: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (e: any) => void;
  }
  export function registerSW(opts?: RegisterSWOptions): (reload?: boolean) => Promise<void>;
}
