import { email, z } from 'zod';
import { createTRPCRouter } from '../init';
import { inngest } from '@/src/inngest/client';
import { messageRouter } from '@/src/modules/messages/server/procedures';
import { projectsRouter } from '@/src/modules/projects/server/procedures';
import { usageRouter } from '@/src/modules/usage/server/procedures';
 
export const appRouter = createTRPCRouter({
   messages : messageRouter,
   projects: projectsRouter,
   usage : usageRouter,
});
 
// export type definition of API
export type AppRouter = typeof appRouter;