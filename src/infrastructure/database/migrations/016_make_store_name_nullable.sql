-- Make store_name nullable in shopping_executions
-- Allow executions without a store name when user doesn't register in budget

ALTER TABLE shopping_executions
  ALTER COLUMN store_name DROP NOT NULL;
