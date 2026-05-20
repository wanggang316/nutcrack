import { PageHeader, AdminPageShell } from "../../components";
import AiSettingsContent from "./AiSettingsContent";

export default function AiSettings() {
  return (
    <AdminPageShell contentClassName="max-w-2xl space-y-6">
      <PageHeader title="AI 设置" />
      <AiSettingsContent />
    </AdminPageShell>
  );
}
