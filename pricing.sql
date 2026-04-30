-- ============================================================
-- COMPLETE PRICING DATA
-- Combined from three sources:
--   1. Access Medical Labs retail pricing (315 tests)
--   2. CPL (Clinical Pathology Labs) pricing (164 tests)
--   3. Access Medical Labs actual lab costs (228 tests)
--
-- Run order: schema.sql > categories.sql > laboratories.sql >
--            tests-complete.sql > THIS FILE
--
-- IMPORTANT: Requires the tests and laboratories tables to be
-- populated first (foreign key dependencies).
-- ============================================================

SET NAMES utf8mb4;

-- ============================================================
-- SECTION 1: Access Medical Labs — Retail Pricing
-- All 315 tests with Access lab codes, lab cost, and retail price.
-- lab_cost = what Access charges us
-- retail_price = what we charge the customer
-- Rule: retail_price must ALWAYS be >= lab_cost (never sell at a loss)
-- ============================================================

-- Seed: Lab Tests (linking tests to Access Medical Labs)
-- Generated from Access Tests - Cleaned.xlsx
-- Safe to re-run (INSERT ... ON DUPLICATE KEY UPDATE)

-- Ensure composite unique index for ON DUPLICATE KEY to work:
-- ALTER TABLE lab_tests ADD UNIQUE INDEX idx_lab_tests_composite (test_id, laboratory_id);

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(1, 1, '29', 30.0, 75, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '29', lab_cost = 30.0, retail_price = 75, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(2, 1, '141', 24.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '141', lab_cost = 24.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(3, 1, '112', 3.5, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '112', lab_cost = 3.5, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(4, 1, '115', 4.0, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '115', lab_cost = 4.0, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(5, 1, '116', 5.0, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '116', lab_cost = 5.0, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(6, 1, '16', 69.0, 172, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '16', lab_cost = 69.0, retail_price = 172, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(7, 1, '121', 4.0, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '121', lab_cost = 4.0, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(8, 1, '24A', 19.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '24A', lab_cost = 19.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(9, 1, 'ANA+', 199.0, 258.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'ANA+', lab_cost = 199.0, retail_price = 258.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(10, 1, 'ANA', 19.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'ANA', lab_cost = 19.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(11, 1, 'ANAX', 19.0, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'ANAX', lab_cost = 19.0, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(12, 1, 'ANA-', 199.0, 258.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'ANA-', lab_cost = 199.0, retail_price = 258.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(13, 1, '327', 30.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '327', lab_cost = 30.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(14, 1, '329', 35.0, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '329', lab_cost = 35.0, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(15, 1, '14', 29.0, 92.07, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '14', lab_cost = 29.0, retail_price = 92.07, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(16, 1, '30', 20.0, 36.27, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '30', lab_cost = 20.0, retail_price = 36.27, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(17, 1, '175', 34.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '175', lab_cost = 34.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(18, 1, '176', 34.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '176', lab_cost = 34.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(19, 1, 'S301', 90.0, 117.0, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'S301', lab_cost = 90.0, retail_price = 117.0, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(20, 1, 'LAPE', 325.0, 422.5, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'LAPE', lab_cost = 325.0, retail_price = 422.5, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(21, 1, '15', 75.0, 101.37, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '15', lab_cost = 75.0, retail_price = 101.37, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(22, 1, '117', 5.0, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '117', lab_cost = 5.0, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(23, 1, 'ANAZ', 199.0, 498, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'ANAZ', lab_cost = 199.0, retail_price = 498, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(24, 1, 'S335', 71.0, 101.37, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'S335', lab_cost = 71.0, retail_price = 101.37, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(25, 1, '3', 4.0, 36.27, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '3', lab_cost = 4.0, retail_price = 36.27, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(26, 1, '114', 4.0, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '114', lab_cost = 4.0, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(27, 1, 'IBIL', 7.5, 19, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'IBIL', lab_cost = 7.5, retail_price = 19, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(28, 1, '113', 3.5, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '113', lab_cost = 3.5, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(29, 1, '171B', 34.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '171B', lab_cost = 34.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(30, 1, '101', 3.5, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '101', lab_cost = 3.5, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(31, 1, 'CPEP', 31.5, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'CPEP', lab_cost = 31.5, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(32, 1, '247', 39.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '247', lab_cost = 39.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(33, 1, '143', 20.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '143', lab_cost = 20.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(34, 1, '144', 35.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '144', lab_cost = 35.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(35, 1, '181', 50.0, 65.0, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '181', lab_cost = 50.0, retail_price = 65.0, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(36, 1, 'L452', 29.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'L452', lab_cost = 29.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(37, 1, '108', 4.0, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '108', lab_cost = 4.0, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(38, 1, '4UCA', 10.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '4UCA', lab_cost = 10.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(39, 1, 'RUCA', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'RUCA', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(40, 1, '3000', 106.0, 137.8, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '3000', lab_cost = 106.0, retail_price = 137.8, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(41, 1, '3001', 154.0, 200.2, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '3001', lab_cost = 154.0, retail_price = 200.2, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(42, 1, '3002', 76.0, 129.27, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '3002', lab_cost = 76.0, retail_price = 129.27, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(43, 1, '3003', 125.0, 162.5, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '3003', lab_cost = 125.0, retail_price = 162.5, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(44, 1, '107', 3.5, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '107', lab_cost = 3.5, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(45, 1, 'CP2', 199.0, 258.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'CP2', lab_cost = 199.0, retail_price = 258.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(46, 1, 'CP1', 99.0, 128.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'CP1', lab_cost = 99.0, retail_price = 128.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(47, 1, 'ED1', 89.0, 115.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'ED1', lab_cost = 89.0, retail_price = 115.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(48, 1, 'S508', 75.5, 98.15, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'S508', lab_cost = 75.5, retail_price = 98.15, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(49, 1, '11', 5.0, 36.27, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '11', lab_cost = 5.0, retail_price = 36.27, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(50, 1, '1', 5.0, 36.27, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '1', lab_cost = 5.0, retail_price = 36.27, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(51, 1, '142', 18.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '142', lab_cost = 18.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(52, 1, 'CLIA', 105.0, 136.5, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'CLIA', lab_cost = 105.0, retail_price = 136.5, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(53, 1, 'CENT', 30.5, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'CENT', lab_cost = 30.5, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(54, 1, 'S603', 35.0, 73.47, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'S603', lab_cost = 35.0, retail_price = 73.47, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(55, 1, 'S595', 65.0, 84.5, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'S595', lab_cost = 65.0, retail_price = 84.5, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(56, 1, '106', 3.0, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '106', lab_cost = 3.0, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(57, 1, '4UCL', 10.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '4UCL', lab_cost = 10.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(58, 1, '124', 4.0, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '124', lab_cost = 4.0, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(59, 1, 'CHRM', 76.0, 98.8, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'CHRM', lab_cost = 76.0, retail_price = 98.8, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(60, 1, '120', 9.0, 36.27, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '120', lab_cost = 9.0, retail_price = 36.27, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(61, 1, '379', 16.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '379', lab_cost = 16.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(62, 1, 'C3', 17.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'C3', lab_cost = 17.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(63, 1, 'C4', 17.5, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'C4', lab_cost = 17.5, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(64, 1, '4', 5.5, 36.27, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '4', lab_cost = 5.5, retail_price = 36.27, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(65, 1, '162', 19.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '162', lab_cost = 19.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(66, 1, 'LCU', 26.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'LCU', lab_cost = 26.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(67, 1, 'MR52', 55.5, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'MR52', lab_cost = 55.5, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(68, 1, 'Q10', 74.5, 101.37, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'Q10', lab_cost = 74.5, retail_price = 101.37, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(69, 1, '102', 3.0, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '102', lab_cost = 3.0, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(70, 1, '234', 16.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '234', lab_cost = 16.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(71, 1, '127', 17.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '127', lab_cost = 17.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(72, 1, '255', 33.0, 73.47, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '255', lab_cost = 33.0, retail_price = 73.47, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(73, 1, '310', 43.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '310', lab_cost = 43.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(74, 1, '299', 65.0, 84.5, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '299', lab_cost = 65.0, retail_price = 84.5, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(75, 1, '298', 33.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '298', lab_cost = 33.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(76, 1, '308', 28.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '308', lab_cost = 28.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(77, 1, '287', 29.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '287', lab_cost = 29.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(78, 1, '295', 28.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '295', lab_cost = 28.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(79, 1, '294', 28.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '294', lab_cost = 28.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(80, 1, '290', 28.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '290', lab_cost = 28.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(81, 1, '293', 28.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '293', lab_cost = 28.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(82, 1, 'C296', 20.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'C296', lab_cost = 20.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(83, 1, 'D297', 28.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'D297', lab_cost = 28.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(84, 1, 'S297', 28.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'S297', lab_cost = 28.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(85, 1, '302', 59.0, 76.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '302', lab_cost = 59.0, retail_price = 76.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(86, 1, '303', 25.0, 73.47, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '303', lab_cost = 25.0, retail_price = 73.47, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(87, 1, '304', 33.0, 73.47, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '304', lab_cost = 33.0, retail_price = 73.47, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(88, 1, '388', 26.5, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '388', lab_cost = 26.5, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(89, 1, '260', 33.0, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '260', lab_cost = 33.0, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(90, 1, 'S782', 34.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'S782', lab_cost = 34.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(91, 1, '396', 26.5, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '396', lab_cost = 26.5, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(92, 1, '398', 26.5, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '398', lab_cost = 26.5, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(93, 1, '161', 15.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '161', lab_cost = 15.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(94, 1, '321', 35.0, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '321', lab_cost = 35.0, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(95, 1, '259', 250.0, 325.0, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '259', lab_cost = 250.0, retail_price = 325.0, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(96, 1, 'DNA', 19.0, 73.47, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'DNA', lab_cost = 19.0, retail_price = 73.47, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(97, 1, '27', 20.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '27', lab_cost = 20.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(98, 1, '246', 33.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '246', lab_cost = 33.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(99, 1, 'D172', 90.0, 117.0, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'D172', lab_cost = 90.0, retail_price = 117.0, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(100, 1, '5', 3.0, 36.27, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '5', lab_cost = 3.0, retail_price = 36.27, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(101, 1, '354', 31.5, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '354', lab_cost = 31.5, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(102, 1, 'EPS', 125.0, 162.5, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'EPS', lab_cost = 125.0, retail_price = 162.5, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(103, 1, '355', 31.5, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '355', lab_cost = 31.5, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(104, 1, '352', 31.5, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '352', lab_cost = 31.5, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(105, 1, '353', 31.5, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '353', lab_cost = 31.5, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(106, 1, '159', 15.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '159', lab_cost = 15.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(107, 1, '359', 35.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '359', lab_cost = 35.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(108, 1, '323', 32.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '323', lab_cost = 32.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(109, 1, '324', 50.0, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '324', lab_cost = 50.0, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(110, 1, '322', 32.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '322', lab_cost = 32.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(111, 1, '270', 24.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '270', lab_cost = 24.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(112, 1, '272', 25.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '272', lab_cost = 25.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(113, 1, '131', 8.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '131', lab_cost = 8.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(114, 1, '284', 19.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '284', lab_cost = 19.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(115, 1, '133', 8.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '133', lab_cost = 8.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(116, 1, 'FTI', 30.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'FTI', lab_cost = 30.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(117, 1, 'T003', 14.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'T003', lab_cost = 14.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(118, 1, '155', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '155', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(119, 1, '5239', 30.0, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '5239', lab_cost = 30.0, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(120, 1, '300', 25.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '300', lab_cost = 25.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(121, 1, '119', 5.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '119', lab_cost = 5.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(122, 1, '362', 25.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '362', lab_cost = 25.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(123, 1, '100', 5.0, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '100', lab_cost = 5.0, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(124, 1, 'L036', 22.5, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'L036', lab_cost = 22.5, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(125, 1, 'c296', 6.0, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'c296', lab_cost = 6.0, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(126, 1, '350', 7.0, 36.27, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '350', lab_cost = 7.0, retail_price = 36.27, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(127, 1, '4UGL', 10.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '4UGL', lab_cost = 10.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(128, 1, 'RUGL', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'RUGL', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(129, 1, 'LGTA', 109.5, 142.35, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'LGTA', lab_cost = 109.5, retail_price = 142.35, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(130, 1, '326', 34.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '326', lab_cost = 34.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(131, 1, '233', 19.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '233', lab_cost = 19.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(132, 1, 'T075', 119.0, 154.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'T075', lab_cost = 119.0, retail_price = 154.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(133, 1, 'P208', 31.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'P208', lab_cost = 31.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(134, 1, '180', 12.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '180', lab_cost = 12.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(135, 1, '125', 5.0, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '125', lab_cost = 5.0, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(136, 1, 'MU90', 59.0, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'MU90', lab_cost = 59.0, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(137, 1, 'L072', 55.5, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'L072', lab_cost = 55.5, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(138, 1, '5520', 139.0, 180.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '5520', lab_cost = 139.0, retail_price = 180.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(139, 1, '5521', 159.0, 206.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '5521', lab_cost = 159.0, retail_price = 206.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(140, 1, '202', 11.0, 36.27, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '202', lab_cost = 11.0, retail_price = 36.27, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(141, 1, '189', 29.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '189', lab_cost = 29.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(142, 1, '188', 29.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '188', lab_cost = 29.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(143, 1, '9', 59.0, 119.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '9', lab_cost = 59.0, retail_price = 119.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(144, 1, '194', 29.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '194', lab_cost = 29.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(145, 1, '193', 29.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '193', lab_cost = 29.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(146, 1, '192', 29.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '192', lab_cost = 29.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(147, 1, '199', 29.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '199', lab_cost = 29.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(148, 1, '190', 40.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '190', lab_cost = 40.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(149, 1, '197', 29.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '197', lab_cost = 29.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(150, 1, '6', 5.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '6', lab_cost = 5.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(151, 1, 'HRPS', 50.0, 65.0, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'HRPS', lab_cost = 50.0, retail_price = 65.0, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(152, 1, '382', 20.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '382', lab_cost = 20.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(153, 1, '383', 30.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '383', lab_cost = 30.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(154, 1, 'P311', 33.0, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'P311', lab_cost = 33.0, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(155, 1, '210', 39.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '210', lab_cost = 39.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(156, 1, '320', 39.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '320', lab_cost = 39.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(157, 1, '330', 59.0, 76.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '330', lab_cost = 59.0, retail_price = 76.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(158, 1, 'IGA', 25.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'IGA', lab_cost = 25.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(159, 1, '166', 19.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '166', lab_cost = 19.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(160, 1, 'IGG', 25.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'IGG', lab_cost = 25.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(161, 1, 'IGM', 25.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'IGM', lab_cost = 25.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(162, 1, 'GAM', 50.5, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'GAM', lab_cost = 50.5, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(163, 1, '245', 49.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '245', lab_cost = 49.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(164, 1, '163', 15.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '163', lab_cost = 15.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(165, 1, 'L366', 80.0, 104.0, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'L366', lab_cost = 80.0, retail_price = 104.0, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(166, 1, '129', 14.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '129', lab_cost = 14.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(167, 1, '128', 5.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '128', lab_cost = 5.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(168, 1, 'JO1', 64.0, 83.2, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'JO1', lab_cost = 64.0, retail_price = 83.2, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(169, 1, '118', 5.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '118', lab_cost = 5.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(170, 1, '126', 5.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '126', lab_cost = 5.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(171, 1, 'L574', 87.0, 113.1, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'L574', lab_cost = 87.0, retail_price = 113.1, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(172, 1, '156', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '156', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(173, 1, '122', 5.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '122', lab_cost = 5.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(174, 1, '7', 9.0, 36.27, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '7', lab_cost = 9.0, retail_price = 36.27, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(175, 1, '208', 22.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '208', lab_cost = 22.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(176, 1, 'L484', 22.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'L484', lab_cost = 22.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(177, 1, 'S419', 43.5, 101.37, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'S419', lab_cost = 43.5, retail_price = 101.37, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(178, 1, 'D261', 67.0, 87.1, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'D261', lab_cost = 67.0, retail_price = 87.1, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(179, 1, 'LSP1', 187.0, 243.1, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'LSP1', lab_cost = 187.0, retail_price = 243.1, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(180, 1, 'LSP2', 155.5, 202.15, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'LSP2', lab_cost = 155.5, retail_price = 202.15, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(181, 1, 'LSP3', 84.0, 109.2, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'LSP3', lab_cost = 84.0, retail_price = 109.2, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(182, 1, 'LSP4', 68.5, 89.05, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'LSP4', lab_cost = 68.5, retail_price = 89.05, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(183, 1, '110', 3.5, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '110', lab_cost = 3.5, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(184, 1, 'MR55', 20.5, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'MR55', lab_cost = 20.5, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(185, 1, '4UMG', 10.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '4UMG', lab_cost = 10.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(186, 1, 'RUMG', 10.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'RUMG', lab_cost = 10.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(187, 1, '263', 35.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '263', lab_cost = 35.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(188, 1, '384', 25.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '384', lab_cost = 25.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(189, 1, '26', 9.5, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '26', lab_cost = 9.5, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(190, 1, 'MMR', 61.0, 101.37, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'MMR', lab_cost = 61.0, retail_price = 101.37, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(191, 1, '4UMA', 10.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '4UMA', lab_cost = 10.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(192, 1, 'MMRV', 80.0, 119.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'MMRV', lab_cost = 80.0, retail_price = 119.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(193, 1, '356', 17.5, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '356', lab_cost = 17.5, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(194, 1, 'L620', 199.0, 258.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'L620', lab_cost = 199.0, retail_price = 258.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(195, 1, '385', 19.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '385', lab_cost = 19.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(196, 1, '289', 33.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '289', lab_cost = 33.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(197, 1, '174', 29.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '174', lab_cost = 29.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(198, 1, 'MPO', 45.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'MPO', lab_cost = 45.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(199, 1, 'NKC', 97.0, 126.1, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'NKC', lab_cost = 97.0, retail_price = 126.1, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(200, 1, 'C169', 35.0, 73.47, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'C169', lab_cost = 35.0, retail_price = 73.47, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(201, 1, '209', 95.0, 123.5, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '209', lab_cost = 95.0, retail_price = 123.5, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(202, 1, '250', 49.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '250', lab_cost = 49.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(203, 1, '256', 152.5, 198.25, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '256', lab_cost = 152.5, retail_price = 198.25, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(204, 1, '8', 45.0, 101.37, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '8', lab_cost = 45.0, retail_price = 101.37, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(205, 1, '266', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '266', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(206, 1, '267', 22.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '267', lab_cost = 22.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(207, 1, 'D169', 105.0, 136.5, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'D169', lab_cost = 105.0, retail_price = 136.5, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(208, 1, '109', 3.5, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '109', lab_cost = 3.5, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(209, 1, '4UPH', 10.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '4UPH', lab_cost = 10.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(210, 1, 'RUPH', 10.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'RUPH', lab_cost = 10.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(211, 1, '207', 69.0, 89.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '207', lab_cost = 69.0, retail_price = 89.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(212, 1, 'PLTC', 3.5, 36.27, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'PLTC', lab_cost = 3.5, retail_price = 36.27, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(213, 1, '105', 3.5, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '105', lab_cost = 3.5, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(214, 1, '4UPO', 10.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '4UPO', lab_cost = 10.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(215, 1, 'PPOT', 6.5, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'PPOT', lab_cost = 6.5, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(216, 1, 'RUPO', 6.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'RUPO', lab_cost = 6.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(217, 1, 'P209', 57.5, 74.75, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'P209', lab_cost = 57.5, retail_price = 74.75, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(218, 1, '165', 14.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '165', lab_cost = 14.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(219, 1, '154B', 15.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '154B', lab_cost = 15.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(220, 1, '201', 14.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '201', lab_cost = 14.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(221, 1, '325', 60.0, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '325', lab_cost = 60.0, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(222, 1, '1158', 17.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '1158', lab_cost = 17.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(223, 1, '358', 35.0, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '358', lab_cost = 35.0, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(224, 1, '157', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '157', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(225, 1, '111', 3.5, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '111', lab_cost = 3.5, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(226, 1, '4UTP', 10.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '4UTP', lab_cost = 10.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(227, 1, 'RUTP', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'RUTP', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(228, 1, 'T755', 29.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'T755', lab_cost = 29.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(229, 1, '178', 8.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '178', lab_cost = 8.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(230, 1, '146', 5.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '146', lab_cost = 5.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(231, 1, '280', 35.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '280', lab_cost = 35.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(232, 1, '164', 3.5, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '164', lab_cost = 3.5, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(233, 1, '282', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '282', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(234, 1, 'QNTF', 29.5, 101.37, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'QNTF', lab_cost = 29.5, retail_price = 101.37, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(235, 1, '10', 139.0, 180.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '10', lab_cost = 139.0, retail_price = 180.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(236, 1, '277', 97.0, 126.1, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '277', lab_cost = 97.0, retail_price = 126.1, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(237, 1, 'RT3', 61.0, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'RT3', lab_cost = 61.0, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(238, 1, 'RMT', 25.0, 101.37, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'RMT', lab_cost = 25.0, retail_price = 101.37, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(239, 1, '389', 97.0, 126.1, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '389', lab_cost = 97.0, retail_price = 126.1, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(240, 1, 'RIBO', 137.0, 178.1, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'RIBO', lab_cost = 137.0, retail_price = 178.1, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(241, 1, 'RNP', 4.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'RNP', lab_cost = 4.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(242, 1, '229', 29.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '229', lab_cost = 29.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(243, 1, 'E129', 36.5, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'E129', lab_cost = 36.5, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(244, 1, '399', 17.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '399', lab_cost = 17.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(245, 1, '386', 17.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '386', lab_cost = 17.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(246, 1, '378', 16.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '378', lab_cost = 16.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(247, 1, '6400', 99.0, 128.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '6400', lab_cost = 99.0, retail_price = 128.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(248, 1, 'S90', 99.0, 128.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'S90', lab_cost = 99.0, retail_price = 128.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(249, 1, '4350', 259.0, 336.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '4350', lab_cost = 259.0, retail_price = 336.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(250, 1, 'S84', 349.0, 453.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'S84', lab_cost = 349.0, retail_price = 453.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(251, 1, 'S88', 379.0, 492.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'S88', lab_cost = 379.0, retail_price = 492.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(252, 1, '2600', 97.0, 138.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '2600', lab_cost = 97.0, retail_price = 138.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(253, 1, '2700', 137.0, 178.1, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '2700', lab_cost = 137.0, retail_price = 178.1, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(254, 1, 'C19N', 59.0, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'C19N', lab_cost = 59.0, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(255, 1, 'SCL', 45.5, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'SCL', lab_cost = 45.5, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(256, 1, '184', 34.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '184', lab_cost = 34.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(257, 1, '278', 9.0, 36.27, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '278', lab_cost = 9.0, retail_price = 36.27, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(258, 1, 'MR60', 35.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'MR60', lab_cost = 35.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(259, 1, 'T287', 100.5, 130.65, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'T287', lab_cost = 100.5, retail_price = 130.65, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(260, 1, '168', 19.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '168', lab_cost = 19.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(261, 1, 'L485', 92.0, 119.6, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'L485', lab_cost = 92.0, retail_price = 119.6, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(262, 1, 'SM', 33.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'SM', lab_cost = 33.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(263, 1, 'SMRN', 36.5, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'SMRN', lab_cost = 36.5, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(264, 1, '104', 3.0, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '104', lab_cost = 3.0, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(265, 1, 'RUSO', 7.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'RUSO', lab_cost = 7.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(266, 1, '4USO', 10.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '4USO', lab_cost = 10.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(267, 1, 'SSA', 26.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'SSA', lab_cost = 26.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(268, 1, 'SSB', 20.5, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'SSB', lab_cost = 20.5, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(269, 1, '594', 69.0, 119.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '594', lab_cost = 69.0, retail_price = 119.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(270, 1, '595', 120.0, 156.0, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '595', lab_cost = 120.0, retail_price = 156.0, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(271, 1, '148', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '148', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(272, 1, '147', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '147', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(273, 1, '151', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '151', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(274, 1, '150', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '150', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(275, 1, 'L959', 85.0, 110.5, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'L959', lab_cost = 85.0, retail_price = 110.5, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(276, 1, '160', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '160', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(277, 1, '328', 35.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '328', lab_cost = 35.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(278, 1, 'BAT', 39.0, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'BAT', lab_cost = 39.0, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(279, 1, '167', 28.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '167', lab_cost = 28.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(280, 1, 'TFLC', 47.0, 82.77, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'TFLC', lab_cost = 47.0, retail_price = 82.77, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(281, 1, '179', 20.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '179', lab_cost = 20.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(282, 1, '13', 33.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '13', lab_cost = 33.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(283, 1, 'TTP', 109.0, 141.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'TTP', lab_cost = 109.0, retail_price = 141.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(284, 1, '153', 20.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '153', lab_cost = 20.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(285, 1, '395', 26.5, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '395', lab_cost = 26.5, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(286, 1, '397', 26.5, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '397', lab_cost = 26.5, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(287, 1, 'TRCH', 139.0, 180.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'TRCH', lab_cost = 139.0, retail_price = 180.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(288, 1, '377', 27.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '377', lab_cost = 27.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(289, 1, '130', 8.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '130', lab_cost = 8.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(290, 1, '123', 4.0, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '123', lab_cost = 4.0, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(291, 1, '152', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '152', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(292, 1, '152R', 15.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '152R', lab_cost = 15.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(293, 1, '149', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '149', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(294, 1, 'RUUR', 15.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'RUUR', lab_cost = 15.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(295, 1, '4UUR', 10.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '4UUR', lab_cost = 10.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(296, 1, '103', 3.0, 26.97, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '103', lab_cost = 3.0, retail_price = 26.97, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(297, 1, '3111', 9.0, 36.27, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '3111', lab_cost = 9.0, retail_price = 36.27, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(298, 1, '6000', 9.0, 36.27, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '6000', lab_cost = 9.0, retail_price = 36.27, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(299, 1, '2', 9.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '2', lab_cost = 9.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(300, 1, 'V296', 17.5, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'V296', lab_cost = 17.5, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(301, 1, '387', 25.0, 54.87, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '387', lab_cost = 25.0, retail_price = 54.87, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(302, 1, '132', 8.0, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '132', lab_cost = 8.0, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(303, 1, '28', 15.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '28', lab_cost = 15.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(304, 1, 'E566', 59.0, 76.7, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'E566', lab_cost = 59.0, retail_price = 76.7, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(305, 1, 'VD25', 33.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'VD25', lab_cost = 33.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(306, 1, 'L093', 13.5, 45.57, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'L093', lab_cost = 13.5, retail_price = 45.57, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(307, 1, 'MR62', 35.0, 64.17, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'MR62', lab_cost = 35.0, retail_price = 64.17, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(308, 1, 'FDSN', 199.0, 498, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'FDSN', lab_cost = 199.0, retail_price = 498, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(309, 1, 'ALLG', 199.0, 498, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'ALLG', lab_cost = 199.0, retail_price = 498, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(310, 1, 'ALSN', 349.0, 872, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = 'ALSN', lab_cost = 349.0, retail_price = 872, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(311, 1, '2600', 97.0, 242, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '2600', lab_cost = 97.0, retail_price = 242, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(312, 1, '2700', 137.0, 342, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '2700', lab_cost = 137.0, retail_price = 342, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(313, 1, '6400', 99.0, 248, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '6400', lab_cost = 99.0, retail_price = 248, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(314, 1, '6100', 60.0, 150, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '6100', lab_cost = 60.0, retail_price = 150, is_available = 1;

INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available, turnaround_days_override) VALUES
(315, 1, '6101', 60.0, 150, 1, NULL)
ON DUPLICATE KEY UPDATE lab_test_code = '6101', lab_cost = 60.0, retail_price = 150, is_available = 1;



-- ============================================================
-- SECTION 2: CPL (Clinical Pathology Labs) — Regional Pricing
-- 164 tests matched to existing test catalog.
-- CPL is a regional lab (Texas-based), so these prices only apply
-- when a patient is near a CPL draw center.
-- The retail_price formula: GREATEST(cpl_cost * 2.5, Access retail, cpl_cost * 3)
-- This ensures competitive pricing without undercutting Access.
-- NOTE: CPL lab (laboratory_id=4) should be is_active=0 until
-- proximity-based lab selection is implemented.
-- ============================================================

-- ============================================================
-- CPL (Clinical Pathology Labs) Pricing Import
-- Auto-generated by cpl_parse.py
-- Source: CPL client_75448_pricing_20260309.pdf
-- ============================================================

-- Ensure CPL laboratory exists (id=4, code='CPL')
INSERT INTO laboratories (id, name, code, api_endpoint, api_key_encrypted, is_active) VALUES
(4, 'Clinical Pathology Labs', 'CPL', NULL, NULL, 1)
ON DUPLICATE KEY UPDATE name = 'Clinical Pathology Labs', is_active = 1;

-- ────────────────────────────────────────────────────────────
-- CPL test pricing entries
-- Strategy: match CPL test name to existing tests table,
--   insert into lab_tests with CPL pricing.
--   retail_price = GREATEST(cpl_cost * 2.5, existing Access retail, cpl_cost * 3)
-- ────────────────────────────────────────────────────────────

-- CPL 3800: ABO & RH @ $6.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '3800', 6.00,
  GREATEST(
    6.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 6.00 * 3),
    6.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('ABO Group & RH Type')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('ABO & RH')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 6.00, lab_test_code = '3800';

-- CPL 4201: ALDOSTERONE @ $36.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4201', 36.00,
  GREATEST(
    36.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 36.00 * 3),
    36.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Electrolyte Panel')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('ALDOSTERONE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 36.00, lab_test_code = '4201';

-- CPL 2025: AMYLASE @ $6.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2025', 6.00,
  GREATEST(
    6.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 6.00 * 3),
    6.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Amylase')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('AMYLASE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 6.00, lab_test_code = '2025';

-- CPL 355001: ANA TITER AND PATTERN @ $9.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '355001', 9.00,
  GREATEST(
    9.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 9.00 * 3),
    9.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('ANA Screen')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('ANA TITER AND PATTERN')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 9.00, lab_test_code = '355001';

-- CPL 3550: ANTI-NUCLEAR ANTIBODIES @ $18.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '3550', 18.00,
  GREATEST(
    18.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 18.00 * 3),
    18.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('ANA Screen')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('ANTI-NUCLEAR ANTIBODIES')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 18.00, lab_test_code = '3550';

-- CPL 5637: APOLIPOPROTEIN E MUTATION @ $71.47
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5637', 71.47,
  GREATEST(
    71.47 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 71.47 * 3),
    71.47 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('APOLIPOPROTEIN E MUTATION')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 71.47, lab_test_code = '5637';

-- CPL 4203: ARSENIC @ $20.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4203', 20.00,
  GREATEST(
    20.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 20.00 * 3),
    20.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Heavy Metals Screening, Whole Blood (Arsenic, Lead, Mercury)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('ARSENIC')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 20.00, lab_test_code = '4203';

-- CPL 391: ARTHRITIS PROFILE @ $28.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '391', 28.00,
  GREATEST(
    28.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 28.00 * 3),
    28.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Arthritis Panel')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('ARTHRITIS PROFILE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 28.00, lab_test_code = '391';

-- CPL 142: BASIC METABOLIC PANEL @ $3.40
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '142', 3.40,
  GREATEST(
    3.40 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 3.40 * 3),
    3.40 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Basic Metabolic Panel')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('BASIC METABOLIC PANEL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 3.40, lab_test_code = '142';

-- CPL 1210: BODY FLUID CELL COUNT @ $25.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '1210', 25.00,
  GREATEST(
    25.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 25.00 * 3),
    25.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('BODY FLUID CELL COUNT')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 25.00, lab_test_code = '1210';

-- CPL 5264: BONE SPECIFIC ALK PHOS @ $97.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5264', 97.00,
  GREATEST(
    97.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 97.00 * 3),
    97.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('BONE SPECIFIC ALK PHOS')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 97.00, lab_test_code = '5264';

-- CPL 926: BREATH TEK COLLECTION @ $11.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '926', 11.00,
  GREATEST(
    11.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 11.00 * 3),
    11.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('BREATH TEK COLLECTION')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 11.00, lab_test_code = '926';

-- CPL 6015: C DIFF CULT RFLX CYTOTOX @ $788.40
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '6015', 788.40,
  GREATEST(
    788.40 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 788.40 * 3),
    788.40 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('C DIFF CULT RFLX CYTOTOX')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 788.40, lab_test_code = '6015';

-- CPL 4150: C DIFF CYTOTOXIN AB,SERUM @ $185.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4150', 185.00,
  GREATEST(
    185.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 185.00 * 3),
    185.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('C DIFF CYTOTOXIN AB,SERUM')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 185.00, lab_test_code = '4150';

-- CPL 6335: C DIFF GDH RFLX TOXIN,PCR @ $22.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '6335', 22.00,
  GREATEST(
    22.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 22.00 * 3),
    22.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('C DIFF GDH RFLX TOXIN,PCR')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 22.00, lab_test_code = '6335';

-- CPL 4733: C DIFF TOXIN B BY PCR @ $135.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4733', 135.00,
  GREATEST(
    135.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 135.00 * 3),
    135.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('C DIFF TOXIN B BY PCR')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 135.00, lab_test_code = '4733';

-- CPL 3545: C-REACTIVE PROTEIN @ $7.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '3545', 7.00,
  GREATEST(
    7.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 7.00 * 3),
    7.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('CRP')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('C-REACTIVE PROTEIN')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 7.00, lab_test_code = '3545';

-- CPL 2209: CALCIUM @ $3.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2209', 3.50,
  GREATEST(
    3.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 3.50 * 3),
    3.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Calcium, Serum')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CALCIUM')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 3.50, lab_test_code = '2209';

-- CPL 4326: CATECHOLAMINES,URINE @ $42.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4326', 42.00,
  GREATEST(
    42.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 42.00 * 3),
    42.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Catecholamines, Fractionated')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CATECHOLAMINES,URINE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 42.00, lab_test_code = '4326';

-- CPL 1000: CBC W/AUTO DIFF+PLATELETS @ $3.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '1000', 3.00,
  GREATEST(
    3.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 3.00 * 3),
    3.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('CBC w/Diff')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CBC W/AUTO DIFF+PLATELETS')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 3.00, lab_test_code = '1000';

-- CPL 5783: CELIAC DISEASE GENOTYPE @ $280.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5783', 280.00,
  GREATEST(
    280.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 280.00 * 3),
    280.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('CELIAC DISEASE GENOTYPE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 280.00, lab_test_code = '5783';

-- CPL 4833: CELIAC DISEASE PANEL @ $70.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4833', 70.00,
  GREATEST(
    70.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 70.00 * 3),
    70.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('CELIAC DISEASE PANEL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 70.00, lab_test_code = '4833';

-- CPL 4739: CELIAC DISEASE RFLX PANEL @ $20.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4739', 20.00,
  GREATEST(
    20.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 20.00 * 3),
    20.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('CELIAC DISEASE RFLX PANEL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 20.00, lab_test_code = '4739';

-- CPL 5399: CHLAMYDIA,NAAT,URINE @ $15.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5399', 15.00,
  GREATEST(
    15.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 15.00 * 3),
    15.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Chlamydia, Urine')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CHLAMYDIA,NAAT,URINE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 15.00, lab_test_code = '5399';

-- CPL 5398: CHLAMYDIA,TMA,SIMPLESWAB @ $15.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5398', 15.00,
  GREATEST(
    15.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 15.00 * 3),
    15.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Chlamydia, Urine')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CHLAMYDIA,TMA,SIMPLESWAB')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 15.00, lab_test_code = '5398';

-- CPL 2660: CK ISOENZYMES @ $35.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2660', 35.00,
  GREATEST(
    35.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 35.00 * 3),
    35.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('CK ISOENZYMES')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 35.00, lab_test_code = '2660';

-- CPL 2075: CK, TOTAL @ $4.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2075', 4.00,
  GREATEST(
    4.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 4.00 * 3),
    4.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('CK, Total')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CK, TOTAL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 4.00, lab_test_code = '2075';

-- CPL 4019: CMV BY PCR,PLASMA @ $100.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4019', 100.00,
  GREATEST(
    100.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 100.00 * 3),
    100.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('CMV BY PCR,PLASMA')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 100.00, lab_test_code = '4019';

-- CPL 9179: COMP METABOLIC PANEL @ $3.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '9179', 3.50,
  GREATEST(
    3.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 3.50 * 3),
    3.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Comprehensive Metabolic Panel')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('COMP METABOLIC PANEL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 3.50, lab_test_code = '9179';

-- CPL 4267: CORTISOL, A.M. SPECIMEN @ $10.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4267', 10.00,
  GREATEST(
    10.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 10.00 * 3),
    10.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Cortisol')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CORTISOL, A.M. SPECIMEN')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 10.00, lab_test_code = '4267';

-- CPL 4269: CORTISOL, P.M. SPECIMEN @ $11.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4269', 11.00,
  GREATEST(
    11.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 11.00 * 3),
    11.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Cortisol')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CORTISOL, P.M. SPECIMEN')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 11.00, lab_test_code = '4269';

-- CPL 2655: CORTISOL, RANDOM @ $11.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2655', 11.00,
  GREATEST(
    11.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 11.00 * 3),
    11.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Cortisol')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CORTISOL, RANDOM')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 11.00, lab_test_code = '2655';

-- CPL 3571: COVID19/FLU A/B, NAAT @ $143.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '3571', 143.00,
  GREATEST(
    143.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 143.00 * 3),
    143.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('COVID19/FLU A/B, NAAT')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 143.00, lab_test_code = '3571';

-- CPL 5083: CRP,HIGH SENSITIVITY @ $8.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5083', 8.50,
  GREATEST(
    8.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 8.50 * 3),
    8.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('CRP, HS')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CRP,HIGH SENSITIVITY')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 8.50, lab_test_code = '5083';

-- CPL 1215: CRYSTALS, BODY FLUID @ $40.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '1215', 40.00,
  GREATEST(
    40.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 40.00 * 3),
    40.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('CRYSTALS, BODY FLUID')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 40.00, lab_test_code = '1215';

-- CPL 4335: CT/NG,NAAT,URINE @ $26.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4335', 26.50,
  GREATEST(
    26.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 26.50 * 3),
    26.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Chlamydia/Gonorrhea, Urine')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CT/NG,NAAT,URINE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 26.50, lab_test_code = '4335';

-- CPL 5249: CT/NG,TMA,SIMPLESWAB @ $30.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5249', 30.00,
  GREATEST(
    30.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 30.00 * 3),
    30.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Chlamydia/Gonorrhea, Urine')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CT/NG,TMA,SIMPLESWAB')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 30.00, lab_test_code = '5249';

-- CPL 6047: CULTURE, GROUP A STREP, THROAT @ $8.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '6047', 8.00,
  GREATEST(
    8.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 8.00 * 3),
    8.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Culture, Gp. A Strep')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CULTURE, GROUP A STREP, THROAT')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 8.00, lab_test_code = '6047';

-- CPL 6079: CULTURE, GROUP B STREP (GBS) SCREEN @ $8.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '6079', 8.00,
  GREATEST(
    8.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 8.00 * 3),
    8.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Culture, Gp. B Strep')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CULTURE, GROUP B STREP (GBS) SCREEN')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 8.00, lab_test_code = '6079';

-- CPL 6040: CULTURE, RESPIRATORY, LOWER @ $8.75
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '6040', 8.75,
  GREATEST(
    8.75 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 8.75 * 3),
    8.75 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Culture, Sputum/Lower Respiratory')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CULTURE, RESPIRATORY, LOWER')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 8.75, lab_test_code = '6040';

-- CPL 6107: CULTURE,BODY FLUID @ $28.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '6107', 28.00,
  GREATEST(
    28.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 28.00 * 3),
    28.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Culture, General')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CULTURE,BODY FLUID')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 28.00, lab_test_code = '6107';

-- CPL 6007: CULTURE,ROUTINE @ $9.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '6007', 9.00,
  GREATEST(
    9.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 9.00 * 3),
    9.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Culture, General')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CULTURE,ROUTINE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 9.00, lab_test_code = '6007';

-- CPL 6234: CULTURE,SUSCEPTIBILITY @ $4.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '6234', 4.00,
  GREATEST(
    4.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 4.00 * 3),
    4.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Culture, General')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CULTURE,SUSCEPTIBILITY')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 4.00, lab_test_code = '6234';

-- CPL 6049: CULTURE,URINE @ $9.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '6049', 9.00,
  GREATEST(
    9.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 9.00 * 3),
    9.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Culture, Urine, Catheterized')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('CULTURE,URINE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 9.00, lab_test_code = '6049';

-- CPL 4225: DHEA SULFATE @ $12.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4225', 12.00,
  GREATEST(
    12.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 12.00 * 3),
    12.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('DHEA-Sulfate')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('DHEA SULFATE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 12.00, lab_test_code = '4225';

-- CPL 4506: DNA DS AB RFLX CRITHIDIA @ $23.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4506', 23.00,
  GREATEST(
    23.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 23.00 * 3),
    23.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('DNA Ab., d-s')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('DNA DS AB RFLX CRITHIDIA')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 23.00, lab_test_code = '4506';

-- CPL 4504: DNASE-B ANTIBODY @ $19.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4504', 19.00,
  GREATEST(
    19.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 19.00 * 3),
    19.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('DNASE-B ANTIBODY')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 19.00, lab_test_code = '4504';

-- CPL 5488: ENVIRONMENTAL IgE PANEL @ $47.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5488', 47.00,
  GREATEST(
    47.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 47.00 * 3),
    47.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('ENVIRONMENTAL IgE PANEL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 47.00, lab_test_code = '5488';

-- CPL 4552: EPSTEIN BARR VCA IgG @ $12.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4552', 12.00,
  GREATEST(
    12.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 12.00 * 3),
    12.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('EPSTEIN BARR VCA IgG')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 12.00, lab_test_code = '4552';

-- CPL 2646: ES CORTISOL,BASELINE @ $11.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2646', 11.00,
  GREATEST(
    11.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 11.00 * 3),
    11.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Cortisol')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('ES CORTISOL,BASELINE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 11.00, lab_test_code = '2646';

-- CPL 2675: ESTRADIOL @ $10.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2675', 10.00,
  GREATEST(
    10.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 10.00 * 3),
    10.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Estradiol (E2)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('ESTRADIOL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 10.00, lab_test_code = '2675';

-- CPL 5678: ESTRADIOL ULTRASENSITIVE @ $30.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5678', 30.00,
  GREATEST(
    30.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 30.00 * 3),
    30.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Estradiol (E2)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('ESTRADIOL ULTRASENSITIVE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 30.00, lab_test_code = '5678';

-- CPL 4840: ESTRIOL, UNCONJUGATED @ $18.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4840', 18.00,
  GREATEST(
    18.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 18.00 * 3),
    18.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Estriol (E3) LC/MS/MS')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('ESTRIOL, UNCONJUGATED')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 18.00, lab_test_code = '4840';

-- CPL 4229: ESTROGEN, FRACTIONATED @ $26.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4229', 26.00,
  GREATEST(
    26.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 26.00 * 3),
    26.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Estrogens, Total LC/MS/MS')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('ESTROGEN, FRACTIONATED')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 26.00, lab_test_code = '4229';

-- CPL 4982: ESTRONE (E1) @ $20.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4982', 20.00,
  GREATEST(
    20.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 20.00 * 3),
    20.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Estrone (E1) LC/MS/MS')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('ESTRONE (E1)')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 20.00, lab_test_code = '4982';

-- CPL 4845: FACTOR V LEIDEN @ $60.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4845', 60.00,
  GREATEST(
    60.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 60.00 * 3),
    60.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('FACTOR V LEIDEN')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 60.00, lab_test_code = '4845';

-- CPL 4848: FECAL FAT, QUANTITATIVE @ $42.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4848', 42.00,
  GREATEST(
    42.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 42.00 * 3),
    42.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('FECAL FAT, QUANTITATIVE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 42.00, lab_test_code = '4848';

-- CPL 7020: FECAL LEUKOCYTES @ $8.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '7020', 8.00,
  GREATEST(
    8.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 8.00 * 3),
    8.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('FECAL LEUKOCYTES')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 8.00, lab_test_code = '7020';

-- CPL 2090: FERRITIN @ $6.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2090', 6.00,
  GREATEST(
    6.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 6.00 * 3),
    6.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Ferritin')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('FERRITIN')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 6.00, lab_test_code = '2090';

-- CPL 2695: FOLIC ACID @ $11.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2695', 11.00,
  GREATEST(
    11.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 11.00 * 3),
    11.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Folate')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('FOLIC ACID')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 11.00, lab_test_code = '2695';

-- CPL 2700: FOLLICLE STIM HORMONE @ $12.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2700', 12.00,
  GREATEST(
    12.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 12.00 * 3),
    12.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('FSH')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('FOLLICLE STIM HORMONE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 12.00, lab_test_code = '2700';

-- CPL 5548: FOOD ALLERGY IgE PANEL @ $85.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5548', 85.00,
  GREATEST(
    85.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 85.00 * 3),
    85.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('FOOD ALLERGY IgE PANEL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 85.00, lab_test_code = '5548';

-- CPL 4273: FREE T3 @ $10.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4273', 10.00,
  GREATEST(
    10.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 10.00 * 3),
    10.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('T3, Free')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('FREE T3')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 10.00, lab_test_code = '4273';

-- CPL 2823: FREE T4 (THYROXINE) @ $7.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2823', 7.00,
  GREATEST(
    7.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 7.00 * 3),
    7.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('T4, Free')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('FREE T4 (THYROXINE)')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 7.00, lab_test_code = '2823';

-- CPL 438: FSH + LH PROFILE @ $14.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '438', 14.00,
  GREATEST(
    14.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 14.00 * 3),
    14.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('FSH & LH')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('FSH + LH PROFILE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 14.00, lab_test_code = '438';

-- CPL 2217: GLUCOSE @ $3.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2217', 3.50,
  GREATEST(
    3.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 3.50 * 3),
    3.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Glucose')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('GLUCOSE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 3.50, lab_test_code = '2217';

-- CPL 5397: GONORRHEA,NAAT,URINE @ $15.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5397', 15.00,
  GREATEST(
    15.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 15.00 * 3),
    15.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Neisseria gonorrhea, Urine')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('GONORRHEA,NAAT,URINE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 15.00, lab_test_code = '5397';

-- CPL 5396: GONORRHEA,TMA,SIMPLESWAB @ $15.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5396', 15.00,
  GREATEST(
    15.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 15.00 * 3),
    15.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Neisseria gonorrhea, Urine')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('GONORRHEA,TMA,SIMPLESWAB')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 15.00, lab_test_code = '5396';

-- CPL 4499: H PYLORI AG, STOOL @ $57.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4499', 57.00,
  GREATEST(
    57.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 57.00 * 3),
    57.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('H PYLORI AG, STOOL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 57.00, lab_test_code = '4499';

-- CPL 5591: H PYLORI BREATH TEST @ $60.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5591', 60.00,
  GREATEST(
    60.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 60.00 * 3),
    60.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('H PYLORI BREATH TEST')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 60.00, lab_test_code = '5591';

-- CPL 2713: HCG QUANTITATIVE @ $9.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2713', 9.50,
  GREATEST(
    9.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 9.50 * 3),
    9.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Pregnancy Test, Serum (Quantitative)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HCG QUANTITATIVE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 9.50, lab_test_code = '2713';

-- CPL 2714: HCG,QUALITATIVE,SERUM @ $6.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2714', 6.50,
  GREATEST(
    6.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 6.50 * 3),
    6.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Pregnancy Test, Serum (Positive or Negative)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HCG,QUALITATIVE,SERUM')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 6.50, lab_test_code = '2714';

-- CPL 2708: HEMOGLOBIN A1C @ $6.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2708', 6.00,
  GREATEST(
    6.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 6.00 * 3),
    6.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Hemoglobin A1C')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HEMOGLOBIN A1C')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 6.00, lab_test_code = '2708';

-- CPL 9175: HEPATIC FUNCTION PANEL @ $3.30
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '9175', 3.30,
  GREATEST(
    3.30 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 3.30 * 3),
    3.30 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Hepatic Function Panel')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HEPATIC FUNCTION PANEL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 3.30, lab_test_code = '9175';

-- CPL 2724: HEPATITIS A TOTAL AB @ $6.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2724', 6.50,
  GREATEST(
    6.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 6.50 * 3),
    6.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Hep A Ab Total w/Reflex to IgM')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HEPATITIS A TOTAL AB')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 6.50, lab_test_code = '2724';

-- CPL 2725: HEPATITIS A TOTAL AB,RFLX @ $10.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2725', 10.00,
  GREATEST(
    10.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 10.00 * 3),
    10.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Hep A Ab Total w/Reflex to IgM')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HEPATITIS A TOTAL AB,RFLX')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 10.00, lab_test_code = '2725';

-- CPL 4644: HEPATITIS B CORE IGM @ $6.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4644', 6.00,
  GREATEST(
    6.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 6.00 * 3),
    6.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Hep B Core Ab, IgM')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HEPATITIS B CORE IGM')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 6.00, lab_test_code = '4644';

-- CPL 2737: HEPATITIS B SURF AB @ $6.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2737', 6.00,
  GREATEST(
    6.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 6.00 * 3),
    6.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Hep B Surface Ab')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HEPATITIS B SURF AB')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 6.00, lab_test_code = '2737';

-- CPL 2739: HEPATITIS B SURF AG @ $6.75
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2739', 6.75,
  GREATEST(
    6.75 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 6.75 * 3),
    6.75 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Hep B Surface Ag  w/Con')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HEPATITIS B SURF AG')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 6.75, lab_test_code = '2739';

-- CPL 2738: HEPATITIS Bs AB QUANT @ $9.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2738', 9.00,
  GREATEST(
    9.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 9.00 * 3),
    9.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Hep B Surface AB Quantitive')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HEPATITIS Bs AB QUANT')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 9.00, lab_test_code = '2738';

-- CPL 4675: HEPATITIS C ANTIBODY @ $7.75
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4675', 7.75,
  GREATEST(
    7.75 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 7.75 * 3),
    7.75 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Hep C Ab')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HEPATITIS C ANTIBODY')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 7.75, lab_test_code = '4675';

-- CPL 4677: HEPATITIS C REFLEX QNT @ $5.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4677', 5.00,
  GREATEST(
    5.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 5.00 * 3),
    5.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Hep C Ab')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HEPATITIS C REFLEX QNT')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 5.00, lab_test_code = '4677';

-- CPL 4563: HEPATITIS C RNA PCR QUAL @ $75.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4563', 75.00,
  GREATEST(
    75.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 75.00 * 3),
    75.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('HEPATITIS C RNA PCR QUAL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 75.00, lab_test_code = '4563';

-- CPL 9325: HEPATITIS PANEL,ACUTE @ $23.75
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '9325', 23.75,
  GREATEST(
    23.75 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 23.75 * 3),
    23.75 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Hep A, B, C Ab Panel w/Reflex')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HEPATITIS PANEL,ACUTE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 23.75, lab_test_code = '9325';

-- CPL 162: HEPATITIS PROFILE(A,B,C) @ $31.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '162', 31.00,
  GREATEST(
    31.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 31.00 * 3),
    31.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Hep A, B, C Ab Panel w/Reflex')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HEPATITIS PROFILE(A,B,C)')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 31.00, lab_test_code = '162';

-- CPL 4592: HERPES SIMPLEX 1/2 AB IgG @ $14.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4592', 14.50,
  GREATEST(
    14.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 14.50 * 3),
    14.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('HERPES SIMPLEX 1/2 AB IgG')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 14.50, lab_test_code = '4592';

-- CPL 3540: HIV 1/2 4TH GEN,RFLX CONF @ $7.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '3540', 7.50,
  GREATEST(
    7.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 7.50 * 3),
    7.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('HIV 5th Generation (Ag-Ab Screen, HIV1-Ab, HIV1-Ag, HIV2-Ab)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HIV 1/2 4TH GEN,RFLX CONF')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 7.50, lab_test_code = '3540';

-- CPL 4288: HOMOCYSTEINE @ $18.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4288', 18.00,
  GREATEST(
    18.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 18.00 * 3),
    18.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Homocysteine')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('HOMOCYSTEINE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 18.00, lab_test_code = '4288';

-- CPL 4608: IGF-1 WITH Z-SCORE @ $50.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4608', 50.00,
  GREATEST(
    50.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 50.00 * 3),
    50.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('IGF-1')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('IGF-1 WITH Z-SCORE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 50.00, lab_test_code = '4608';

-- CPL 8341: IHC ADDITIONAL AB @ $100.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '8341', 100.00,
  GREATEST(
    100.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 100.00 * 3),
    100.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('IHC ADDITIONAL AB')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 100.00, lab_test_code = '8341';

-- CPL 8342: IHC FIRST AB @ $55.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '8342', 55.00,
  GREATEST(
    55.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 55.00 * 3),
    55.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('IHC FIRST AB')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 55.00, lab_test_code = '8342';

-- CPL 6084: INDICATED URINE CULTURE @ $9.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '6084', 9.00,
  GREATEST(
    9.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 9.00 * 3),
    9.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('INDICATED URINE CULTURE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 9.00, lab_test_code = '6084';

-- CPL 2760: INSULIN @ $10.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2760', 10.00,
  GREATEST(
    10.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 10.00 * 3),
    10.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Insulin, Fasting')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('INSULIN')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 10.00, lab_test_code = '2760';

-- CPL 2118: IRON+IBC+SATURATION % @ $9.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2118', 9.00,
  GREATEST(
    9.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 9.00 * 3),
    9.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Iron Total Binding Capacity, Total')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('IRON+IBC+SATURATION %')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 9.00, lab_test_code = '2118';

-- CPL 2119: LACTIC ACID,PLASMA @ $15.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2119', 15.00,
  GREATEST(
    15.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 15.00 * 3),
    15.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('LD')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('LACTIC ACID,PLASMA')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 15.00, lab_test_code = '2119';

-- CPL 5931: LAMICTAL LEVEL @ $20.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5931', 20.00,
  GREATEST(
    20.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 20.00 * 3),
    20.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('LAMICTAL LEVEL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 20.00, lab_test_code = '5931';

-- CPL 2224: LDH @ $5.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2224', 5.00,
  GREATEST(
    5.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 5.00 * 3),
    5.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('LD')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('LDH')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 5.00, lab_test_code = '2224';

-- CPL 4239: LEAD,BLOOD,VENIPUNCTURE @ $11.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4239', 11.00,
  GREATEST(
    11.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 11.00 * 3),
    11.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Heavy Metals Screening, Whole Blood (Arsenic, Lead, Mercury)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('LEAD,BLOOD,VENIPUNCTURE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 11.00, lab_test_code = '4239';

-- CPL 2124: LIPASE @ $6.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2124', 6.00,
  GREATEST(
    6.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 6.00 * 3),
    6.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Lipase')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('LIPASE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 6.00, lab_test_code = '2124';

-- CPL 173: LIPID PANEL @ $3.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '173', 3.50,
  GREATEST(
    3.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 3.50 * 3),
    3.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Lipid Panel')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('LIPID PANEL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 3.50, lab_test_code = '173';

-- CPL 2128: LITHIUM @ $9.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2128', 9.00,
  GREATEST(
    9.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 9.00 * 3),
    9.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Lithium (Eskalith)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('LITHIUM')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 9.00, lab_test_code = '2128';

-- CPL 2776: LUTEINIZING HORMONE @ $12.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2776', 12.00,
  GREATEST(
    12.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 12.00 * 3),
    12.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('LH')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('LUTEINIZING HORMONE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 12.00, lab_test_code = '2776';

-- CPL 3605: LYME ANTIBODY,IgG/IgM @ $27.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '3605', 27.00,
  GREATEST(
    27.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 27.00 * 3),
    27.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('LYME ANTIBODY,IgG/IgM')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 27.00, lab_test_code = '3605';

-- CPL 2130: MAGNESIUM @ $6.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2130', 6.00,
  GREATEST(
    6.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 6.00 * 3),
    6.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Magnesium')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('MAGNESIUM')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 6.00, lab_test_code = '2130';

-- CPL 810000: MANUAL UA W/MICRO @ $4.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '810000', 4.00,
  GREATEST(
    4.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 4.00 * 3),
    4.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Urinalysis, Microscopic')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('MANUAL UA W/MICRO')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 4.00, lab_test_code = '810000';

-- CPL 4245: MERCURY @ $16.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4245', 16.00,
  GREATEST(
    16.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 16.00 * 3),
    16.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Heavy Metals Screening, Whole Blood (Arsenic, Lead, Mercury)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('MERCURY')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 16.00, lab_test_code = '4245';

-- CPL 4369: METANEPHRINES,24HR URINE @ $42.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4369', 42.00,
  GREATEST(
    42.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 42.00 * 3),
    42.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('METANEPHRINES,24HR URINE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 42.00, lab_test_code = '4369';

-- CPL 5116: METANEPHRINES,PLASMA @ $55.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5116', 55.00,
  GREATEST(
    55.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 55.00 * 3),
    55.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('METANEPHRINES,PLASMA')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 55.00, lab_test_code = '5116';

-- CPL 8227: MISC FNA CYTO @ $80.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '8227', 80.00,
  GREATEST(
    80.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 80.00 * 3),
    80.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('MISC FNA CYTO')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 80.00, lab_test_code = '8227';

-- CPL 152: MMR PROFILE @ $40.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '152', 40.00,
  GREATEST(
    40.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 40.00 * 3),
    40.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Measles, Mumps, Rubella')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('MMR PROFILE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 40.00, lab_test_code = '152';

-- CPL 4585: MUMPS VIRUS AB, IgG @ $18.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4585', 18.00,
  GREATEST(
    18.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 18.00 * 3),
    18.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('MUMPS VIRUS AB, IgG')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 18.00, lab_test_code = '4585';

-- CPL 5526: NEVADA REGIONAL IgE PANEL @ $100.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5526', 100.00,
  GREATEST(
    100.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 100.00 * 3),
    100.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('NEVADA REGIONAL IgE PANEL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 100.00, lab_test_code = '5526';

-- CPL 5722: NT-proBNP @ $34.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '5722', 34.00,
  GREATEST(
    34.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 34.00 * 3),
    34.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('NT-proBNP')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 34.00, lab_test_code = '5722';

-- CPL 514: OBSTETRIC PANEL @ $22.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '514', 22.00,
  GREATEST(
    22.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 22.00 * 3),
    22.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Obstetric Panel')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('OBSTETRIC PANEL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 22.00, lab_test_code = '514';

-- CPL 518: OBSTETRIC PANEL + HIV @ $31.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '518', 31.00,
  GREATEST(
    31.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 31.00 * 3),
    31.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Obstetric Panel')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('OBSTETRIC PANEL + HIV')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 31.00, lab_test_code = '518';

-- CPL 7009: OCC BLD,FECAL,IMM MC SCRN @ $32.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '7009', 32.00,
  GREATEST(
    32.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 32.00 * 3),
    32.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('OCC BLD,FECAL,IMM MC SCRN')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 32.00, lab_test_code = '7009';

-- CPL 7015: OCCULT BLOOD SCREEN (1-3) @ $10.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '7015', 10.00,
  GREATEST(
    10.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 10.00 * 3),
    10.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Occult Blood, 3 Specimens')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('OCCULT BLOOD SCREEN (1-3)')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 10.00, lab_test_code = '7015';

-- CPL 7000: OVA AND PARASITES @ $36.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '7000', 36.00,
  GREATEST(
    36.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 36.00 * 3),
    36.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('OVA AND PARASITES')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 36.00, lab_test_code = '7000';

-- CPL 6242: PARASITE ANTIGEN PANEL @ $38.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '6242', 38.00,
  GREATEST(
    38.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 38.00 * 3),
    38.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('PARASITE ANTIGEN PANEL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 38.00, lab_test_code = '6242';

-- CPL 2790: PROGESTERONE @ $13.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2790', 13.00,
  GREATEST(
    13.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 13.00 * 3),
    13.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Progesterone')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('PROGESTERONE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 13.00, lab_test_code = '2790';

-- CPL 2800: PROLACTIN @ $13.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2800', 13.00,
  GREATEST(
    13.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 13.00 * 3),
    13.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Prolactin')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('PROLACTIN')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 13.00, lab_test_code = '2800';

-- CPL 1425: PROTHROMBIN TIME @ $3.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '1425', 3.00,
  GREATEST(
    3.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 3.00 * 3),
    3.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('PT with INR')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('PROTHROMBIN TIME')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 3.00, lab_test_code = '1425';

-- CPL 2608: PSA TOTAL,SCRN MEDICARE @ $9.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2608', 9.00,
  GREATEST(
    9.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 9.00 * 3),
    9.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('PSA, Total (mcr Scr)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('PSA TOTAL,SCRN MEDICARE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 9.00, lab_test_code = '2608';

-- CPL 2606: PSA, TOTAL @ $7.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2606', 7.00,
  GREATEST(
    7.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 7.00 * 3),
    7.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('PSA, Total (mcr Scr)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('PSA, TOTAL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 7.00, lab_test_code = '2606';

-- CPL 2814: PTH, INTACT @ $33.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2814', 33.00,
  GREATEST(
    33.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 33.00 * 3),
    33.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('PTH, Intact')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('PTH, INTACT')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 33.00, lab_test_code = '2814';

-- CPL 1430: PTT @ $3.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '1430', 3.50,
  GREATEST(
    3.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 3.50 * 3),
    3.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('PTT, Activated')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('PTT')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 3.50, lab_test_code = '1430';

-- CPL 7580: QUANTIFERON TB GOLD PLUS @ $50.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '7580', 50.00,
  GREATEST(
    50.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 50.00 * 3),
    50.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Quantiferon TB Gold Plus 4th Gen')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('QUANTIFERON TB GOLD PLUS')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 50.00, lab_test_code = '7580';

-- CPL 272501: REFLEX HEPATITIS A IgM @ $10.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '272501', 10.00,
  GREATEST(
    10.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 10.00 * 3),
    10.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('REFLEX HEPATITIS A IgM')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 10.00, lab_test_code = '272501';

-- CPL 9324: RENAL FUNCTION PANEL @ $3.60
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '9324', 3.60,
  GREATEST(
    3.60 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 3.60 * 3),
    3.60 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Renal Function Panel')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('RENAL FUNCTION PANEL')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 3.60, lab_test_code = '9324';

-- CPL 4255: RENIN ACTIVITY @ $36.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4255', 36.00,
  GREATEST(
    36.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 36.00 * 3),
    36.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Electrolyte Panel')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('RENIN ACTIVITY')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 36.00, lab_test_code = '4255';

-- CPL 3505: RHEUMATOID FACTOR @ $5.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '3505', 5.00,
  GREATEST(
    5.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 5.00 * 3),
    5.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Rheumatoid Factor')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('RHEUMATOID FACTOR')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 5.00, lab_test_code = '3505';

-- CPL 3500: RPR @ $4.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '3500', 4.00,
  GREATEST(
    4.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 4.00 * 3),
    4.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('RPR W/ Reflex to (1357 Syphilis & 337 RPR Titer)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('RPR')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 4.00, lab_test_code = '3500';

-- CPL 3503: RPR REFLEX TO TP-PA @ $3.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '3503', 3.50,
  GREATEST(
    3.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 3.50 * 3),
    3.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('RPR W/ Reflex to (1357 Syphilis & 337 RPR Titer)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('RPR REFLEX TO TP-PA')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 3.50, lab_test_code = '3503';

-- CPL 4600: RUBELLA AB SCREEN @ $10.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4600', 10.00,
  GREATEST(
    10.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 10.00 * 3),
    10.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Rubella Immune Status')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('RUBELLA AB SCREEN')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 10.00, lab_test_code = '4600';

-- CPL 4604: RUBEOLA AB, IgG @ $12.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4604', 12.00,
  GREATEST(
    12.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 12.00 * 3),
    12.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('RUBEOLA AB, IgG')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 12.00, lab_test_code = '4604';

-- CPL 3562: SARS-CoV-2 (COVID-19) BY @ $70.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '3562', 70.00,
  GREATEST(
    70.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 70.00 * 3),
    70.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('SARS-CoV-2 (COVID-19) BY')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 70.00, lab_test_code = '3562';

-- CPL 7305: SARS-COV-2(COVID19)RT-PCR @ $70.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '7305', 70.00,
  GREATEST(
    70.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 70.00 * 3),
    70.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('SARS-COV-2(COVID19)RT-PCR')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 70.00, lab_test_code = '7305';

-- CPL 1055: SEDIMENTATION RATE @ $4.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '1055', 4.00,
  GREATEST(
    4.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 4.00 * 3),
    4.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Sed Rate (Westergren)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('SEDIMENTATION RATE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 4.00, lab_test_code = '1055';

-- CPL 1350: SEMEN STUDY @ $27.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '1350', 27.50,
  GREATEST(
    27.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 27.50 * 3),
    27.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('STD Panel')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('SEMEN STUDY')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 27.50, lab_test_code = '1350';

-- CPL 2218: SGOT (AST) @ $4.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2218', 4.00,
  GREATEST(
    4.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 4.00 * 3),
    4.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('AST')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('SGOT (AST)')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 4.00, lab_test_code = '2218';

-- CPL 2219: SGPT (ALT) @ $4.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2219', 4.00,
  GREATEST(
    4.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 4.00 * 3),
    4.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('ALT')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('SGPT (ALT)')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 4.00, lab_test_code = '2219';

-- CPL 8562: SKIN OR NAIL X1 @ $53.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '8562', 53.50,
  GREATEST(
    53.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 53.50 * 3),
    53.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('SKIN OR NAIL X1')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 53.50, lab_test_code = '8562';

-- CPL 8563: SKIN X 2 @ $107.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '8563', 107.00,
  GREATEST(
    107.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 107.00 * 3),
    107.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('SKIN X 2')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 107.00, lab_test_code = '8563';

-- CPL 8699: SKIN-CYST/TAG/DEBRIDE X1 @ $55.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '8699', 55.00,
  GREATEST(
    55.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 55.00 * 3),
    55.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('SKIN-CYST/TAG/DEBRIDE X1')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 55.00, lab_test_code = '8699';

-- CPL 4285: SMITH & RNP ANTIBODIES @ $28.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4285', 28.00,
  GREATEST(
    28.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 28.00 * 3),
    28.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Sm/RNP Abs')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('SMITH & RNP ANTIBODIES')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 28.00, lab_test_code = '4285';

-- CPL 2817: T-UPTAKE @ $4.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2817', 4.00,
  GREATEST(
    4.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 4.00 * 3),
    4.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('T-Uptake')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('T-UPTAKE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 4.00, lab_test_code = '2817';

-- CPL 2819: T4 @ $4.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2819', 4.00,
  GREATEST(
    4.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 4.00 * 3),
    4.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('T4, Total')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('T4')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 4.00, lab_test_code = '2819';

-- CPL 2830: TESTOSTERONE @ $15.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2830', 15.00,
  GREATEST(
    15.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 15.00 * 3),
    15.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Testosterone, Total')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('TESTOSTERONE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 15.00, lab_test_code = '2830';

-- CPL 4937: TESTOSTERONE,FR/TOT W/SBG @ $24.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4937', 24.00,
  GREATEST(
    24.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 24.00 * 3),
    24.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Testosterone, Free & Total w/SHBG')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('TESTOSTERONE,FR/TOT W/SBG')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 24.00, lab_test_code = '4937';

-- CPL 4927: THYROGLOBULIN QNT & AB @ $18.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4927', 18.00,
  GREATEST(
    18.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 18.00 * 3),
    18.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Thyroglobulin Abs')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('THYROGLOBULIN QNT & AB')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 18.00, lab_test_code = '4927';

-- CPL 4513: THYROID PEROXIDASE AB @ $9.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4513', 9.00,
  GREATEST(
    9.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 9.00 * 3),
    9.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Thyroid Peroxidase Abs')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('THYROID PEROXIDASE AB')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 9.00, lab_test_code = '4513';

-- CPL 4657: TOXOPLASMA AB IgG/IgM @ $44.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4657', 44.00,
  GREATEST(
    44.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 44.00 * 3),
    44.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('TOXOPLASMA AB IgG/IgM')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 44.00, lab_test_code = '4657';

-- CPL 4658: TOXOPLASMA AB, IgM @ $20.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4658', 20.00,
  GREATEST(
    20.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 20.00 * 3),
    20.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('TOXOPLASMA AB, IgM')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 20.00, lab_test_code = '4658';

-- CPL 4936: TRANSFERRIN @ $18.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4936', 18.00,
  GREATEST(
    18.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 18.00 * 3),
    18.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Transferrin')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('TRANSFERRIN')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 18.00, lab_test_code = '4936';

-- CPL 3913: TRICHOMONAS,NAAT,URINE @ $26.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '3913', 26.50,
  GREATEST(
    26.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 26.50 * 3),
    26.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('STD Panel')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('TRICHOMONAS,NAAT,URINE')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 26.50, lab_test_code = '3913';

-- CPL 4017: TROPONIN T @ $24.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4017', 24.00,
  GREATEST(
    24.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 24.00 * 3),
    24.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('BNP')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('TROPONIN T')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 24.00, lab_test_code = '4017';

-- CPL 2835: TSH @ $4.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2835', 4.50,
  GREATEST(
    4.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 4.50 * 3),
    4.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('TSH')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('TSH')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 4.50, lab_test_code = '2835';

-- CPL 2834: TSH REFLEX TO FREE T4 @ $4.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2834', 4.50,
  GREATEST(
    4.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 4.50 * 3),
    4.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('TSH W/ Reflex to T4 Free (additional cost for reflex)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('TSH REFLEX TO FREE T4')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 4.50, lab_test_code = '2834';

-- CPL 2836: TSH+FREE T4 @ $11.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2836', 11.50,
  GREATEST(
    11.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 11.50 * 3),
    11.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('TSH W/ Reflex to T4 Free (additional cost for reflex)')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('TSH+FREE T4')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 11.50, lab_test_code = '2836';

-- CPL 2233: URIC ACID @ $3.50
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2233', 3.50,
  GREATEST(
    3.50 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 3.50 * 3),
    3.50 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Uric Acid, Serum')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('URIC ACID')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 3.50, lab_test_code = '2233';

-- CPL 1501: URINALYSIS W/REFLEX MICROSCOPIC @ $4.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '1501', 4.00,
  GREATEST(
    4.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 4.00 * 3),
    4.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Urinalysis w/Reflex to Culture')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('URINALYSIS W/REFLEX MICROSCOPIC')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 4.00, lab_test_code = '1501';

-- CPL 2840: VITAMIN B-12 @ $8.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '2840', 8.00,
  GREATEST(
    8.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 8.00 * 3),
    8.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Vitamin B12')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('VITAMIN B-12')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 8.00, lab_test_code = '2840';

-- CPL 4956: VITAMIN B-6 @ $30.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4956', 30.00,
  GREATEST(
    30.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 30.00 * 3),
    30.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Vitamin B12')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('VITAMIN B-6')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 30.00, lab_test_code = '4956';

-- CPL 4958: VITAMIN D, 25-HYDROXY @ $22.00
INSERT INTO lab_tests (test_id, laboratory_id, lab_test_code, lab_cost, retail_price, is_available)
SELECT t.id, 4, '4958', 22.00,
  GREATEST(
    22.00 * 2.5,
    COALESCE((SELECT lt2.retail_price FROM lab_tests lt2 WHERE lt2.test_id = t.id AND lt2.laboratory_id = 1 LIMIT 1), 22.00 * 3),
    22.00 * 3
  ), 1
FROM tests t
WHERE (LOWER(TRIM(t.name)) = LOWER(TRIM('Vitamin D, 25-OH, Total')) OR LOWER(TRIM(t.name)) = LOWER(TRIM('VITAMIN D, 25-HYDROXY')))
  AND t.is_active = 1
LIMIT 1
ON DUPLICATE KEY UPDATE lab_cost = 22.00, lab_test_code = '4958';


-- ============================================================
-- SECTION 3: Access Medical Labs — Updated Lab Costs
-- 228 tests with refined lab_cost values from the 2026 Access
-- sliding scale pricing menu (L501 Client Prices).
-- These are the actual costs Access charges us — run this AFTER
-- Section 1 to override the initial estimates with real numbers.
-- ============================================================

-- Update Access Medical Labs lab_cost with L501 Client Prices (your actual cost)
-- Source: 2026 Access Sliding Test Menu
-- Run in phpMyAdmin or cPanel terminal

SET @access_id = (SELECT id FROM laboratories WHERE code = 'ACCESS');

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 30.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('ABO Group & RH Type'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 13.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('AFP (Tumor Marker)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Albumin'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Alkaline Phosphatase'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('ALT'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 114.73
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Amenorrhea Panel'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 5.67
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Amylase'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 11.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('ANA Screen'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 42.69
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Androstenedione'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 49.36
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Anemia Panel'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 15.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Antibody Screen'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 11.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Apolipoprotein A-1 (Apo-A)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 11.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Apolipoprotein B (Apo-B)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 43.36
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Apolipoprotein Evaluation (Apo-A-1, Apo-B, Lpa)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 325.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Apo E Genotype'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 147.27
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Arsenic, Lead, Mercury, Random Urine'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 36.35
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Arthritis Panel'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('AST'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 5.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Basic Metabolic Panel'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Bilirubin, Direct'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Bilirubin, Total'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 60.03
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('BNP'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('BUN'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 19.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('C-Peptide'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 46.69
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('C.Difficile Toxin A&B'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 22.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('CA 125'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 19.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('CA 15-3'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 24.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('CA 19-9'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 29.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('CA 27-29'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Calcium, Serum'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 106.06
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Cancer Panel, Female Extended (AFP, B-HCG Qual., CEA, CA 15-3, CA 19-9, CA 125)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 45.35
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Cancer Panel, Male (PSA Free & Total, CA 19-9)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 133.40
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Candida Albicans Evaluation'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Carbon Dioxide (CO2)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 75.50
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Catecholamines, Fractionated'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.80
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('CBC'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 5.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('CBC w/Diff'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 16.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('CEA'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 125.39
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Celiac Disease Evaluation (TTG-A, DGP-A, TTG-G, DGP-G)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 28.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Chlamydia, Swab'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 28.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Chlamydia, Urine'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 102.72
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Chlamydia/Gonnorrhea, Swab'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 56.03
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Chlamydia/Gonorrhea, Urine'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Chloride'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Cholesterol, Total'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 100.05
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Chromatin'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('CK, Total'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 26.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Cytomegalovirus Ab., IgG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 14.67
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Complement C3'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 10.14
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Complement C4'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 6.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Comprehensive Metabolic Panel'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 12.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Cortisol'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 31.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Copper'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 61.76
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('CoQ10'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Creatinine'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 8.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('CRP'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 16.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('CRP, HS'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 61.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Cryptosporidium, Stool'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 48.02
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Culture, Fungus'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 10.67
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Culture, Urine, Catheterized'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 10.67
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Culture, Urine, Void'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 44.69
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Culture, Camp./Salm./Shig'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 10.67
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Culture, Campylobacter'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 26.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Cyclic Citrullinated Peptide IgG Ab.'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 26.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Cytomegalovirus, IgM'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 26.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Cytomegalovirus Ab., IgG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 21.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Deamidated Gliadin Peptide IgA'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 21.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Deamidated Gliadin Peptide IgG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 21.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('DHEA-Sulfate'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 120.06
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('DHT (Dihydrotestosterone)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 16.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('DNA Ab., d-s'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 5.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Electrolyte Panel'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 20.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Epstein Barr Early Ag, IgG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 81.37
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Epstein Barr Evaluation (EBVCG, EBNAG, EDEAG, EBVCM)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 17.50
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Epstein Barr Heterophile Ag ,IgM'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 21.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Epstein Barr Nuclear Ag ,IgG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 20.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Epstein Barr Viral Capsid Ag ,IgG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 20.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Epstein Barr Viral Capsid Ag ,IgM'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 28.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Estradiol (E2)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 53.36
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Estradiol (E2) LC/MS/MS'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 23.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Estriol (E3)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 26.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Estrogens, Total'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 26.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Estrone (E1)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 9.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Ferritin'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 25.43
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Fibrinogen'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 10.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Folate'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 14.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Fructosamine'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 15.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('FSH'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 30.02
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('FSH & LH'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('GGT'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Glucose'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 22.50
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Glucose-6-Phosphate Dehydrogenase (G6PD), Quant.'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Glucose, Fasting, Plasma'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Glucose, Gestational, 1Hr'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 109.50
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Glutathione'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 21.90
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Growth Hormone'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 91.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('H. Pylori Antigen, Stool'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 50.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Haptoglobin'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 26.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('HCG, Total'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 9.07
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('HDL Cholesterol'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 147.27
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Heavy Metals Screening, Urine (Arsenic, Lead, Mercury)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 109.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Heavy Metals Screening, Whole Blood (Arsenic, Lead, Mercury)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 5.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Hemoglobin A1C'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 21.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Hep A Ab, IgM'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 21.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Hep A Ab Total w/Reflex to IgM'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 51.28
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Hep A, B, C Ab Panel w/Reflex'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 12.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Hep B Core Ab, IgM'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 9.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Hep B Core Ab, Total w /Reflex to IgM'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 10.67
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Hep B Surface Ab'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 12.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Hep B Surface Ag  w/Con'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 14.59
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Hep C Ab'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 5.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Hepatic Function Panel'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 49.02
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Herpes I & II IgG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 19.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Herpes I, IgG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 29.35
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Herpes II, IgG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 26.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('HIV 5th Generation (Ag-Ab Screen, HIV1-Ab, HIV1-Ag, HIV2-Ab)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 46.69
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Homocysteine'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 31.35
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('IGF-1'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 38.35
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('IGF-BP3'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 9.07
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Immunoglobulin A (IgA Total)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 13.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Immunoglobulin E (IgE Total)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 9.07
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Immunoglobulin G (IgG Total)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 9.07
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Immunoglobulin M (IgM Total)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 23.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Immunoglobulins G, A, M'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 8.67
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Insulin, Fasting'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 80.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Iodine, Serum/Plasma Trace Metal'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 10.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Iron Total Binding Capacity, Total'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Iron, Total'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('LD'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 10.67
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('LDL Cholesterol, measured'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 87.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Leptin'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 15.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('LH'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 5.67
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Lipase'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 6.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Lipid Panel'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 21.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Lipoprotein(a)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 22.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Lithium (Eskalith)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 46.69
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Lyme Disease Ab w/Reflex to Blot'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 67.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Lyme Disease Ab Immunotblot (IgG, IgM)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 267.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Lymphocyte Subset Panel 1'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 6.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Magnesium'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 16.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Magnesium, Packed RBC'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 14.67
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Measles (Rubeola) IgG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 13.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Microalbumin/Cre Ratio'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 38.02
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Measles, Mumps, Rubella'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 17.50
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Mono Test (Epstein Barr Heterophile Ag IgM)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 199.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('MTHFR'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 13.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Mumps Abs, IgG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 29.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Myoglobin'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 91.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Myeloperoxidase'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 28.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Neisseria gonorrhea, Urine'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 28.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Neisseria gonorrhea, Swab'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 95.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('NMR LipoProfile'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 24.80
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('O&P w/Permanent Stain'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 33.35
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Occult Blood, 3 Specimens'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Phosphorus, Serum'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 36.02
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('PLAC TEST (Lp-PLA2)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 8.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Platelet Count'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Potassium, Serum'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Potassium, Plasma'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 13.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Pre-Albumin'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 12.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Pregnancy Test, Serum (Positive or Negative)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 26.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Pregnancy Test, Serum (Quantitative)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 44.02
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Pregnenolone'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 16.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Progesterone'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 46.69
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Progesterone  LC/MS/MS'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 17.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Prolactin'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Protein, Total'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 20.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Prostatic Acid Phosphate'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 21.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('PSA Free and Total'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 10.67
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('PSA, Total (mcr Scr)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('PT with INR'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 40.02
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('PTH, Intact'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('PTT, Activated'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 66.70
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Quantiferon TB Gold Plus 4th Gen'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 5.67
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Renal Function Panel'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 8.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Reticulocyte Count'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 46.69
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Reverse T3'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 6.67
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Rheumatoid Factor'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 15.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('RNP Abs'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 13.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('RPR W/ Reflex to (1357 Syphilis & 337 RPR Titer)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 10.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Rubella Immune Status'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 61.95
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('S1-RBD Antibodies COV-2 Neutralizing'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 26.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Scl-70 Abs'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 6.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Sed Rate (Westergren)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 100.50
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Serotonin, Serum'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 26.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('SHBG (Sex Hormone Binding Globulin)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 92.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Sickle Cell Screen (Hemoglobin Solubility)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 15.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Sm (Smith) Abs'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Sodium'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 15.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('SS-A (RO) Abs'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 15.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('SS-B (La) Abs'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 89.04
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('STD Panel'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 117.05
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('STD Panel, Comprehensive'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 27.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('T3, Free'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 16.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('T3, Total'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 9.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('T4, Free'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 5.67
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('T4, Total'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 85.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Thyroid Binding Globulin'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 18.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Testosterone, Total'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 88.38
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Testosterone, Bioavailable (Total, Free, Bio-Available, SHBG)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 49.02
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Testosterone, Free & Total w/SHBG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 61.36
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Testosterone LC/MS/MS, Free & Total w/SHBG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 30.35
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Testosterone, Total LC/MS/MS'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 12.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Thyroglobulin Abs'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 45.02
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Thyroid Panel (Free T3, Free T4, TSH)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 114.06
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Thyroid Panel Comprehensive (FT3, FT4, TSH, TGA Abs, TPO Abs, RT3)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 10.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Thyroid Peroxidase Abs'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 42.69
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Tissue Transglutaminase IgA'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 40.02
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Tissue Transglutaminase IgG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 94.50
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('TMAO (Trimethylamine N-oxide)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 33.35
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Toxoplasma Gondi, Quant. IgG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 33.35
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Transferrin'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Triglycerides'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 8.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('TSH'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 5.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('T-Uptake'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.34
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Uric Acid, Serum'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 5.95
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Urinalysis, Microscopic'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 4.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Urinalysis, No Reflex'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 5.95
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Urinalysis w/Reflex to Culture'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 10.67
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Urine Culture (Void)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 16.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Varicella Zoster Virus Ab., IgG'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 12.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Vitamin B12'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 22.01
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Vitamin B12 & Folate'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 50.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Vitamin C LC/MS/MS'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 125.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Vitamin D, 25-OH, LC/MS/MS (D2, D3, Total)'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 30.68
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Vitamin D, 25-OH, Total'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 13.50
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Zinc'));

UPDATE lab_tests lt
JOIN tests t ON t.id = lt.test_id
SET lt.lab_cost = 35.00
WHERE lt.laboratory_id = @access_id AND LOWER(TRIM(t.name)) = LOWER(TRIM('Zinc RBC'));
