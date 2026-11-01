import { useProjectState } from "./useProjectState";

interface Requirements {
  journal: string;
  policyUrl: string;
  checkedAt: string;
  abstractLimit: number | null;
  manuscriptLimit: number | null;
  referenceLimit: number | null;
  articleType: string;
  notes: string;
}
export function SubmissionRequirements({ manuscript }: { manuscript: string }) {
  const [requirements, setRequirements] = useProjectState<Requirements>(
    "workspace.submissionRequirements",
    {
      journal: "",
      policyUrl: "",
      checkedAt: "",
      abstractLimit: null,
      manuscriptLimit: null,
      referenceLimit: null,
      articleType: "",
      notes: "",
    },
  );
  const words = manuscript.trim() ? manuscript.trim().split(/\s+/).length : 0;
  return (
    <details className="sf-card">
      <summary>Target journal requirements</summary>
      <p>
        Record requirements from the publisher and the date you checked them.
        Limits are author-entered facts; this tool does not verify publisher
        policies.
      </p>
      <div className="sf-grid">
        {(
          [
            ["journal", "Journal"],
            ["articleType", "Article type"],
            ["policyUrl", "Publisher instructions URL"],
            ["checkedAt", "Date checked"],
          ] as const
        ).map(([key, label]) => (
          <label className="sf-field" key={key}>
            <span>{label}</span>
            <input
              type={
                key === "checkedAt"
                  ? "date"
                  : key === "policyUrl"
                    ? "url"
                    : "text"
              }
              value={requirements[key]}
              onChange={(e) =>
                setRequirements({ ...requirements, [key]: e.target.value })
              }
            />
          </label>
        ))}
      </div>
      <div className="sf-grid">
        {(
          [
            ["abstractLimit", "Abstract word limit"],
            ["manuscriptLimit", "Manuscript word limit"],
            ["referenceLimit", "Reference limit"],
          ] as const
        ).map(([key, label]) => (
          <label className="sf-field" key={key}>
            <span>{label}</span>
            <input
              type="number"
              min="1"
              value={requirements[key] ?? ""}
              onChange={(e) =>
                setRequirements({
                  ...requirements,
                  [key]: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </label>
        ))}
      </div>
      <label className="sf-field">
        <span>
          Other requirements (headings, data sharing, AI disclosure, figures,
          declarations)
        </span>
        <textarea
          value={requirements.notes}
          onChange={(e) =>
            setRequirements({ ...requirements, notes: e.target.value })
          }
        />
      </label>
      <p>
        Latest saved manuscript: {words} words.{" "}
        {requirements.manuscriptLimit
          ? words > requirements.manuscriptLimit
            ? "Above the recorded manuscript limit; verify the journal’s counting rules."
            : "Within the recorded manuscript limit; verify the journal’s counting rules."
          : "No journal-specific manuscript limit recorded."}
      </p>
    </details>
  );
}
