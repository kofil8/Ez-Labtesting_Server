-- Seed: Laboratories
-- Generated from Access Tests - Cleaned.xlsx
-- Safe to re-run (INSERT IGNORE)
--
-- NOTE: CPL (Clinical Pathology Labs) should be set to is_active=0 initially.
-- CPL is a regional lab partner — their draw centers are only in certain states.
-- Until you build proximity-based lab selection (showing CPL only when the patient
-- is near a CPL draw center), keep CPL hidden from customers.
-- Access Medical Laboratories is the primary nationwide lab partner.
-- LabCorp and Quest are placeholders for future expansion.

INSERT IGNORE INTO laboratories (id, name, code, api_endpoint, api_key_encrypted, is_active) VALUES
(1, 'Access Medical Laboratories', 'ACCESS', 'https://access.labsvc.net/', NULL, 1),
(2, 'LabCorp', 'LABCORP', NULL, NULL, 0),
(3, 'Quest Diagnostics', 'QUEST', NULL, NULL, 0),
(4, 'Clinical Pathology Labs', 'CPL', NULL, NULL, 0);
