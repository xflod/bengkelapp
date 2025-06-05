import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function ComingSoonPlaceholder({ featureName }: { featureName: string }) {
  return (
    <Card className="w-full max-w-md mx-auto text-center shadow-xl">
      <CardHeader>
        <CardTitle className="flex flex-col items-center gap-2 text-xl text-primary font-headline">
          <Construction className="w-12 h-12 text-accent" />
          Segera Hadir!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Fitur <span className="font-semibold text-foreground">{featureName}</span> sedang dalam pengembangan dan akan segera tersedia.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Terima kasih atas kesabaran Anda!
        </p>
      </CardContent>
    </Card>
  );
}
