Migration is **needed** for this new analytics feature.

Please run the following in your SQL Editor after pulling the changes from this branch 

```
 CREATE INDEX IF NOT EXISTS idx_email_logs_analytics
  ON email_logs(domain_id, created_at, status);
```