"use client"

import { Fragment } from "@/src/generated/prisma/client"
import { ErrorBoundary } from "react-error-boundary";

import { Tabs,TabsContent,TabsList,TabsTrigger } from "@/src/components/ui/tabs"

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup
} from "../../../../components/ui/resizable"
import { MessagesContainer } from "../components/MessagesContainer"
import { act, Suspense, useState } from "react"
import { ProjectHeader } from "../components/project-header"
import { FragmentWeb } from "../components/fragment-web"
import { CodeIcon, CrownIcon, EyeIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { FileExplorer } from "@/src/components/file-explorer"
import { UserControl } from "@/src/components/user-control"
import { useAuth } from "@clerk/nextjs"

interface props{
    projectId : string
}

export const ProjectView = ( {projectId} :props )=>{

    const { has } = useAuth();
    const hasProAccess = has?.({plan : "pro"});

    const [activeFragment,setActiveFragement] = useState<Fragment | null>(null)

    const [tabState,setTabState] = useState<"preview" | "code"  >("preview")
    
    return(
        <div className="h-screen">
            <ResizablePanelGroup dir="horizontal">
                <ResizablePanel
                    defaultSize={35}
                    minSize={20}
                    className="flex flex-col min-h-0 "
                >
                  <ErrorBoundary fallback={<p>Error!</p>}>
                    <Suspense fallback ={<p>Loading messages...</p>} >
                        <ProjectHeader projectId={projectId}/>
                        </Suspense>
                    </ErrorBoundary>
                  <ErrorBoundary fallback={<p>Error!</p>}>

                    <Suspense fallback ={<p>Loading messages...</p>} >
                      <MessagesContainer
                      projectId = {projectId} 
                        activeFragment = {activeFragment}
                        setActiveFragement= {setActiveFragement}
                      />
                      </Suspense>
                  </ErrorBoundary>
                </ResizablePanel>
                <ResizableHandle withHandle/>
                <ResizablePanel
                    defaultSize={65}
                    minSize={20}
                >
                    <Tabs
            className="h-full gap-y-0 flex flex-col"
            defaultValue="preview"
            value={tabState}
            onValueChange={(value) => setTabState(value as "preview" | "code")}
          >
            <div className="w-full h-8 flex items-center p-2 border-b gap-x-2">
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon /> <span>Demo</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <CodeIcon /> <span>Code</span>
                </TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-x-2">
                {!hasProAccess && (
                  <Button asChild size="sm" variant="tertiary">
                    <Link href="/pricing">
                      <CrownIcon /> Upgrade
                    </Link>
                  </Button>
                )}
                <UserControl />
              </div>
            </div>
            <TabsContent value="preview">
              {!!activeFragment && <FragmentWeb data={activeFragment} />}
            </TabsContent>
            <TabsContent value="code" className="min-h-0">
              {!!activeFragment?.files && (
                <FileExplorer
                  files={activeFragment.files as { [path: string]: string }}
                />
              )}
            </TabsContent>
          </Tabs>
                </ResizablePanel>
            </ResizablePanelGroup> 
        </div>
    )
}