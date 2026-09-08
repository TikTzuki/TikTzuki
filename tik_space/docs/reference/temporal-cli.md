---
title: Temporal CLI Notes
sidebar_position: 4
---

Working notes for driving Temporal from the CLI. Hosts and workflow ids are placeholders —
a real frontend address does not belong on a public page.

## Terminating a workflow

```
tctl --address <temporal-frontend-host>:17233 --namespace subscription wf terminate --workflow_id <workflow-id>
tctl --address <temporal-frontend-host>:17233 namespace delete
```

## Workflow execution timeout

![alt](https://docs.temporal.io/diagrams/workflow-execution-timeout.svg)