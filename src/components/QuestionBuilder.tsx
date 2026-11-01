import { useProjectState } from "./useProjectState";

const FRAMEWORKS = {
  PICO: {
    fields: ["Population", "Intervention", "Comparison", "Outcome"],
    prompt: (v: string[]) =>
      `In ${v[0]}, how does ${v[1]} compared with ${v[2]} affect ${v[3]}?`,
  },
  PCC: {
    fields: ["Population", "Concept", "Context"],
    prompt: (v: string[]) =>
      `What is known about ${v[1]} for ${v[0]} in ${v[2]}?`,
  },
  SPIDER: {
    fields: [
      "Sample",
      "Phenomenon of interest",
      "Design",
      "Evaluation",
      "Research type",
    ],
    prompt: (v: string[]) =>
      `How is ${v[1]} experienced or understood by ${v[0]}, considering ${v[3]}, using ${v[2]} within ${v[4]} inquiry?`,
  },
  Interpretive: {
    fields: [
      "Texts, archives, or participants",
      "Interpretive problem",
      "Historical or social context",
    ],
    prompt: (v: string[]) =>
      `How can ${v[1]} be interpreted through ${v[0]} in ${v[2]}?`,
  },
  Computational: {
    fields: [
      "System or artifact",
      "Task and benchmark",
      "Baseline",
      "Evaluation criteria",
    ],
    prompt: (v: string[]) =>
      `How does ${v[0]} perform on ${v[1]} compared with ${v[2]}, evaluated by ${v[3]}?`,
  },
};
type Framework = keyof typeof FRAMEWORKS;
export function QuestionBuilder({
  apply,
}: {
  apply: (question: string) => void;
}) {
  const [framework, setFramework] = useProjectState<Framework>(
    "workspace.questionFramework",
    "PCC",
  );
  const [values, setValues] = useProjectState<Record<string, string>>(
    "workspace.questionComponents",
    {},
  );
  const definition = FRAMEWORKS[framework];
  return (
    <details className="sf-card">
      <summary>
        Develop a question with a discipline-appropriate framework
      </summary>
      <p>
        Frameworks are drafting aids. The wording does not establish
        feasibility, an analysis plan, or causal identification.
      </p>
      <label className="sf-field">
        <span>Question framework</span>
        <select
          value={framework}
          onChange={(e) => setFramework(e.target.value as Framework)}
        >
          {Object.keys(FRAMEWORKS).map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </label>
      <div className="sf-grid">
        {definition.fields.map((field) => (
          <label className="sf-field" key={field}>
            <span>{field}</span>
            <input
              value={values[`${framework}:${field}`] || ""}
              onChange={(e) =>
                setValues({
                  ...values,
                  [`${framework}:${field}`]: e.target.value,
                })
              }
            />
          </label>
        ))}
      </div>
      <button
        className="sf-secondary"
        disabled={definition.fields.some(
          (field) => !values[`${framework}:${field}`]?.trim(),
        )}
        onClick={() =>
          apply(
            definition.prompt(
              definition.fields.map((field) =>
                values[`${framework}:${field}`].trim(),
              ),
            ),
          )
        }
      >
        Use this research question
      </button>
    </details>
  );
}
