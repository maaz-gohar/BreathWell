/**
 * BreathWell design system: spacing, radius, typography, and layout tokens.
 */

/** Horizontal padding for screen content (edges). Use for sections and full-width elements. */
export const LAYOUT = {
  screenPaddingHorizontal: 20,
  sectionSpacingVertical: 24,
  gridGap: 12,
  cardPadding: 20,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const TYPOGRAPHY = {
  heading1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  heading2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  captionMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
} as const;
