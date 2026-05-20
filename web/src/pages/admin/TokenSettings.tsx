import { PageHeader, AdminPageShell } from "../../components";
import TokenSettingsContent from "./TokenSettingsContent";

export default function TokenSettings() {
  return (
    <AdminPageShell contentClassName="max-w-5xl space-y-6">
      <PageHeader title="API Token" />
      <TokenSettingsContent />
    </AdminPageShell>
  );
}
