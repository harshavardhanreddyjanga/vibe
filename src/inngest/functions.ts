
// src/inngest/functions.ts
import { gemini, createAgent } from "@inngest/agent-kit";
import { inngest } from "./client";

import { Sandbox } from "@e2b/code-interpreter"
import { getSandbox } from "./utils";

export const helloWorld = inngest.createFunction(
 { id: "hello-world" ,triggers : { event: "test/hello.world" }},

  async ({ event, step }) => {

    const sandboxId = await step.run("get-sandbox-id",async()=>{
      const sandbox = await Sandbox.create("jangaharshavardhanreddy/vibe-nextjs-harsha-j2")
      return sandbox.sandboxId
    })



    const codeAgent = createAgent({
      name: "code-agent",
      system: "You are an expert next.js developer. you write readable,maintainable code. you write simple next.js snippets & React snippets",
      model: gemini({ model: "gemini-2.5-flash"})
    });
    const { output } = await codeAgent.run(
      `write the following snippet ${event.data.value}`,
    );
    // console.log(output);
    
    const sandboxUrl = await step.run("get-sandbox-url",async()=>{
      const sandbox = await getSandbox(sandboxId)
      const host =  sandbox.getHost(3000)
      return `https://${host}`
    })
    
    return { output,sandboxUrl };
  }
);
