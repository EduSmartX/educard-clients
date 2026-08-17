import { MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedbackForm } from '../components/feedback-form';
import { FeedbackList } from '../components/feedback-list';
import { ReviewForm } from '../components/review-form';

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description="Tell us what is working, what is not, and how we can improve"
        icon={MessageSquare}
      />

      <Tabs defaultValue="submit" className="space-y-6">
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
