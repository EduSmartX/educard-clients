/**
 * Timetable Setup Page — Admin only
 *
 * Step-based management with visual guide:
 *   1. Class Groups — create groups and map classes
 *   2. Time Slots — define period structure per group (multi-day)
 *   3. View Timetable — see the grid and assign entries
 */

import { useState } from 'react';
import { Users, Clock, Calendar, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, HowItWorksDialog } from '@/components/common';
import { ClassGroupsTab } from '../components/class-groups-tab';
import { TimeSlotsTab } from '../components/time-slots-tab';
import { TimetableViewTab } from '../components/timetable-view-tab';

const STEPS = [
  {
    id: 'groups',
    label: 'Class Groups',
    icon: Users,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    ringColor: 'ring-emerald-400',
    description: 'Group classes that share the same schedule',
  },
  {
    id: 'slots',
    label: 'Time Slots',
    icon: Clock,
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    ringColor: 'ring-indigo-400',
    description: 'Define periods, breaks & timings',
  },
  {
    id: 'view',
    label: 'Add Timetable',
    icon: Calendar,
    color: 'from-violet-500 to-pink-500',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200',
    ringColor: 'ring-violet-400',
    description: 'Assign teachers/subjects to slots',
  },
] as const;

// How It Works content for Timetable Setup
const timetableHowItWorks = {
  title: 'How Timetable Setup Works',
  steps: [
    {
      title: 'Create Class Groups',
      description: (
        <>
          Group classes that share the same period structure. E.g., "Primary" (1st–5th), "Senior"
          (9th–10th). Classes in the same group have the same timings.
        </>
      ),
      color: 'green' as const,
    },
    {
      title: 'Define Time Slots',
      description: (
        <>
          For each group, set up periods, breaks, and assemblies. You can apply the same slot
          structure to <strong>multiple days at once</strong> (e.g., Mon–Fri).
        </>
      ),
    },
    {
      title: 'Assign Teachers & Subjects',
      description: (
        <>
          In the Add Timetable tab, select a class and assign teachers/subjects to each period. Each
          class gets its own assignments even within the same group.
        </>
      ),
    },
  ],
  tips: [
    {
      title: 'Teacher Conflict Prevention',
      description: (
        <>
          The system automatically prevents assigning the same teacher to two classes at the same
          time. If a conflict is detected, the assignment will be rejected.
        </>
      ),
    },
  ],
  warnings: [
    {
      title: 'Important Notes',
      items: [
        'Each class can only belong to one group',
        'Changing slots will remove existing entries for affected days',
        'Breaks and assemblies cannot have teacher/subject assignments',
      ],
    },
  ],
};

export default function TimetableSetupPage() {
  const [activeTab, setActiveTab] = useState('groups');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Timetable Management"
        description="Set up class groups, define time slots, and manage your school timetable"
      >
        <HowItWorksDialog {...timetableHowItWorks} />
      </PageHeader>

      {/* Step indicator */}
      <div className="flex items-center gap-3 overflow-x-auto">
        {STEPS.map((step, idx) => {
          const isActive = step.id === activeTab;
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex items-center gap-3">
              {idx > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />}
              <button
                type="button"
                onClick={() => setActiveTab(step.id)}
                className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? `${step.bgColor} ${step.textColor} ring-2 ${step.ringColor} shadow-sm`
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    isActive
                      ? `bg-gradient-to-br ${step.color} text-white shadow-sm`
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="hidden text-left sm:block">
                  <div className="text-xs leading-none font-bold">{step.label}</div>
                  <div className="mt-0.5 text-[10px] font-normal opacity-70">
                    {step.description}
                  </div>
                </div>
                <span className="sm:hidden">{step.label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-0">
        <TabsList className="sr-only">
          {STEPS.map((step) => (
            <TabsTrigger key={step.id} value={step.id}>
              {step.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="groups" className="mt-0">
          <ClassGroupsTab />
        </TabsContent>

        <TabsContent value="slots" className="mt-0">
          <TimeSlotsTab />
        </TabsContent>

        <TabsContent value="view" className="mt-0">
          <TimetableViewTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
