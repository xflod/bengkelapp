import { PageHeader } from "@/components/shared/PageHeader";
import { ComingSoonPlaceholder } from "@/components/shared/ComingSoonPlaceholder";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Jadwal Servis"
        description="Atur dan lihat jadwal servis pelanggan."
        actions={
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <CalendarPlus className="mr-2 h-4 w-4" />
            Buat Jadwal Baru
          </Button>
        }
      />
      <ComingSoonPlaceholder featureName="Jadwal Servis" />
    </div>
  );
}
