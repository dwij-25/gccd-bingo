# 📖 GCCD Bingo REST API Reference

All requests accept and return `application/json` unless otherwise noted.
Base URL: `/api`

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
Checks participant name and email against the registered attendee roster.
- **Request Body**:
  ```json
  {
    "name": "Dwij Patel",
    "email": "dwij@example.com"
  }
  ```
- **Response `200 OK`**: Sets httpOnly session cookie.
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "isNew": false,
    "message": "Welcome back! Your saved draft has been loaded.",
    "participant": {
      "id": "uuid",
      "name": "Dwij Patel",
      "email": "dwij@example.com",
      "organization": "GDG Cloud",
      "role": "Speaker"
    },
    "card": {
      "id": "uuid",
      "bingo_id": "GCCD-7K4M-92QX",
      "status": "draft",
      "total_completed": 4,
      "tiles": [...]
    }
  }
  ```
- **Response `404 Not Found`**:
  ```json
  {
    "success": false,
    "error": "Email 'notfound@example.com' is not registered on the official GCCD attendee roster.",
    "hint": "Please verify the email you used on your registration ticket, or visit the Organizer Desk."
  }
  ```

### `POST /api/auth/logout`
Clears session cookie and invalidates user state.

### `GET /api/auth/me`
Retrieves authenticated participant and card data from session cookie.

---

## 2. Bingo Card Endpoints

### `GET /api/card`
Retrieves current participant's bingo card and 9 tiles. (Requires Auth).

### `PUT /api/card/tiles/:index`
Uploads or replaces the photo for tile `index` (0 to 8).
- **Content-Type**: `multipart/form-data`
- **Form Field**: `image` (binary file, max 8MB, JPG/PNG/WEBP/HEIC)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "tileIndex": 1,
    "imageUrl": "/uploads/tile_GCCD-7K4M-92QX_1_17400000.jpg",
    "status": "completed",
    "totalCompleted": 5,
    "canSubmit": false,
    "updatedAt": "2026-11-02T15:20:00Z"
  }
  ```

### `DELETE /api/card/tiles/:index`
Removes the photo from tile `index` and resets its status to `not_finished`.

### `POST /api/card/save-draft`
Saves draft tiles state with server-side timestamp.
- **Request Body**:
  ```json
  {
    "tiles": [
      { "tileIndex": 0, "title": "Speaker Spotter", "status": "completed", "imageUrl": "..." },
      ...
    ]
  }
  ```

### `POST /api/card/submit`
Validates that all 9 tiles are completed and locks card.
- **Request Body**: `{ "confirmSubmit": true }`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "bingoId": "GCCD-7K4M-92QX",
    "submittedAt": "2026-11-02T15:30:00Z",
    "winEvaluation": {
      "isWinner": true,
      "fullHouse": true,
      "linesCount": 8,
      "lines": ["Top Row (Row 1)", "Main Diagonal (↘)", ...],
      "winTier": "Full House Grand Prize"
    }
  }
  ```

### `GET /api/bingo/:bingoId`
Public or participant lookup for card status and win verification by Bingo ID.

---

## 3. Organizer Admin Endpoints

Protected via `x-admin-key` header or organizer session.

- `GET  /api/admin/submissions?status=submitted`
- `GET  /api/admin/submissions/:cardId`
- `POST /api/admin/verify-winner` `{ "bingoId": "...", "isWinner": true, "winTier": "Grand Prize" }`
- `GET  /api/admin/export-csv` (streams complete attendee submission spreadsheet)
- `POST /api/admin/import-excel` (multipart upload for attendee spreadsheet)
