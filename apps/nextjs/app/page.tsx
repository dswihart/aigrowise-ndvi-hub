import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    // Redirect based on user role
    const userRole = (session.user as any)?.role;
    if (userRole === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  } else {
    // Not authenticated, redirect to login
    redirect("/login");
  }
}
