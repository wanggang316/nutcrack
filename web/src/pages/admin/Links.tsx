import { useState } from "react";
import {
  useAdminLinks,
  useDeleteLink,
  useUpdateLink,
  usePublishLink,
  useArchiveLink,
  useReprocessLink,
  useReanalyzeLink,
} from "../../hooks/useLinks";
import { useAdminCategories } from "../../hooks/useCategories";
import { AdminLinkCard, LinkEditModal } from "../../components";
import { PageHeader, Pagination, AdminPageShell } from "../../components";
import type { Link, LinkStatus, ProcessingStatus } from "@nutcrack/shared";
import toast from "react-hot-toast";
import { ApiClientError } from "@nutcrack/shared";
import { getAiSuggestedManualFields } from "../../utils/link-fields";

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待处理" },
  { value: "published", label: "已发布" },
  { value: "archived", label: "已归档" },
  { value: "deleted", label: "已删除" },
] as const;

const processingOptions = [
  { value: "", label: "全部处理状态" },
  { value: "queued", label: "排队中" },
  { value: "fetching", label: "抓取中" },
  { value: "analyzing", label: "分析中" },
  { value: "completed", label: "已完成" },
  { value: "failed", label: "失败" },
] as const;

export default function AllLinks() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<LinkStatus | "">("");
  const [processingStatus, setProcessingStatus] = useState<
    ProcessingStatus | ""
  >("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data, isLoading } = useAdminLinks({
    page,
    page_size: 20,
    q: q || undefined,
    status: status || undefined,
    processing_status: processingStatus || undefined,
    category: categoryFilter || undefined,
  });

  const { data: categoriesData } = useAdminCategories();
  const deleteMutation = useDeleteLink();
  const updateMutation = useUpdateLink();
  const publishMutation = usePublishLink();
  const archiveMutation = useArchiveLink();
  const reprocessMutation = useReprocessLink();
  const reanalyzeMutation = useReanalyzeLink();
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const publishLoadingId = publishMutation.isPending
    ? publishMutation.variables
    : null;
  const deleteLoadingId = deleteMutation.isPending
    ? deleteMutation.variables
    : null;
  const reprocessLoadingId = reprocessMutation.isPending
    ? reprocessMutation.variables
    : null;
  const reanalyzeLoadingId = reanalyzeMutation.isPending
    ? reanalyzeMutation.variables
    : null;

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此链接？")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("已删除");
    } catch {
      toast.error("删除失败");
    }
  };

  const handleSave = async (data: Record<string, unknown>) => {
    if (!editingLink) return;
    try {
      await updateMutation.mutateAsync({ id: editingLink.id, ...data });
      toast.success("已保存");
      setEditingLink(null);
    } catch {
      toast.error("保存失败");
    }
  };

  const handleSaveAndPublish = async (data: Record<string, unknown>) => {
    if (!editingLink) return;
    try {
      await updateMutation.mutateAsync({ id: editingLink.id, ...data });
      await publishMutation.mutateAsync(editingLink.id);
      toast.success("已保存并发布");
      setEditingLink(null);
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "操作失败");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const link = data?.items.find((item) => item.id === id);
      if (!link) return;
      await updateMutation.mutateAsync({
        id,
        ...getAiSuggestedManualFields(link),
      });
      await publishMutation.mutateAsync(id);
      toast.success("已发布");
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "发布失败");
    }
  };

  const handleReanalyze = async (link: Link) => {
    try {
      await reanalyzeMutation.mutateAsync(link.id);
      toast.success("正在重新获取 AI 建议");
    } catch {
      toast.error("重新获取 AI 建议失败");
    }
  };

  const handleReprocess = async (link: Link) => {
    try {
      await reprocessMutation.mutateAsync(link.id);
      toast.success(
        link.processing_status === "completed"
          ? "已提交重新分析"
          : "已重新提交处理",
      );
    } catch {
      toast.error(
        link.processing_status === "completed" ? "重新分析失败" : "重试失败",
      );
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveMutation.mutateAsync(id);
      toast.success("已归档");
    } catch {
      toast.error("归档失败");
    }
  };

  const handleReset = () => {
    setQ("");
    setStatus("");
    setProcessingStatus("");
    setCategoryFilter("");
    setPage(1);
  };

  return (
    <AdminPageShell>
      <PageHeader title="全部链接" />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          className="input input-bordered input-sm w-full sm:w-72"
          placeholder="搜索标题、URL..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <select
            className="select select-bordered select-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as LinkStatus);
              setPage(1);
            }}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered select-sm"
            value={processingStatus}
            onChange={(e) => {
              setProcessingStatus(e.target.value as ProcessingStatus);
              setPage(1);
            }}
          >
            {processingOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered select-sm"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部分类</option>
            {categoriesData?.items.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>
            重置
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <div>
          {data?.items.map((link) => (
            <AdminLinkCard
              key={link.id}
              link={link}
              categories={categoriesData?.items}
              showActions={true}
              onPublish={() => handlePublish(link.id)}
              onEdit={() => setEditingLink(link)}
              onDelete={() => handleDelete(link.id)}
              onReprocess={() => handleReprocess(link)}
              publishLoading={publishLoadingId === link.id}
              deleteLoading={deleteLoadingId === link.id}
              reprocessLoading={reprocessLoadingId === link.id}
            />
          ))}

          {data && data.pagination.total_pages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={data.pagination.total_pages}
              onPageChange={setPage}
              maxVisible={10}
              size="sm"
              className="mt-6 pb-4"
            />
          )}
        </div>
      )}

      <LinkEditModal
        link={editingLink}
        open={!!editingLink}
        onClose={() => setEditingLink(null)}
        onReanalyze={
          editingLink ? () => handleReanalyze(editingLink) : undefined
        }
        reanalyzeLoading={reanalyzeLoadingId === editingLink?.id}
        onSave={handleSave}
        onSaveAndPublish={handleSaveAndPublish}
      />
    </AdminPageShell>
  );
}
