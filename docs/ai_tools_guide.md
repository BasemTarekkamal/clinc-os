# AI Tools Implementation Guide

This guide explains how to enable "features" (Function Calling) for the OpenAI Assistant in our project.

## Overview
Enabling a new capability requires two steps:
1.  **Phase 1: Definition (OpenAI Side)** - Telling the AI that the function exists.
2.  **Phase 2: Handler (App Side)** - Executing the code when the AI asks for it.

---

## Phase 1: The Definition
In `supabase/functions/assistant-chat/index.ts`, we define the `tools` array. This is passed to OpenAI every time we create a Run.

To add a new tool, append a JSON object to this array:

```typescript
const tools = [
  {
    type: "function",
    function: {
      name: "log_milestone", // 1. Unique Name
      description: "Log a developmental milestone for a child", // 2. Description (AI uses this to decide)
      parameters: {
        type: "object",
        properties: {
          child_name: { 
            type: "string", 
            description: "The name of the child (e.g. Basem, Ahmed)" 
          },
          milestone_description: { 
            type: "string", 
            description: "What happened? (e.g. 'started walking', 'first smile')" 
          }
        },
        required: ["child_name", "milestone_description"]
      }
    }
  }
];
```

## Phase 2: The Handler
In the same file, inside the polling loop (where we check `run.status === 'requires_action'`), adding a handler for the new tool name.

```typescript
if (call.function.name === 'log_milestone') {
    const args = JSON.parse(call.function.arguments);
    
    // 1. Execute Logic (e.g., Database Insert)
    // You'll need to look up the child_id from the name first!
    const { data: child } = await supabase.from('children').select('id').eq('name', args.child_name).single();
    
    if (child) {
        await supabase.from('child_milestones').insert({
            child_id: child.id,
            description: args.milestone_description,
            // ... other fields
        });
        
        // 2. Return Output
        toolOutputs.push({
            tool_call_id: call.id,
            output: `Success: Logged that ${args.child_name} ${args.milestone_description}`
        });
    } else {
        toolOutputs.push({
            tool_call_id: call.id,
            output: `Error: Could not find child named ${args.child_name}`
        });
    }
}
```
