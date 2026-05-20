import { useState } from "react";
import {
  useTokens,
  useCreateToken,
  useDeleteToken,
  useDisableToken,
  useEnableToken,
} from "../../hooks/useTokens";
import { Pill } from "../../components";
import {
  CheckIcon,
  ClipboardDocumentIcon,
  KeyIcon,
  NoSymbolIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { formatDateOnly } from "../../utils/date";

const tokenPillStyles = {
  active: {
    toneClassName: "text-primary",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 14%, transparent)",
    },
  },
  disabled: {
    toneClassName: "text-[#B42318]",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 12%, transparent)",
    },
  },
  expired: {
    toneClassName: "text-[#B42318]",
    style: {
      backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)",
      borderColor: "color-mix(in srgb, currentColor 12%, transparent)",
    },
  },
} as const;

export default function TokenSettingsContent() {
  const { data, isLoading } = useTokens();
  const createMutation = useCreateToken();
  const deleteMutation = useDeleteToken();
  const disableMutation = useDisableToken();
  const enableMutation = useEnableToken();

  const [name, setName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const result = await createMutation.mutateAsync(name.trim());
      setNewToken(result.raw_token);
      setName("");
      toast.success("Token 已生成");
    } catch {
      toast.error("生成失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此 Token？")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("已删除");
    } catch {
      toast.error("删除失败");
    }
  };

  const handleCopy = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      toast.success("已复制到剪贴板");
    }
  };

  const activeTokens =
    data?.items.filter((token) => token.status === "active") ?? [];
  const inactiveTokens =
    data?.items.filter((token) => token.status !== "active") ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-primary/10 bg-primary/5 p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)] lg:items-end">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <KeyIcon className="h-4 w-4" />
            创建新 Token
          </div>
        </div>

        <form
          onSubmit={handleCreate}
          className="mt-5 flex flex-col gap-3 sm:flex-row"
        >
          <input
            className="input input-sm h-9 flex-1 rounded-md border border-base-300 bg-base-100 focus:border-primary focus:outline-none"
            placeholder="Token 名称，建议用清晰名称区分用途，如 CLI、Chrome 等"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={createMutation.isPending}
          >
            生成 Token
          </button>
        </form>
      </section>

      {newToken && (
        <section className="rounded-xl border border-warning/25 bg-warning/10 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-base-content">
                请立即复制此 Token
              </p>
              <p className="text-sm text-base-content/65">
                关闭后无法再次查看。
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                className="btn btn-sm gap-1"
                onClick={handleCopy}
                title="复制"
                aria-label="复制 Token"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                复制
              </button>
              <button
                className="btn btn-ghost btn-sm gap-1"
                onClick={() => setNewToken(null)}
                title="关闭"
                aria-label="关闭 Token 提示"
              >
                <XMarkIcon className="h-4 w-4" />
                关闭
              </button>
            </div>
          </div>

          <code className="mt-4 block break-all rounded-lg bg-base-100 px-4 py-4 text-xs leading-6 text-base-content/75">
            {newToken}
          </code>
        </section>
      )}

      <section className="rounded-xl border border-base-200 bg-base-100 p-5">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-semibold text-base-content">Token 列表</p>
          <div className="rounded-full bg-base-200 px-3 py-1 text-xs text-base-content/55">
            {data?.items.length ?? 0} 项
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : data?.items.length === 0 ? (
          <div className="rounded-lg bg-base-200/60 px-6 py-16 text-center text-sm text-base-content/45">
            还没有 Token。
          </div>
        ) : (
          <div className="space-y-6">
            {[
              { title: "启用中的 Token", items: activeTokens },
              { title: "已限制的 Token", items: inactiveTokens },
            ].map((group) =>
              group.items.length > 0 ? (
                <div key={group.title} className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
                    {group.title}
                  </p>
                  {group.items.map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center gap-4 rounded-xl border border-base-200 bg-base-100 px-4 py-4 transition-colors hover:bg-base-200/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-base-content">
                            {token.name}
                          </span>
                          <Pill
                            size="sm"
                            toneClassName={
                              tokenPillStyles[token.status].toneClassName
                            }
                            style={tokenPillStyles[token.status].style}
                          >
                            {token.status === "active"
                              ? "启用"
                              : token.status === "disabled"
                                ? "禁用"
                                : "过期"}
                          </Pill>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-base-content/40">
                          <code>{token.prefix}****</code>
                          <span>使用 {token.usage_count} 次</span>
                          <span>{formatDateOnly(token.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        {token.status === "active" ? (
                          <button
                            className="btn btn-ghost btn-xs gap-1 rounded-md font-normal"
                            onClick={() =>
                              disableMutation
                                .mutateAsync(token.id)
                                .then(() => toast.success("已禁用"))
                            }
                            title="禁用"
                            aria-label={`禁用 Token ${token.name}`}
                          >
                            <NoSymbolIcon className="h-3.5 w-3.5" />
                            禁用
                          </button>
                        ) : token.status === "disabled" ? (
                          <button
                            className="btn btn-ghost btn-xs gap-1 rounded-md font-normal"
                            onClick={() =>
                              enableMutation
                                .mutateAsync(token.id)
                                .then(() => toast.success("已启用"))
                            }
                            title="启用"
                            aria-label={`启用 Token ${token.name}`}
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                            启用
                          </button>
                        ) : null}
                        <button
                          className="btn btn-ghost btn-xs gap-1 rounded-md font-normal text-error"
                          onClick={() => handleDelete(token.id)}
                          title="删除"
                          aria-label={`删除 Token ${token.name}`}
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null,
            )}
          </div>
        )}
      </section>
    </div>
  );
}
