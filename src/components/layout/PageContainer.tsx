
import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { SummaryLoadingProvider } from "@/context/summaryloading";
interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <SummaryLoadingProvider>
      <main className="flex-1 overflow-auto p-6 bg-background ">
        {children}
      </main>
      </SummaryLoadingProvider>
    </div>
  );
}
