import { useState } from "react";
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../../hooks/useCategories";
import CategoryIcon from "../../components/CategoryIcon";
import type { Category } from "@nutcrack/shared";
import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const PRESET_ICONS = [
  "BookmarkIcon",
  "FolderIcon",
  "TagIcon",
  "StarIcon",
  "HeartIcon",
  "SparklesIcon",
  "RocketLaunchIcon",
  "GlobeAltIcon",
  "CloudIcon",
  "CubeIcon",
  "CodeBracketIcon",
  "CommandLineIcon",
  "WrenchScrewdriverIcon",
  "CpuChipIcon",
  "ServerIcon",
  "AcademicCapIcon",
  "BeakerIcon",
  "NewspaperIcon",
  "DocumentIcon",
  "ClipboardDocumentListIcon",
  "PhotoIcon",
  "FilmIcon",
  "MusicalNoteIcon",
  "VideoCameraIcon",
  "MicrophoneIcon",
  "ShoppingBagIcon",
  "CreditCardIcon",
  "CurrencyDollarIcon",
  "BriefcaseIcon",
  "BuildingOfficeIcon",
  "HomeIcon",
  "MapPinIcon",
  "TrophyIcon",
  "GiftIcon",
  "TicketIcon",
  "SwatchIcon",
  "ChartPieIcon",
  "TableCellsIcon",
  "MagnifyingGlassIcon",
  "HashtagIcon",
  "EnvelopeIcon",
  "PhoneIcon",
  "ShieldCheckIcon",
  "KeyIcon",
  "LockClosedIcon",
  "UserIcon",
  "CameraIcon",
  "SunIcon",
  "MoonIcon",
  "WifiIcon",
  "ShareIcon",
  "PlayIcon",
  "TruckIcon",
  "PrinterIcon",
];

export default function CategorySettingsContent() {
  const { data, isLoading } = useAdminCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("BookmarkIcon");
  const [customIcon, setCustomIcon] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setIcon("BookmarkIcon");
    setCustomIcon("");
    setShowForm(false);
    setEditingCat(null);
  };

  const startEdit = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    const preset = cat.icon || "BookmarkIcon";
    if (PRESET_ICONS.includes(preset)) {
      setIcon(preset);
      setCustomIcon("");
    } else {
      setIcon("");
      setCustomIcon(preset);
    }
    setShowForm(true);
  };

  const effectiveIcon = customIcon.trim() || icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await updateMutation.mutateAsync({
          id: editingCat.id,
          name,
          description,
          icon: effectiveIcon,
        });
        toast.success("分类已更新");
      } else {
        await createMutation.mutateAsync({
          name,
          description,
          icon: effectiveIcon,
        });
        toast.success("分类已添加");
      }
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "操作失败";
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此分类？该分类下的链接将变为未分类。")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("已删除");
    } catch {
      toast.error("删除失败");
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-primary/10 bg-primary/5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            {editingCat ? (
              <PencilSquareIcon className="h-4 w-4" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
            {editingCat ? "编辑分类" : "新增分类"}
          </div>
          {!showForm && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              + 添加
            </button>
          )}
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-base-100 px-4 py-4">
              <label className="mb-1.5 block text-xs font-medium text-base-content/60">
                分类名称
              </label>
              <input
                className="input input-sm h-9 w-full rounded-md border border-base-300 bg-base-100 focus:border-primary focus:outline-none"
                placeholder="例如：AI、产品、设计"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="rounded-lg bg-base-100 px-4 py-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CategoryIcon iconName={effectiveIcon} className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-base-content">
                    图标预览
                  </p>
                  <p className="text-xs text-base-content/50">
                    {effectiveIcon || "未选择"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 rounded-lg bg-base-200/70 p-3">
                {PRESET_ICONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    title={item}
                    className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                      effectiveIcon === item
                        ? "bg-primary/12 text-primary ring-1 ring-primary/20"
                        : "text-base-content/50 hover:bg-base-100 hover:text-base-content"
                    }`}
                    onClick={() => {
                      setIcon(item);
                      setCustomIcon("");
                    }}
                  >
                    <CategoryIcon iconName={item} className="h-5 w-5" />
                  </button>
                ))}
              </div>

              <input
                className="input input-sm mt-3 h-9 w-full rounded-md border border-base-300 bg-base-100 font-mono focus:border-primary focus:outline-none"
                placeholder="自定义图标名称，如 FireIcon"
                value={customIcon}
                onChange={(e) => {
                  setCustomIcon(e.target.value);
                  if (e.target.value) setIcon("");
                }}
              />
            </div>

            <div className="rounded-lg bg-base-100 px-4 py-4">
              <label className="mb-1.5 block text-xs font-medium text-base-content/60">
                分类描述
              </label>
              <input
                className="input input-sm h-9 w-full rounded-md border border-base-300 bg-base-100 focus:border-primary focus:outline-none"
                placeholder="说明这个分类主要收纳什么内容"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="btn btn-primary btn-sm rounded-md"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingCat ? "更新分类" : "添加分类"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm rounded-md"
                onClick={resetForm}
              >
                清空
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-lg bg-base-100 px-5 py-10 text-center text-sm text-base-content/50">
            点击「+ 添加」，或从下方进入编辑。
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-base-200 bg-base-100 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-base-content">已有分类</p>
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
            还没有分类。
          </div>
        ) : (
          <div className="space-y-3">
            {data?.items.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-4 rounded-xl border border-base-200 bg-base-100 px-4 py-4 transition-colors hover:bg-base-200/50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CategoryIcon iconName={cat.icon} className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold leading-snug text-base-content">
                      {cat.name}
                    </div>
                    <span className="rounded-full bg-base-200 px-2 py-0.5 text-[11px] text-base-content/45">
                      #{cat.sort_order}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-base-content/55">
                    {cat.description || "暂无描述"}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    className="btn btn-ghost btn-xs gap-1 rounded-md font-normal"
                    onClick={() => startEdit(cat)}
                    title="编辑"
                    aria-label={`编辑分类 ${cat.name}`}
                  >
                    <PencilSquareIcon className="h-3.5 w-3.5" />
                    编辑
                  </button>
                  <button
                    className="btn btn-ghost btn-xs gap-1 rounded-md font-normal text-error"
                    onClick={() => handleDelete(cat.id)}
                    title="删除"
                    aria-label={`删除分类 ${cat.name}`}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
