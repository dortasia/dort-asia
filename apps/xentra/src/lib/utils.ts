import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarUrl(name?: string | null, existingUrl?: string | null): string {
  if (existingUrl && typeof existingUrl === 'string' && existingUrl.trim() !== '' && !existingUrl.includes('dicebear') && !existingUrl.includes('unsplash')) {
    return existingUrl
  }
  return "/default-profile.svg"
}

