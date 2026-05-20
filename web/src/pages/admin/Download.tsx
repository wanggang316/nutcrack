import {
  ArrowDownTrayIcon,
  BoltIcon,
  CommandLineIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/outline";
import { PageHeader, AdminPageShell } from "../../components";

const toolEntries = [
  {
    title: "Skills",
    description: "为 Agent 和自动化流程接入 Nutcrack 能力。",
    href: "https://github.com/wanggang316/nutcrack/skills",
    icon: PuzzlePieceIcon,
    buttonLabel: "打开 Skills",
    iconPositionClassName: "-right-2 -bottom-6",
    iconRotateClassName: "-rotate-[12deg]",
  },
  {
    title: "CLI",
    description: "在终端和脚本中快速提交、管理和集成 Nutcrack。",
    href: "https://github.com/wanggang316/nutcrack/cli",
    icon: CommandLineIcon,
    buttonLabel: "打开 CLI",
    iconPositionClassName: "right-2 top-3",
    iconRotateClassName: "rotate-[9deg]",
  },
] as const;

const chromeSteps = [
  "打开扩展仓库并下载代码",
  "进入 chrome://extensions/",
  "开启「开发者模式」",
  "点击「加载已解压的扩展程序」",
  "选择扩展目录完成安装",
];

export default function Download() {
  return (
    <AdminPageShell contentClassName="max-w-5xl space-y-6">
      <PageHeader title="下载" />

      <section className="rounded-xl border border-primary/10 bg-primary/5 p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ArrowDownTrayIcon className="h-4 w-4" />
              Chrome Extension
            </div>
            <h2 className="text-xl font-semibold text-base-content">
              在浏览器里一键收集网页到 Nutcrack
            </h2>
            <p className="text-sm leading-6 text-base-content/65">
              这是当前最直接的使用入口，适合在浏览网页时快速保存内容。
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href="https://github.com/wanggang316/nutcrack/extensions"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
              >
                打开扩展仓库
              </a>
            </div>
          </div>

          <div className="min-w-0 rounded-lg bg-base-100 px-4 py-4 lg:w-[22rem]">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-base-content">
              <BoltIcon className="h-4 w-4 text-primary" />
              安装步骤
            </div>
            <ol className="list-decimal space-y-2 pl-4 text-sm text-base-content/65">
              {chromeSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section>
        <div className="grid gap-4 md:grid-cols-2">
          {toolEntries.map((entry) => (
            <a
              key={entry.title}
              href={entry.href}
              target="_blank"
              rel="noreferrer"
              className="group relative block overflow-hidden rounded-xl border border-base-200 bg-base-100 px-5 py-5 transition-colors duration-200 hover:bg-primary/[0.04]"
            >
              <div
                className={`pointer-events-none absolute text-primary/[0.12] transition-colors duration-200 group-hover:text-primary/[0.18] ${entry.iconPositionClassName}`}
              >
                <entry.icon
                  className={`h-28 w-28 transition-transform duration-200 ease-[var(--ease-out-quint)] group-hover:rotate-0 motion-reduce:transform-none ${entry.iconRotateClassName}`}
                />
              </div>
              <div className="relative z-10 min-h-[10rem] max-w-[17rem]">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-base font-semibold text-base-content transition-colors duration-200 group-hover:text-primary">
                    {entry.title}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-base-content/62">
                  {entry.description}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  <span>{entry.buttonLabel}</span>
                  <span className="text-base-content/25 transition-all duration-200 ease-[var(--ease-out-quint)] group-hover:translate-x-1 group-hover:text-primary motion-reduce:transform-none">
                    →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
