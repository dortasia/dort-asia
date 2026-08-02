import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarUrl(name?: string | null, existingUrl?: string | null): string {
  if (existingUrl && !existingUrl.includes('unsplash')) {
    return existingUrl
  }
  const seedName = name || 'Unknown'
  // using a diverse palette (Tailwind 200s/300s) to avoid blending with the avatar's clothes
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seedName)}&backgroundColor=fecaca,fed7aa,fef08a,d9f99d,a7f3d0,99f6e4,bae6fd,c7d2fe,e9d5ff,fbcfe8`
}
