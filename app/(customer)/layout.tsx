import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CustomerSidebar } from "@/components/customer/Sidebar";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Get workspace name for sidebar
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { workspace: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <CustomerSidebar workspaceName={membership?.workspace?.name} isAdmin={session.user.role === "ADMIN"} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
