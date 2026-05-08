/**
 * Branding Constants for EduCard Application
 *
 * ⚠️ IMPORTANT: Update these constants to rebrand the entire application
 * All UI components reference these values for consistent branding
 */

export const BRANDING = {
  // Company/Product Name
  APP_NAME: 'EduCard',
  COMPANY_NAME: 'EduCard',

  // Taglines and Descriptions
  TAGLINE: 'Modern Multi-Tenant School Management System',
  SHORT_DESCRIPTION: 'Empowering education through technology',
  FULL_DESCRIPTION:
    'Complete solution for managing educational institutions with attendance, leave management, student records, and more.',

  // Logo Paths
  LOGO: {
    // Main logo (with text)
    MAIN: '/assets/images/educard-logo.jpg',
    // Icon only (same as main for this logo)
    ICON: '/assets/images/educard-logo.jpg',
    // Logo for dark theme (same for now)
    MAIN_DARK: '/assets/images/educard-logo.jpg',
    // Favicon
    FAVICON: '/favicon.ico',
  },

  // Fallback Logo (when image not loaded)
  LOGO_FALLBACK: {
    TEXT: 'EC',
    BG_GRADIENT: 'from-teal-500 to-cyan-600',
    TEXT_COLOR: 'text-white',
  },

  // Brand Colors (for programmatic use)
  COLORS: {
    PRIMARY: {
      light: '#14b8a6', // teal-500
      DEFAULT: '#0d9488', // teal-600
      dark: '#0f766e', // teal-700
    },
    SECONDARY: {
      light: '#06b6d4', // cyan-500
      DEFAULT: '#0891b2', // cyan-600
      dark: '#0e7490', // cyan-700
    },
    ACCENT: {
      light: '#a855f7', // purple-500
      DEFAULT: '#9333ea', // purple-600
      dark: '#7e22ce', // purple-700
    },
  },

  // Copyright and Legal
  COPYRIGHT: {
    YEAR: new Date().getFullYear(),
    OWNER: 'EduCard',
    TEXT: `© ${new Date().getFullYear()} EduCard. All rights reserved.`,
  },

  // Contact Information
  CONTACT: {
    EMAIL: 'support@educard.com',
    PHONE: '+91 1800-123-4567',
    ADDRESS: '123 Education Street, Tech City, TC 12345',
  },

  // Social Media (optional)
  SOCIAL: {
    TWITTER: 'https://twitter.com/educard',
    FACEBOOK: 'https://facebook.com/educard',
    LINKEDIN: 'https://linkedin.com/company/educard',
    INSTAGRAM: 'https://instagram.com/educard',
  },

  // App Metadata
  META: {
    TITLE: 'EduCard - School Management System',
    DESCRIPTION: 'Modern multi-tenant school management system for educational institutions',
    KEYWORDS: 'school management, education, attendance, leave management, student records',
    AUTHOR: 'EduCard Team',
  },
} as const;

// Utility functions for branding
export const getBrandingText = (key: keyof typeof BRANDING) => BRANDING[key];

export const getLogoUrl = (variant: keyof typeof BRANDING.LOGO = 'MAIN') => BRANDING.LOGO[variant];

export const getCopyrightText = () => BRANDING.COPYRIGHT.TEXT;

export const getAppTitle = (pageTitle?: string) =>
  pageTitle ? `${pageTitle} | ${BRANDING.APP_NAME}` : BRANDING.META.TITLE;
