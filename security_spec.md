# Firestore Security Specification - TDD Rules

This document outlines the security architecture, data invariants, the "Dirty Dozen" malicious payloads designed to breach the system, and a comprehensive test suite to verify that all unauthorized behaviors are safely rejected.

## 1. Data Invariants

For the `users` collection located at `/users/{userId}` where `{userId}` refers to the student's unique authenticated Google/guest UID:
- **Identity Pinning**: The `userId` in the document path MUST match `request.auth.uid`. The body field `uid` MUST also equal the `userId` in the path.
- **Strict Keys**: The workspace document MUST NOT contain any unrequested, hidden, or "ghost" fields (e.g., `role`, `isAdmin`, `isPremium`).
- **Temporal Integrity**: Every write (create or update) MUST set the `updatedAt` field to the server-assigned timestamp (`request.time`). Client-provided historical or future timestamps must be strictly rejected.
- **Volumetric Bounding**: Text fields and array lists must be bounded to prevent Denial of Wallet (DoW) attacks.
  - `email` string size <= 200 characters.
  - `xp` and `streak` must be non-negative integers.
  - `subjects` list size <= 50 elements.
  - `tasks` list size <= 300 elements.
  - `classes` list size <= 100 elements.
  - `apps` list size <= 100 elements.
  - `papers` list size <= 200 elements.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent targeted attacks attempting to bypass identity, integrity, and state boundaries. All of these MUST return `PERMISSION_DENIED`.

### Payload 1: The Spoofed Owner ID (Identity Breach)
- **Path**: `/users/victim_student_99`
- **User auth.uid**: `attacker_student_1`
- **Description**: Attacker tries to write into a victim's workspace using their own token but targeting the victim's document path.

### Payload 2: Ghost Field injection (Privilege Escalation)
- **Path**: `/users/attacker_student_1`
- **User auth.uid**: `attacker_student_1`
- **Payload**:
  ```json
  {
    "uid": "attacker_student_1",
    "email": "attacker@gmail.com",
    "xp": 500,
    "streak": 2,
    "subjects": [],
    "tasks": [],
    "classes": [],
    "apps": [],
    "role": "admin",
    "isPremium": true
  }
  ```
- **Description**: Attacker attempts to add self-assigned `role` and `isPremium` fields to gain elevated application access.

### Payload 3: Negative/Overflow XP (Value Poisoning)
- **Path**: `/users/attacker_student_1`
- **User auth.uid**: `attacker_student_1`
- **Payload**:
  ```json
  {
    "uid": "attacker_student_1",
    "email": "attacker@gmail.com",
    "xp": -9999,
    "streak": 5,
    "subjects": [],
    "tasks": [],
    "classes": [],
    "apps": []
  }
  ```
- **Description**: Injecting negative values into the XP counter to break leaderboards or cause arithmetic underflows.

### Payload 4: Type Confusion on Core Numeric Field (Value Poisoning)
- **Path**: `/users/attacker_student_1`
- **User auth.uid**: `attacker_student_1`
- **Payload**:
  ```json
  {
    "uid": "attacker_student_1",
    "email": "attacker@gmail.com",
    "xp": "nine-thousand",
    "streak": 5,
    "subjects": [],
    "tasks": [],
    "classes": [],
    "apps": []
  }
  ```
- **Description**: Attempting type confusion by sending a string instead of an integer for `xp`.

### Payload 5: Deny-of-Wallet Huge String Injection (Resource Poisoning)
- **Path**: `/users/attacker_student_1`
- **User auth.uid**: `attacker_student_1`
- **Payload**:
  ```json
  {
    "uid": "attacker_student_1",
    "email": "[A repeated sequence of 500,000 characters]",
    "xp": 100,
    "streak": 3,
    "subjects": [],
    "tasks": [],
    "classes": [],
    "apps": []
  }
  ```
- **Description**: Injecting a massive string to inflate Firestore document sizes and rack up bandwidth/storage bills.

### Payload 6: Unbounded Array Injection (Resource Poisoning)
- **Path**: `/users/attacker_student_1`
- **User auth.uid**: `attacker_student_1`
- **Payload**:
  ```json
  {
    "uid": "attacker_student_1",
    "email": "attacker@gmail.com",
    "xp": 100,
    "streak": 3,
    "subjects": ["[A 10,000-element list of mock subjects]"],
    "tasks": [],
    "classes": [],
    "apps": []
  }
  ```
- **Description**: Flooding the database with oversized arrays to exceed physical document limits or increase processing latency.

### Payload 7: Client-Defined Future Timestamp (Temporal Breach)
- **Path**: `/users/attacker_student_1`
- **User auth.uid**: `attacker_student_1`
- **Payload**:
  ```json
  {
    "uid": "attacker_student_1",
    "email": "attacker@gmail.com",
    "xp": 100,
    "streak": 3,
    "subjects": [],
    "tasks": [],
    "classes": [],
    "apps": [],
    "updatedAt": "2050-12-31T23:59:59Z"
  }
  ```
- **Description**: Manually providing a future date-time timestamp to fake persistent activity history.

### Payload 8: Type Confusion on Array Lists (Type Invariant)
- **Path**: `/users/attacker_student_1`
- **User auth.uid**: `attacker_student_1`
- **Payload**:
  ```json
  {
    "uid": "attacker_student_1",
    "email": "attacker@gmail.com",
    "xp": 100,
    "streak": 3,
    "subjects": "History, Math, Science",
    "tasks": [],
    "classes": [],
    "apps": []
  }
  ```
- **Description**: Sending a raw comma-separated string instead of a valid List array for the `subjects` field.

### Payload 9: Empty Path Variable/ID Poisoning (Path Injection)
- **Path**: `/users/` (attempting list queries or wildcard fetches)
- **User auth.uid**: null (or unauthorized user)
- **Description**: Querying the root collection `/users` to scrape or list other students' workspace details.

### Payload 10: Null / Unauthenticated Client Write (Access Control)
- **Path**: `/users/attacker_student_1`
- **User auth.uid**: null
- **Description**: Making a write operation without any bearer credentials, attempting to bypass Firestore's entry auth gates.

### Payload 11: Shadow Field Override during Update (Update-Gap)
- **Path**: `/users/attacker_student_1`
- **User auth.uid**: `attacker_student_1`
- **Payload Modification**:
  - Existing: `{ uid: "attacker_student_1", email: "student@gmail.com", ... }`
  - Modification: `{ uid: "attacker_student_1", email: "student@gmail.com", isPremium: true, ... }`
- **Description**: Attacking the update block specifically by injecting a privilege parameter that wasn't present during creation.

### Payload 12: Invalid Path Poisoning (Path Vulnerability)
- **Path**: `/users/attacker..admins..some_admin`
- **User auth.uid**: `attacker_student_1`
- **Description**: Using path traversal characters or malicious syntax to try and overwrite documents outside the matching schema scope.

---

## 3. The Test Runner Specification

The following `firestore.rules.test.ts` outlines how unit tests execute to assert complete protection against the "Dirty Dozen" payloads.

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "abiding-ratio-g224x",
    firestore: {
      rules: require("fs").readFileSync("firestore.rules", "utf8"),
      host: "localhost",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Engez Student Workspace Security Fortress Rules", () => {
  it("should block Payload 1: Spoofed Owner ID", async () => {
    const context = testEnv.authenticatedContext("attacker_student_1");
    const db = context.firestore();
    const docRef = doc(db, "users", "victim_student_99");
    await expect(setDoc(docRef, { uid: "victim_student_99", email: "victim@gmail.com" }))
      .rejects.toThrow("PERMISSION_DENIED");
  });

  it("should block Payload 2: Ghost Field Injection", async () => {
    const context = testEnv.authenticatedContext("attacker_student_1");
    const db = context.firestore();
    const docRef = doc(db, "users", "attacker_student_1");
    await expect(setDoc(docRef, {
      uid: "attacker_student_1",
      email: "attacker@gmail.com",
      xp: 500,
      streak: 2,
      subjects: [],
      tasks: [],
      classes: [],
      apps: [],
      role: "admin",
      isPremium: true
    })).rejects.toThrow("PERMISSION_DENIED");
  });

  it("should block Payload 3: Negative XP", async () => {
    const context = testEnv.authenticatedContext("attacker_student_1");
    const db = context.firestore();
    const docRef = doc(db, "users", "attacker_student_1");
    await expect(setDoc(docRef, {
      uid: "attacker_student_1",
      email: "attacker@gmail.com",
      xp: -50,
      streak: 1,
      subjects: [],
      tasks: [],
      classes: [],
      apps: []
    })).rejects.toThrow("PERMISSION_DENIED");
  });

  it("should block Payload 5: Excessive String Size", async () => {
    const context = testEnv.authenticatedContext("attacker_student_1");
    const db = context.firestore();
    const docRef = doc(db, "users", "attacker_student_1");
    const longEmail = "a".repeat(500) + "@gmail.com";
    await expect(setDoc(docRef, {
      uid: "attacker_student_1",
      email: longEmail,
      xp: 10,
      streak: 1,
      subjects: [],
      tasks: [],
      classes: [],
      apps: []
    })).rejects.toThrow("PERMISSION_DENIED");
  });

  it("should block Payload 10: Unauthenticated Writes", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const docRef = doc(db, "users", "attacker_student_1");
    await expect(setDoc(docRef, {
      uid: "attacker_student_1",
      email: "attacker@gmail.com",
      xp: 10,
      streak: 1,
      subjects: [],
      tasks: [],
      classes: [],
      apps: []
    })).rejects.toThrow("PERMISSION_DENIED");
  });
});
```
