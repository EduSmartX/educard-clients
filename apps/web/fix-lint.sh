#!/bin/bash

# Fix unused imports
sed -i '' 's/import { Check,/import {/' src/components/ui/dropdown-menu.tsx
sed -i '' 's/, Circle } from "lucide-react"/ } from "lucide-react"/' src/components/ui/dropdown-menu.tsx

# Fix unused imports in other files
sed -i '' 's/import { LogoWithText } from/\/\/ import { LogoWithText } from/' src/features/auth/pages/login-page.tsx
sed -i '' 's/, Lock } from "lucide-react"/ } from "lucide-react"/' src/features/auth/pages/signup-page.tsx

# Fix unused functions
sed -i '' 's/import { getTenDigitPhoneNumber }/\/\/ import { getTenDigitPhoneNumber }/' src/features/auth/pages/signup-page.tsx

# Fix unused imports in date-utils
sed -i '' 's/import { differenceInDays,/import {/' src/lib/utils/date-utils.ts
sed-i '' 's/  isWithinInterval,//' src/lib/utils/date-utils.ts

# Fix unused cn import
sed -i '' 's/import { cn } from/\/\/ import { cn } from/' src/features/leave/components/leave-allocation-form.tsx

echo "Basic fixes applied. Run npm run lint to see remaining issues."
