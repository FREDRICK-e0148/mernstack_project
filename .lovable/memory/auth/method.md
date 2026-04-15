---
name: Authentication Method
description: Email OTP (6-digit code) via Supabase, no SMS OTP due to costs
type: preference
---
- Auth uses Supabase `signInWithOtp({ email })` + `verifyOtp({ email, token, type: 'email' })`
- User enters 6-digit code from email to verify
- NEVER use SMS/mobile OTP (costs money)
- After verification, user is redirected to /enroll
