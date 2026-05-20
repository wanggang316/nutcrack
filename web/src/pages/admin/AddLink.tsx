import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { PageHeader, AdminPageShell } from "../../components";
import { useCreateLinkStreaming, usePublishLink } from "../../hooks/useLinks";
import { useAdminCategories } from "../../hooks/useCategories";
import AdminProcessFlow, {
  type AdminProcessFlowStatus,
} from "../../components/admin/AdminProcessFlow";
import AdminLinkCard from "../../components/admin/AdminLinkCard";
import { LinkIcon } from "@heroicons/react/24/outline";
import type { Link } from "@nutcrack/shared";
import { useUpdateLink } from "../../hooks/useLinks";
import { ApiClientError } from "@nutcrack/shared";
import { getAiSuggestedManualFields } from "../../utils/link-fields";

export default function AddLink() {
  const [url, setUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");
  const [status, setStatus] = useState<AdminProcessFlowStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [linkId, setLinkId] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<{
    url?: string;
    title?: string;
    summary?: string;
    category?: string;
    tags?: string[];
  }>({});

  const { createStreaming } = useCreateLinkStreaming();
  const publishMutation = usePublishLink();
  const updateMutation = useUpdateLink();
  const { data: categoriesData } = useAdminCategories();
  const navigate = useNavigate();

  const canSubmit =
    status === "idle" || status === "completed" || status === "failed";
  const hasResult = status !== "idle";
  const completedLink: Link | null =
    status === "completed"
      ? {
          id: linkId || "preview",
          url: progressData.url || submittedUrl,
          original_title: null,
          original_description: null,
          original_content: null,
          title: null,
          summary: null,
          key_points: [],
          category: null,
          tags: [],
          ai_title: progressData.title || null,
          ai_summary: progressData.summary || null,
          ai_key_points: [],
          ai_category: progressData.category || null,
          ai_tags: progressData.tags || [],
          status: "pending",
          processing_status: "completed",
          process_error: null,
          published_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: "system",
        }
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const nextUrl = url.trim();

    setStatus("idle");
    setErrorMessage(null);
    setProgressData({});
    setLinkId(null);
    setSubmittedUrl(nextUrl);

    try {
      await createStreaming(nextUrl, (event) => {
        setStatus(event.type as AdminProcessFlowStatus);
        setLinkId(event.link_id);

        if (event.type === "completed") {
          toast.success("链接处理完成");
          setProgressData({
            url: event.data?.url,
            title: event.data?.title,
            summary: event.data?.summary,
            category: event.data?.category,
            tags: event.data?.tags,
          });
          setUrl("");
        } else if (event.type === "failed") {
          const message = event.data?.error || "未知错误";
          setErrorMessage(message);
          toast.error(`处理失败: ${message}`);
        } else if (event.type === "analyzing") {
          setProgressData((prev) => ({
            ...prev,
            url: event.data?.url || prev.url,
            title: event.data?.title || prev.title,
          }));
        }
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "添加失败";
      setStatus("failed");
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const handlePublish = async () => {
    if (!linkId || !completedLink) return;
    try {
      await updateMutation.mutateAsync({
        id: linkId,
        ...getAiSuggestedManualFields(completedLink),
      });
      await publishMutation.mutateAsync(linkId);
      toast.success("已发布");
      navigate("/admin/links");
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "发布失败");
    }
  };

  return (
    <AdminPageShell>
      <div className="space-y-8">
        <PageHeader title="添加链接" />

        <section className="rounded-xl border border-primary/10 bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <LinkIcon className="h-4 w-4" />
            输入添加的地址
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="max-w-4xl">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="url"
                  className="input input-sm h-9 w-full flex-1 rounded-md border border-base-300 bg-base-100 focus:border-primary focus:outline-none"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={!canSubmit}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!canSubmit}
                >
                  {canSubmit ? (
                    status === "failed" ? (
                      "重新提取"
                    ) : (
                      "添加链接"
                    )
                  ) : (
                    <span className="loading loading-spinner" />
                  )}
                </button>
              </div>
            </div>

            {status === "failed" && errorMessage ? (
              <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                {errorMessage}
              </div>
            ) : null}
          </form>
        </section>

        {hasResult ? (
          <div className="space-y-6">
            <AdminProcessFlow status={status} errorMessage={errorMessage} />

            {status === "completed" && completedLink ? (
              <div className="space-y-4">
                <section className="rounded-xl border border-base-200 bg-base-100 px-5 py-3">
                  <AdminLinkCard
                    link={completedLink}
                    categories={categoriesData?.items}
                  />
                </section>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn btn-outline btn-sm rounded-md"
                    onClick={() => navigate("/admin/pending")}
                  >
                    查看待处理链接
                  </button>
                  <button
                    className="btn btn-primary btn-sm rounded-md"
                    onClick={handlePublish}
                    disabled={
                      publishMutation.isPending ||
                      updateMutation.isPending ||
                      !completedLink
                    }
                  >
                    {publishMutation.isPending || updateMutation.isPending ? (
                      <span className="loading loading-spinner" />
                    ) : (
                      "确认并发布"
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
