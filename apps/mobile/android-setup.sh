#!/bin/bash
# Android Development Setup Script for EduCard Mobile (pnpm monorepo)
# Run this script from educard-clients/ root if you encounter build errors

set -e  # Exit on error

echo "🔧 EduCard Mobile - Android Setup Script"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps/mobile" ]; then
    echo -e "${RED}❌ Error: Run this script from educard-clients/ root${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1/6: Cleaning node_modules...${NC}"
rm -rf node_modules apps/*/node_modules packages/*/node_modules
echo -e "${GREEN}✓ Cleaned${NC}"
echo ""

echo -e "${YELLOW}Step 2/6: Updating .npmrc for pnpm compatibility...${NC}"
cat > .npmrc <<EOF
enable-pre-post-scripts=true
shamefully-hoist=true
EOF
echo -e "${GREEN}✓ .npmrc updated${NC}"
echo ""

echo -e "${YELLOW}Step 3/6: Installing dependencies (this may take a while)...${NC}"
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 4/6: Adding @react-native/codegen as explicit dependency...${NC}"
cd apps/mobile
pnpm add -D @react-native/codegen@0.83.6
cd ../..
echo -e "${GREEN}✓ Codegen added${NC}"
echo ""

echo -e "${YELLOW}Step 5/6: Verifying React Native packages...${NC}"
if [ -f "apps/mobile/node_modules/@react-native/codegen/lib/cli/combine/combine-js-to-schema-cli.js" ]; then
    echo -e "${GREEN}✓ @react-native/codegen found${NC}"
else
    echo -e "${RED}❌ Warning: @react-native/codegen not found in expected location${NC}"
fi
echo ""

echo -e "${YELLOW}Step 6/6: Cleaning Gradle cache...${NC}"
cd apps/mobile/android
./gradlew clean --no-daemon
cd ../../..
echo -e "${GREEN}✓ Gradle cleaned${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Ensure Android emulator/device is connected:"
echo "     adb devices"
echo ""
echo "  2. Build and run the app:"
echo "     cd apps/mobile"
echo "     pnpm android"
echo ""
echo "  3. Or build APK manually:"
echo "     cd apps/mobile/android"
echo "     ./gradlew assembleDebug"
echo ""
