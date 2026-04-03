"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2, XCircle, Loader2, ChevronRight,
  Key, Database, Plug, Zap, ExternalLink, Copy, Check,
  AlertTriangle, ArrowRight,
} from "lucide-react";

interface SetupStatus {
  anthropic: boolean;
  notionToken: boolean;
  notionDb: boolean;
  notionConnected: boolean;
  hasBuildSpecField: boolean;
  databaseTitle: string | null;
  notionError?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="ml-2 p-1 rounded hover:bg-gray-200 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
    </button>
  );
}

function StatusIcon({ ok, loading }: { ok: boolean; loading?: boolean }) {
  if (loading) return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
  return ok
    ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
    : <XCircle className="h-5 w-5 text-red-400" />;
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 bg-gray-900 text-gray-100 rounded-lg px-4 py-2.5 text-sm font-mono mt-2">
      <span className="flex-1">{children}</span>
      <CopyButton text={children} />
    </div>
  );
}

const STEPS = [
  {
    id: "anthropic",
    icon: <Key className="h-5 w-5" />,
    title: "Anthropic API Key",
    subtitle: "Needed for Claude to analyze workflows",
  },
  {
    id: "notionToken",
    icon: <Plug className="h-5 w-5" />,
    title: "Notion Integration Token",
    subtitle: "Connects WIRE to your Notion workspace",
  },
  {
    id: "notionConnected",
    icon: <Database className="h-5 w-5" />,
    title: "Database Access",
    subtitle: "Your integration must be connected to the database",
  },
  {
    id: "hasBuildSpecField",
    icon: <Zap className="h-5 w-5" />,
    title: "Build Spec Field",
    subtitle: "Required for AI build specs to save",
  },
];

export default function SetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  async function check() {
    setRetrying(true);
    const res = await fetch("/api/setup-check");
    setStatus(await res.json());
    setLoading(false);
    setRetrying(false);
  }

  useEffect(() => { check(); }, []);

  const allGood = status?.anthropic && status?.notionConnected && status?.hasBuildSpecField;
  const stepStatus = status
    ? {
        anthropic: status.anthropic,
        notionToken: status.notionToken,
        notionConnected: status.notionConnected,
        hasBuildSpecField: status.hasBuildSpecField,
      }
    : {};

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-2">Setup Guide</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Connect WIRE to your tools</h1>
        <p className="text-gray-500 text-sm mt-2">
          Four steps to get WIRE reading and writing to your Notion database.
        </p>
      </div>

      {/* Live status bar */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-gray-700">Connection status</span>
          <button
            onClick={check}
            disabled={retrying}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 disabled:opacity-50"
          >
            {retrying && <Loader2 className="h-3 w-3 animate-spin" />}
            Re-check
          </button>
        </div>
        <div className="space-y-3">
          {STEPS.map((step) => (
            <div key={step.id} className="flex items-center gap-3">
              <StatusIcon ok={!!stepStatus[step.id as keyof typeof stepStatus]} loading={loading} />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">{step.title}</div>
                <div className="text-xs text-gray-400">{step.subtitle}</div>
              </div>
              {stepStatus[step.id as keyof typeof stepStatus] && (
                <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                  Connected
                </span>
              )}
            </div>
          ))}
        </div>

        {status?.databaseTitle && (
          <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400">
            Notion database: <span className="font-medium text-gray-600">{status.databaseTitle}</span>
          </div>
        )}

        {allGood && (
          <div className="mt-4 pt-4 border-t border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-semibold">All systems connected</span>
            </div>
            <Link
              href="/"
              className="mt-3 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
            >
              Start analyzing workflows
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Step-by-step instructions */}
      <div className="space-y-5">

        {/* Step 1 — Anthropic */}
        <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${status?.anthropic ? "border-emerald-200" : "border-gray-100"}`}>
          <div className="px-6 py-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${status?.anthropic ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
              1
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-sm">Get your Anthropic API key</div>
              {status?.anthropic && <div className="text-xs text-emerald-600 mt-0.5">Key detected in .env.local ✓</div>}
            </div>
            {status?.anthropic
              ? <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              : <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-indigo-600 flex items-center gap-1 font-medium hover:underline flex-shrink-0">
                  Get key <ExternalLink className="h-3 w-3" />
                </a>
            }
          </div>
          {!status?.anthropic && (
            <div className="px-6 pb-5 space-y-3 text-sm text-gray-600">
              <ol className="space-y-2 list-none">
                <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />Go to <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">console.anthropic.com → API Keys</span></li>
                <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />Create a key and copy it</li>
                <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />Open <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">wire/.env.local</span> and set:</li>
              </ol>
              <CodeBlock>ANTHROPIC_API_KEY=sk-ant-api03-...</CodeBlock>
              <p className="text-xs text-gray-400">Restart the dev server after editing .env.local</p>
            </div>
          )}
        </div>

        {/* Step 2 — Notion token */}
        <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${status?.notionToken ? "border-emerald-200" : "border-gray-100"}`}>
          <div className="px-6 py-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${status?.notionToken ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
              2
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-sm">Create a Notion integration</div>
              {status?.notionToken && <div className="text-xs text-emerald-600 mt-0.5">Token detected ✓</div>}
            </div>
            {status?.notionToken
              ? <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              : <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-indigo-600 flex items-center gap-1 font-medium hover:underline flex-shrink-0">
                  Open Notion <ExternalLink className="h-3 w-3" />
                </a>
            }
          </div>
          {!status?.notionToken && (
            <div className="px-6 pb-5 space-y-3 text-sm text-gray-600">
              <ol className="space-y-2 list-none">
                <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />Go to <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">notion.so/my-integrations</span></li>
                <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />Click <strong>New integration</strong> → name it WIRE → Submit</li>
                <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />Copy the <strong>Internal Integration Secret</strong></li>
                <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />Add to your .env.local:</li>
              </ol>
              <CodeBlock>NOTION_TOKEN=secret_abc123...</CodeBlock>
            </div>
          )}
        </div>

        {/* Step 3 — Connect integration to database */}
        <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${status?.notionConnected ? "border-emerald-200" : "border-gray-100"}`}>
          <div className="px-6 py-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${status?.notionConnected ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
              3
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-sm">Connect integration to your database</div>
              {status?.notionConnected
                ? <div className="text-xs text-emerald-600 mt-0.5">Database accessible ✓</div>
                : status?.notionToken
                  ? <div className="text-xs text-amber-600 mt-0.5">Token found but can&apos;t reach database — check connection below</div>
                  : <div className="text-xs text-gray-400 mt-0.5">Complete step 2 first</div>
              }
            </div>
            {status?.notionConnected && <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />}
          </div>
          {!status?.notionConnected && (
            <div className="px-6 pb-5 space-y-3 text-sm text-gray-600">
              <ol className="space-y-2 list-none">
                <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />Open your Notion database (the one with ID <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">e52ece14...</span>)</li>
                <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />Click the <strong>···</strong> menu in the top-right corner of the database</li>
                <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />Select <strong>Add connections</strong> → search for WIRE → click to add</li>
              </ol>
              {status?.notionError && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                  {status.notionError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 4 — Build Spec field */}
        <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${status?.hasBuildSpecField ? "border-emerald-200" : "border-gray-100"}`}>
          <div className="px-6 py-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${status?.hasBuildSpecField ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
              4
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-sm">Add &ldquo;Build Spec&rdquo; field to your database</div>
              {status?.hasBuildSpecField
                ? <div className="text-xs text-emerald-600 mt-0.5">Field found in database ✓</div>
                : status?.notionConnected
                  ? <div className="text-xs text-amber-600 mt-0.5">Field not found — add it now</div>
                  : <div className="text-xs text-gray-400 mt-0.5">Complete step 3 first</div>
              }
            </div>
            {status?.hasBuildSpecField && <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />}
          </div>
          {!status?.hasBuildSpecField && status?.notionConnected && (
            <div className="px-6 pb-5 space-y-3 text-sm text-gray-600">
              <ol className="space-y-2 list-none">
                <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />Open your Notion database</li>
                <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />Click <strong>+</strong> to add a new property at the end of the columns</li>
                <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />Type the name exactly: <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded font-semibold">Build Spec</span> <CopyButton text="Build Spec" /></li>
                <li className="flex gap-2"><ChevronRight className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />Set the type to <strong>Text</strong> (rich text)</li>
              </ol>
              <p className="text-xs text-gray-400">
                Without this field, analyses still work &mdash; build specs just won&apos;t be saved to Notion.
              </p>
            </div>
          )}
        </div>

        {/* .env.local restart reminder */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="font-semibold text-amber-900">After editing .env.local</span>
          </div>
          <p className="text-amber-700 text-sm">
            You must restart the dev server for environment variable changes to take effect:
          </p>
          <CodeBlock>cd wire && npm run dev</CodeBlock>
          <p className="text-amber-600 text-xs mt-2">Then come back here and click Re-check.</p>
        </div>
      </div>
    </div>
  );
}
