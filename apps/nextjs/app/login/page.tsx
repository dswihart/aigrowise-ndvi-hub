import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";
import { authOptions } from "../../lib/auth";

export default async function LoginPage() {
	const session = await getServerSession(authOptions);
	if (session) {
		// Redirect based on user role
		const userRole = (session.user as any)?.role;
		if (userRole === "ADMIN") {
			redirect("/admin");
		} else {
			redirect("/dashboard");
		}
	}
	
	return (
		<div className="min-h-screen flex flex-col lg:flex-row">
			{/* Left side - Branding */}
			<div className="lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 flex flex-col justify-center items-center p-8 text-white">
				<div className="max-w-md text-center">
					<h1 className="text-4xl font-heading font-bold mb-4">
						🌱 Aigrowise
					</h1>
					<h2 className="text-2xl font-heading font-semibold mb-6">
						NDVI Hub
					</h2>
					<p className="text-lg opacity-90 leading-relaxed">
						Secure access to your agricultural NDVI imagery and vegetation analysis data. 
						Monitor crop health, track changes over time, and make data-driven decisions for your fields.
					</p>
				</div>
			</div>

			{/* Right side - Login Form */}
			<div className="lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
				<div className="w-full max-w-md">
					<div className="bg-white rounded-lg shadow-lg p-8">
						<div className="text-center mb-8">
							<h3 className="text-2xl font-heading font-semibold text-secondary-800 mb-2">
								Welcome Back
							</h3>
							<p className="text-secondary-600">
								Sign in to access your NDVI dashboard
							</p>
						</div>
						<LoginForm />
					</div>
					
					{/* Footer */}
					<p className="text-center text-sm text-secondary-500 mt-6">
						© 2025 Aigrowise. All rights reserved.
					</p>
				</div>
			</div>
		</div>
	);
}
