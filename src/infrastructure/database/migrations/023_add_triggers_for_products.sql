-- ============================================
-- MIGRATION 023: Add Triggers for Product Tables
-- ============================================
-- Añade triggers para updated_at en todas las tablas de productos

-- Trigger para product_catalog
DROP TRIGGER IF EXISTS update_product_catalog_updated_at ON product_catalog;
CREATE TRIGGER update_product_catalog_updated_at
  BEFORE UPDATE ON product_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para product_categories_global
DROP TRIGGER IF EXISTS update_product_categories_global_updated_at ON product_categories_global;
CREATE TRIGGER update_product_categories_global_updated_at
  BEFORE UPDATE ON product_categories_global
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para product_user_custom
DROP TRIGGER IF EXISTS update_product_user_custom_updated_at ON product_user_custom;
CREATE TRIGGER update_product_user_custom_updated_at
  BEFORE UPDATE ON product_user_custom
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para product_categories_user
DROP TRIGGER IF EXISTS update_product_categories_user_updated_at ON product_categories_user;
CREATE TRIGGER update_product_categories_user_updated_at
  BEFORE UPDATE ON product_categories_user
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para product_frequency
DROP TRIGGER IF EXISTS update_product_frequency_updated_at ON product_frequency;
CREATE TRIGGER update_product_frequency_updated_at
  BEFORE UPDATE ON product_frequency
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
