import { inngest } from "@/src/inngest/client";
import prisma from "@/src/lib/db";
import { protectedProcedure, createTRPCRouter } from "@/src/trpc/init";
import z from "zod";
import { generateSlug } from 'random-word-slugs'
import { TRPCError } from "@trpc/server";
import { consumeCredits } from "@/src/lib/usage";

export const projectsRouter = createTRPCRouter({
    getOne : protectedProcedure
    .input(
        z.object({
            id : z.string().min(1,{message : "id is required"})
        })
    )
    .query(async ( {input ,ctx } )=>{
        const existingProject = await prisma.project.findUnique({
            where:{
                id : input.id,
                userId : ctx.auth.userId,
            }
        })
        if(!existingProject){
            throw new TRPCError({code:"NOT_FOUND",message:"project not found"})
        }
       
        return existingProject;
    }),
    getMany : protectedProcedure
    .query(async ({ctx})=>{
        const projects = await prisma.project.findMany({
            where:{
                userId : ctx.auth.userId,
            },
            orderBy:{
                updatedAt:"asc"
            }
        })
        return projects;
    }),
    create : protectedProcedure
    .input(
        z.object({
            value : z.string()
                    .min(1,{message : "value is required"})
                    .max(10000,{message: "value is too long"})
        })
    )
    .mutation(async({input,ctx}) =>{

          try {
                    const result  = await consumeCredits();
                    console.log("result",result)
                } catch (error) {
                    if (error instanceof Error) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: "Something went wrong" });
                    } else {
                    throw new TRPCError({
                        code: "TOO_MANY_REQUESTS",
                        message: "You have run out of credits"
                    });
                    }
                }

        const createdProject = await prisma.project.create({
            data:{
                name:generateSlug(2,{
                    format:"kebab"
                }),
                userId : ctx.auth.userId,
                messages:{
                    create:{
                         content : input.value,
                         role : "USER",
                         type : "RESULT"
                    }
                }
            }
        })
       
         await inngest.send({
              name : "code-agent/run",
              data : {
                value : input.value,
                projectId : createdProject.id
              }
            })
            return createdProject;
    } )
})