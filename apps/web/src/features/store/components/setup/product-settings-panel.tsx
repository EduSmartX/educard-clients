/**
 * Store setup > Products: every product EduCard offers the school as a card with its
 * pictures, status (draft / published) and what is still needed before it can be
 * published and ordered. Opening a card goes to the product's detail page.
 */
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, PenLine, RefreshCw } from 'lucide-react';
import type { CatalogProduct } from '@educard/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCatalog } from '../../hooks/use-store';
import { formatCurrency, storeProductSetupPath } from '../../utils/store-format';
import { ProductImageCarousel } from '../product-image-carousel';
import { StoreEmptyState } from '../store-empty-state';

function ProductSetupCard({ product }: { product: CatalogProduct }) {
  const navigate = useNavigate();
  const blockers = product.publish_blockers;
  const open = () => navigate(storeProductSetupPath(product.public_id));

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`Open ${product.name}`}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.target === event.currentTarget) {
          open();
        }
      }}
      className="bg-card flex cursor-pointer flex-col gap-3 rounded-xl border p-3 shadow-sm transition hover:border-sky-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
    >
      <ProductImageCarousel images={product.images} alt={product.name} className="h-44" />

      <div className="space-y-2 px-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="leading-tight font-semibold">{product.name}</h3>
          <span className="shrink-0 font-semibold">
            {product.kind === 'book_set' ? 'Per list' : formatCurrency(product.price)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="bg-sky-100 font-normal text-sky-800">
            {product.category_name}
          </Badge>
          {product.is_published ? (
            <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Published
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Draft</Badge>
          )}
          {product.is_customized && <Badge variant="outline">Customised</Badge>}
        </div>
        {!product.is_published && (
          <p
            className={
              blockers.length > 0
                ? 'text-sm text-amber-700 dark:text-amber-400'
                : 'text-sm text-emerald-700 dark:text-emerald-400'
            }
          >
            {blockers.length > 0 ? `Needs: ${blockers.join(', ')}` : 'Ready to publish'}
          </p>
        )}
      </div>

      <Button
        size="sm"
        variant={product.is_published ? 'outline' : 'default'}
        className="mt-auto w-full"
        onClick={(event) => {
          event.stopPropagation();
          open();
        }}
      >
        <PenLine className="mr-2 h-4 w-4" />
        {product.is_published ? 'View details' : 'Set up & publish'}
      </Button>
    </div>
  );
}

export function ProductSettingsPanel() {
  const { data, isLoading, refetch } = useCatalog({ page_size: 100 });
  const products = data?.data ?? [];
  const published = products.filter((product) => product.is_published).length;

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-80 w-full" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <StoreEmptyState
        title="Your store is not yet configured."
        description="{company} has not added any products for your school yet. They will appear here, ready for you to set up and publish."
        action={{ label: 'Refresh', icon: RefreshCw, onClick: () => void refetch() }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <ol className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {[
            'Open a product',
            'Fill in what EduCard needs',
            'Add your pictures and details',
            'Publish to start ordering',
          ].map((step, index, steps) => (
            <li key={step} className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold">
                {index + 1}
              </span>
              <span className="text-foreground">{step}</span>
              {index < steps.length - 1 && <span aria-hidden>→</span>}
            </li>
          ))}
        </ol>
        <Badge variant="secondary">
          {published} of {products.length} published
        </Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductSetupCard key={product.public_id} product={product} />
        ))}
      </div>
    </div>
  );
}
