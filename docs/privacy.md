# Privacy

Psychiatric records are among the most sensitive data a person has. Thunai Care is designed around that.

**Today (v0.1)**
- All processing happens in the browser. Nothing is sent to any server.
- Entries are saved only in that browser's local storage, so they survive a page refresh. "Clear" deletes them.
- "Export" downloads a JSON file to the user's own device. Whoever holds that file holds the record.
- On a shared computer, use a private window and press "Clear" when done.

**For contributors**
- Never commit real patient data, including your own or a family member's. Use fictional examples only.
- Don't paste real records into issues, pull requests, chats or screenshots.

**Before any feature that stores or shares data (Stage 2+)**
- Legal review against India's Digital Personal Data Protection Act, 2023 and the Telemedicine Practice Guidelines.
- Explicit, revocable consent for every share.
- Encryption in transit and at rest; minimal data retention.
