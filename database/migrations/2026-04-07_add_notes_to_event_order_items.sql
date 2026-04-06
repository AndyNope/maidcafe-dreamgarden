-- Migration: Add notes column to event_order_items
-- Generated: 2026-04-07
-- Safe to run multiple times

SET @schema = DATABASE();

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=@schema AND TABLE_NAME='event_order_items' AND COLUMN_NAME='notes') = 0,
  'ALTER TABLE event_order_items ADD COLUMN notes VARCHAR(300) DEFAULT NULL AFTER assigned_guest',
  'SELECT "notes_column_already_exists"'
) INTO @sql; PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
