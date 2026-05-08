import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, BookOpen, Calendar, Loader2, RefreshCw, Settings } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updatePreference, type OrganizationPreference } from '@/lib/api/preferences-api';
import { useOrganizationPreferences } from '../hooks/use-preferences';
import { AcademicYearSettingsForm } from './academic-year-settings-form';
import { PreferenceField } from './preference-field';
import { WorkingDayPolicyForm } from './working-day-policy-form';
import { CommonUiText, ErrorMessages, SuccessMessages, ToastTitles } from '@/constants';

// Category icons mapping
const categoryIcons: Record<string, string> = {
  attendance: '📊',
  authentication: '🔐',
  notifications: '🔔',
  security: '🛡️',
  general: '⚙️',
};

// Category descriptions
const categoryDescriptions: Record<string, string> = {
  attendance: 'Configure attendance tracking, approval workflows, and absence notifications',
  authentication: 'Manage authentication settings, email verification, and password policies',
  notifications: 'Control notification delivery, timing, and delivery methods',
  security: 'Security and access control settings for your organization',
  general: 'General organization settings and configurations',
};

interface PreferencesByCategoryProps {
  preferences: OrganizationPreference[];
}

function PreferencesByCategory({ preferences }: PreferencesByCategoryProps) {
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
    mutationFn: async ({ publicId, value }: { publicId: string; value: string | string[] }) => {
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
    <div className="space-y-6">
      {Object.entries(groupedPreferences).map(([category, categoryPrefs]) => {
        const hasChanges = categoryPrefs.some((pref) => pref.public_id in changedValues);
        const isSaving = categoryPrefs.some((pref) => savingStates[pref.public_id]);

        // Group preferences by field type within category
        const radioPrefs = categoryPrefs.filter((p) => p.field_type === 'radio');
        const textPrefs = categoryPrefs.filter(
          (p) => p.field_type === 'string' || p.field_type === 'number'
        );
        const timePrefs = categoryPrefs.filter((p) => p.field_type === 'time');
        const choicePrefs = categoryPrefs.filter((p) => p.field_type === 'choice');
        const multiChoicePrefs = categoryPrefs.filter((p) => p.field_type === 'multi-choice');

        return (
          <Card key={category} className="border-gray-200 shadow-sm">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-2xl shadow-sm">
                    {categoryIcons[category] || '⚙️'}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold capitalize text-gray-900">
                      {category.replace(/_/g, ' ')}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-gray-500">
                      {categoryDescriptions[category] || 'Configure settings for this category'}
                    </CardDescription>
                  </div>
                </div>
                {hasChanges && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    {categoryPrefs.filter((p) => p.public_id in changedValues).length} unsaved
                    changes
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 overflow-hidden">
                {/* Boolean/Radio Fields */}
                {radioPrefs.map((preference) => (
                  <PreferenceField
                    key={preference.public_id}
                    preference={preference}
                    value={changedValues[preference.public_id] ?? preference.value}
                    onChange={(value) => handlePreferenceChange(preference.public_id, value)}
                    disabled={savingStates[preference.public_id]}
                  />
                ))}

                {/* Text/Number Fields */}
                {textPrefs.map((preference) => (
                  <PreferenceField
                    key={preference.public_id}
                    preference={preference}
                    value={changedValues[preference.public_id] ?? preference.value}
                    onChange={(value) => handlePreferenceChange(preference.public_id, value)}
                    disabled={savingStates[preference.public_id]}
                  />
                ))}

                {/* Time Picker Fields */}
                {timePrefs.map((preference) => (
                  <PreferenceField
                    key={preference.public_id}
                    preference={preference}
                    value={changedValues[preference.public_id] ?? preference.value}
                    onChange={(value) => handlePreferenceChange(preference.public_id, value)}
                    disabled={savingStates[preference.public_id]}
                  />
                ))}

                {/* Choice/Dropdown Fields */}
                {choicePrefs.map((preference) => (
                  <PreferenceField
                    key={preference.public_id}
                    preference={preference}
                    value={changedValues[preference.public_id] ?? preference.value}
                    onChange={(value) => handlePreferenceChange(preference.public_id, value)}
                    disabled={savingStates[preference.public_id]}
                  />
                ))}

                {/* Multi-Choice Fields */}
                {multiChoicePrefs.map((preference) => (
                  <PreferenceField
                    key={preference.public_id}
                    preference={preference}
                    value={changedValues[preference.public_id] ?? preference.value}
                    onChange={(value) => handlePreferenceChange(preference.public_id, value)}
                    disabled={savingStates[preference.public_id]}
                  />
                ))}
              </div>

              {hasChanges && (
                <div className="flex items-center justify-end gap-3 border-t pt-4">
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
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
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
    </div>
  );
}
