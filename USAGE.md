linearis v2026.4.4 — CLI for Linear.app (project management / issue tracking)
auth: linearis auth login | --api-token <token> | LINEAR_API_TOKEN | ~/.linearis/token
output: JSON
ids: UUID or human-readable (team key, issue ABC-123, name)

domains:
  auth          authenticate with Linear API (interactive, for humans)
  issues        work items with status, priority, assignee, labels
  comments      discussion threads on issues (list, create, reply, edit, delete)
  labels        categorization tags, workspace-wide or team-scoped
  projects      groups of issues toward a goal
  cycles        time-boxed iterations (sprints) per team
  milestones    progress checkpoints within projects
  documents     long-form markdown docs attached to projects or issues
  files         upload/download file attachments
  attachments   linked external resources on issues (PRs, commits, URLs)
  teams         organizational units owning issues and cycles
  users         workspace members and assignees

detail: linearis <domain> usage

---

linearis auth — authenticate with Linear API (interactive, for humans)

linearis requires a Linear API token for all operations.
use 'auth login' to store a token (optionally under a named profile via -p).
profiles let you switch between tokens and actor attributions (createAsUser,
displayIconUrl) and live in ~/.linearis/profiles.json (encrypted token).
token resolution order: --api-token flag, --profile flag, LINEARIS_PROFILE
env, LINEAR_API_TOKEN env, default profile, ~/.linearis/token (legacy),
~/.linear_api_token (deprecated).

commands:
  login [options]  set up or refresh authentication
  logout           remove stored authentication token or profile
  list             list configured profiles
  config           open the profile config file in VS Code

login options:
  --force           reauthenticate even if already authenticated
  --as <name>       display name for created issues/comments (profile only)
  --icon-url <url>  avatar URL for created issues/comments (profile only)

---

linearis issues — work items with status, priority, assignee, labels

an issue belongs to exactly one team. it has a status (e.g. backlog,
todo, in progress, done — configurable per team), a priority (1-4),
and can be assigned to a user. issues can have estimates; valid values
are integers whose meaning depends on the team's estimation scale
(fibonacci, exponential, linear, or t-shirt sizes mapped to integers).
issues can have labels, a due date, belong to a project, be part of a
cycle (sprint), and reference a project milestone. parent-child
relationships and issue relations (blocks, blocked-by, relates-to,
duplicate-of) are supported.

commands:
  list [options]  list issues with optional filters
  search <query>  full-text search issues
  read <issue>    get full issue details including description
  create <title>  create new issue
  update <issue>  update an existing issue

arguments:
  <issue>  issue identifier (UUID or ABC-123)
  <title>  string
  <query>  full-text search term

list options:
  --query <query>            deprecated: use `issues search <query>`
  --limit <n>                max results (default: 50)
  --after <cursor>           cursor for next page
  --team <team>              filter by team
  --assignee <user>          filter by assignee
  --creator <user>           filter by creator
  --project <project>        filter by project
  --status <statuses>        filter by status (comma-separated, requires --team)
  --label <labels>           filter by labels (comma-separated)
  --cycle <cycle>            filter by cycle (requires --team)
  --parent <issue>           filter by parent issue
  --milestone <milestone>    filter by milestone (requires --project)
  --priority <n>             filter by priority (0-4)
  --estimate <n>             filter by estimate
  --due-before <date>        due before date (YYYY-MM-DD)
  --due-after <date>         due after date (YYYY-MM-DD)
  --created-after <date>     created after date (YYYY-MM-DD)
  --created-before <date>    created before date (YYYY-MM-DD)
  --completed-after <date>   completed after date (YYYY-MM-DD)
  --completed-before <date>  completed before date (YYYY-MM-DD)
  --updated-after <date>     updated after date (YYYY-MM-DD)
  --updated-before <date>    updated before date (YYYY-MM-DD)
  --has-blockers             only issues that are blocked
  --is-blocking              only issues that block others

search options:
  --limit <n>                max results (default: 50)
  --after <cursor>           cursor for next page
  --team <team>              filter by team
  --assignee <user>          filter by assignee
  --creator <user>           filter by creator
  --project <project>        filter by project
  --status <statuses>        filter by status (comma-separated, requires --team)
  --label <labels>           filter by labels (comma-separated)
  --cycle <cycle>            filter by cycle (requires --team)
  --parent <issue>           filter by parent issue
  --milestone <milestone>    filter by milestone (requires --project)
  --priority <n>             filter by priority (0-4)
  --estimate <n>             filter by estimate
  --due-before <date>        due before date (YYYY-MM-DD)
  --due-after <date>         due after date (YYYY-MM-DD)
  --created-after <date>     created after date (YYYY-MM-DD)
  --created-before <date>    created before date (YYYY-MM-DD)
  --completed-after <date>   completed after date (YYYY-MM-DD)
  --completed-before <date>  completed before date (YYYY-MM-DD)
  --updated-after <date>     updated after date (YYYY-MM-DD)
  --updated-before <date>    updated before date (YYYY-MM-DD)
  --has-blockers             only issues that are blocked
  --is-blocking              only issues that block others

read options:
  --with-attachments  include issue attachments

create options:
  --description <text>      issue body
  --assignee <user>         assign to user
  --priority <1-4>          1=urgent 2=high 3=medium 4=low
  --project <project>       add to project
  --team <team>             target team (required)
  --labels <labels>         comma-separated label names or UUIDs
  --project-milestone <ms>  set milestone (requires --project)
  --cycle <cycle>           add to cycle (requires --team)
  --status <status>         set status
  --estimate <n>            set estimate
  --parent-ticket <issue>   set parent issue
  --due-date <date>         due date (YYYY-MM-DD)
  --blocks <issue>          this issue blocks <issue>
  --blocked-by <issue>      this issue is blocked by <issue>
  --relates-to <issue>      this issue relates to <issue>
  --duplicate-of <issue>    this issue duplicates <issue>

update options:
  --title <text>             new title
  --description <text>       new description
  --status <status>          new status
  --priority <1-4>           new priority
  --assignee <user>          new assignee
  --project <project>        new project
  --labels <labels>          labels to apply (comma-separated)
  --label-mode <mode>        add | overwrite
  --clear-labels             remove all labels
  --parent-ticket <issue>    set parent issue
  --clear-parent-ticket      clear parent
  --project-milestone <ms>   set project milestone
  --clear-project-milestone  clear project milestone
  --cycle <cycle>            set cycle
  --clear-cycle              clear cycle
  --estimate <n>             new estimate
  --clear-estimate           clear estimate
  --due-date <date>          set due date (YYYY-MM-DD)
  --clear-due-date           clear due date
  --blocks <issue>           add blocks relation
  --blocked-by <issue>       add blocked-by relation
  --relates-to <issue>       add relates-to relation
  --duplicate-of <issue>     add duplicate relation
  --remove-relation <issue>  remove relation with <issue>

see also: comments create <issue>, documents list --issue <issue>, attachments list <issue>, issues read --with-attachments

---

linearis comments — discussion threads on issues (list, create, reply, edit, delete)

a comment is a text entry on an issue. comments support markdown and threaded replies via parentId.

commands:
  list <issue>      list comments on an issue
  create <issue>    create a comment on an issue
  reply <comment>   reply to a comment (threaded)
  edit <comment>    edit a comment
  delete <comment>  delete a comment

arguments:
  <issue>    issue identifier (UUID or ABC-123)
  <comment>  comment identifier (UUID only)

list options:
  --limit <n>       max results (default: 25)
  --after <cursor>  cursor for next page

create options:
  --body <text>  comment body (required, markdown supported)

reply options:
  --body <text>    reply body (required, markdown supported)
  --issue <issue>  issue the parent comment belongs to (required, UUID or ABC-123)

edit options:
  --body <text>  new comment body (required, markdown supported)

see also: issues read <issue>

---

linearis labels — categorization tags, workspace-wide or team-scoped

labels categorize issues. they can exist at workspace level or be
scoped to a specific team. use with issues create/update --labels.

commands:
  list [options]  list available labels

list options:
  --team <team>     filter by team (key, name, or UUID)
  --limit <n>       max results (default: 50)
  --after <cursor>  cursor for next page

see also: issues create --labels, issues update --labels

---

linearis projects — groups of issues toward a goal

a project collects related issues across teams. projects can have
milestones to track progress toward deadlines or phases. projects
have a status (backlog, planned, started, paused, completed,
canceled), priority (0-4), health (onTrack, atRisk, offTrack),
and can be assigned labels, a lead, and members.

commands:
  list [options]    list projects
  read <project>    get full project details
  create <name>     create a new project
  update <project>  update an existing project

arguments:
  <project>  project identifier (UUID or name)
  <name>     string

list options:
  --limit <n>       max results (default: 100)
  --after <cursor>  cursor for next page

create options:
  --teams <teams>       comma-separated team names or UUIDs
  --description <text>  project description
  --content <text>      project content (markdown)
  --lead <user>         project lead (name, email, or UUID)
  --members <users>     comma-separated member names or UUIDs
  --priority <0-4>      0=none 1=urgent 2=high 3=medium 4=low
  --status <status>     project status name or UUID
  --start-date <date>   start date (YYYY-MM-DD)
  --target-date <date>  target date (YYYY-MM-DD)
  --labels <labels>     comma-separated label names or UUIDs

update options:
  --name <name>         new name
  --description <text>  new description
  --content <text>      new content (markdown)
  --lead <user>         new lead (name, email, or UUID)
  --members <users>     comma-separated member names or UUIDs
  --priority <0-4>      new priority
  --status <status>     new status name or UUID
  --start-date <date>   new start date (YYYY-MM-DD)
  --target-date <date>  new target date (YYYY-MM-DD)
  --teams <teams>       comma-separated team names or UUIDs
  --labels <labels>     comma-separated label names or UUIDs

see also: milestones list --project, documents list --project, issues create --project

---

linearis cycles — time-boxed iterations (sprints) per team

a cycle is a sprint belonging to one team. each team can have one
active cycle at a time. cycles contain issues and have start/end dates.

commands:
  list [options]  list cycles
  read <cycle>    get cycle details including issues

arguments:
  <cycle>  cycle identifier (UUID or name)

list options:
  --team <team>     filter by team (key, name, or UUID)
  --active          only show active cycles
  --window <n>      active cycle +/- n neighbors (requires --team)
  --limit <n>       max results (default: 50)
  --after <cursor>  cursor for next page

read options:
  --team <team>  scope name lookup to team
  --limit <n>    max issues to fetch (default: 50)

see also: issues create --cycle, issues update --cycle

---

linearis milestones — progress checkpoints within projects

a milestone marks a phase or deadline within a project. milestones
can have target dates and contain issues assigned to them.

commands:
  list [options]      list milestones in a project
  read <milestone>    get milestone details including issues
  create <name>       create a new milestone
  update <milestone>  update an existing milestone

arguments:
  <milestone>  milestone identifier (UUID or name)
  <name>       string

list options:
  --project <project>  target project (required)
  --limit <n>          max results (default: 50)
  --after <cursor>     cursor for next page

read options:
  --project <project>  scope name lookup to project
  --limit <n>          max issues to fetch (default: 50)

create options:
  --project <project>   target project (required)
  --description <text>  milestone description
  --target-date <date>  target date in ISO format (YYYY-MM-DD)

update options:
  --project <project>   scope name lookup to project
  --name <name>         new name
  --description <text>  new description
  --target-date <date>  new target date in ISO format (YYYY-MM-DD)
  --sort-order <n>      display order

see also: issues create --project-milestone, issues update --project-milestone

---

linearis documents — long-form markdown docs attached to projects or issues

a document is a markdown page. it can belong to a project and/or be
attached to an issue. documents support icons and colors.

commands:
  list [options]     list documents
  read <document>    get document content
  create [options]   create a new document
  update <document>  update an existing document
  delete <document>  trash a document

arguments:
  <document>  document identifier (UUID)

list options:
  --project <project>  filter by project name or ID
  --issue <issue>      filter by issue (shows documents attached to the issue)
  --limit <n>          max results (default: 50)
  --after <cursor>     cursor for next page

create options:
  --title <title>      document title (required)
  --content <text>     document content (markdown)
  --project <project>  project name or ID
  --team <team>        team key or name
  --icon <icon>        document icon
  --color <color>      icon color
  --issue <issue>      also attach document to issue (e.g., ABC-123)

update options:
  --title <title>      new title
  --content <text>     new content (markdown)
  --project <project>  move to project
  --icon <icon>        new icon
  --color <color>      new icon color

see also: issues read <issue>, projects list

---

linearis files — upload/download file attachments

files are binary attachments stored in Linear's storage. upload returns
a URL that can be referenced in issue descriptions or comments.

commands:
  download <url>  download a file from Linear storage
  upload <file>   upload a file to Linear storage

arguments:
  <url>   Linear storage URL
  <file>  local file path

download options:
  --output <path>  output file path
  --overwrite      overwrite existing file

---

linearis attachments — linked external resources on issues (PRs, commits, URLs)

attachments link external resources to issues. they represent GitHub
pull requests, commits, Slack messages, or arbitrary URLs. each has a
title, subtitle, sourceType (e.g. 'github', 'slack'), and metadata
with integration-specific data. creating an attachment with the same
url on the same issue updates the existing record (idempotent).

commands:
  list <issue>    list attachments on an issue
  create <issue>  create an attachment on an issue
  delete <id>     delete an attachment by UUID

arguments:
  <issue>  issue identifier (UUID or ABC-123)
  <id>     attachment UUID

list options:
  --source-type <type>     filter by source type (e.g. github, slack)
  --title <title>          filter by title (case-insensitive)
  --created-after <date>   created after date (YYYY-MM-DD)
  --created-before <date>  created before date (YYYY-MM-DD)

create options:
  --title <title>    attachment title
  --url <url>        attachment URL
  --subtitle <text>  attachment subtitle

see also: issues read --with-attachments

---

linearis teams — organizational units owning issues and cycles

a team is a group of users that owns issues, cycles, statuses, and
labels. teams are identified by a short key (e.g. ENG), name, or UUID.

commands:
  list [options]  list all teams

list options:
  --limit <n>       max results (default: 50)
  --after <cursor>  cursor for next page

---

linearis users — workspace members and assignees

a user is a member of the Linear workspace. users can be assigned to
issues and belong to teams.

commands:
  list [options]  list workspace members

list options:
  --active          only show active users
  --limit <n>       max results (default: 50)
  --after <cursor>  cursor for next page
