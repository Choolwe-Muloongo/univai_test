'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { Download, FileBadge, Loader2, PenLine, Save, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import {
  documentBrandingPreviewUrl,
  getDocumentBrandingSettings,
  updateDocumentBrandingSettings,
} from '@/lib/api';
import type { DocumentBrandingSettings } from '@/lib/api/types';

const defaultSettings: DocumentBrandingSettings = {
  registrarName: 'Registrar',
  registrarTitle: 'Registrar',
  registrarSignature: '',
  directorName: 'Director, Professional & Short Courses',
  directorTitle: 'Director, Professional & Short Courses',
  directorSignature: '',
  footerTagline: 'Unlocking Potential. Building Futures.',
  verificationUrl: '',
  contactEmail: '',
};

export default function DocumentBrandingPage() {
  const [form, setForm] = useState<DocumentBrandingSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getDocumentBrandingSettings()
      .then((settings) => {
        if (mounted) setForm({ ...defaultSettings, ...settings });
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load document branding.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function updateField<K extends keyof DocumentBrandingSettings>(key: K, value: DocumentBrandingSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function readSignature(key: 'registrarSignature' | 'directorSignature', event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateField(key, String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateDocumentBrandingSettings(form);
      setForm({ ...defaultSettings, ...updated });
      setMessage('Document branding saved. Download a preview to check the layout.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save document branding.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading label="Loading document branding..." />;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Official documents</p>
          <h1 className="text-2xl font-semibold text-slate-950">Document Branding</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Control the signatures, contact details, and verification text used on offer letters, admission letters,
            and short course certificates.
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="w-full gap-2 sm:w-auto">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save branding
        </Button>
      </div>

      {error ? <PageError title="Document branding error" message={error} /> : null}
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PenLine className="size-5 text-cyan-700" />
                Authorized Signatures
              </CardTitle>
              <CardDescription>Upload transparent PNG or JPG signature images for official PDF documents.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <SignatureBlock
                title="Registrar signature"
                name={form.registrarName || ''}
                titleValue={form.registrarTitle || ''}
                image={form.registrarSignature || ''}
                onName={(value) => updateField('registrarName', value)}
                onTitle={(value) => updateField('registrarTitle', value)}
                onFile={(event) => readSignature('registrarSignature', event)}
                onClear={() => updateField('registrarSignature', '')}
              />
              <SignatureBlock
                title="Director signature"
                name={form.directorName || ''}
                titleValue={form.directorTitle || ''}
                image={form.directorSignature || ''}
                onName={(value) => updateField('directorName', value)}
                onTitle={(value) => updateField('directorTitle', value)}
                onFile={(event) => readSignature('directorSignature', event)}
                onClear={() => updateField('directorSignature', '')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Footer and Verification</CardTitle>
              <CardDescription>These details appear in the footer and verification area of generated PDFs.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="footerTagline">Footer tagline</Label>
                <Textarea
                  id="footerTagline"
                  value={form.footerTagline || ''}
                  onChange={(event) => updateField('footerTagline', event.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="verificationUrl">Verification URL</Label>
                <Input
                  id="verificationUrl"
                  value={form.verificationUrl || ''}
                  onChange={(event) => updateField('verificationUrl', event.target.value)}
                  placeholder="https://univai.example.com/verify"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={form.contactEmail || ''}
                  onChange={(event) => updateField('contactEmail', event.target.value)}
                  placeholder="admissions@univai.example"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileBadge className="size-5 text-cyan-700" />
              Download Previews
            </CardTitle>
            <CardDescription>Save first, then download each PDF to check spacing, logos, and signatures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <PreviewLink href={documentBrandingPreviewUrl('offer')} label="Offer letter preview" />
            <PreviewLink href={documentBrandingPreviewUrl('admission')} label="Admission letter preview" />
            <PreviewLink href={documentBrandingPreviewUrl('certificate')} label="Certificate preview" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SignatureBlock({
  title,
  name,
  titleValue,
  image,
  onName,
  onTitle,
  onFile,
  onClear,
}: {
  title: string;
  name: string;
  titleValue: string;
  image: string;
  onName: (value: string) => void;
  onTitle: (value: string) => void;
  onFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
        <p className="text-xs text-slate-500">Use a clean signature image on a transparent or white background.</p>
      </div>
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={name} onChange={(event) => onName(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={titleValue} onChange={(event) => onTitle(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Signature image</Label>
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600 hover:border-cyan-500 hover:bg-cyan-50">
          {image ? (
            <img src={image} alt={`${title} preview`} className="max-h-20 max-w-full object-contain" />
          ) : (
            <>
              <Upload className="size-5 text-cyan-700" />
              Upload PNG or JPG
            </>
          )}
          <input className="sr-only" type="file" accept="image/png,image/jpeg" onChange={onFile} />
        </label>
      </div>
      {image ? (
        <Button type="button" variant="outline" className="w-full" onClick={onClear}>
          Remove signature
        </Button>
      ) : null}
    </div>
  );
}

function PreviewLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="outline" className="w-full justify-between gap-3">
      <a href={href} target="_blank" rel="noreferrer">
        {label}
        <Download className="size-4" />
      </a>
    </Button>
  );
}
