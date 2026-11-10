# RKP Associates — Backup, Security and Disaster Recovery

Status: **Runbook/proposal, not deployed.** Adding this file does not activate backups, alter IAM, change Firestore data, or rotate credentials. Confirm and execute cloud changes with an authorized project owner.

## 1. What must be protected

| Asset | Primary source | Recovery layer |
| --- | --- | --- |
| Client records, engagements, checklists and notes | Firestore | Daily/weekly backup, PITR, offsite export |
| Employee work time, session locks, activity events, invoices | Firestore | Same, plus immutable audit trail and billing reconciliation |
| Employee login identities | Firebase Authentication | Restricted Auth export and documented account recovery |
| Uploaded supporting documents, if any | Firebase Storage / object storage | Separate storage protection and recovery |
| Application source / security rules | GitHub | Protected main branch and independent repository copy |
| Server secrets | Netlify and Google Cloud IAM | Secure inventory, service account rotation/re-creation |

Source-code backups do NOT recover Firestore client or time records.

Suggested recovery objectives, to be verified with real restore testing:
- RPO: less than one hour with PITR available; up to a day if only daily backups work.
- RTO: target four to eight hours. This is a goal, NOT a verified service-level guarantee.

## 2. IMMEDIATE: Isolate Netlify Firebase administrator credentials

Current configuration was inspected on November 10, 2026:
- FIREBASE_SERVICE_ACCOUNT_JSON is marked as a Netlify secret.
- It is currently available to **builds, functions and runtime** and across production, deploy-preview, branch-deploy and development contexts.

This is broader than necessary. A privileged server key used by untrusted preview builds may provide access to the production Firebase project. That does NOT demonstrate key theft, but it warrants urgent containment.

Before changing the existing variable, prepare an authorized, tested replacement:
1. Use a **separate staging Firebase project** for previews, with synthetic data and a staging-only service-account key.
2. In Netlify, scope the **production** key to production functions/runtime; remove access from build/preview/branch/development contexts. Keep distinct staging variables for staging.
3. Existing Netlify variable edits may not modify scope/secret metadata. Replace carefully in the UI if needed, with a rollback and redeploy plan; do not delete the only working production value without a replacement.
4. Once the scoped replacement runs successfully, revoke/rotate the previous service-account key and check Google Cloud audit logs for unexpected use. Avoid copying secrets into logs, tickets, PRs or chat.
5. Limit Google IAM for the server credential to only operations required. Server/Admin API calls bypass Firestore Security Rules.

## 3. Enable native Firestore backups

Prerequisite: Firebase Blaze billing. Budget/alerts must be configured; managed backups and restores incur charges.

Recommended schedules for the (default) Firestore database:

| Protection | Suggested frequency | Retention | Purpose |
| --- | --- | --- | --- |
| Native managed backup | Daily | 30 days | Restore after accidental deletion or corruption |
| Native managed backup | Weekly (Sunday) | 12 weeks | Recover older known-good snapshots |
| Firestore PITR | Continuously after enabling | Up to 7 days | Recover recent mistaken changes |
| Independent managed export | Monthly | 12 months, subject to records policy | Separate failure domain and longer archive |

There can be at most one daily and one weekly native Firestore backup schedule per database. Native backups are not scheduled for a fixed hour. Backup schedules and PITR must be ENABLED IN GOOGLE CLOUD; the repository alone does not turn them on.

Cloud console:
1. Open https://console.cloud.google.com/firestore/databases.
2. Select the proper project and (default) database.
3. Open Scheduled backups / Disaster recovery. Inspect existing schedules first.
4. Create Daily with 30 days retention and Weekly with 12 weeks retention.
5. Enable PITR for the default database.
6. Verify that actual backups appear and monitor age/health. Set a billing budget alert.

PITR does not contain seven days of history immediately on enabling; its window grows after activation. Native managed backup restores to a **new** Firestore database; it is NOT an automatic in-place rollback.

Official references:
- https://firebase.google.com/docs/firestore/backups
- https://firebase.google.com/docs/firestore/use-pitr
- https://firebase.google.com/docs/firestore/disaster-recovery

## 4. Independent Cloud Storage exports

Native backups are linked to the same database location and project. For separate disaster-recovery protection:
- Configure a private Cloud Storage destination, preferably in a distinct backup project with separate ownership.
- Use Cloud Functions + Cloud Scheduler to run a managed Firestore export to that bucket at an approved interval.
- Use least-privilege IAM, server-side encryption and retention/lifecycle policies. Decide whether irrevocable Bucket Lock is appropriate only after legal review.
- Enable monitoring and audit logging for the export job.
- Export/import has separate Firestore read/write and storage charges. Never publish archive links or copy raw client data into GitHub, ordinary email, public buckets or an unencrypted laptop.
- Backup evidence files and uploaded documents separately if the firm begins storing them in Firebase Storage.

References:
- https://firebase.google.com/docs/firestore/solutions/schedule-export
- https://firebase.google.com/docs/firestore/manage-data/export-import
- https://cloud.google.com/storage/docs/bucket-lock

## 5. Firebase Authentication account recovery

Firestore snapshots DO NOT include Firebase Authentication user accounts. Keep a separate protected process for exporting user identities using Firebase auth:export, or re-provision accounts and invite users to reset passwords. Authentication exports can contain sensitive password hashes and salts; apply stricter restrictions to these exports.

Reference: https://firebase.google.com/docs/cli/auth

## 6. Restore drill — mandatory before claiming recovery readiness

At least monthly during rollout:
1. Choose a daily/weekly snapshot and restore it to an isolated TEST Firestore database.
2. Record backup time, restore operator, database ID and elapsed recovery time.
3. Compare counts of clients, assignments, timesheets, workSessionEvents, invoices, user profile documents, attendance and leave requests.
4. Validate at least three client/assignment relationships and all related timesheet IDs.
5. Recalculate working time from server start/stop times for sample records and compare invoiced hours and invoice IDs. Do not silently rewrite historic hours.
6. Check active session locks; do not accidentally resume stale sessions in the recovered environment.
7. Test Super Admin, Manager, Employee and unauthenticated access, including denied access to other users' time records.
8. Test linked evidence file recovery if applicable and verify the restoration is isolated from production.
9. Document actual RPO/RTO. Only promote restored data after a formal incident decision and maintenance plan.

## 7. Server and client access controls

- Super Admin: only privileged business administration, provisioning and billing; require additional MFA and protected cloud account.
- Manager: monitor and delegate existing engagements as allowed by firm policy; not create users or edit work durations.
- Employee: only assigned tasks, personally owned sessions and permitted narrations; no client-wide mass reads.
- Enforce each rule in both Firebase Security Rules and server API authorization. Hiding a menu item is NOT security.
- Create immutable work-session events and use a correction/reversal workflow for signed-off time records; never edit billing evidence silently.
- Verify email for MFA enrollment; Identity Platform options include TOTP.
- Add rate limiting to user provisioning, task-session APIs and invoice creation before broad onboarding.
- Limit Netlify administrators, protect GitHub main branch, require reviewed pull requests and rotate secrets.
- Enable Google Cloud audit logs and alerts for new keys, unusual mass exports and denied requests.

Important: the firestore.rules file in GitHub is NOT automatically deployed by Netlify. Confirm and test live rules in Firebase Console. Before deployment, reconcile old assignments missing assignedUserIds and run Firebase Rules Emulator tests with all three roles. Google Cloud service-account REST APIs use IAM and bypass Firestore Rules.

References:
- https://firebase.google.com/docs/firestore/security/test-rules-emulator
- https://firebase.google.com/docs/auth/web/totp-mfa
- https://firebase.google.com/docs/firestore/security/get-started

## 8. Browser and network hardening

The accompanying next.config.ts proposal adds these safe security headers:
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-Frame-Options: DENY
- Permissions-Policy: camera=(), microphone=(), payment=()
- Strict-Transport-Security: max-age=31536000 (no subdomain preload)

A full Content Security Policy should start in Report-Only mode, accounting for Firebase and Next.js, then be enforced after testing. Do not block existing authentication or Firebase network calls.

## 9. Review and operations ownership

| Activity | Responsible | Frequency |
| --- | --- | --- |
| Verify backup freshness and failed jobs | Designated cloud admin | Daily |
| Verify PITR coverage and cloud budget | Cloud admin | Weekly |
| Check offsite export, storage permissions | Cloud admin | Monthly |
| Restore to test database, reconcile hours | Cloud admin + independent firm reviewer | Monthly, then quarterly after stable |
| Review team access, former employees, IAM and keys | Super Admin | Monthly |
| Review anomalies, session corrections and billed hours | Super Admin + Manager | Monthly |

**Release gate:** Do not mark data as protected until at least one real backup has completed and been restored/tested. This document is guidance and contains no live Firebase backup configuration.
