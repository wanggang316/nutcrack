import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import AiSettingsContent from "../../pages/admin/AiSettingsContent";
import TokenSettingsContent from "../../pages/admin/TokenSettingsContent";
import CategorySettingsContent from "../../pages/admin/CategorySettingsContent";

type Tab = "ai" | "token" | "category";

const tabs: { id: Tab; label: string }[] = [
  { id: "ai", label: "AI 设置" },
  { id: "token", label: "API Token" },
  { id: "category", label: "分类设置" },
];

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: Tab;
}

export default function SettingsModal({
  open,
  onClose,
  defaultTab = "ai",
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-base-200 bg-base-100 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-200 px-6 py-4">
          <h2 className="text-base font-semibold">设置</h2>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-base-200 px-6">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-base-content/55 hover:text-base-content"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content — keep all tabs mounted to preserve local state (e.g. newly generated tokens) */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className={activeTab !== "ai" ? "hidden" : ""}>
            <AiSettingsContent />
          </div>
          <div className={activeTab !== "token" ? "hidden" : ""}>
            <TokenSettingsContent />
          </div>
          <div className={activeTab !== "category" ? "hidden" : ""}>
            <CategorySettingsContent />
          </div>
        </div>
      </div>
    </div>
  );
}
