import { useMemo, useState } from 'react';
import { Lock, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { type NotificationCategory, type NotificationPreferenceRow } from '@educard/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error-handler';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../hooks/use-notifications';

type Draft = Record<string, { in_app_enabled: boolean; push_enabled: boolean }>;

function toDraft(rows: NotificationPreferenceRow[]): Draft {
  return rows.reduce<Draft>((acc, row) => {
    acc[row.category] = {
      in_app_enabled: row.in_app_enabled,
      push_enabled: row.push_enabled,
    };
    return acc;
  }, {});
}

export function NotificationPreferencesPanel() {
  const { data, isLoading, isError } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const rows = useMemo(() => data?.data?.preferences ?? [], [data]);
  const serverMasterSwitch = data?.data?.notifications_enabled ?? true;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [masterSwitch, setMasterSwitch] = useState<boolean | null>(null);
  const effective = draft ?? toDraft(rows);
  const effectiveMaster = masterSwitch ?? serverMasterSwitch;

  const isDirty =
    effectiveMaster !== serverMasterSwitch ||
    rows.some(
      (row) =>
        effective[row.category]?.in_app_enabled !== row.in_app_enabled ||
        effective[row.category]?.push_enabled !== row.push_enabled
    );

  const toggle = (
    category: NotificationCategory,
    channel: 'in_app_enabled' | 'push_enabled',
    value: boolean
  ) => {
    setDraft({
      ...effective,
      [category]: { ...effective[category], [channel]: value },
    });
  };

  const handleSave = () => {
    const payload = rows
      .filter((row) => !row.is_locked)
      .map((row) => ({
        category: row.category,
        in_app_enabled: effective[row.category].in_app_enabled,
        push_enabled: effective[row.category].push_enabled,
      }));

    updatePreferences.mutate(
      { notifications_enabled: effectiveMaster, preferences: payload },
      {
        onSuccess: (response) => {
          setDraft(null);
          setMasterSwitch(null);
          toast.success(response.message || 'Notification preferences updated');
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, 'Failed to update preferences'));
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {['a', 'b', 'c', 'd'].map((key) => (
          <Skeleton key={key} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-rose-600">
          We could not load your notification preferences. Please try again.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-6">
          <div>
            <p className="text-sm font-semibold text-slate-900">All notifications</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Turning this off silences every optional category. Security and account alerts are
              always delivered.
            </p>
          </div>
          <Switch
            aria-label="All notifications"
            checked={effectiveMaster}
            disabled={updatePreferences.isPending}
            onCheckedChange={setMasterSwitch}
          />
        </CardContent>
      </Card>

      <Card className={cn(!effectiveMaster && 'opacity-60')}>
        <CardHeader>
          <CardTitle className="text-base">Delivery channels</CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5" />
            Push notifications are delivered to your registered EduCard mobile app. Browser push is
            not supported.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 p-0">
          <div className="hidden items-center px-6 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase sm:flex">
            <span className="flex-1">Category</span>
            <span className="w-24 text-center">In-app</span>
            <span className="w-28 text-center">Mobile push</span>
          </div>

          {rows.map((row) => (
            <div
              key={row.category}
              className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{row.label}</p>
                  {row.is_locked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      <Lock className="h-3 w-3" />
                      Always on
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{row.description}</p>
              </div>

              <div className="flex items-center gap-8 sm:gap-0">
                <div className="flex w-24 justify-center">
                  <Switch
                    aria-label={`${row.label} in-app notifications`}
                    checked={effective[row.category]?.in_app_enabled ?? true}
                    disabled={row.is_locked || !effectiveMaster || updatePreferences.isPending}
                    onCheckedChange={(value) => toggle(row.category, 'in_app_enabled', value)}
                  />
                </div>
                <div className="flex w-28 justify-center">
                  <Switch
                    aria-label={`${row.label} mobile push notifications`}
                    checked={effective[row.category]?.push_enabled ?? true}
                    disabled={row.is_locked || !effectiveMaster || updatePreferences.isPending}
                    onCheckedChange={(value) => toggle(row.category, 'push_enabled', value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          disabled={!isDirty || updatePreferences.isPending}
          onClick={() => {
            setDraft(null);
            setMasterSwitch(null);
          }}
        >
          Reset
        </Button>
        <Button
          variant="brand"
          disabled={!isDirty || updatePreferences.isPending}
          onClick={handleSave}
        >
          {updatePreferences.isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
