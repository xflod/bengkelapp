import { PageHeader } from "@/components/shared/PageHeader";
import { ComingSoonPlaceholder } from "@/components/shared/ComingSoonPlaceholder";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manajemen Penjualan"
        description="Catat transaksi penjualan jasa dan barang."
        actions={
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" />
            Transaksi Baru
          </Button>
        }
      />
      <ComingSoonPlaceholder featureName="Manajemen Penjualan" />
    </div>
  );
}
