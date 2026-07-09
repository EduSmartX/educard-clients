/**
 * Student Fee Discount Section
 * Edit discount and referral fields for a student fee.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StudentFeeDiscountSectionProps {
  discountPercentage: string;
  discountReason: string;
  referralName: string;
  referralCode: string;
  isSaving: boolean;
  onDiscountPercentageChange: (value: string) => void;
  onDiscountReasonChange: (value: string) => void;
  onReferralNameChange: (value: string) => void;
  onReferralCodeChange: (value: string) => void;
  onSave: () => void;
}

export function StudentFeeDiscountSection({
  discountPercentage,
  discountReason,
  referralName,
  referralCode,
  isSaving,
  onDiscountPercentageChange,
  onDiscountReasonChange,
  onReferralNameChange,
  onReferralCodeChange,
  onSave,
}: Readonly<StudentFeeDiscountSectionProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Discount & Referral</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="discount_percentage">Discount Percentage (%)</Label>
            <Input
              id="discount_percentage"
              type="number"
              min={0}
              max={100}
              value={discountPercentage}
              onChange={(e) => onDiscountPercentageChange(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount_reason">Discount Reason</Label>
            <Input
              id="discount_reason"
              value={discountReason}
              onChange={(e) => onDiscountReasonChange(e.target.value)}
              placeholder="e.g. Sibling discount"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referral_name">Referral Name</Label>
            <Input
              id="referral_name"
              value={referralName}
              onChange={(e) => onReferralNameChange(e.target.value)}
              placeholder="Referrer's name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referral_code">Referral Code</Label>
            <Input
              id="referral_code"
              value={referralCode}
              onChange={(e) => onReferralCodeChange(e.target.value)}
              placeholder="e.g. REF2024"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            variant="default"
            onClick={onSave}
            disabled={isSaving}
            className="min-w-32 gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            {isSaving ? 'Saving...' : 'Save Discount'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
