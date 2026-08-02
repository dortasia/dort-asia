import { redirect } from 'next/navigation'

/**
 * HRMS has no login page — auth is handled by the Dort Asia landing page.
 * Redirect anyone who lands here to the landing page login.
 */
export default function LoginRedirect() {
  let landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://dortasia.com'
  
  // Failsafe: never redirect to localhost in a production environment
  if (process.env.NODE_ENV === 'production' && landingUrl.includes('localhost')) {
    landingUrl = 'https://dortasia.com'
  }
  
  // Prevent redirecting to itself if misconfigured on Vercel
  if (landingUrl.includes('dortasia-hrms') || landingUrl.includes('localhost:3003')) {
    landingUrl = 'https://dortasia.com'
  }
  
  redirect(`${landingUrl.replace(/\/$/, '')}/login`)
}
