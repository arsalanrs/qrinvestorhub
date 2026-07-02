'use client';

import { useEffect, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { InvestorApplication, DocumentItem } from '@/types/investor-application';
import { WizardCard } from '@/components/ui/WizardCard';
import { DocumentDropzone } from '@/components/ui/DocumentDropzone';

function getDocumentsForProgram(program: string): DocumentItem[] {
  const common: DocumentItem[] = [
    { id: 'gov_id', label: 'Government-Issued ID', type: 'identity', required: false, status: 'missing' },
    { id: 'entity_docs', label: 'Entity Documents (articles, operating agreement)', type: 'entity', required: false, status: 'missing' },
  ];

  switch (program) {
    case 'dscr':
      return [...common,
        { id: 'lease', label: 'Lease Agreement or Rent Roll', type: 'rental', required: false, status: 'missing' },
        { id: 'photos', label: 'Property Photos', type: 'photos', required: false, status: 'missing' },
      ];
    case 'rehab':
      return [...common,
        { id: 'scope', label: 'Scope of Work / Contractor Bid', type: 'rehab', required: false, status: 'missing' },
        { id: 'purchase_contract', label: 'Purchase Contract', type: 'contract', required: false, status: 'missing' },
        { id: 'photos', label: 'Property Photos (before)', type: 'photos', required: false, status: 'missing' },
      ];
    case 'construction':
      return [...common,
        { id: 'plans', label: 'Architectural Plans', type: 'construction', required: false, status: 'missing' },
        { id: 'permits', label: 'Building Permits', type: 'construction', required: false, status: 'missing' },
        { id: 'builder_license', label: 'Builder / GC License & Insurance', type: 'construction', required: false, status: 'missing' },
        { id: 'draw_schedule', label: 'Draw Schedule', type: 'construction', required: false, status: 'missing' },
        { id: 'land_deed', label: 'Land Deed / Purchase Contract', type: 'title', required: false, status: 'missing' },
      ];
    case 'bridge':
      return [...common,
        { id: 'purchase_contract', label: 'Purchase Contract (if applicable)', type: 'contract', required: false, status: 'missing' },
        { id: 'appraisal', label: 'Appraisal or BPO (if available)', type: 'appraisal', required: false, status: 'missing' },
      ];
    case 'blanket_portfolio':
      return [...common,
        { id: 'rent_roll', label: 'Rent Roll / Property Schedule', type: 'rental', required: false, status: 'missing' },
        { id: 'mortgage_statements', label: 'Mortgage Statements (all properties)', type: 'mortgage', required: false, status: 'missing' },
        { id: 'property_list', label: 'Property List with Current Values', type: 'portfolio', required: false, status: 'missing' },
        { id: 'lease_all', label: 'Lease Agreements (all properties)', type: 'rental', required: false, status: 'missing' },
      ];
    default:
      return common;
  }
}

export function DocumentUploadStep() {
  const { control, watch, setValue } = useFormContext<InvestorApplication>();
  const program = watch('loanProgram');
  const applicationId = watch('id');
  const docs = useWatch({ control, name: 'documents' }) as DocumentItem[];

  const programDocs = useMemo(() => getDocumentsForProgram(program || ''), [program]);
  const displayDocs: DocumentItem[] = docs && docs.length > 0 ? docs : programDocs;

  useEffect(() => {
    if (!docs || docs.length === 0) {
      setValue('documents', programDocs, { shouldDirty: false });
    }
  }, [docs, program, programDocs, setValue]);

  const handleUploaded = (docId: string, fileUrl: string, fileName: string) => {
    const current = watch('documents');
    const base = current && current.length > 0 ? current : programDocs;
    const updated = base.map(d =>
      d.id === docId ? { ...d, status: 'uploaded' as const, fileUrl, fileName } : d
    );
    setValue('documents', updated, { shouldDirty: true });
  };

  const uploadedCount = displayDocs.filter(d => d.status === 'uploaded').length;

  return (
    <WizardCard
      title="Document Checklist"
      subtitle="Upload any supporting documents here. These are not required at this stage, but may be helpful. QuestRock staff will personally reach out for anything that is required at this stage."
    >
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--slate)' }}>
            {uploadedCount} of {displayDocs.length} documents uploaded
          </span>
        </div>
        <div style={{ height: '6px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${displayDocs.length > 0 ? (uploadedCount / displayDocs.length) * 100 : 0}%`,
            background: 'var(--ledger-green)',
            borderRadius: '3px',
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {displayDocs.map(doc => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            applicationId={applicationId}
            onUploaded={(url, name) => handleUploaded(doc.id, url, name)}
          />
        ))}
      </div>
    </WizardCard>
  );
}

function DocumentRow({ doc, applicationId, onUploaded }: { doc: DocumentItem; applicationId?: string; onUploaded: (url: string, name: string) => void }) {
  const statusConfig = {
    missing: { label: 'Not uploaded', bg: 'var(--paper-dim)', color: 'var(--slate)' },
    uploaded: { label: 'Uploaded ✓', bg: 'var(--ledger-green-soft)', color: 'var(--ledger-green)' },
    requested: { label: 'Requested', bg: 'var(--brass-soft)', color: 'var(--brass)' },
    reviewed: { label: 'Reviewed ✓', bg: 'var(--ledger-green-soft)', color: 'var(--ledger-green)' },
  }[doc.status] || { label: doc.status, bg: 'var(--paper-dim)', color: 'var(--slate)' };

  return (
    <div style={{ border: '1.5px solid var(--line)', borderRadius: '4px', padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: doc.status !== 'uploaded' ? '10px' : '0' }}>
        <span style={{ fontSize: '14px', color: 'var(--ink-soft)', fontWeight: 500 }}>{doc.label}</span>
        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '2px', background: statusConfig.bg, color: statusConfig.color, fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}>
          {statusConfig.label}
        </span>
      </div>
      {doc.status === 'uploaded' && doc.fileName && (
        <p style={{ fontSize: '12px', color: 'var(--slate-light)', margin: 0 }}>📄 {doc.fileName}</p>
      )}
      {doc.status !== 'uploaded' && (
        <DocumentDropzone
          documentId={doc.id}
          documentLabel={doc.label}
          applicationId={applicationId}
          onUploaded={onUploaded}
        />
      )}
    </div>
  );
}
