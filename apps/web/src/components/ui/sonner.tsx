import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          closeButton:
            'group-[.toast]:bg-white group-[.toast]:text-gray-600 group-[.toast]:border group-[.toast]:border-gray-300 group-[.toast]:hover:bg-gray-100 group-[.toast]:hover:text-gray-900 group-[.toast]:rounded-full group-[.toast]:shadow-sm',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
