# EMBER — SFC Tayabas CLP

Version 1.1.0 — clean functional browser build

EMBER is a responsive React + Vite Progressive Web App for the Christian Life Program of Singles for Christ Tayabas City.

## Team Leader account

```text
Email: teamleader@ember.com
Password: ember123
```

No demo accounts or sample participant records are included.

## Included functions

- Participant and DGL self-registration
- Team Leader account approval and role assignment
- Discussion group creation, join codes, and join-request approval
- Eight CLP talks and progress tracking
- Announcements and talk materials
- Attendance management
- Posts, reflections, prayer requests, testimonies, comments, reactions, and saved posts
- Polls, events, moderation, reports, JSON backup, and system reset
- Profile pictures for Team Leaders, DGLs, and Participants
- Optional profile-picture upload during registration
- Mobile-first profile design with automatic square image resizing
- Profile photos displayed in posts, comments, group lists, attendance, and dashboards
- Installable PWA and GitHub Pages deployment workflow

## Run locally

```bash
npm install --no-audit --no-fund
npm run dev
```

Open the local URL shown by Vite. To test from a phone connected to the same Wi-Fi, open the Network URL displayed in the terminal.

## Production build

```bash
npm run build
npm run preview
```

The production output is generated in `dist/`.

## Publish through GitHub Pages

1. Upload every project file and folder to the root of your GitHub repository.
2. Make sure the default branch is `main`.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. Push to `main` or manually run **Deploy EMBER to GitHub Pages** under Actions.
6. Open the URL shown after the workflow succeeds.

## Important data note

This release stores accounts, images, groups, posts, attendance, and reports in the browser's local storage. It is suitable for testing the complete workflow in one browser profile. Different devices will not share the same records until Firebase Authentication, Firestore, and Storage are connected.

Profile photos are resized and compressed before local storage to reduce storage use. For a real multi-device release, store profile images in Firebase Storage rather than local storage.

## Version 1.2.1 — Member management

- Team Leaders can permanently delete Participant and DGL accounts from **Admin Dashboard → Registrations → Approved members**.
- Permanent deletion also removes the member's posts, comments, reactions, attendance, progress, poll responses, notifications, join requests, and related records.
- The Team Leader account cannot be deleted.
- DGLs can remove Participants from their assigned discussion group without deleting the Participant's EMBER account.
## Version 1.2.2 — Clear CLP completion workflow

- Participants can mark a talk complete directly from the Talks page.
- Every talk detail page has a prominent completion panel and a mobile completion bar.
- DGLs can manage Participant completion from the new CLP Progress tab.
- Team Leaders can manage completion for all approved Participants from the Admin CLP Progress tab.
- Completion remains separate from attendance, reflections, and weekly challenges.

