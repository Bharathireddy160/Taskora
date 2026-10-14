# Taskora — Plan Smart. Achieve More.

A multi-page HTML/CSS/JavaScript student planner using Firebase Authentication and Cloud Firestore.

## 1. Folder structure
```text
taskora/
├── index.html
├── about.html
├── contact.html
├── login.html
├── signup.html
├── dashboard.html
├── tasks.html
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── firebase.js
│       ├── auth.js
│       ├── dashboard.js
│       └── tasks.js
└── README.md
```

## 2. Configure Firebase
1. Open https://console.firebase.google.com/ and select project `taskora-5b226`.
2. In **Authentication → Sign-in method**, enable **Email/Password** and **Google**.
3. In **Firestore Database**, create a database.
4. In **Firestore → Rules**, use the rules below, then Publish.
5. In **Project settings → Your apps**, confirm the web app config in `assets/js/firebase.js`.
6. In **Authentication → Settings → Authorized domains**, add `localhost` if it is not listed.

Suggested Firestore rules (each signed-in user can access only their own tasks):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/tasks/{taskId} {
      allow read, create, update, delete: if request.auth != null
        && request.auth.uid == userId;
    }
    match /users/{userId}/profile/{docId} {
      allow read, create, update: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

## 3. Run locally
Do not open HTML files directly with `file://`. Use VS Code's **Live Server** extension, or from this folder run:
```bash
python -m http.server 5500
```
Then open http://localhost:5500. Firebase Auth redirects/popups and modules work on localhost.

## 4. Important reminder limitation
This starter app checks due tasks and can request browser notifications while the site is open. Browsers may suspend tabs, and this does **not** guarantee reminders when the site is closed. Reliable scheduled reminders require a trusted backend such as Firebase Cloud Functions + Cloud Scheduler and an email/push provider. Never put service-account credentials in frontend code.

## 5. Privacy/security
The Firebase web config (including `apiKey`) identifies the web app; it is not a server secret. Firestore Security Rules are essential. Do not place passwords, service-account keys, or private credentials in frontend files.
