# How to Run Kasa Family Management

## Important: Port 3000 is Already in Use

Port 3000 is being used by another project (likely `ai-saas-platform`).

## Solution: Run on Port 3001

The Kasa project is configured to run on **port 3001** by default.

### Steps to Run:

1. **Navigate to the project folder:**
   ```bash
   cd c:\Users\YoelAG\my-sfdx-project\ai-saas-platform\kasa-family-management
   ```

2. **Install dependencies (if not done):**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Go to: **http://localhost:3001**

   (NOT localhost:3000 - that's your other project!)

## Quick Commands

```bash
# Start on port 3001 (default)
npm run dev

# Or specify a different port manually
next dev -p 3002
```

## What You'll See

When you run `npm run dev`, you should see:
```
- ready started server on 0.0.0.0:3001, url: http://localhost:3001
```

Then open: **http://localhost:3001**

## Both Projects Running?

You can run both projects simultaneously:
- **ai-saas-platform**: http://localhost:3000
- **kasa-family-management**: http://localhost:3001

## Troubleshooting

If port 3001 is also busy:
```bash
# Use a different port
next dev -p 3002
```

Then open: http://localhost:3002

