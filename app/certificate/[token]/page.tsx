'use client';

import { useEffect, useState } from 'react';
import { Award, Download, Linkedin, Share2, Twitter } from 'lucide-react';

interface CertificateData {
  attendeeName: string;
  eventTitle: string;
  eventDate: string | null;
  certificateId: string;
  issuedAt: string;
}

export default function CertificatePage({ params }: { params: Promise<{ token: string }> }) {
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then(({ token }) => {
      fetch(`/api/certificates?token=${encodeURIComponent(token)}`)
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok || !data.success) throw new Error(data.message || 'Certificate unavailable');
          setCertificate(data.data);
        })
        .catch((loadError) => setError(loadError.message));
    });
  }, [params]);

  const certificateUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = certificate ? `I attended ${certificate.eventTitle} by Quantum Nexus Global.` : '';

  if (error) {
    return <main className="min-h-screen grid place-items-center bg-[#eef4f5] px-6 text-center"><div><h1 className="text-2xl font-semibold text-[#17323a]">Certificate unavailable</h1><p className="mt-2 text-sm text-[#60747a]">{error}</p></div></main>;
  }

  if (!certificate) {
    return <main className="min-h-screen grid place-items-center bg-[#eef4f5] text-sm text-[#60747a]">Loading certificate...</main>;
  }

  const formattedDate = certificate.eventDate
    ? new Date(certificate.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Quantum Nexus Global event';
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificateUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(certificateUrl)}`;

  return (
    <main className="min-h-screen bg-[#eef4f5] px-4 py-8 text-[#17323a] sm:px-8 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <div id="certificate" className="relative overflow-hidden border-[10px] border-[#17323a] bg-[#fffdf7] px-6 py-12 text-center shadow-2xl sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute inset-3 border border-[#c8943e]" />
          <div className="relative">
            <Award className="mx-auto mb-5 h-12 w-12 text-[#c8943e]" strokeWidth={1.5} />
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c8943e]">Quantum Nexus Global</p>
            <h1 className="mt-7 text-3xl font-semibold tracking-tight sm:text-5xl">Certificate of Participation</h1>
            <p className="mx-auto mt-8 max-w-xl text-sm leading-7 text-[#60747a]">This certificate is proudly presented to</p>
            <p className="mt-3 break-words font-serif text-3xl text-[#17323a] sm:text-5xl">{certificate.attendeeName}</p>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-7 text-[#60747a]">for attending</p>
            <p className="mt-2 break-words text-xl font-semibold sm:text-3xl">{certificate.eventTitle}</p>
            <p className="mt-6 text-sm text-[#60747a]">{formattedDate}</p>
            <div className="mx-auto mt-12 flex max-w-xl items-end justify-between border-t border-[#d7c6a8] pt-3 text-left text-[10px] uppercase tracking-widest text-[#60747a]">
              <span>Quantum Nexus Global</span>
              <span>Certificate ID: {certificate.certificateId}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-[#17323a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#28525d]"><Download className="h-4 w-4" /> Download / Print</button>
          <a href={linkedInUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#17323a]/20 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[#f7fbfb]"><Linkedin className="h-4 w-4" /> LinkedIn</a>
          <a href={twitterUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#17323a]/20 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[#f7fbfb]"><Twitter className="h-4 w-4" /> X / Twitter</a>
          <button onClick={() => navigator.share?.({ title: certificate.eventTitle, text: shareText, url: certificateUrl })} className="inline-flex items-center gap-2 rounded-lg border border-[#17323a]/20 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[#f7fbfb]"><Share2 className="h-4 w-4" /> Share</button>
        </div>
      </div>
    </main>
  );
}
