import { requireAuth } from "@/lib/auth-helpers";
import { getUserFeatures } from "@/lib/feature-gates";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopBar } from "@/components/layout/top-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { FeatureProvider } from "./feature-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const features = await getUserFeatures(user.id);

  return (
    <FeatureProvider features={features}>
      <div className="flex h-screen">
        <SidebarNav user={user} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar user={user} />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-20 md:p-6 md:pb-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
          <MobileNav />
        </div>
      </div>
    </FeatureProvider>
  );
}
