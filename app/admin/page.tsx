import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function AdminPage() {
	const session = await getServerSession(authOptions);
	const role = (session?.user as any)?.role;
	if (!session) redirect("/login");
	if (role !== "ADMIN") redirect("/");
	return (
		<div className="p-6">
			<h1 className="text-2xl font-semibold">Admin</h1>
			<p className="mt-2">Welcome, {session.user?.email}</p>
		</div>
	);
}
