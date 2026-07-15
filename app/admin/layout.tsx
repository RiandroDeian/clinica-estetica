import { getSessao } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/sidebar";
import AdminTopbar from "@/components/admin/topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Georgia, serif" }}>
      <AdminSidebar role={sessao.role} permissoes={sessao.permissoes} />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <AdminTopbar user={sessao} />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
