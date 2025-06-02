

// src/app/EmailView.tsx
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Reply } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import ComposeEmailModal from '@/components/mail/ComposeEmailModal';
import { set } from 'date-fns';

export default function EmailView() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState<any>(null);
    const [open, setopen] = useState<any>(false);
    const [gmailid, setgmailid] = useState<any>("");
    const [userid, setuserid] = useState<any>("");
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { id } = useParams<{ id: string }>();
    const { theme } = useTheme();

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
                    to: metadata.receiver || 'Unknown recipient',
                    date: new Date(data.created_at).toLocaleString(),
                    body: data.content,
                    originalHtml: metadata.originalHtml || '',
                    attachments: metadata.attachments || [],
                });
            } catch (err) {
                console.error("Error fetching email:", err);
                setError(err instanceof Error ? err.message : 'Failed to load email');
            } finally {
                setLoading(false);
            }
        };

        fetchEmail();
        window.scrollTo(0, 0);
    }, [id]);

    const resolveInlineImages = (html: string, attachments: any[]) => {
        if (!attachments?.length) return html;
        let resolved = html;
        attachments.forEach((att) => {
            if (att.contentId && att.url) {
                resolved = resolved.replaceAll(`cid:${att.contentId}`, att.url);
            }
        });
        return resolved;
    };

    useEffect(() => {
        if (!email?.originalHtml || !iframeRef.current) return;

        const html = resolveInlineImages(email.originalHtml, email.attachments);

        const doc = iframeRef.current.contentDocument;
        if (!doc) return;

        doc.open();
        doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body {
    font-family: system-ui, sans-serif;
    padding: 1rem;
    background: ${theme === 'dark' ? '#1e1e1e' : '#fff'};
    color: ${theme === 'dark' ? '#fff' : '#000'};
  }
  img {
    max-width: 100%;
    height: auto;
  }
  a {
    color: ${theme === 'dark' ? '#60a5fa' : '#2563eb'};
  }
</style>
</head>
<body>${html}</body>
</html>`);
        doc.close();
    }, [email, theme]);

    const handleReply = () => {
        setopen(true);
        const gmailid=localStorage.getItem('selected_gmail_id');
        if (!gmailid) {
            return console.log('not able to retrieve data from local storage');
        }
        setgmailid(gmailid);
        const userid=localStorage.getItem('userid');
        if (!userid) {
            return console.log('not able to retrieve data from local storage');
        }
        setuserid(userid);
        
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                Loading email...
            </div>
        );
    }

    if (error || !email) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                <div className="text-destructive">{error || 'Email not found'}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {open && (<ComposeEmailModal fromEmail={gmailid} userId={userid} onClose={()=>setopen(false)}/>)}
            <div className="max-w-9xl mx-auto p-0 sm:p-3 space-y-5 ">
                {/* Header */}
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

                    <div className="p-6 max-h-[700px] overflow-y-auto bg-muted dark:bg-[#1e1e1e] rounded-b-xl">
                        {email.originalHtml ? (
                            <iframe
                                ref={iframeRef}
                                title="Email Content"
                                className="w-full h-[600px] border-none rounded-md"
                            />
                        ) : email.body ? (
                            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {email.body}
                            </div>
                        ) : (
                            <div className="text-muted-foreground text-center">No email body content.</div>
                        )}
                    </div>

                    <div className="p-4 flex justify-end border-t border-border">
                        <button
                            onClick={()=>handleReply()}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition"
                        >
                            <Reply size={16} />
                            Reply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
