/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REPOSITORY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
