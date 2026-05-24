const fs = require('node:fs');

const files = [
  './app/(shared-screens)/change-email.tsx',
  './app/(shared-screens)/change-password.tsx',
  './app/(shared-screens)/change-phone.tsx',
  './app/(shared-screens)/classes/create.tsx',
  './app/(shared-screens)/classes/edit.tsx',
  './app/(shared-screens)/exams/create-exam.tsx',
  './app/(shared-screens)/exams/create-session.tsx',
  './app/(shared-screens)/exceptional-work.tsx',
  './app/(shared-screens)/holidays/index.tsx',
  './app/(shared-screens)/homework/create.tsx',
  './app/(shared-screens)/homework/edit.tsx',
  './app/(shared-screens)/homework/review.tsx',
  './app/(shared-screens)/leave/apply.tsx',
  './app/(shared-screens)/leave/create.tsx',
  './app/(shared-screens)/leave/edit.tsx',
  './app/(shared-screens)/preferences/index.tsx',
  './app/(shared-screens)/students/create.tsx',
  './app/(shared-screens)/subjects/create.tsx',
  './app/(shared-screens)/subjects/edit.tsx',
  './app/(shared-screens)/timetable/assign-entry.tsx',
  './app/(shared-screens)/timetable/setup.tsx',
  './app/(shared-screens)/timetable/slots-editor.tsx',
  './app/(tabs)/(admin)/create-class.tsx',
  './app/(tabs)/(admin)/create-student.tsx',
  './app/(tabs)/(admin)/create-subject.tsx',
  './app/(tabs)/(admin)/create-teacher.tsx',
];

let updated = 0, skipped = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Step 1: Remove ScrollView from react-native import
  content = content.replace(
    /import\s*\{([^}]*)\}\s*from\s*'react-native'/g,
    (match, inner) => {
      let cleaned = inner
        .replace(/\bScrollView\b\s*,?\s*/g, '')
        .replace(/\bKeyboardAvoidingView\b\s*,?\s*/g, '')
        .replace(/\bPlatform\b\s*,?\s*/g, '');
      // Clean up commas
      cleaned = cleaned.replace(/,\s*,/g, ',').replace(/^\s*,/, '').replace(/,\s*$/, '');
      // Check if Platform is still used elsewhere (e.g. Platform.select)
      const platformUsedElsewhere = content.replace(match, '').includes('Platform.');
      if (platformUsedElsewhere) {
        cleaned = cleaned.trim() + ', Platform';
      }
      return `import {${cleaned}} from 'react-native'`;
    }
  );

  // Re-check if Platform is needed (some files use it for other things)
  if (!content.replace(/import[^;]+;/g, '').includes('Platform.') && !content.replace(/import[^;]+;/g, '').includes('Platform,')) {
    // Already removed above, good
  }

  // Step 2: Add KeyboardAwareScrollView import if not present
  if (!content.includes('KeyboardAwareScrollView')) {
    const rnImportMatch = content.match(/import\s*\{[^}]*\}\s*from\s*'react-native';/);
    if (rnImportMatch) {
      const insertIdx = content.indexOf(rnImportMatch[0]) + rnImportMatch[0].length;
      content = content.slice(0, insertIdx) +
        "\nimport { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';" +
        content.slice(insertIdx);
    }
  }

  // Step 3: Replace <KeyboardAvoidingView ...>\n<ScrollView ...> with <KeyboardAwareScrollView ...>
  content = content.replace(
    /<KeyboardAvoidingView[\s\S]*?>\s*\n(\s*)<ScrollView([^>]*)>/g,
    (match, indent, scrollProps) => {
      // Keep contentContainerStyle and keyboardShouldPersistTaps from ScrollView
      let props = scrollProps.trim();
      if (!props.includes('keyboardShouldPersistTaps')) {
        props += ' keyboardShouldPersistTaps="handled"';
      }
      if (!props.includes('enableOnAndroid')) {
        props += ' enableOnAndroid';
      }
      if (!props.includes('extraScrollHeight')) {
        props += ' extraScrollHeight={20}';
      }
      return `${indent}<KeyboardAwareScrollView${props ? ' ' + props : ''}>`;
    }
  );

  // Step 4: Replace </ScrollView>\n</KeyboardAvoidingView> with </KeyboardAwareScrollView>
  content = content.replace(
    /(\s*)<\/ScrollView>\s*\n\s*<\/KeyboardAvoidingView>/g,
    '$1</KeyboardAwareScrollView>'
  );

  // Step 5: For files that only have ScrollView (no KeyboardAvoidingView wrapper)
  if (content.includes('<ScrollView') && !content.includes('<KeyboardAwareScrollView')) {
    content = content.replace(
      /<ScrollView([^>]*)>/g,
      (match, props) => {
        let newProps = props.trim();
        if (!newProps.includes('keyboardShouldPersistTaps')) {
          newProps += ' keyboardShouldPersistTaps="handled"';
        }
        if (!newProps.includes('enableOnAndroid')) {
          newProps += ' enableOnAndroid';
        }
        if (!newProps.includes('extraScrollHeight')) {
          newProps += ' extraScrollHeight={20}';
        }
        return `<KeyboardAwareScrollView ${newProps}>`;
      }
    );
    content = content.replace(/<\/ScrollView>/g, '</KeyboardAwareScrollView>');
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    updated++;
    console.log('✅ ' + file);
  } else {
    skipped++;
    console.log('⏭️  ' + file);
  }
});

console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
