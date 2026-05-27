import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  Code2,
  Loader2,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updatePreference, type OrganizationPreference } from '@/lib/api/preferences-api';
import { useOrganizationPreferences } from '../hooks/use-preferences';
import { AcademicYearSettingsForm } from './academic-year-settings-form';
import { PreferenceField } from './preference-field';
import { WorkingDayPolicyForm } from './working-day-policy-form';
import { CommonUiText, ErrorMessages, SuccessMessages, ToastTitles } from '@/constants';

// Category icons mapping
const categoryIcons: Record<string, string> = {
  student_management: '🎓',
  teacher_management: '👨‍🏫',
  leave_notifications: '🏖️',
  sms: '📱',
  attendance: '📊',
  exam_notifications: '📝',
  fee_notifications: '💰',
  homework_notifications: '📚',
  work_policy_notifications: '📋',
};

// Category display names
const categoryDisplayNames: Record<string, string> = {
  student_management: 'Student Management',
  teacher_management: 'Teacher Management',
  leave_notifications: 'Leave Notifications',
  sms: 'SMS & WhatsApp Notifications',
  attendance: 'Attendance Management',
  exam_notifications: 'Exam Notifications',
  fee_notifications: 'Fee Notifications',
  homework_notifications: 'HomeWork Notifications',
  work_policy_notifications: 'Exception WorkPolicy Notification',
};

interface PreferencesByCategoryProps {
  preferences: OrganizationPreference[];
}

function PreferencesByCategory({ preferences }: Readonly<PreferencesByCategoryProps>) {
  const queryClient = useQueryClient();
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [changedValues, setChangedValues] = useState<Record<string, string | string[]>>({});

  // Group preferences by category
  const groupedPreferences = preferences.reduce(
    (acc, pref) => {
      const category = pref.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(pref);
      return acc;
    },
    {} as Record<string, OrganizationPreference[]>
  );

  const updateMutation = useMutation({
    mutationFn: ({ publicId, value }: { publicId: string; value: string | string[] }) => {
      return updatePreference(publicId, value);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-preferences'] });
      setSavingStates((prev) => ({ ...prev, [variables.publicId]: false }));
      setChangedValues((prev) => {
        const newState = { ...prev };
        delete newState[variables.publicId];
        return newState;
      });
      toast.success(ToastTitles.SUCCESS, {
        description: SuccessMessages.PREFERENCES.UPDATED,
      });
    },
    onError: (error: Error, variables) => {
      setSavingStates((prev) => ({ ...prev, [variables.publicId]: false }));
      toast.error(ToastTitles.ERROR, {
        description: error?.message || ErrorMessages.UPDATE_FAILED,
      });
    },
  });

  const handlePreferenceChange = (publicId: string, value: string | string[]) => {
    setChangedValues((prev) => ({ ...prev, [publicId]: value }));
  };

  const handleSaveCategory = async (categoryPrefs: OrganizationPreference[]) => {
    const prefsToUpdate = categoryPrefs.filter((pref) => pref.public_id in changedValues);

    if (prefsToUpdate.length === 0) {
      toast.info(CommonUiText.NO_CHANGES, {
        description: 'No changes to save in this category.',
      });
      return;
    }

    // Mark all as saving
    const savingState = prefsToUpdate.reduce(
      (acc, pref) => {
        acc[pref.public_id] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );
    setSavingStates((prev) => ({ ...prev, ...savingState }));

    // Update all changed preferences
    for (const pref of prefsToUpdate) {
      await updateMutation.mutateAsync({
        publicId: pref.public_id,
        value: changedValues[pref.public_id],
      });
    }
  };

  if (Object.keys(groupedPreferences).length === 0) {
    return (
      <div className="py-20 text-center">
        <Settings className="mx-auto mb-4 h-16 w-16 text-gray-400" />
        <h3 className="mb-2 text-xl font-semibold text-gray-700">No Preferences Found</h3>
        <p className="text-gray-500">There are no organization preferences configured yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedPreferences).map(([category, categoryPrefs]) => {
        const hasChanges = categoryPrefs.some((pref) => pref.public_id in changedValues);
        const isSaving = categoryPrefs.some((pref) => savingStates[pref.public_id]);

        // Build parent-children groups based on depends_on
        const childrenByParentKey = categoryPrefs.reduce(
          (acc, pref) => {
            if (pref.depends_on) {
              if (!acc[pref.depends_on]) {
                acc[pref.depends_on] = [];
              }
              acc[pref.depends_on].push(pref);
            }
            return acc;
          },
          {} as Record<string, OrganizationPreference[]>
        );

        // Top-level preferences: those without a depends_on
        const topLevelPrefs = categoryPrefs.filter((p) => !p.depends_on);

        return (
          <Card key={category} className="border-gray-100 shadow-sm">
            <CardHeader className="border-b bg-gray-50/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryIcons[category] || '⚙️'}</span>
                  <CardTitle className="text-sm font-semibold text-gray-800">
                    {categoryDisplayNames[category] || category.replaceAll('_', ' ')}
                  </CardTitle>
                </div>
                {hasChanges && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                    {categoryPrefs.filter((p) => p.public_id in changedValues).length} unsaved
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="divide-y divide-gray-100">
                {topLevelPrefs.map((preference) => {
                  const children = childrenByParentKey[preference.key] || [];
                  const parentValue =
                    (changedValues[preference.public_id] as string) ?? (preference.value as string);
                  const isParentEnabled = parentValue === 'TRUE';

                  return (
                    <div key={preference.public_id}>
                      <PreferenceField
                        preference={preference}
                        value={changedValues[preference.public_id] ?? preference.value}
                        onChange={(value) => handlePreferenceChange(preference.public_id, value)}
                        disabled={savingStates[preference.public_id]}
                      />
                      {/* Compact dependent children */}
                      {children.length > 0 && (
                        <div
                          className={`ml-6 border-l-2 py-1 pl-3 transition-all duration-200 ${
                            isParentEnabled
                              ? 'border-blue-200 opacity-100'
                              : 'pointer-events-none border-gray-100 opacity-40'
                          }`}
                        >
                          {children.map((child) => (
                            <PreferenceField
                              key={child.public_id}
                              preference={child}
                              value={changedValues[child.public_id] ?? child.value}
                              onChange={(value) => handlePreferenceChange(child.public_id, value)}
                              disabled={!isParentEnabled || savingStates[child.public_id]}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {hasChanges && (
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                  <Button
                    variant="brandOutline"
                    onClick={() => {
                      const resetState = categoryPrefs.reduce(
                        (acc, pref) => {
                          if (pref.public_id in changedValues) {
                            delete acc[pref.public_id];
                          }
                          return acc;
                        },
                        { ...changedValues }
                      );
                      setChangedValues(resetState);
                      toast.info(CommonUiText.CHANGES_DISCARDED, {
                        description: 'All unsaved changes have been discarded.',
                      });
                    }}
                    disabled={isSaving}
                  >
                    {CommonUiText.DISCARD_CHANGES}
                  </Button>
                  <Button
                    variant="brand"
                    onClick={() => handleSaveCategory(categoryPrefs)}
                    disabled={isSaving}
                    className="min-w-[140px]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {CommonUiText.SAVING}
                      </>
                    ) : (
                      CommonUiText.SAVE_CHANGES
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function OrganizationPreferencesTabbed() {
  const {
    data: preferencesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrganizationPreferences();
  const [showDebug, setShowDebug] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-gray-400" />
        <p className="text-gray-600">Loading preferences...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error Loading Preferences</AlertTitle>
          <AlertDescription className="mt-2">
            {error?.message || 'Failed to load organization preferences. Please try again.'}
          </AlertDescription>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            {CommonUiText.RETRY}
          </Button>
        </Alert>
      </div>
    );
  }

  const preferences = preferencesData?.data || [];

  return (
    <div className="space-y-6">
      {/* Tabbed Interface */}
      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:inline-grid lg:w-auto">
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Organization Preferences</span>
            <span className="sm:hidden">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="working-day" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Working Day Policy</span>
            <span className="sm:hidden">Working Days</span>
          </TabsTrigger>
          <TabsTrigger value="academic-year" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Academic Year</span>
            <span className="sm:hidden">Academic</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences">
          <PreferencesByCategory preferences={preferences} />
        </TabsContent>

        <TabsContent value="working-day">
          <WorkingDayPolicyForm />
        </TabsContent>

        <TabsContent value="academic-year">
          <AcademicYearSettingsForm />
        </TabsContent>
      </Tabs>

      {/* Debug Panel — Inspect all preferences from the API */}
      <div className="border-t pt-4">
        <button
          type="button"
          onClick={() => setShowDebug((v) => !v)}
          className="flex items-center gap-2 text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
        >
          <Code2 className="h-3.5 w-3.5" />
          {showDebug ? 'Hide' : 'Show'} API Debug ({preferences.length} preferences loaded)
          {showDebug ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        {showDebug && (
          <div className="mt-3 max-h-[400px] overflow-auto rounded-lg border border-gray-200 bg-gray-900 p-4 text-xs">
            <table className="w-full text-left text-gray-300">
              <thead className="sticky top-0 border-b border-gray-700 bg-gray-900 text-gray-400">
                <tr>
                  <th className="pr-4 pb-2">#</th>
                  <th className="pr-4 pb-2">Key</th>
                  <th className="pr-4 pb-2">Display Name</th>
                  <th className="pr-4 pb-2">Category</th>
                  <th className="pr-4 pb-2">Type</th>
                  <th className="pr-4 pb-2">Value</th>
                  <th className="pr-4 pb-2">Depends On</th>
                </tr>
              </thead>
              <tbody>
                {preferences.map((pref, idx) => (
                  <tr key={pref.public_id} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="py-1.5 pr-4 text-gray-500">{idx + 1}</td>
                    <td className="py-1.5 pr-4 font-mono text-cyan-400">{pref.key}</td>
                    <td className="py-1.5 pr-4">{pref.display_name}</td>
                    <td className="py-1.5 pr-4">
                      <span className="rounded bg-gray-700 px-1.5 py-0.5">{pref.category}</span>
                    </td>
                    <td className="py-1.5 pr-4 text-yellow-400">{pref.field_type}</td>
                    <td className="py-1.5 pr-4 font-mono text-green-400">
                      {Array.isArray(pref.value) ? pref.value.join(', ') : String(pref.value)}
                    </td>
                    <td className="py-1.5 pr-4 font-mono text-orange-400">
                      {pref.depends_on || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
