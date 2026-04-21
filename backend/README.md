# BitePick Backend

TypeScript Express API starter for BitePick with MongoDB, Zod validation, and JWT utilities.

## Structure

```text
backend
├── src
│   ├── config
│   ├── constants
│   ├── controllers
│   ├── lib
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   ├── types
│   ├── utils
│   ├── validators
│   ├── app.ts
│   └── server.ts
├── .env.example
├── package.json
└── tsconfig.json
```

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm start`

## Notes

- Copy `.env.example` to `.env` before running the API.
- The server connects to MongoDB on startup.
- `jsonwebtoken`, `zod`, `bcryptjs`, `helmet`, `cors`, `morgan`, and `cookie-parser` are included as common backend utilities.
