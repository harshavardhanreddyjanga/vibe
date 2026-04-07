"use client"
import { mutationOptions, useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "../trpc/client"
import { Button } from "./components/ui/button"
import { Input } from "../components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
 const Page = ()=>{
  const   [value,setValue] = useState("")
    const trpc = useTRPC();
    const createMesssage = useMutation(trpc.messages.create.mutationOptions({
      onSuccess : ()=>{
        toast.success("message created")
      }
    }));
    const { data : messages } = useQuery(trpc.messages.getMany.queryOptions())
  return(
    <div>
      <Input value={value}  onChange={(e)=>setValue(e.target.value)}/>
        <Button disabled = {createMesssage.isPending}
                onClick={()=>createMesssage.mutate({value : value})}
         >
            invoke background job
        </Button>
        {JSON.stringify(messages,null,2)}
    </div> 
  )
 }

 export default Page