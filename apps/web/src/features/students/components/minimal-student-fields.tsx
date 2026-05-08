import type { Control } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TextInputField, GenderField } from '@/components/forms';
import { FormPlaceholders } from '@/constants';
import type { StudentFormData } from '../schemas/student-form-schema';

interface MinimalStudentFieldsProps {
  control: Control<StudentFormData>;
  disabled?: boolean;
}

export function MinimalStudentFields({ control, disabled = false }: MinimalStudentFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information (Required Fields Only)</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInputField
          control={control}
          name="first_name"
          label="First Name"
          placeholder={FormPlaceholders.ENTER_FIRST_NAME}
          disabled={disabled}
          required
          validationType="name"
          validationOptions={{ fieldName: 'First name' }}
        />
        <TextInputField
          control={control}
          name="last_name"
          label="Last Name"
          placeholder={FormPlaceholders.ENTER_LAST_NAME}
          disabled={disabled}
          required
          validationType="name"
          validationOptions={{ fieldName: 'Last name' }}
        />
        <TextInputField
          control={control}
          name="roll_number"
          label="Roll Number"
          placeholder={FormPlaceholders.ENTER_ROLL_NUMBER}
          disabled={disabled}
          required
          validationType="alphanumeric"
        />
        <GenderField control={control} name="gender" disabled={disabled} />
      </CardContent>
    </Card>
  );
}
