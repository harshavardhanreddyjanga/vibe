
// src/inngest/functions.ts
import {  gemini, createAgent, createTool, createNetwork, openai, type Tool, Message, createState } from "@inngest/agent-kit";
import { inngest } from "./client";

import { Sandbox } from "@e2b/code-interpreter"
import { getSandbox, lastAssistantTextMessageContent, parseAgentOutput } from "./utils";
import z, { file } from "zod";
import { PROMPT, FRAGMENT_TITLE_PROMPT,RESPONSE_PROMPT } from "../prompt";
import prisma from "../lib/db";
import { SANDBOX_TIMEOUT } from "./types";

interface AgentState{
  summary : string,
  files : { [path : string] : string}
}

export const codeAgentFunction = inngest.createFunction(
 { id: "code-agent" ,triggers : { event: "code-agent/run" }},

  async ({ event, step }) => {

    const sandboxId = await step.run("get-sandbox-id",async()=>{
      const sandbox = await Sandbox.create("jangaharshavardhanreddy/vibe-nextjs-harsha-j2")
      //  await sandbox.setTimeout(SANDBOX_TIMEOUT)
      return sandbox.sandboxId
    })

    const previousMessages = await step.run("get-previous-messages",async()=>{
      const formattedMessages : Message[] = []
      
      const messages = await prisma.message.findMany({
        where : {
          projectId : event.data.projectId,
        },
        orderBy:{
          createdAt:"desc"
        },
        take : 5
      })

      for(const message of messages ){
        formattedMessages.push({
          type : "text",
          role : message.role === "ASSISSTANT" ? "assistant" : "user",
          content : message.content
        })
      }
       return formattedMessages.reverse()
    })

    const state = createState<AgentState>(
      {
        summary:"",
        files:{}
      },
      {
        messages:previousMessages,
      }
  )

    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description : "An expert coding agent",
      system: PROMPT,
      model: openai({
          model: "llama-3.1-8b-instant",
          apiKey:process.env.OPENAI_API_KEY,
          baseUrl:"https://api.groq.com/openai/v1",
        }),
      tools : [
        createTool({
          name : "terminal",
          description : "use the terminal to run the commands",
          parameters : z.object({
            command : z.string()
          }),
          handler : async( {command},{step} )=>{
            return await step?.run("terminal",async()=>{

              const buffers = {stdout : "",stderr:""};
              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command,{
                  onStdout : (data:string)=>{
                    buffers.stdout+=data
                  },
                  onStderr : (data:string)=>{
                    buffers.stderr+=data
                  }
                });
                return result.stdout
              } catch (error) {
                console.error(`Command failed ${error} \n ${buffers.stderr}\n ${buffers.stderr}`)
                return `Command failed ${error} \n ${buffers.stderr}\n ${buffers.stderr}`
              }
            })
          }
        }),
        createTool({
            name:"createOrUpdateFiles",
            description : "create or update files inside a sandbox",
            parameters : z.object({
              files : z.array(
                z.object({
                  path : z.string(),
                  content : z.string()
                })
              )
            }),
            handler : async( {files},{ step,network } : Tool.Options<AgentState> )=>{
              const newFiles = await step?.run("createOrUpdateFiles", async()=>{
                try {
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await getSandbox(sandboxId);
                  for(const file of files){
                    await sandbox.files.write(file.path,file.content)
                    updatedFiles[file.path] = file.content;
                  }
                  return updatedFiles;
                } catch (e) {
                  return "Error: "+e;
                }
              } );
              if(typeof newFiles == "object"){
                network.state.data.files = newFiles;
              }
            }
        }),
        createTool({
          name : "readFiles",
          description : "Read files from the sandbox",
          parameters : z.object({
            files : z.array(z.string())
          }),
          handler : async ({ files },{step})=>{
            return await step?.run("readFiles",async()=>{
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files){
                  const content = await sandbox.files.read(file);
                  contents.push({path : file,content})
                }
                return JSON.stringify(contents);

              } catch (e) {
                return "Error: "+e;
              }
            })
          }
        })
      ],
      lifecycle:{
        onResponse : async ({result,network})=>{
          const lastAssistantMessageText = lastAssistantTextMessageContent(result)
          if(lastAssistantMessageText && network){
            if(lastAssistantMessageText.includes("<task_summary>")){
              network.state.data.summary = lastAssistantMessageText
            }
          }
          return result;
        }
      }
    });

    const network = createNetwork<AgentState>({
      name : "coding-agent-network",
      agents : [codeAgent],
      maxIter : 15,
      defaultState:state,
      router:async({network})=>{
        const summary = network.state.data.summary;
        if(summary){
          return ;
        }
        return codeAgent
      }
    })

     const  result = await network.run(event.data.value,{state});

     const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      description: "A fragment title generator",
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({ 
         model: "llama-3.1-8b-instant",
          apiKey:process.env.OPENAI_API_KEY,
          baseUrl:"https://api.groq.com/openai/v1",
      }),
    })

    const responseGenerator = createAgent({
      name: "response-generator",
      description: "A response generator",
      system: RESPONSE_PROMPT,
      model: openai({ 
         model: "llama-3.1-8b-instant",
          apiKey:process.env.OPENAI_API_KEY,
          baseUrl:"https://api.groq.com/openai/v1",
      }),
    });

    const { 
      output: fragmentTitleOuput
    } = await fragmentTitleGenerator.run(result.state.data.summary);
    const { 
      output: responseOutput
    } = await responseGenerator.run(result.state.data.summary);


    const isError = !result?.state.data.summary || Object.keys(result.state.data.files || {}).length ==0
    
    const sandboxUrl = await step.run("get-sandbox-url",async()=>{
      const sandbox = await getSandbox(sandboxId)
      const host =  sandbox.getHost(3000)
      return `https://${host}`
    })

    await step.run("save-result", async () => {
      if(isError){
        return await prisma.message.create({
          data : {
            projectId : event.data.projectId,
            content : "somenthing went wrong, please try again",
            role : "ASSISSTANT",
            type : "ERROR" 
          }
        })
      }
      return prisma.message.create({
        data : {
          projectId : event.data.projectId,
          content : parseAgentOutput(responseOutput.choices[0].message.content),
          role : "ASSISSTANT",
          type : "RESULT",
          fragment : {
            create:{
              sandboxUrl : sandboxUrl,
              title :  parseAgentOutput(fragmentTitleOuput.choices[0].message.content),
              files : result?.state.data.files
            }
          }
        }
      })
    });
    
    return { 
       url : sandboxUrl,
       title : "Fragment",
       files : result.state.data.files,
       summary : result.state.data.summary
     };
  }
);
