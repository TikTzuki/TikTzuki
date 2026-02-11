# Terminate workflow:

```
tctl --address 14.225.205.235:17233 --namespace subscription wf terminate --workflow_id 2aece341-404c-4f25-82e5-e68daa0c1975
tctl --address 14.225.205.235:17233 namespace delete
```

# Workflow execution timeout

![alt](https://docs.temporal.io/diagrams/workflow-execution-timeout.svg)