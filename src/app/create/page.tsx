import { SiteHeader } from "@/components/SiteHeader";
import { CreateWizard } from "@/components/CreateWizard";

export default function CreatePage() {
  return (
    <>
      <div className="no-print">
        <SiteHeader compact />
      </div>
      <main className="flex-1">
        <CreateWizard />
      </main>
    </>
  );
}
