import { ProjectView } from "@/src/modules/projects/ui/views/project-view";
import { getQueryClient, trpc } from "@/src/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";


interface props  {
    params : Promise<{
        projectId : string;
    }>
}

const Page = async ( { params } : props )=>{
    const { projectId } = await params;

    const queryClient = getQueryClient()
    void queryClient.prefetchQuery(trpc.messages.getMany.queryOptions({
        projectId,
    }));
    void queryClient.prefetchQuery(trpc.projects.getOne.queryOptions({
        id : projectId,
    }));

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
        
            <Suspense fallback = {<p>Loading</p>} >
                <ProjectView projectId={projectId} />
            </Suspense>
        </HydrationBoundary>
    )
}

export default Page;

