# EMBER v1.1.0 Functional Testing Guide

1. Sign in as the Team Leader using `teamleader@ember.com` / `ember123`.
2. Open Profile, upload a JPEG, PNG, or WebP picture, save it, and confirm it appears in the top bar.
3. Sign out and register a Participant with an optional profile picture.
4. Sign out and register a DGL applicant with an optional profile picture.
5. Sign back in as the Team Leader and verify both pictures appear in the approval queue.
6. Approve both registrations.
7. Sign in as the DGL and create a discussion group.
8. Sign in as the Participant, enter the group code, and submit a join request.
9. Sign in as the DGL and approve the request.
10. Confirm profile pictures appear in group membership and attendance lists.
11. Record attendance and publish an announcement.
12. Sign in as the Participant and create a reflection and a comment.
13. Confirm the Participant picture appears beside the post and comment.
14. Test changing and removing a profile picture.
15. Test polls, reactions, talk progress, reports, backup, and moderation.
16. Use the Team Leader reset control only after testing is complete.

All local-mode accounts must be tested in the same browser profile because local storage is device-specific.

## Member deletion test

1. Register and approve a Participant or DGL test account.
2. Sign in as `teamleader@ember.com`.
3. Open **Admin Dashboard → Registrations**.
4. Under **Approved members**, select **Delete member**.
5. Confirm the warning.
6. Verify that the member no longer appears and cannot sign in.
7. For DGL testing, open the DGL dashboard and use **Remove from group**. Verify that the Participant account remains active but becomes unassigned.
