import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import type { CatalogProduct } from '@educard/shared';
import { PageHeader } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES } from '@/constants/app-config';
import { ProductCard } from '../components/product-card';
import { ProductConfigDialog } from '../components/product-config-dialog';
import { useCart, useCatalog } from '../hooks/use-store';

const ALL_CATEGORIES = 'all';

export default function StoreCatalogPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [selected, setSelected] = useState<CatalogProduct | null>(null);

  const { data, isLoading } = useCatalog(
    category === ALL_CATEGORIES ? undefined : { category, page_size: 100 }
  );
  const { data: cartResponse } = useCart();

  const products = useMemo(() => data?.data ?? [], [data]);
  const cartCount = cartResponse?.data?.item_count ?? 0;

  const categories = useMemo(() => {
    const unique = new Map<string, string>();
    for (const product of products) {
      unique.set(product.category_code, product.category_name);
    }
    return Array.from(unique, ([code, name]) => ({ code, name }));
  }, [products]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store"
        description="Order ID cards, uniforms and supplies for your school"
        icon={ShoppingBag}
        actions={[
          {
            label: cartCount > 0 ? `Cart (${cartCount})` : 'Cart',
            icon: ShoppingCart,
            variant: 'outline',
            onClick: () => navigate(ROUTES.STORE.CART),
          },
        ]}
      />

      {categories.length > 0 && (
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList>
            <TabsTrigger value={ALL_CATEGORIES}>All</TabsTrigger>
            {categories.map((item) => (
              <TabsTrigger key={item.code} value={item.code}>
                {item.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-72 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <ShoppingBag className="text-muted-foreground mx-auto h-10 w-10" aria-hidden />
          <p className="mt-3 font-medium">No products available yet</p>
          <p className="text-muted-foreground text-sm">
            Your administrator has not enabled any store products for this school.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.public_id} product={product} onConfigure={setSelected} />
          ))}
        </div>
      )}

      <ProductConfigDialog
        product={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}
