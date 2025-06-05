import { PageHeader } from "@/components/shared/PageHeader";
import { ComingSoonPlaceholder } from "@/components/shared/ComingSoonPlaceholder";
import { Button } from "@/components/ui/button";
import { PackagePlus } from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manajemen Inventaris"
        description="Kelola stok barang, suku cadang, dan item etalase."
        actions={
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PackagePlus className="mr-2 h-4 w-4" />
            Tambah Item Baru
          </Button>
        }
      />
      <ComingSoonPlaceholder featureName="Manajemen Inventaris" />
    </div>
  );
}
