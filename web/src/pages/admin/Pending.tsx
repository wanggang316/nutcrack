import { useState } from "react";
import {
  usePendingLinks,
  usePublishLink,
  useDeleteLink,
  useUpdateLink,
  useReprocessLink,
  useReanalyzeLink,
} from "../../hooks/useLinks";
import { useAdminCategories } from "../../hooks/useCategories";
import { AdminLinkCard, LinkEditModal } from "../../components";
import {
  PageHeader,
  EmptyStates,
  Pagination,
  AdminPageShell,
} from "../../components";
import type { Link } from "@nutcrack/shared";
import toast from "react-hot-toast";
import { ApiClientError } from "@nutcrack/shared";
import { getAiSuggestedManualFields } from "../../utils/link-fields";

export default function Pending() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = usePendingLinks({ page, page_size: 20 });
  const { data: categories } = useAdminCategories();
  const publishMutation = usePublishLink();
  const deleteMutation = useDeleteLink();
  const updateMutation = useUpdateLink();
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

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此链接？")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("已删除");
    } catch {
      toast.error("删除失败");
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
    } catch {
      toast.error("操作失败");
    }
  };

  return (
    <AdminPageShell>
      <PageHeader
        title="待处理链接"
        action={
          <button className="btn btn-sm btn-ghost" onClick={() => refetch()}>
            刷新
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center p-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : data?.items.length === 0 ? (
        <EmptyStates.NoPendingLinks />
      ) : (
        <div>
          {data?.items.map((link) => (
            <AdminLinkCard
              key={link.id}
              link={link}
              categories={categories?.items}
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
