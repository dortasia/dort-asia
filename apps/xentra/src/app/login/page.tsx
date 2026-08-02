import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

/**
 * HRMS has no login page — auth is handled by the Dort Asia landing page.
 * Redirect anyone who lands here to the landing page login.
 */
export default async function LoginRedirect() {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  
  let landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://dortasia.com'
  
  // Prevent infinite loop: only override if landing URL points exactly at this host
  try {
    const landingHostname = new URL(landingUrl).hostname
    if (landingHostname === host.split(':')[0]) {
      landingUrl = 'https://dortasia.com'
    }
  } catch {
    landingUrl = 'https://dortasia.com'
  }
  
  redirect(`${landingUrl.replace(/\/$/, '')}/login`)
}
