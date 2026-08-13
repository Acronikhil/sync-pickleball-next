"use client";

import { createContext, useContext } from "react";

/**
 * Lets any image field queue an upload without threading a callback through
 * every section editor. Returns the site-root-relative path the content should
 * point at; the file itself is committed later, when the admin publishes.
 */
export interface UploadApi {
  uploadImage: (file: File) => Promise<string>;
}

const UploadContext = createContext<UploadApi | null>(null);

export const UploadProvider = UploadContext.Provider;

export function useUpload(): UploadApi {
  const api = useContext(UploadContext);
  if (!api) throw new Error("useUpload must be used inside an UploadProvider");
  return api;
}
