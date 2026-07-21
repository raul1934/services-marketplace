# Tasks — a way back into your own account

## 0. Prerequisite
- [ ] 0.1 Confirm transactional e-mail actually delivers in dev, staging and production. Stop here if it does not.

## 1. Identity model (AUTH-16)
- [ ] 1.1 Decide: phone mandatory at register, or OTP by e-mail supported.
- [ ] 1.2 Record the decision in the proposal.
- [ ] 1.3 Make the login screen offer only paths the account can complete.

## 2. Password recovery (AUTH-02) — backend
- [ ] 2.1 Request-reset endpoint: rate-limited, identical response for known and unknown addresses.
- [ ] 2.2 Tokenised reset mailable; token single-use with an expiry.
- [ ] 2.3 Reset endpoint honouring the password policy from `harden-auth-forms`.
- [ ] 2.4 Tests: expiry, reuse, wrong token, rate limit.

## 3. Password recovery — app
- [ ] 3.1 "Esqueci a senha" link on login.
- [ ] 3.2 Request screen (enter e-mail) with a neutral confirmation.
- [ ] 3.3 Reset screen reached by deep link from the e-mail.
- [ ] 3.4 Success feedback, then straight to login (or signed in).

## 4. E-mail verification (AUTH-18)
- [ ] 4.1 Send verification on register; resend with a cooldown.
- [ ] 4.2 Decide what an unverified account may do; enforce it server-side.
- [ ] 4.3 Non-blocking in-app banner while unverified.

## 5. Verify
- [ ] 5.1 Full loop on device: register → verify → forget → reset → log in.
- [ ] 5.2 Confirm an expired and a reused token both fail cleanly.

## 6. Close out
- [ ] 6.1 Update `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit together.
