import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2, ShoppingBag, ShoppingCart } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES } from '@/constants/app-config';
import { ProductCard } from '../components/product-card';
import { StoreEmptyState } from '../components/store-empty-state';
import { useCart, useCatalog } from '../hooks/use-store';
import { storeOrderPath, storeProductSetupPath } from '../utils/store-format';

const ALL_CATEGORIES = 'all';

/** Selected category reads as a light-blue pill rather than the default white tab. */
const CATEGORY_TAB_CLASS =
  'data-[state=active]:bg-sky-100 data-[state=active]:text-sky-800 data-[state=active]:shadow-none';

export default function StoreCatalogPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState(ALL_CATEGORIES);

  // Load the whole catalog once and filter locally, so every category tab stays visible.
  const { data, isLoading } = useCatalog({ page_size: 100 });
  const { data: cartResponse } = useCart();

  const allProducts = useMemo(() => data?.data ?? [], [data]);
  const products = useMemo(
    () =>
      category === ALL_CATEGORIES
        ? allProducts
        : allProducts.filter((product) => product.category_code === category),
    [allProducts, category]
  );
  const cartCount = cartResponse?.data?.item_count ?? 0;

  const categories = useMemo(() => {
    const unique = new Map<string, string>();
    for (const product of allProducts) {
      unique.set(product.category_code, product.category_name);
    }
    return Array.from(unique, ([code, name]) => ({ code, name }));
  }, [allProducts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store"
        description="Order ID cards, uniforms and supplies for your school"
        icon={ShoppingBag}
        actions={[
          {
            label: 'Store setup',
            icon: Settings2,
            variant: 'outline',
            onClick: () => navigate(ROUTES.STORE.SETUP),
          },
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
            <TabsTrigger value={ALL_CATEGORIES} className={CATEGORY_TAB_CLASS}>
              All
            </TabsTrigger>
            {categories.map((item) => (
              <TabsTrigger key={item.code} value={item.code} className={CATEGORY_TAB_CLASS}>
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
        <StoreEmptyState
          title="No products available yet"
          description="{company} has not added any store products for your school yet. Check back soon."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.public_id}
              product={product}
              onConfigure={(item) => navigate(storeOrderPath(item.public_id))}
              onSetup={(item) => navigate(storeProductSetupPath(item.public_id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
