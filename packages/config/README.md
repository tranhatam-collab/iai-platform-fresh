# @iai/config

Shared configuration loaders and env parsing helpers for the mail platform.

Current scope:
- parse typed env values without leaking provider secrets into app code
- expose `loadMailSmtpConfig()` for the SMTP submission runtime
- keep the source of truth for env names close to the repo skeleton
