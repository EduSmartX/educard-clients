/**
 * Store setup > Products: every product EduCard offers the school, its status
 * (draft / published) and what is still needed before it can be published and ordered.
 */
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ImageOff, PenLine, ShoppingBag } from 'lucide-react';
import type { CatalogProduct } from '@educard/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getMediaUrl } from '@/lib/utils/media-utils';
import { useCatalog } from '../../hooks/use-store';
import { storeProductSetupPath } from '../../utils/store-format';

function ProductSetupRow({ product }: { product: CatalogProduct }) {
  const navigate = useNavigate();
  const blockers = product.publish_blockers;

  return (
    <div className="bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="bg-muted flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
        {product.image_url ? (
          <img
            src={getMediaUrl(product.image_url)}
            alt=""
            className="h-full w-full object-contain"
          />
        ) : (
          <ImageOff className="text-muted-foreground h-6 w-6" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{product.name}</p>
          {product.is_published ? (
            <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Published
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Draft</Badge>
          )}
          {product.is_customized ? (
            <Badge variant="outline">Customised</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground font-normal">
              EduCard default
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">{product.category_name}</p>
        {!product.is_published && (
          <p className="text-sm">
            {blockers.length > 0 ? (
              <span className="text-amber-700 dark:text-amber-400">
                Needs: {blockers.join(', ')}
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400">Ready to publish</span>
            )}
          </p>
        )}
      </div>

      <Button
        variant={product.is_published ? 'outline' : 'default'}
        onClick={() => navigate(storeProductSetupPath(product.public_id))}
      >
        <PenLine className="mr-2 h-4 w-4" />
        {product.is_published ? 'Edit' : 'Set up & publish'}
      </Button>
    </div>
  );
}

export function ProductSettingsPanel() {
  const { data, isLoading } = useCatalog({ page_size: 100 });
  const products = data?.data ?? [];
  const published = products.filter((product) => product.is_published).length;

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <ShoppingBag className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
        <p className="mt-2 text-sm font-medium">No products to set up</p>
        <p className="text-muted-foreground text-sm">
          EduCard has not offered any products to your school yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          Review each product, fill in what EduCard needs, then publish it to start ordering.
        </p>
        <Badge variant="secondary">
          {published} of {products.length} published
        </Badge>
      </div>
      <div className="space-y-3">
        {products.map((product) => (
          <ProductSetupRow key={product.public_id} product={product} />
        ))}
      </div>
    </div>
  );
}
