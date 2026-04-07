import { email, z } from 'zod';
import { createTRPCRouter } from '../init';
import { inngest } from '@/src/inngest/client';
import { messageRouter } from '@/src/modules/messages/server/procedures';
 
export const appRouter = createTRPCRouter({
   messages : messageRouter,
   
});
 
// export type definition of API
export type AppRouter = typeof appRouter;