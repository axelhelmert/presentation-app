# Project Instructions for Claude Code

## Git Operations

Always execute git operations (fetch, pull, push, etc.) without asking for confirmation first. This project authorizes automatic git actions to streamline the workflow.

### Authorized operations:
- `git fetch` - Always run to get latest remote state
- `git pull` - When updating the local branch
- `git push` - After creating commits
- Other standard git read/write operations

No confirmation needed for these operations in this project.

## Code Edits

All code edits and file modifications are authorized throughout this entire project. Make changes directly without asking for confirmation first. This includes:
- Editing existing files
- Creating new files
- Deleting files
- Refactoring code
- Adding features or fixing bugs

Just make the changes and inform the user what was done.

## Development Server

**Project Directory:** The Next.js application is located in the `presentation-app/` subdirectory. All npm commands must be run from this directory using `cd presentation-app && <command>`.

**Automatic Server Check:** At the beginning of each conversation, automatically check if the development server is running by looking for a Next.js dev server process on port 3000. If no server is running, start it automatically without asking for confirmation.

**Starting the Server:** 
- Command: `cd presentation-app && npm run dev`
- Always run in the background so work can continue
- No confirmation needed
- Server typically runs on http://localhost:3000

**Checking Server Status:**
```bash
lsof -i :3000 | grep LISTEN
```
or check for existing Next.js dev server process.

## Image Management

Large image files should NOT be committed to GitHub. Images are managed externally and downloaded as needed. The image library provides download functionality for backup/external management.
