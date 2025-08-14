### **Section 6: API Specification (tRPC)**

The API is defined by type-safe tRPC routers for `auth` and `image` procedures, combined in a main `appRouter`. Procedures are protected using `publicProcedure`, `protectedProcedure`, and `adminProcedure` middleware to ensure correct access levels.

***
