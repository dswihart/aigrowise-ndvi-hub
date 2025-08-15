import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import ClientCreationForm from "./client-creation-form";

export default async function CreateClientPage() {
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
								🌱 Aigrowise Admin - Create Client
							</h1>
						</div>
						<div className="flex items-center space-x-4">
							<a 
								href="/admin" 
								className="text-sm text-secondary-600 hover:text-secondary-800"
							>
								← Back to Dashboard
							</a>
							<span className="text-sm text-secondary-600">
								{session.user?.email}
							</span>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-2xl mx-auto py-8 px-4">
				<ClientCreationForm />
			</main>
		</div>
	);
}