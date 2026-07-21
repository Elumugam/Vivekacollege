import type { Metadata } from "next";
import AdminDashboard from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard | Viveka College",
  description: "Secure dashboard for content, gallery, applications, and contact management.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
