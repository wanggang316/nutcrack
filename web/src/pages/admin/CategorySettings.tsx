import { PageHeader, AdminPageShell } from "../../components";
import CategorySettingsContent from "./CategorySettingsContent";

export default function CategorySettings() {
  return (
    <AdminPageShell contentClassName="max-w-3xl space-y-6">
      <PageHeader title="分类设置" />
      <CategorySettingsContent />
    </AdminPageShell>
  );
}
