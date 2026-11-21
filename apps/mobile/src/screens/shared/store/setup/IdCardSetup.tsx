/**
 * Store Setup > ID cards: the school's cards, EduCard's ready-made designs (live as
 * soon as the school picks one) and uploads of the school's own artwork, which EduCard
 * turns into a print design before approving.
 */
import {
  APPROVAL_STATUS,
  APPROVAL_STATUS_LABELS,
  EDITABLE_APPROVAL_STATUSES,
  getErrorMessage,
  type ApprovalStatus,
  type IdCardDesign,
  type IdCardTemplate,
} from '@educard/shared';
import { ImagePlus, Upload } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SubmitButton } from '@/components/common';
import { getMediaUrl } from '@/constants/config';
import { useClasses } from '@/features/classes';
import {
  classLabel,
  oneSectionPerGrade,
  pickStoreImage,
  useAdoptIdCardDesign,
  useIdCardDesigns,
  useIdCardTemplates,
  useUploadIdCardTemplate,
  useWithdrawIdCardTemplate,
  type UploadFile,
} from '@/features/store';
import { CardPreviewImage } from '@/features/store/components/CardPreviewImage';
import { storeStyles as s } from '@/features/store/components/store-styles';
import { showToast } from '@/utils/toast';

const STATUS_COLOURS: Record<ApprovalStatus, { bg: string; fg: string }> = {
  [APPROVAL_STATUS.PENDING]: { bg: '#fef3c7', fg: '#92400e' },
  [APPROVAL_STATUS.APPROVED]: { bg: '#dcfce7', fg: '#166534' },
  [APPROVAL_STATUS.REJECTED]: { bg: '#fee2e2', fg: '#991b1b' },
  [APPROVAL_STATUS.SUPERSEDED]: { bg: '#f3f4f6', fg: '#4b5563' },
};

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const colours = STATUS_COLOURS[status];
  return (
    <Text
      style={[styles.badge, { backgroundColor: colours.bg, color: colours.fg }]}
    >
      {APPROVAL_STATUS_LABELS[status] ?? status}
    </Text>
  );
}

/** "Whole school" plus one chip per grade; value '' means school-wide. */
function ScopeChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { data } = useClasses({ page_size: 100 });
  const grades = useMemo(() => oneSectionPerGrade(data?.classes ?? []), [data]);
  const chip = (key: string, label: string) => {
    const active = value === key;
    return (
      <TouchableOpacity
        key={key || 'school'}
        style={[s.option, active && s.optionActive]}
        onPress={() => onChange(key)}
      >
        <Text style={[s.optionText, active && s.optionTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };
  return (
    <View style={s.optionRow}>
      {chip('', 'Whole school')}
      {grades.map(section =>
        chip(
          section.public_id,
          section.class_master?.name ?? classLabel(section),
        ),
      )}
    </View>
  );
}

function TemplateCard({ template }: { template: IdCardTemplate }) {
  const withdraw = useWithdrawIdCardTemplate();
  const editable = (EDITABLE_APPROVAL_STATUSES as readonly string[]).includes(
    template.status,
  );
  const orientation = template.design?.orientation ?? 'landscape';
  return (
    <View style={s.card}>
      <View style={styles.cardHeader}>
        <View style={styles.flex}>
          <Text style={s.cardTitle}>{template.name}</Text>
          <Text style={s.hint}>
            {template.is_default ? 'Whole school' : template.class_name}
            {template.design?.is_library ? ' · EduCard design' : ''}
          </Text>
        </View>
        <StatusBadge status={template.status} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.previews}>
          {template.can_preview ? (
            <>
              <CardPreviewImage
                path={template.front_preview_url}
                orientation={orientation}
                width={200}
              />
              {template.design?.has_back && (
                <CardPreviewImage
                  path={template.back_preview_url}
                  orientation={orientation}
                  width={200}
                />
              )}
            </>
          ) : template.image_url ? (
            <Image
              source={{ uri: getMediaUrl(template.image_url) }}
              style={styles.artwork}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </ScrollView>
      {!template.can_preview && template.status === APPROVAL_STATUS.PENDING && (
        <Text style={s.hint}>
          EduCard is preparing the print design from your artwork.
        </Text>
      )}
      {template.status === APPROVAL_STATUS.REJECTED && template.review_notes ? (
        <Text style={s.error}>EduCard: {template.review_notes}</Text>
      ) : null}
      {editable && (
        <TouchableOpacity
          style={[s.secondaryButton, styles.withdraw]}
          disabled={withdraw.isPending}
          onPress={() =>
            withdraw.mutate(template.public_id, {
              onSuccess: () => showToast('success', 'Template withdrawn'),
              onError: error => showToast('error', getErrorMessage(error)),
            })
          }
        >
          <Text style={s.secondaryButtonText}>Withdraw</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function AdoptSheet({
  design,
  onClose,
}: {
  design: IdCardDesign | null;
  onClose: () => void;
}) {
  const [scope, setScope] = useState('');
  const adopt = useAdoptIdCardDesign();
  const close = () => {
    setScope('');
    onClose();
  };
  return (
    <Modal
      visible={Boolean(design)}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Use {design?.name}</Text>
          <Text style={[s.hint, styles.gap]}>
            Students&apos; photos, names, class and blood group are filled in
            from their profiles when the cards are printed.
          </Text>
          <Text style={s.label}>For</Text>
          <ScopeChips value={scope} onChange={setScope} />
          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.cancel} onPress={close}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <SubmitButton
              label="Use design"
              isLoading={adopt.isPending}
              onPress={() =>
                design &&
                adopt.mutate(
                  {
                    design_public_id: design.public_id,
                    class_public_id: scope || undefined,
                  },
                  {
                    onSuccess: () => {
                      showToast(
                        'success',
                        `${design.name} is now your ID card`,
                      );
                      close();
                    },
                    onError: error =>
                      showToast('error', getErrorMessage(error)),
                  },
                )
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function UploadSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState('');
  const [image, setImage] = useState<UploadFile>();
  const upload = useUploadIdCardTemplate();
  const close = () => {
    setName('');
    setScope('');
    setImage(undefined);
    onClose();
  };
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Upload your own design</Text>
          <Text style={[s.hint, styles.gap]}>
            Send your card artwork. EduCard places the student details on it and
            approves it for printing.
          </Text>
          <View style={s.field}>
            <Text style={s.label}>Name *</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. 2026 ID card"
            />
          </View>
          <View style={s.field}>
            <Text style={s.label}>For</Text>
            <ScopeChips value={scope} onChange={setScope} />
          </View>
          <View style={s.field}>
            {image ? (
              <Image
                source={{ uri: image.uri }}
                style={styles.artwork}
                resizeMode="contain"
              />
            ) : null}
            <TouchableOpacity
              style={[s.secondaryButton, styles.gap]}
              onPress={() =>
                void pickStoreImage().then(picked => picked && setImage(picked))
              }
            >
              <ImagePlus size={16} color="#2563eb" />
              <Text style={s.secondaryButtonText}>
                {image ? 'Choose another image' : 'Choose artwork'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.cancel} onPress={close}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <SubmitButton
              label="Send to EduCard"
              isLoading={upload.isPending}
              disabled={!name.trim() || !image}
              onPress={() =>
                image &&
                upload.mutate(
                  {
                    name: name.trim(),
                    image,
                    classPublicId: scope || undefined,
                  },
                  {
                    onSuccess: () => {
                      showToast('success', 'Sent to EduCard for approval');
                      close();
                    },
                    onError: error =>
                      showToast('error', getErrorMessage(error)),
                  },
                )
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function IdCardSetup() {
  const { data: templatesResponse, isLoading } = useIdCardTemplates();
  const { data: designsResponse, isLoading: designsLoading } =
    useIdCardDesigns();
  const [adopting, setAdopting] = useState<IdCardDesign | null>(null);
  const [uploading, setUploading] = useState(false);

  const templates = (templatesResponse?.data ?? []).filter(
    template => template.status !== APPROVAL_STATUS.SUPERSEDED,
  );
  const designs = designsResponse?.data ?? [];

  return (
    <View>
      <Text style={styles.section}>Your ID cards</Text>
      {isLoading ? (
        <ActivityIndicator color="#2563eb" />
      ) : templates.length === 0 ? (
        <Text style={[s.hint, styles.gap]}>
          No ID card yet. Pick an EduCard design below or upload your own.
        </Text>
      ) : (
        templates.map(template => (
          <TemplateCard key={template.public_id} template={template} />
        ))
      )}

      <View style={styles.sectionRow}>
        <Text style={styles.section}>EduCard designs</Text>
        <TouchableOpacity
          style={s.secondaryButton}
          onPress={() => setUploading(true)}
        >
          <Upload size={14} color="#2563eb" />
          <Text style={s.secondaryButtonText}>Upload own</Text>
        </TouchableOpacity>
      </View>
      {designsLoading ? (
        <ActivityIndicator color="#2563eb" />
      ) : (
        designs.map(design => (
          <View key={design.public_id} style={s.card}>
            <Text style={s.cardTitle}>{design.name}</Text>
            {design.description ? (
              <Text style={[s.hint, styles.gap]}>{design.description}</Text>
            ) : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.previews}>
                <CardPreviewImage
                  path={design.front_preview_url}
                  orientation={design.orientation}
                  width={200}
                />
                {design.has_back && (
                  <CardPreviewImage
                    path={design.back_preview_url}
                    orientation={design.orientation}
                    width={200}
                  />
                )}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[s.secondaryButton, styles.gap]}
              onPress={() => setAdopting(design)}
            >
              <Text style={s.secondaryButtonText}>Use this design</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <AdoptSheet design={adopting} onClose={() => setAdopting(null)} />
      <UploadSheet open={uploading} onClose={() => setUploading(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { marginTop: 8, marginBottom: 8 },
  section: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  previews: { flexDirection: 'row', gap: 10, paddingBottom: 6 },
  artwork: {
    width: 200,
    height: 126,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  withdraw: { marginTop: 8 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#374151' },
});
