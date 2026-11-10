# RKP Associates — technical release checklist

This technical branch is **not ready to merge on the strength of its Next.js build alone**. It adds privileged server APIs and a new authoritative time recording model. Verify the steps below in a test Firebase project or on carefully controlled test records before production.

## 1. Server-only Netlify environment variable

Create a Firebase service account with the minimum IAM permissions needed for Identity Toolkit user provisioning and Firestore access. In Netlify > Project configuration > Environment variables, configure:

- Key: `FIREBASE_SERVICE_ACCOUNT_JSON`
- Value: the service account JSON, as a **secret** (never prefix with `NEXT_PUBLIC_`, commit it, or paste it in chat)
- Scope: Functions/runtime; set the proper deploy-preview and production contexts only after testing.

`NEXT_PUBLIC_FIREBASE_PROJECT_ID` must be from the **same** Firebase project as the service account.

For deployment previews, use a **separate staging Firebase project and staging Netlify environment variables** whenever possible, so preview actions cannot change production clients, employees or timesheets.

A Netlify build succeeding does **not** confirm that Firebase Admin REST operations work. Test account creation and time recording on an isolated test project.

## 2. Firestore rules

The repository includes `firestore.rules` and `firebase.json`, but these do not deploy when Netlify deploys.

Before applying new rules to a production project:

- Export or back up existing Firestore records.
- Review the **current live rules** and compare their collection permissions with the proposed rules.
- Test with Firebase Rules Emulator and Super Admin, Manager, Employee, and unauthenticated accounts.
- Backfill `assignments[].assignedUserIds` for **legacy assignments**. New assignments and manager task shares now set this field; old records may not. Without it, the new rules can deny employee reads of assignment checklists, instructions and notes.
- Check any integrations not represented in this repository before enforcing default-deny.
- Deploy via Firebase CLI after the tests: `firebase deploy --only firestore:rules --project YOUR_FIREBASE_PROJECT_ID` (only from a securely configured local development environment).

**Do not deploy these rules blindly to production.** Existing client side integrations and older documents may require a migration first.

## 3. Permissions acceptance tests

| Action | Super Admin | Manager | Employee |
|---|---|---|---|
| Create employee/manager Firebase account | Allow | Deny | Deny |
| Create client | Allow | Deny | Deny |
| Create assignment and initial allocation | Allow | Deny | Deny |
| Share existing assignment with employee | Allow | Allow | Deny |
| View every team's work | Allow | Allow | Deny |
| Read own assigned work | Allow if assigned | Allow if assigned | Allow |
| Start/stop own assigned timer | Allow if assigned | Allow if assigned | Allow |
| Update work duration via browser Firestore SDK | Deny | Deny | Deny |
| Update another employee's timer | Deny | Deny | Deny |

## 4. Time record integrity

For two test employees and assignments, verify:

1. An employee starts an assigned task. One `timesheets` entry has `status=active` and a corresponding `activeWorkSessions/{uid}` lock.
2. Starting a different assignment while the first timer is active returns HTTP 409 and creates no second active session.
3. Stopping a timer creates an end timestamp, time totals, a narration, and removes the lock atomically. The assignment remains open.
4. Restarting the task creates a **new session** without overwriting previous durations.
5. Marking a paused task complete updates the employee's progress without fabricating extra working minutes.
6. Simultaneous clicks or browser retries do not create double sessions. Validate the Firestore precondition response.
7. Server-side `workSessionEvents` documents are created and cannot be written by employees.
8. Failed writes leave the previous state untouched; repeat safely after refresh.
9. Netlify function restarts, multiple tabs, and time-zone/day-boundary transitions preserve accurate timestamps.

Prior sessions produced by older client-side tracking may need reconciliation before hours are treated as financial data. Do not edit historical timestamps to make them appear consistent.

## 5. UI smoke tests

Check desktop and mobile: login/logout, dashboard, assignment list and details, Super Admin user creation and password setup, client creation, new assignment, manager sharing, personal timer start/stop/complete, and timesheet histories.

Also check: attendance, leave, narrations, reports, analytics, invoices, and print formatting.

## 6. Outstanding work before declaring a production release

- End-to-end automated tests for the new server APIs with Firebase Emulator or a staging project.
- Backfill and validate older assignment ownership metadata.
- Migrate any remaining direct Firestore writes to server endpoints or explicitly authorize them through tested Firestore rules.
- Verify the new atomic invoice-and-timesheet server transaction under concurrent requests, retries, and billing-period filters.
- Confirm historical session totals and test real user roles, including disabled users.

This checklist intentionally keeps the technical PR in draft until the environment and database security steps are complete.


## 7. November 2026 settings and UI verification

The code for the following features is included in PR #5; they are **not verified end to end** just because a Netlify build passes:

- Confirm employee-creation dialog input text, labels, placeholder text, selects and primary button are readable in light, dark and system themes.
- Test `Settings` for all three roles. Personal appearance settings are saved to this **browser**, not to the central database.
- Test Super Admin firm name update propagates to sidebar/header. Manager/Employee must receive HTTP 403 on attempting to change shared settings.
- Test Manager delegation disabled in firm settings; Manager share endpoint must return 403, Super Admin share still works.
- Test narrated timer stops with the Super Admin-defined minimum character count, including simultaneous start and stop clicks.
- Test employees requesting their own password reset from login/Settings and Super Admin requesting reset via Team Directory. Confirm links arrive and Firebase's email/password sign-in method and app domain are configured.
- Test Assignment Board fetch with Super Admin and Manager and HTTP 403 for Employee; missing server credentials must report setup error instead of displaying zero assignments.
- Test invoice generation using the new atomic API. Validate `invoices` and every linked timesheet agree on invoice ID; two concurrent requests for the same work must not bill it twice.
- Confirm all existing and legacy timesheets match the expected status and duration conventions before invoicing.

### Critical external configuration

The Netlify site was inspected on November 10, 2026 and **does not have** a variable named `FIREBASE_SERVICE_ACCOUNT_JSON`. The application cannot create employees or use the privileged server endpoints until this is set.

Use the Netlify project UI (Functions scope, mark as secret) and the Firebase console > Project settings > Service accounts > Generate new private key. Upload the key **only to Netlify's secure environment variable value**. Never send the key in a chat, add it to client JavaScript or commit it.

For staging, keep a **separate Firebase project** and a separate secret. Rebuild and then test an employee, manager and Super Admin, followed by a full rules review. Netlify does not deploy Firestore security rules.

## 8. Known limitations before a firm-wide release

- Legacy `assignedUserIds` fields may need data migration before employee rule checks behave consistently.
- Attendance and leave functions are still partly client-SDK based; review and test Firestore rules carefully.
- Current report/board aggregation is collection-wide; evaluate pagination or precomputed aggregates before high data volumes.
- Admin REST operations and password reset delivery must be tested with real Firebase permissions and email configuration.
- Always back up and reconcile historic time entries before using them for audit engagement billing.
