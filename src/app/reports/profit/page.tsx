import { PageHeader } from "@/components/shared/PageHeader";
import { ComingSoonPlaceholder } from "@/components/shared/ComingSoonPlaceholder";
import { Button } from "@/components/ui/button";
import { FileSliders } from "lucide-react";

export default function ProfitReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Laporan Keuntungan"
        description="Analisis keuntungan bengkel Anda."
        actions={
          <Button variant="outline">
            <FileSliders className="mr-2 h-4 w-4" />
            Filter Laporan
          </Button>
        }
      />
      <ComingSoonPlaceholder featureName="Laporan Keuntungan" />
    </div>
  );
}
