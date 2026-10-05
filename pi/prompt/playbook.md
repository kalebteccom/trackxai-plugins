## Laying out the work

Where the workspace's conventions disagree with these defaults, the conventions win.

Workspace: one per organisation. Agents never create one, and no tool can. Why: the token is bounded
by the workspace, so the workspace is the tenant.

Project: one per product or client deliverable. Call project.list before project.create. Why: a
project carries its own address sequence, so a project per feature splits the numbering.

Initiative: only for an outcome that spans several epics, with a target date. Create it with
initiative.create, naming its epics. Why: it rolls health up from its epics, so over one epic it
tells nobody anything.

Epic: one outcome bigger than one pull request, with a done-when an observer can check.
Why: epic.sequence and the progress roll-ups work at this size.

Milestone: an ordered checkpoint inside one epic, named for the state reached, such as "Schema in
production". Add it with milestone.add; put tasks in with task.update's milestoneId. Why: milestones
live inside one epic. A dated checkpoint across epics is an initiative's target date.

Task: one pull request or one verifiable unit, at most a day, with at least one acceptance
criterion. Why: a claim and a completion should bracket one reviewable change.

Subtask: when a claimed task turns out larger, split it with parentTaskId on task.create, or
task.parent.set on an existing task. Why: the original task keeps its address and its history.

## Task, question or note

Question: a gap on the task it blocks, raised with gap.add, classified, with options. Never a task
titled "Decide X". Why: unlike a task, a gap routes to its answerer and never blocks the write.

Requirements: context that outlives one task goes in the epic's goal. Each task that rests on an
outside source cites it as a sources reference with ref.add. Why: every task in the epic is read
against its goal, and a reference can be queried.

Progress, notes and comments: task.progress says what happened. Notes hold what was learned, and
comment.add is discussion with people. Why: each has its own reader and its own view.

## Claiming, progressing and completing

Claim: call task.claim before your first edit, on a task from epic.sequence's Ready now. Hold one
live claim per agent label, and call task.release when you stop unfinished. Why: a claim is the only
signal another agent reads to avoid duplicate work.

Progress: call task.progress at each step someone else could act on, such as a pushed commit, a test
result or a blocker. Never on a timer. Why: people read the feed, and timer notes bury the ones that
matter.

Complete: call task.complete once every criterion an agent can tick is checked with evidence, which
usually means merged. To close with one unmet, post the reason with comment.add first, then name its
id in unmetCriteria. Why: done means a stranger can verify it. unmetCriteria takes ids only, so the
reason lives in the comment.

Human check: criterion.check refuses an agent on a criterion verified by a human. Finish the rest,
then hand the task over with task.handoff. Why: only a person can vouch for that criterion, and the
handoff puts the task in review.

## Evidence for a criterion

Tick a criterion with criterion.check and evidence a stranger can re-run or open: a command and its
result, a link to the commit or pull request, or a file path. Add the pull request to the task as a
sources reference too. Why: evidence that says "verified" verifies nothing.

## Naming

Titles: imperative outcomes, such as "Reject an importer row with no legacy identifier". Why: an
outcome says when the work is done.

Agent labels: harness/role, such as claude-code/explore or codex/planner, 1 to 64 characters of
lowercase letters, digits and . _ - / :. When a session shares its token with subagents, pass agent
on every write with the label of what is writing. Omit it where one agent holds the token. Why: the
label shows as "via <label>" in the feed and on the task, and it changes no permission.
