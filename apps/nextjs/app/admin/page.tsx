import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import AdminDashboard from "./admin-dashboard";

export default async function AdminPage() {
	const session = await getServerSession(authOptions);
	
	if (!session) {
		redirect("/login");
	}
	
	// Check if user has admin role
	const userRole = (session.user as any)?.role;
	if (userRole !== "ADMIN") {
		redirect("/dashboard"); // Redirect non-admin users to regular dashboard
	}

	return <AdminDashboard session={session} />;
}
