import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import ClientDashboard from "./client-dashboard";

export default async function DashboardPage() {
	const session = await getServerSession(authOptions);
	
	if (!session) {
		redirect("/login");
	}

	// Redirect admin users to admin dashboard
	const userRole = (session.user as any)?.role;
	if (userRole === "ADMIN") {
		redirect("/admin");
	}

	return <ClientDashboard session={session} />;
}
