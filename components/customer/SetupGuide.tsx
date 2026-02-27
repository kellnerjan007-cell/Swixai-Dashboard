import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface Step {
  title: string;
  description: string;
  href: string;
  done: boolean;
  optional?: boolean;
}

interface SetupGuideProps {
  steps: Step[];
}

export function SetupGuide({ steps }: SetupGuideProps) {
  const criticalSteps = steps.filter((s) => !s.optional);
  const doneCount = criticalSteps.filter((s) => s.done).length;
  const allCriticalDone = doneCount === criticalSteps.length;

  if (allCriticalDone) return null;

  const progress = Math.round((doneCount / criticalSteps.length) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Einrichtung abschließen</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {doneCount} von {criticalSteps.length} Schritte erledigt
          </p>
        </div>
        <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
          <div
            className="h-full bg-black rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition ${
              step.done
                ? "bg-gray-50"
                : "bg-white border border-gray-200"
            }`}
          >
            {step.done ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? "text-gray-400" : "text-gray-900"}`}>
                {step.title}
                {step.optional && (
                  <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>
                )}
              </p>
              {!step.done && (
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
              )}
            </div>

            {!step.done && (
              <Link
                href={step.href}
                className="flex items-center gap-1 text-xs font-semibold text-black hover:text-gray-500 transition flex-shrink-0"
              >
                Einrichten
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
