---
name: Authentication Method
description: Username + password (no OTP). Auto-signup on first login. Auto-confirm email enabled.
type: preference
---
- User auth: simple username + password form on /login
- Username is mapped deterministically to email: `${username}@fsa.user`
- First login auto-creates the account (signUp then signInWithPassword)
- Auto-confirm email is ENABLED in Supabase auth config (no email verification step)
- NO OTP / magic link / SMS anywhere — explicitly removed per user request
- Admin login still uses fsa@321 / fsa@321 at /admin-login
- After login, users land on /enroll (the redesigned aquatic enrollment home)
