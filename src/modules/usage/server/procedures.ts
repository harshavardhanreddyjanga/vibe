import { getUsageStatus } from "@/src/lib/usage";
import { createTRPCRouter, protectedProcedure } from "@/src/trpc/init";

export const usageRouter = createTRPCRouter({
  status: protectedProcedure.query(async () => {
    try {
      const result = await getUsageStatus();
      return result;
    } catch(error) {
      return null;
    }
  }),
});