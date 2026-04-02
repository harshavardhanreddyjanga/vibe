"use client"
import { mutationOptions, useMutation } from "@tanstack/react-query";
import { useTRPC } from "../trpc/client"
import { Button } from "./components/ui/button"
import { Input } from "../components/ui/input";
import { useState } from "react";
 const Page = ()=>{
  const   [value,setValue] = useState("")
    const trpc = useTRPC();
    const invoke = useMutation(trpc.invoke.mutationOptions({}));
  return(
    <div>
      <Input value={value}  onChange={(e)=>setValue(e.target.value)}/>
        <Button onClick={()=>invoke.mutate({value : value})} >
            invoke background job
        </Button>
    </div> 
  )
 }

 export default Page