import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Reply } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useTheme } from '@/context/ThemeContext'; // <-- import your theme hook

export default function EmailView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<any>(null);
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme(); // <-- get theme from context

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        if (!id) throw new Error('No email ID provided');

        const { data, error: supabaseError } = await supabase
          .from('memory_entries')
          .select('id, created_at, sender, content, metadata')
          .eq('id', id)
          .single();

        if (supabaseError) throw supabaseError;
        if (!data) throw new Error('Email not found');

        const metadata = data.metadata || {};
        setEmail({
          subject: metadata.subject || 'No Subject',
          from: data.sender,
          to: metadata.to || 'Unknown recipient',
          date: new Date(data.created_at).toLocaleString(),
          body: data.content,
          plainText: metadata.plainText || '',
          attachments: metadata.attachments || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load email');
      } finally {
        setLoading(false);
      }
    };

    fetchEmail();
  }, [id]);

  const createSanitizedHTML = (html: string) => {
    return {
      __html: DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        ADD_TAGS: ['style'],
        ADD_ATTR: ['target'],
      }),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        Loading...
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-destructive">{error || 'Email not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Top Bar */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        {/* Email Card */}
        <div className="border rounded-xl shadow-sm bg-card border-border">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold mb-2">{email.subject}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="space-y-1">
                <div><span className="font-semibold">From:</span> {email.from}</div>
                <div><span className="font-semibold">To:</span> {email.to}</div>
              </div>
              <div className="text-xs">{email.date}</div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[600px] overflow-y-auto overflow-x-hidden bg-muted rounded-b-xl">
            {email.body ? (
              <div
                className="email-body prose prose-sm sm:prose-base max-w-none"
                dangerouslySetInnerHTML={createSanitizedHTML(email.body)}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm">{email.plainText}</pre>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 flex justify-end border-t border-border">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition">
              <Reply size={16} />
              Reply
            </button>
          </div>
        </div>
      </div>

      {/* Styles for the email HTML content */}
      <style jsx global>{`
        .email-body table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
          margin-bottom: 1rem;
        }

        .email-body th, .email-body td {
          border: 1px solid ${theme === 'dark' ? '#444' : '#ccc'};
          padding: 8px;
          text-align: left;
        }

        .email-body a {
          color: ${theme === 'dark' ? '#60a5fa' : '#2563eb'};
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
