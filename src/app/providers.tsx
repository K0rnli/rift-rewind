"use client"

import { ImageProvider, ImageSizeProvider } from "./context/imageHelper"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ImageProvider>
      <ImageSizeProvider>
        {children}
      </ImageSizeProvider>
    </ImageProvider>
  )
}

