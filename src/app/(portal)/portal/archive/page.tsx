"use client";

import { useState } from "react";
import { usePortal } from "@/portal/store";
import { isExec } from "@/portal/logic";
import { Button, Card, Field, Input, PageTitle, Textarea } from "@/portal/ui";

export default function ArchivePage() {
  const { data, me, update } = usePortal();
  const [urlDraft, setUrlDraft] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);

  if (!me) return null;
  const exec = isExec(me);
  const { archiveDeckUrl, archiveNote } = data.settings;

  const saveUrl = () => {
    const url = (urlDraft ?? "").trim();
    update((d) => ({ ...d, settings: { ...d.settings, archiveDeckUrl: url } }));
    setUrlDraft(null);
  };

  const saveNote = () => {
    const note = (noteDraft ?? "").trim();
    update((d) => ({ ...d, settings: { ...d.settings, archiveNote: note } }));
    setNoteDraft(null);
  };

  return (
    <div>
      <PageTitle title="Archive" sub="The club's history in one place." />

      <Card
        title="About the archive"
        className="mb-6"
        action={
          exec &&
          noteDraft === null && (
            <Button variant="ghost" onClick={() => setNoteDraft(archiveNote)}>
              Edit note
            </Button>
          )
        }
      >
        <div className="px-5 py-4">
          {noteDraft === null ? (
            <p className="text-sm text-slate">{archiveNote || "No description yet."}</p>
          ) : (
            <div className="space-y-3">
              <Textarea aria-label="Archive note" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setNoteDraft(null)}>
                  Cancel
                </Button>
                <Button onClick={saveNote}>Save note</Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center md:py-24">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate uppercase">Graphite Group</p>
          <h2 className="font-serif text-3xl md:text-4xl">The Graphite archive</h2>
          {archiveDeckUrl && urlDraft === null ? (
            <>
              <a
                href={archiveDeckUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center bg-accent px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-accent-dark"
              >
                Open the Graphite archive deck
              </a>
              {exec && (
                <Button variant="ghost" onClick={() => setUrlDraft(archiveDeckUrl)}>
                  Change link
                </Button>
              )}
            </>
          ) : (
            <>
              {!archiveDeckUrl && <p className="text-sm text-slate">No archive deck linked yet.</p>}
              {exec ? (
                <form
                  className="flex w-full max-w-xl flex-col gap-3 text-left sm:flex-row sm:items-end"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveUrl();
                  }}
                >
                  <div className="flex-1">
                    <Field label="Archive deck URL">
                      <Input
                        type="url"
                        placeholder="https://"
                        value={urlDraft ?? ""}
                        onChange={(e) => setUrlDraft(e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="flex gap-2">
                    {urlDraft !== null && archiveDeckUrl && (
                      <Button variant="secondary" onClick={() => setUrlDraft(null)}>
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" disabled={!(urlDraft ?? "").trim() && !archiveDeckUrl}>
                      Save link
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-slate">The executive board will add the link soon.</p>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
