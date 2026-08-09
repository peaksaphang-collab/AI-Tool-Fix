-- Legacy system has a third closed state: "ไม่สามารถดำเนินการได้".
-- Kept as its own migration — ALTER TYPE ... ADD VALUE must not share a
-- transaction with statements that use the new value.

alter type report_status add value if not exists 'cannot_proceed';
