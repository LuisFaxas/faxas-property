# WORK PROTOCOL

## 6-Step Editing Protocol (MANDATORY)

### Step 1: READ
- List the **exact** file paths you will read
- Read files to understand current implementation
- Note patterns, imports, styles, conventions

### Step 2: PLAN
- Propose a **tiny batch** (≤3 files max)
- State specific changes for each file
- Identify query keys that will be invalidated

### Step 3: DIFF
- Show **unified diff** preview for each file
- Use proper diff format with `---` and `+++` headers
- Get explicit approval before proceeding

### Step 4: APPLY
- Only after approval, write the changes
- Use Edit/MultiEdit tools for existing files
- Use Write only for new files

### Step 5: VERIFY
Run these commands and paste results:
```bash
npm run lint
npm run typecheck
npm run build  # if structural changes
```

### Step 6: LOG
Append to `/docs/WORKLOG_<AREA>.md`:
```markdown
## [Date] - [Task]
- Files: [list]
- Changes: [summary]
- Query Keys: [invalidated keys from SOT registry]
- Tests: [pass/fail]
```

## Rules
- **NEVER** skip steps
- **ALWAYS** show diffs before editing
- **ALWAYS** verify after changes
- **ALWAYS** log work with query keys

## File Batching Strategy
- Group related changes together
- Max 3 files per batch
- Complete one batch before starting next
- If errors, fix in same batch

## Query Key Tracking
When mutations affect data, list the exact query keys from SOT:
- `['tasks']` - when tasks change
- `['tasks', { projectId }]` - when project tasks change
- `['task', taskId]` - when single task changes
- Reference `/docs/05-state-management.md` for complete registry