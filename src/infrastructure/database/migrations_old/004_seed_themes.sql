/**
 * Seed: Preestablished Themes
 *
 * 4 modern, professional themes:
 * - Neon: Cyberpunk neon aesthetic
 * - Blanco: Clean minimalist light
 * - Negro: Professional dark mode
 * - Rosado: Modern rose gold/pink
 *
 * Colors are HSL values for Tailwind CSS variables
 * Format: "H S% L%" (e.g., "200 100% 50%")
 */

-- =====================================================
-- THEME 1: NEON (Cyberpunk)
-- =====================================================

INSERT INTO themes (slug, name, description, category, colors) VALUES (
  'neon',
  'Neon',
  'Cyberpunk-inspired theme with electric colors and dark background',
  'preestablished',
  '{
    "background": "240 10% 3.9%",
    "foreground": "0 0% 98%",
    "card": "240 10% 6%",
    "card-foreground": "0 0% 98%",
    "popover": "240 10% 6%",
    "popover-foreground": "0 0% 98%",
    "primary": "166 100% 50%",
    "primary-foreground": "240 10% 3.9%",
    "secondary": "322 100% 50%",
    "secondary-foreground": "0 0% 98%",
    "muted": "240 5% 15%",
    "muted-foreground": "240 5% 64.9%",
    "accent": "190 100% 50%",
    "accent-foreground": "240 10% 3.9%",
    "destructive": "0 72.2% 50.6%",
    "destructive-foreground": "0 0% 98%",
    "border": "166 100% 50%",
    "input": "240 5% 15%",
    "ring": "166 100% 50%",
    "radius": "0.5rem"
  }'::jsonb
);

-- =====================================================
-- THEME 2: BLANCO (Clean Light)
-- =====================================================

INSERT INTO themes (slug, name, description, category, colors) VALUES (
  'blanco',
  'Blanco',
  'Clean and minimalist light theme with soft colors',
  'preestablished',
  '{
    "background": "0 0% 100%",
    "foreground": "222.2 84% 4.9%",
    "card": "0 0% 100%",
    "card-foreground": "222.2 84% 4.9%",
    "popover": "0 0% 100%",
    "popover-foreground": "222.2 84% 4.9%",
    "primary": "221.2 83.2% 53.3%",
    "primary-foreground": "210 40% 98%",
    "secondary": "210 40% 96.1%",
    "secondary-foreground": "222.2 47.4% 11.2%",
    "muted": "210 40% 96.1%",
    "muted-foreground": "215.4 16.3% 46.9%",
    "accent": "210 40% 96.1%",
    "accent-foreground": "222.2 47.4% 11.2%",
    "destructive": "0 84.2% 60.2%",
    "destructive-foreground": "210 40% 98%",
    "border": "214.3 31.8% 91.4%",
    "input": "214.3 31.8% 91.4%",
    "ring": "221.2 83.2% 53.3%",
    "radius": "0.5rem"
  }'::jsonb
);

-- =====================================================
-- THEME 3: NEGRO (Professional Dark)
-- =====================================================

INSERT INTO themes (slug, name, description, category, colors) VALUES (
  'negro',
  'Negro',
  'Professional dark theme with high contrast and modern aesthetics',
  'preestablished',
  '{
    "background": "0 0% 7%",
    "foreground": "0 0% 98%",
    "card": "0 0% 10%",
    "card-foreground": "0 0% 98%",
    "popover": "0 0% 10%",
    "popover-foreground": "0 0% 98%",
    "primary": "217 91% 60%",
    "primary-foreground": "0 0% 98%",
    "secondary": "0 0% 15%",
    "secondary-foreground": "0 0% 98%",
    "muted": "0 0% 15%",
    "muted-foreground": "0 0% 64%",
    "accent": "142 76% 56%",
    "accent-foreground": "0 0% 10%",
    "destructive": "0 72% 51%",
    "destructive-foreground": "0 0% 98%",
    "border": "0 0% 20%",
    "input": "0 0% 15%",
    "ring": "217 91% 60%",
    "radius": "0.5rem"
  }'::jsonb
);

-- =====================================================
-- THEME 4: ROSADO (Rose Gold/Pink)
-- =====================================================

INSERT INTO themes (slug, name, description, category, colors) VALUES (
  'rosado',
  'Rosado',
  'Modern rose gold theme with soft pink and warm accents',
  'preestablished',
  '{
    "background": "30 40% 97%",
    "foreground": "340 50% 20%",
    "card": "0 0% 100%",
    "card-foreground": "340 50% 20%",
    "popover": "0 0% 100%",
    "popover-foreground": "340 50% 20%",
    "primary": "346 77% 60%",
    "primary-foreground": "0 0% 100%",
    "secondary": "30 60% 92%",
    "secondary-foreground": "340 50% 20%",
    "muted": "30 40% 94%",
    "muted-foreground": "340 20% 50%",
    "accent": "25 90% 65%",
    "accent-foreground": "340 50% 20%",
    "destructive": "0 84% 60%",
    "destructive-foreground": "0 0% 100%",
    "border": "30 40% 88%",
    "input": "30 40% 90%",
    "ring": "346 77% 60%",
    "radius": "0.75rem"
  }'::jsonb
);
