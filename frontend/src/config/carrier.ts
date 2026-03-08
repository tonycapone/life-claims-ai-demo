/**
 * Carrier theme configuration — drives the white-label app shell.
 * Swap this config to re-skin the entire customer experience for any carrier.
 */

export interface CarrierConfig {
  id: string
  name: string
  tagline: string
  logo: string        // Full logo with text
  icon: string        // App icon (mark only)
  hero: string        // Hero banner image
  colors: {
    primary: string
    primaryLight: string
    primaryDark: string
    accent: string
    accentHover: string
  }
  support: {
    phone: string
    phoneDisplay: string
    hours: string
  }
  mockUser: {
    firstName: string
    lastName: string
    email: string
  }
  mockPolicy: {
    number: string
    type: string
    typeLabel: string
    faceAmount: string
    status: string
    insuredName: string
    issueDate: string
    premiumAmount: string
    premiumFrequency: string
    nextPaymentDate: string
  }
}

export const tidewell: CarrierConfig = {
  id: 'tidewell',
  name: 'Tidewell Life Insurance',
  tagline: 'Steady as the tide.',
  logo: '/carrier/tidewell-logo.png',
  icon: '/carrier/tidewell-icon.png',
  hero: '/carrier/tidewell-hero.png',
  colors: {
    primary: '#1a365d',
    primaryLight: '#2a4a7f',
    primaryDark: '#0f2440',
    accent: '#0d9488',
    accentHover: '#0b7c72',
  },
  support: {
    phone: 'tel:18005551234',
    phoneDisplay: '1-800-555-1234',
    hours: 'Mon–Fri, 8am–8pm ET',
  },
  mockUser: {
    firstName: 'Tony',
    lastName: 'Capone',
    email: 'tony@example.com',
  },
  mockPolicy: {
    number: 'LT-29471',
    type: 'term_life',
    typeLabel: 'Term Life Insurance',
    faceAmount: '$500,000',
    status: 'Active',
    insuredName: 'Robert Johnson',
    issueDate: 'Jan 15, 2025',
    premiumAmount: '$42.50',
    premiumFrequency: 'monthly',
    nextPaymentDate: 'Apr 1, 2026',
  },
}

/** Active carrier config — change this to switch the entire app shell */
export const carrier = tidewell
