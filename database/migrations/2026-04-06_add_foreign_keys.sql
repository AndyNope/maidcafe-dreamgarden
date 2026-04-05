-- Migration: Add foreign key constraints for shop/event subsystem
-- Generated: 2026-04-06
-- This script is safe to run multiple times (uses information_schema checks)

SET @schema = DATABASE();

-- Helper pattern: prepare and execute ALTER only when constraint is missing.
-- 1) shop_order_items.order_id -> shop_orders.id
SELECT IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@schema AND TABLE_NAME='shop_order_items' AND CONSTRAINT_NAME='fk_soi_order') = 0,
  'ALTER TABLE shop_order_items ADD CONSTRAINT fk_soi_order FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE',
  'SELECT "fk_soi_order_exists"'
) INTO @sql; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) shop_order_items.product_id -> products.id
SELECT IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@schema AND TABLE_NAME='shop_order_items' AND CONSTRAINT_NAME='fk_soi_product') = 0,
  'ALTER TABLE shop_order_items ADD CONSTRAINT fk_soi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL',
  'SELECT "fk_soi_product_exists"'
) INTO @sql; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) shop_orders.customer_id -> customers.id
SELECT IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@schema AND TABLE_NAME='shop_orders' AND CONSTRAINT_NAME='fk_shop_customer') = 0,
  'ALTER TABLE shop_orders ADD CONSTRAINT fk_shop_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL',
  'SELECT "fk_shop_customer_exists"'
) INTO @sql; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) email_verifications.customer_id -> customers.id
SELECT IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@schema AND TABLE_NAME='email_verifications' AND CONSTRAINT_NAME='fk_ev_customer') = 0,
  'ALTER TABLE email_verifications ADD CONSTRAINT fk_ev_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE',
  'SELECT "fk_ev_customer_exists"'
) INTO @sql; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5) password_resets.customer_id -> customers.id
SELECT IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@schema AND TABLE_NAME='password_resets' AND CONSTRAINT_NAME='fk_pr_customer') = 0,
  'ALTER TABLE password_resets ADD CONSTRAINT fk_pr_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE',
  'SELECT "fk_pr_customer_exists"'
) INTO @sql; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6) customer_addresses.customer_id -> customers.id
SELECT IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@schema AND TABLE_NAME='customer_addresses' AND CONSTRAINT_NAME='fk_addr_customer') = 0,
  'ALTER TABLE customer_addresses ADD CONSTRAINT fk_addr_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE',
  'SELECT "fk_addr_customer_exists"'
) INTO @sql; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7) event_orders.table_id -> restaurant_tables.id
SELECT IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@schema AND TABLE_NAME='event_orders' AND CONSTRAINT_NAME='fk_event_table') = 0,
  'ALTER TABLE event_orders ADD CONSTRAINT fk_event_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL',
  'SELECT "fk_event_table_exists"'
) INTO @sql; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 8) event_orders.staff_id -> members.id
SELECT IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@schema AND TABLE_NAME='event_orders' AND CONSTRAINT_NAME='fk_event_staff') = 0,
  'ALTER TABLE event_orders ADD CONSTRAINT fk_event_staff FOREIGN KEY (staff_id) REFERENCES members(id) ON DELETE SET NULL',
  'SELECT "fk_event_staff_exists"'
) INTO @sql; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 9) event_order_items.event_order_id -> event_orders.id
SELECT IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@schema AND TABLE_NAME='event_order_items' AND CONSTRAINT_NAME='fk_eoi_event') = 0,
  'ALTER TABLE event_order_items ADD CONSTRAINT fk_eoi_event FOREIGN KEY (event_order_id) REFERENCES event_orders(id) ON DELETE CASCADE',
  'SELECT "fk_eoi_event_exists"'
) INTO @sql; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 10) event_order_items.menu_item_id -> menu_items.id (if menu_items exists)
SELECT COUNT(*) INTO @cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA=@schema AND TABLE_NAME='menu_items';
SELECT IF(
  @cnt = 1 AND (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@schema AND TABLE_NAME='event_order_items' AND CONSTRAINT_NAME='fk_eoi_menu') = 0,
  'ALTER TABLE event_order_items ADD CONSTRAINT fk_eoi_menu FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL',
  'SELECT "fk_eoi_menu_skipped_or_exists"'
) INTO @sql; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 11) event_bills.event_order_id -> event_orders.id
SELECT IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=@schema AND TABLE_NAME='event_bills' AND CONSTRAINT_NAME='fk_bill_event') = 0,
  'ALTER TABLE event_bills ADD CONSTRAINT fk_bill_event FOREIGN KEY (event_order_id) REFERENCES event_orders(id) ON DELETE CASCADE',
  'SELECT "fk_bill_event_exists"'
) INTO @sql; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 12) shop_order_items.order_id index/check done above; ensure shop_orders.id PK exists

-- Done

/* Note: Running this script on very old MySQL versions that don't support prepared statements at top-level
   may require adaptation. Test on staging first. */
