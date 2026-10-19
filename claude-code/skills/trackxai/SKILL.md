---
name: "trackxai"
description: "Track work in trackxai: claim, progress and complete tasks, record evidence, and write tasks and questions a person can act on. Use when working in a project tracked in trackxai, or when asked to create, update or close a task, epic or question there."
---

Plugin version: 0.1.2

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
criterion, left at no-priority unless a person names one for task.create or task.update. Why: a
claim and a completion should bracket one reviewable change, and attention already orders the list.

Subtask: when a claimed task turns out larger, split it with parentTaskId on task.create, or
task.parent.set on an existing task. Why: the original task keeps its address and its history.

Placement: fix epic or backlog with task.move, labels with task.label.set. Why: the address stays.

Lists: task.list answers at most 200 tasks a call. Follow its nextCursor, passed back as cursor with
the same filters, until an answer ends without one, and never treat an answer marked truncated: true
as the whole list. Why: a list cut short looks complete, and a decision taken on it misses the rest.

## Task, question or note

Question: a gap on the task it blocks, raised with gap.add, classified, with options, and with
proposedDefault and proceedsAt when you will go ahead unanswered. Never a task titled "Decide X".
Why: a gap routes to its answerer, never blocks the write, and tells you the answer.

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

## Writing a task a person can act on

The title is the outcome, as an imperative: "Reject an importer row with no legacy identifier",
never "Importer rows". If nobody can tell from the title when it is done, it names a topic.

The goal says what is true once the work is done, in terms a reader could check without you.
Out-of-scope says what a reader would otherwise assume is included, so nobody builds it. Notes
carry what you learned on the way; they are not the goal restated.

Link, do not narrate. Every relation the schema can hold goes in as a reference rather than a
sentence: an issue is a sources reference with its system, its number and its URL, never "#417"
in the title; a dependency is a blocked-by reference, never "waits on the mapper rewrite" in
the notes; another task is a reference to it, never its identifier pasted into prose; a file
you touch is an entry in files with its symbol, never a path quoted in a criterion. Prose is
read by a person once. A reference is read by every query, every view and every agent after
you, and it is checked on the way in.

An acceptance criterion is one observable a stranger can verify: a command that exits, a
response that carries a value, a file that exists, a count that holds. At least one names the
command, the path or the number. "Works correctly" is not a criterion.

Resolve facts before you write. Read the code, the schema, the runbook and the earlier tasks;
never ask what the repository can tell you. What remains after that goes in as a gap, classified
and routed, and the task proceeds on a stated assumption.

One task is one unit of work. Two mutually exclusive approaches inside one task are an open
question that has not been asked yet.

## Writing a question that stands alone

The person answering will read your question in a list beside forty others, on a phone, without
the task open and without the paragraph you wrote it under. Write it so that list is enough.

Name the referent. "Is this the right column?" cannot be answered from the list. "Does the
legacy importer read legacy_id or legacy_ref for the client reference?" can. No it, this, that,
they or those as the subject.

State what you already know and what you checked, in one clause, so the answerer does not
repeat your lookup and does not have to trust you blindly: "the 2019 export has both columns
and the mapper reads legacy_id".

Offer the options or a default. Give three to five choices when possible, or state the default.
In gap.add's options, give each a label, detail, rationale and trade-off. Mark at most one
recommended and explain it with recommendedBecause, so the answerer needs nothing else.
An open question with no options is a lookup nobody investigated; investigate it, then ask.
Put what you will do if nobody answers in proposedDefault, an option id or a sentence, and when you
will do it in proceedsAt, an ISO instant with a time zone, never in the question text. The answerer
sees both, and the tracker never acts on them: going ahead stays your call.

Say what the answer changes. Name the task, the slot or the criterion it unblocks. A question
that blocks nothing is a note; put it in notes.

Classify it by one question, and route it. If the answer is looked up, it is a needs-input, and
say where it is looked up. If the answer is chosen, it is an open-question. If you have chosen
and are proceeding, it is an assumption, and say what would falsify it. Then say who must act:
human for a person in this workspace, agent for an agent, external for somebody outside.

A human question reaches one person: the clarifier you name, else the reviewer of the project,
else the reviewer of the team, else the account owner. When no reviewer is set, set one or name
the right person: people.list gives the ids, project.reviewer.set and team.reviewer.set record a
reviewer, and clarifier on gap.add routes this one question. Only a person who can write can be
named, never an agent.

Write it as a question, ending in a question mark, and give it enough words to carry all of the
above: a question under six words is a heading. Ask once, in one batch, and never block waiting;
proceed on the stated assumption and apply the answer when it arrives.

Good: "Do we reject an unaddressable record, or quarantine it for a later pass? The mapper
refuses today and nothing is lost; quarantine needs a table nobody has built. Decides the second
criterion on this task.", with proposedDefault "Reject it and name the column" and proceedsAt
tomorrow at 09:00 UTC.

Bad: "Should this be quarantined?"

## Waiting for an answer

gap.add on a needs-input or an open-question returns a watch URL beside the gap. It needs no
bearer token, it answers with the gap's state and, once answered, the answer and who gave it,
and repeated checks are served from the edge, so poll it rather than the task. Keep it in a
shell variable and never print it: it is a secret for that one gap.

Check it every 15 seconds. Run the loop detached if your harness can start a background command
and wake you when it prints or exits. Otherwise give it a timeout and check back between steps.

  until curl -sf "$WATCH" | grep -q '"state":"resolved"'; do sleep 15; done; curl -s "$WATCH"

Expect the answer to reach you within the propagation the response states plus your interval,
once a person has answered; how long a person takes to notice is outside the tracker. Give up
when the response's expiry passes, and read the task again when you next claim it: every answer
that arrived since your last call leads the read. With no shell, each response to your token opens
with 'ACME-12 gap 2 was answered by Rowin, answer: "Quarantine it"' per unread answer until gap.get
or inbox.read; changes.since catches up, and a public HTTPS host can take the answered-gap webhook.

Do not stop working while you wait. Proceed on the assumption you stated, and when the answer
arrives apply it, record what it changed, and move on.

In Claude Code:

Check it every 15 seconds. This loop fits Claude Code's own background tools exactly: back it
with run_in_background rather than blocking on it, and Monitor wakes you when it prints or
exits.
