# bug-fixer memory

Fragile areas and how to reproduce things here. One line per fact.

- Emails leave after commit (`SmtpMailer` registers an afterCommit hook): a test without a transaction sees the send immediately, a real request only after commit
- `LastSeenFilter` runs inside the security chain (it implements `shared/security/AuthenticatedRequestFilter`) and is kept out of the plain servlet chain by a disabled `FilterRegistrationBean`
- Account deletion cascades in the database; the modules correct their counters on `AccountDeleting`, published just before the delete
- Account rename publishes `AccountRenamed`; the newsletter updates the subscriber name in the same transaction
- Cookie writes are protected by SameSite=Lax plus the CORS filter (403 on a foreign Origin); `SecurityConfigTest` proves it
