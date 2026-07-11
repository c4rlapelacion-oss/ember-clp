# Deploy EMBER v1.1.0

## Team Leader login

```text
Email: teamleader@ember.com
Password: ember123
```

There are no demo accounts or preloaded participants.

## GitHub Pages

1. Upload every file and folder in this project to the root of your GitHub repository.
2. Make sure the repository's default branch is `main`.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. Open **Actions → Deploy EMBER to GitHub Pages** and run it if it did not begin automatically.
6. Open the live URL after the workflow shows a green check.

## Local test

```bash
npm install --no-audit --no-fund
npm run dev
```

## Important

The current functional build stores its records separately in each browser. Connect Firebase before expecting registrations and posts from different phones or computers to appear in one shared system.
