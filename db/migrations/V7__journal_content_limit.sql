ALTER TABLE journals ADD CONSTRAINT journal_content_max_length
  CHECK (char_length(content) <= 5000);
