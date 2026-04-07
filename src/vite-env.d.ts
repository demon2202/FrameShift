/// <reference types="vite/client" />

declare module 'react-dom/client' {
  import React from 'react';

  export interface RootOptions {
    identifierPrefix?: string;
    onRecoverableError?: (error: unknown) => void;
  }

  export interface Root {
    render(children: React.ReactNode): void;
    unmount(): void;
  }

  export function createRoot(
    container: Element | DocumentFragment | null,
    options?: RootOptions
  ): Root;

  export function hydrateRoot(
    container: Element | Document | DocumentFragment | null,
    initialChildren: React.ReactNode,
    options?: RootOptions
  ): Root;
}
