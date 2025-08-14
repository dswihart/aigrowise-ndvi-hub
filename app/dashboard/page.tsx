import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");
	return (
		<div className="p-6">
			<h1 className="text-2xl font-semibold">Dashboard</h1>
			<p className="mt-2">Signed in as {session.user?.email ?? session.user?.name ?? "user"}</p>
		</div>
	);
}
