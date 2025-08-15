"use client";
import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { trpc } from "../src/utils/trpc";

function Providers({ children }: { children: ReactNode }) {
	return <SessionProvider>{children}</SessionProvider>;
}

export default trpc.withTRPC(Providers);
