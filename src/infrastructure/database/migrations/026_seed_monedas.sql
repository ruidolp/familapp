-- Migration 026: Seed world currencies
-- Description: Add 90+ world currencies with correct decimal configuration
-- Based on ISO 4217 standard
--
-- Decimal configuration:
--   0 decimals: CLP, JPY, KRW, etc. (no fractional units)
--   2 decimals: USD, EUR, GBP, etc. (cents/centavos)
--   3 decimals: KWD, BHD, OMR, JOD, TND (fils/millimes)
--   8 decimals: BTC, ETH (cryptocurrencies)
--
-- Note: This seed can be run multiple times (uses ON CONFLICT DO UPDATE)

INSERT INTO monedas (id, nombre, simbolo, decimales, tipo, orden, activa) VALUES
  -- Latin America (orden 1-20)
  ('ARS', 'Peso Argentino', '$', 2, 'FIAT', 1, true),
  ('BOB', 'Boliviano', 'Bs', 2, 'FIAT', 2, true),
  ('BRL', 'Real Brasileño', 'R$', 2, 'FIAT', 3, true),
  ('CLP', 'Peso Chileno', '$', 0, 'FIAT', 4, true),
  ('COP', 'Peso Colombiano', '$', 0, 'FIAT', 5, true),
  ('CRC', 'Colón Costarricense', '₡', 2, 'FIAT', 6, true),
  ('CUP', 'Peso Cubano', '$', 2, 'FIAT', 7, true),
  ('DOP', 'Peso Dominicano', 'RD$', 2, 'FIAT', 8, true),
  ('GTQ', 'Quetzal Guatemalteco', 'Q', 2, 'FIAT', 9, true),
  ('HNL', 'Lempira Hondureño', 'L', 2, 'FIAT', 10, true),
  ('MXN', 'Peso Mexicano', '$', 2, 'FIAT', 11, true),
  ('NIO', 'Córdoba Nicaragüense', 'C$', 2, 'FIAT', 12, true),
  ('PAB', 'Balboa Panameño', 'B/.', 2, 'FIAT', 13, true),
  ('PYG', 'Guaraní Paraguayo', '₲', 0, 'FIAT', 14, true),
  ('PEN', 'Sol Peruano', 'S/', 2, 'FIAT', 15, true),
  ('UYU', 'Peso Uruguayo', '$', 2, 'FIAT', 16, true),
  ('VES', 'Bolívar Venezolano', 'Bs.', 2, 'FIAT', 17, true),

  -- North America (orden 18-20)
  ('CAD', 'Dólar Canadiense', 'C$', 2, 'FIAT', 18, true),
  ('USD', 'Dólar Estadounidense', 'US$', 2, 'FIAT', 19, true),

  -- Europe (orden 21-40)
  ('EUR', 'Euro', '€', 2, 'FIAT', 20, true),
  ('GBP', 'Libra Esterlina', '£', 2, 'FIAT', 21, true),
  ('CHF', 'Franco Suizo', 'CHF', 2, 'FIAT', 22, true),
  ('SEK', 'Corona Sueca', 'kr', 2, 'FIAT', 23, true),
  ('NOK', 'Corona Noruega', 'kr', 2, 'FIAT', 24, true),
  ('DKK', 'Corona Danesa', 'kr', 2, 'FIAT', 25, true),
  ('PLN', 'Zloty Polaco', 'zł', 2, 'FIAT', 26, true),
  ('CZK', 'Corona Checa', 'Kč', 2, 'FIAT', 27, true),
  ('HUF', 'Forinto Húngaro', 'Ft', 2, 'FIAT', 28, true),
  ('RON', 'Leu Rumano', 'lei', 2, 'FIAT', 29, true),
  ('BGN', 'Lev Búlgaro', 'лв', 2, 'FIAT', 30, true),
  ('HRK', 'Kuna Croata', 'kn', 2, 'FIAT', 31, true),
  ('RUB', 'Rublo Ruso', '₽', 2, 'FIAT', 32, true),
  ('UAH', 'Grivna Ucraniana', '₴', 2, 'FIAT', 33, true),
  ('TRY', 'Lira Turca', '₺', 2, 'FIAT', 34, true),
  ('ISK', 'Corona Islandesa', 'kr', 0, 'FIAT', 35, true),

  -- Asia (orden 41-65)
  ('CNY', 'Yuan Chino', '¥', 2, 'FIAT', 36, true),
  ('JPY', 'Yen Japonés', '¥', 0, 'FIAT', 37, true),
  ('KRW', 'Won Surcoreano', '₩', 0, 'FIAT', 38, true),
  ('INR', 'Rupia India', '₹', 2, 'FIAT', 39, true),
  ('IDR', 'Rupia Indonesia', 'Rp', 2, 'FIAT', 40, true),
  ('THB', 'Baht Tailandés', '฿', 2, 'FIAT', 41, true),
  ('MYR', 'Ringgit Malayo', 'RM', 2, 'FIAT', 42, true),
  ('SGD', 'Dólar Singapurense', 'S$', 2, 'FIAT', 43, true),
  ('PHP', 'Peso Filipino', '₱', 2, 'FIAT', 44, true),
  ('VND', 'Dong Vietnamita', '₫', 0, 'FIAT', 45, true),
  ('HKD', 'Dólar de Hong Kong', 'HK$', 2, 'FIAT', 46, true),
  ('TWD', 'Dólar Taiwanés', 'NT$', 2, 'FIAT', 47, true),
  ('PKR', 'Rupia Pakistaní', '₨', 2, 'FIAT', 48, true),
  ('BDT', 'Taka Bangladesí', '৳', 2, 'FIAT', 49, true),
  ('LKR', 'Rupia de Sri Lanka', 'Rs', 2, 'FIAT', 50, true),
  ('MMK', 'Kyat Birmano', 'K', 2, 'FIAT', 51, true),
  ('KHR', 'Riel Camboyano', '៛', 2, 'FIAT', 52, true),
  ('LAK', 'Kip Laosiano', '₭', 2, 'FIAT', 53, true),
  ('NPR', 'Rupia Nepalí', 'Rs', 2, 'FIAT', 54, true),

  -- Middle East (orden 66-75) - Note: 3 decimals for some
  ('AED', 'Dírham de EAU', 'د.إ', 2, 'FIAT', 55, true),
  ('SAR', 'Riyal Saudí', 'ر.س', 2, 'FIAT', 56, true),
  ('QAR', 'Riyal Catarí', 'ر.ق', 2, 'FIAT', 57, true),
  ('KWD', 'Dinar Kuwaití', 'د.ك', 3, 'FIAT', 58, true),
  ('BHD', 'Dinar Bahreiní', 'د.ب', 3, 'FIAT', 59, true),
  ('OMR', 'Rial Omaní', 'ر.ع', 3, 'FIAT', 60, true),
  ('JOD', 'Dinar Jordano', 'د.ا', 3, 'FIAT', 61, true),
  ('ILS', 'Nuevo Séquel', '₪', 2, 'FIAT', 62, true),
  ('IQD', 'Dinar Iraquí', 'ع.د', 3, 'FIAT', 63, true),
  ('IRR', 'Rial Iraní', '﷼', 2, 'FIAT', 64, true),
  ('LBP', 'Libra Libanesa', 'ل.ل', 2, 'FIAT', 65, true),
  ('SYP', 'Libra Siria', '£', 2, 'FIAT', 66, true),

  -- Africa (orden 76-95)
  ('ZAR', 'Rand Sudafricano', 'R', 2, 'FIAT', 67, true),
  ('EGP', 'Libra Egipcia', 'E£', 2, 'FIAT', 68, true),
  ('NGN', 'Naira Nigeriana', '₦', 2, 'FIAT', 69, true),
  ('KES', 'Chelín Keniano', 'KSh', 2, 'FIAT', 70, true),
  ('GHS', 'Cedi Ghanés', 'GH₵', 2, 'FIAT', 71, true),
  ('TZS', 'Chelín Tanzano', 'TSh', 2, 'FIAT', 72, true),
  ('UGX', 'Chelín Ugandés', 'USh', 0, 'FIAT', 73, true),
  ('MAD', 'Dírham Marroquí', 'د.م', 2, 'FIAT', 74, true),
  ('TND', 'Dinar Tunecino', 'د.ت', 3, 'FIAT', 75, true),
  ('DZD', 'Dinar Argelino', 'د.ج', 2, 'FIAT', 76, true),
  ('ETB', 'Birr Etíope', 'Br', 2, 'FIAT', 77, true),
  ('XOF', 'Franco CFA Occidental', 'CFA', 0, 'FIAT', 78, true),
  ('XAF', 'Franco CFA Central', 'FCFA', 0, 'FIAT', 79, true),

  -- Oceania (orden 96-100)
  ('AUD', 'Dólar Australiano', 'A$', 2, 'FIAT', 80, true),
  ('NZD', 'Dólar Neozelandés', 'NZ$', 2, 'FIAT', 81, true),
  ('FJD', 'Dólar Fiyiano', 'FJ$', 2, 'FIAT', 82, true),
  ('PGK', 'Kina de Papúa', 'K', 2, 'FIAT', 83, true),
  ('TOP', 'Paʻanga Tongano', 'T$', 2, 'FIAT', 84, true),
  ('WST', 'Tala Samoano', 'WS$', 2, 'FIAT', 85, true),

  -- Special currencies (orden 101-105)
  ('UF', 'Unidad de Fomento', 'UF', 2, 'INDICE', 86, true),

  -- Cryptocurrencies (orden 200+)
  ('BTC', 'Bitcoin', '₿', 8, 'CRYPTO', 200, true),
  ('ETH', 'Ethereum', 'Ξ', 8, 'CRYPTO', 201, true),
  ('USDT', 'Tether', '₮', 2, 'CRYPTO', 202, true),
  ('USDC', 'USD Coin', 'USDC', 2, 'CRYPTO', 203, true)

ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  simbolo = EXCLUDED.simbolo,
  decimales = EXCLUDED.decimales,
  tipo = EXCLUDED.tipo,
  orden = EXCLUDED.orden,
  activa = EXCLUDED.activa,
  updated_at = NOW();

-- Verification
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM monedas WHERE activa = true;
  RAISE NOTICE 'Total active currencies: %', v_count;

  -- Show currencies by decimals
  RAISE NOTICE '0 decimals: % currencies', (SELECT COUNT(*) FROM monedas WHERE decimales = 0 AND activa = true);
  RAISE NOTICE '2 decimals: % currencies', (SELECT COUNT(*) FROM monedas WHERE decimales = 2 AND activa = true);
  RAISE NOTICE '3 decimals: % currencies', (SELECT COUNT(*) FROM monedas WHERE decimales = 3 AND activa = true);
  RAISE NOTICE '8 decimals: % currencies', (SELECT COUNT(*) FROM monedas WHERE decimales = 8 AND activa = true);
END $$;
