"use client";

import { useState } from "react";
import { usePortal } from "@/portal/store";
import { isExec } from "@/portal/logic";
import { Button, ButtonLink, Card, Field, Input, PageTitle, Textarea } from "@/portal/ui";

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
        <div className="py-3">
          {noteDraft === null ? (
            <p className="max-w-[70ch] leading-relaxed text-ink-2">{archiveNote || "No description yet."}</p>
          ) : (
            <div className="space-y-3">
              <Textarea aria-label="Archive note" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
              <div className="flex gap-2">
                <Button onClick={saveNote}>Save note</Button>
                <Button variant="secondary" onClick={() => setNoteDraft(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card title="Slide-deck archive">
        <div className="py-3">
          <p className="max-w-[70ch] text-[13.5px] text-muted">
            The Graphite archive is a single slide deck covering the club&apos;s past members, projects and events. It opens in a new tab.
          </p>
          {archiveDeckUrl && urlDraft === null ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ButtonLink href={archiveDeckUrl} variant="primary">
                Open the Graphite archive deck
              </ButtonLink>
              {exec && (
                <Button variant="secondary" onClick={() => setUrlDraft(archiveDeckUrl)}>
                  Change link
                </Button>
              )}
            </div>
          ) : (
            <div className="mt-3">
              {!archiveDeckUrl && <p className="mb-3 text-[13px] text-muted">No archive deck linked yet.</p>}
              {exec ? (
                <form
                  className="flex max-w-xl flex-col gap-2 sm:flex-row sm:items-end"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveUrl();
                  }}
                >
                  <div className="flex-1">
                    <Field label="Archive deck URL">
                      <Input type="url" placeholder="https://" value={urlDraft ?? ""} onChange={(e) => setUrlDraft(e.target.value)} />
                    </Field>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={!(urlDraft ?? "").trim() && !archiveDeckUrl}>
                      Save link
                    </Button>
                    {urlDraft !== null && archiveDeckUrl && (
                      <Button variant="secondary" onClick={() => setUrlDraft(null)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              ) : (
                <p className="text-[13px] text-muted">The executive board will add the link soon.</p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
