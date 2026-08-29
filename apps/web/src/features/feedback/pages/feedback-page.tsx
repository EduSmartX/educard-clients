import { MessageSquare } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedbackForm } from '../components/feedback-form';
import { FeedbackList } from '../components/feedback-list';
import { ReviewForm } from '../components/review-form';

const FEEDBACK_TABS = ['submit', 'rate', 'history'];

export default function FeedbackPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') ?? '';
  const activeTab = FEEDBACK_TABS.includes(tabParam) ? tabParam : 'submit';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description="Tell us what is working, what is not, and how we can improve"
        icon={MessageSquare}
      />

      <Tabs
        value={activeTab}
        onValueChange={(tab) => setSearchParams({ tab }, { replace: true })}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="submit">Share feedback</TabsTrigger>
          <TabsTrigger value="rate">Rate us</TabsTrigger>
          <TabsTrigger value="history">My submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="submit">
          <FeedbackForm />
        </TabsContent>

        <TabsContent value="rate">
          <ReviewForm />
        </TabsContent>

        <TabsContent value="history">
          <FeedbackList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
