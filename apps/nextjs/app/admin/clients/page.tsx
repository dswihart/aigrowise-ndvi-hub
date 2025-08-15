import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import ClientList from "./client-list";

export default async function ClientsPage() {
	const session = await getServerSession(authOptions);
	
	if (!session) {
		redirect("/login");
	}
	
	// Check if user has admin role
	const userRole = (session.user as any)?.role;
	if (userRole !== "ADMIN") {
		redirect("/dashboard");
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<h1 className="text-2xl font-heading font-bold text-secondary-800">
								🌱 Aigrowise Admin - Client Management
							</h1>
						</div>
						<div className="flex items-center space-x-4">
							<a 
								href="/admin" 
								className="text-sm text-secondary-600 hover:text-secondary-800"
							>
								← Back to Dashboard
							</a>
							<a 
								href="/admin/create-client" 
								className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
							>
								+ Add New Client
							</a>
							<span className="text-sm text-secondary-600">
								{session.user?.email}
							</span>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-6xl mx-auto py-8 px-4">
				<ClientList />
			</main>
		</div>
	);
}