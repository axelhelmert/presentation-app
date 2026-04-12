# Project Instructions for Claude Code

## Git Operations

Always execute git operations (fetch, pull, push, etc.) without asking for confirmation first. This project authorizes automatic git actions to streamline the workflow.

### Authorized operations:
- `git fetch` - Always run to get latest remote state
- `git pull` - When updating the local branch
- `git push` - After creating commits
- Other standard git read/write operations

No confirmation needed for these operations in this project.

## Development Server

Always run `npm run dev` without asking for confirmation when the user requests to start the server. Run it in the background so work can continue.

## Image Management

Large image files should NOT be committed to GitHub. Images are managed externally and downloaded as needed. The image library provides download functionality for backup/external management.
