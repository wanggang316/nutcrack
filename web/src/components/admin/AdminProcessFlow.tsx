import {
  ExclamationTriangleIcon,
  GlobeAltIcon,
  LinkIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export type AdminProcessFlowStatus =
  | "idle"
  | "queued"
  | "fetching"
  | "analyzing"
  | "completed"
  | "failed";

const stages = [
  {
    key: "queued",
    label: "提交链接",
    icon: LinkIcon,
  },
  {
    key: "fetching",
    label: "抓取内容",
    icon: GlobeAltIcon,
  },
  {
    key: "analyzing",
    label: "AI 分析",
    icon: SparklesIcon,
  },
] as const;

function getActiveStageIndex(status: AdminProcessFlowStatus) {
  if (status === "completed") return stages.length - 1;
  return stages.findIndex((stage) => stage.key === status);
}

function getProgressScale(status: AdminProcessFlowStatus) {
  switch (status) {
    case "queued":
      return 0.28;
    case "fetching":
      return 0.58;
    case "analyzing":
      return 0.84;
    case "completed":
      return 1;
    default:
      return 0;
  }
}

function getStatusText(status: AdminProcessFlowStatus) {
  switch (status) {
    case "queued":
      return "链接已加入队列";
    case "fetching":
      return "正在抓取网页内容";
    case "analyzing":
      return "正在进行 AI 分析";
    case "completed":
      return "链接处理完成！";
    default:
      return "";
  }
}

export default function AdminProcessFlow({
  status,
  errorMessage,
}: {
  status: AdminProcessFlowStatus;
  errorMessage: string | null;
}) {
  const isFailed = status === "failed";
  const activeStageIndex = getActiveStageIndex(status);
  const progressScale = getProgressScale(status);
  const statusText = getStatusText(status);

  if (isFailed) {
    return (
      <section className="px-1 py-1">
        <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-error/10 text-error">
              <ExclamationTriangleIcon className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-error">处理失败</div>
              <div className="text-sm text-base-content/62">
                {errorMessage || "链接无法处理，请检查地址后重新提交。"}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-1 py-1">
      <div className="overflow-x-auto">
        <div className="mx-auto min-w-[34rem] max-w-5xl">
          <div className="grid grid-cols-[minmax(7rem,1fr)_auto_minmax(7rem,1fr)_auto_minmax(7rem,1fr)] justify-items-center gap-x-8 gap-y-4">
            {stages.map((stage, index) => {
              const isCompleteTone = index <= activeStageIndex;
              const isCurrent =
                index === activeStageIndex && status !== "completed";
              const columnStart = index * 2 + 1;

              return (
                <div key={`${stage.key}-stage`} className="contents">
                  <div
                    className={`flex min-w-[5rem] flex-col items-center justify-center transition-colors duration-200 ${
                      isCompleteTone ? "text-primary" : "text-base-content/35"
                    }`}
                    style={{ gridColumnStart: columnStart, gridRowStart: 1 }}
                  >
                    <stage.icon
                      className={`h-14 w-14 ${
                        isCurrent ? "motion-safe:animate-pulse" : ""
                      }`}
                    />
                  </div>

                  <div
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isCompleteTone ? "text-primary" : "text-base-content/52"
                    }`}
                    style={{ gridColumnStart: columnStart, gridRowStart: 2 }}
                  >
                    {stage.label}
                  </div>
                </div>
              );
            })}

            {[0, 1].map((index) => {
              const isCompleteTone = index <= activeStageIndex;
              const connectorAnimated =
                index === activeStageIndex && status !== "completed";

              return (
                <div
                  key={`connector-${index}`}
                  className={`process-stage-chevron ${
                    connectorAnimated
                      ? "process-stage-chevron-active"
                      : isCompleteTone
                        ? "process-stage-chevron-done"
                        : "process-stage-chevron-idle"
                  }`}
                  style={{ gridColumnStart: index * 2 + 2, gridRowStart: 1 }}
                  aria-hidden="true"
                >
                  <span>&gt;</span>
                  <span>&gt;</span>
                  <span>&gt;</span>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center text-base font-medium text-base-content/72">
            {statusText}
          </div>

          <div className="mt-6 h-1 rounded-full bg-base-200">
            <div
              className="h-full origin-left rounded-full bg-primary transition-transform duration-300"
              style={{ transform: `scaleX(${progressScale})` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
