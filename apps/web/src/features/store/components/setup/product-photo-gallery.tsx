/**
 * A product's photos for the whole school or for one class. The starred (primary)
 * photo is the one shown in the catalog and the cart, and is sent with the order so
 * EduCard makes exactly that look.
 */
import { useRef } from 'react';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage, type ProductPhoto } from '@educard/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/utils/media-utils';
import {
  useAddProductPhoto,
  useRemoveProductPhoto,
  useSetPrimaryProductPhoto,
} from '../../hooks/use-store';

/** EduCard's per-scope cap (StoreLimits.MAX_PRODUCT_IMAGES). */
const MAX_PHOTOS = 5;

interface ProductPhotoGalleryProps {
  productPublicId: string;
  photos: ProductPhoto[];
  /** Any section of the grade; omit for school-wide photos. */
  classPublicId?: string;
  emptyHint: string;
  /** EduCard's pictures, shown (read-only) while the school has none of its own. */
  fallbackImages?: string[];
}

export function ProductPhotoGallery({
  productPublicId,
  photos,
  classPublicId,
  emptyHint,
  fallbackImages = [],
}: ProductPhotoGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const add = useAddProductPhoto(productPublicId);
  const makePrimary = useSetPrimaryProductPhoto(productPublicId);
  const remove = useRemoveProductPhoto(productPublicId);

  const onError = (error: unknown) => toast.error(getErrorMessage(error, 'Something went wrong'));

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }
    add.mutate(
      { image: file, class_public_id: classPublicId },
      { onSuccess: () => toast.success('Photo added'), onError }
    );
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {photos.length === 0 ? (
        <div className="space-y-2">
          {emptyHint && <p className="text-muted-foreground text-xs">{emptyHint}</p>}
          {fallbackImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {fallbackImages.map((url, index) => (
                <div key={url} className="bg-muted relative overflow-hidden rounded-md border">
                  <img
                    src={getMediaUrl(url)}
                    alt={`EduCard picture ${index + 1}`}
                    className="aspect-square w-full object-contain"
                    loading="lazy"
                  />
                  <span className="absolute top-1 left-1 rounded bg-slate-900/70 px-1.5 text-[10px] font-medium text-white">
                    {index === 0 ? 'EduCard · shown' : 'EduCard'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.public_id}
              className={cn(
                'group bg-muted relative overflow-hidden rounded-md border',
                photo.is_primary && 'ring-primary ring-2'
              )}
            >
              <img
                src={getMediaUrl(photo.image_url)}
                alt={photo.caption || 'Product photo'}
                className="aspect-square w-full object-contain"
                loading="lazy"
              />
              {photo.is_primary && (
                <span className="bg-primary text-primary-foreground absolute top-1 left-1 rounded px-1.5 text-[10px] font-medium">
                  Shown
                </span>
              )}
              <div className="absolute right-1 bottom-1 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                {!photo.is_primary && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    aria-label="Show this photo"
                    title="Show this photo in the catalog"
                    disabled={makePrimary.isPending}
                    onClick={() => makePrimary.mutate(photo.public_id, { onError })}
                  >
                    <Star className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  aria-label="Remove photo"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(photo.public_id, { onError })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={add.isPending || photos.length >= MAX_PHOTOS}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="mr-1 h-4 w-4" />
        {add.isPending ? 'Uploading…' : 'Add photo'}
      </Button>
      {photos.length >= MAX_PHOTOS && (
        <p className="text-muted-foreground text-xs">
          Up to {MAX_PHOTOS} photos. Remove one first.
        </p>
      )}
    </div>
  );
}
