import { ImageOff, Plus } from 'lucide-react';
import type { CatalogProduct } from '@educard/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { formatCurrency } from '../utils/store-format';

interface ProductCardProps {
  product: CatalogProduct;
  onConfigure: (product: CatalogProduct) => void;
}

export function ProductCard({ product, onConfigure }: ProductCardProps) {
  const specs = Object.entries(product.specifications ?? {}).slice(0, 3);

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="bg-muted flex h-40 items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <ImageOff className="text-muted-foreground h-10 w-10" aria-hidden />
        )}
      </div>

      <CardContent className="flex-1 space-y-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="leading-tight font-semibold">{product.name}</h3>
            <p className="text-muted-foreground text-xs">{product.category_name}</p>
          </div>
          <Badge variant="secondary">{product.unit_label}</Badge>
        </div>

        {product.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">{product.description}</p>
        )}

        {specs.length > 0 && (
          <dl className="text-muted-foreground space-y-1 text-xs">
            {specs.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-2">
                <dt className="capitalize">{key.replace(/_/g, ' ')}</dt>
                <dd className="text-foreground font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        <span className="font-semibold">{formatCurrency(product.price)}</span>
        <Button size="sm" onClick={() => onConfigure(product)}>
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </CardFooter>
    </Card>
  );
}
