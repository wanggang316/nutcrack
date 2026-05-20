import { useState, useEffect } from "react";
import { useAiSettings, useUpdateAiSettings } from "../../hooks/useSettings";
import { CenteredLoading } from "../../components";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const inputClass =
  "input input-sm h-9 w-full rounded-md border border-base-300 bg-base-100 focus:border-primary focus:outline-none";

export default function AiSettingsContent() {
  const { data, isLoading } = useAiSettings();
  const updateMutation = useUpdateAiSettings();

  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState("0.7");

  useEffect(() => {
    if (data) {
      setBaseUrl(data.ai_api_base_url);
      setApiKey("");
      setModel(data.ai_model);
      setTemperature(String(data.ai_temperature));
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body: Record<string, unknown> = {
        ai_api_base_url: baseUrl,
        ai_model: model,
        ai_temperature: parseFloat(temperature),
      };
      if (apiKey) body.ai_api_key = apiKey;

      await updateMutation.mutateAsync(body);
      toast.success("AI 设置已保存");
      setApiKey("");
    } catch {
      toast.error("保存失败");
    }
  };

  if (isLoading)
    return (
      <CenteredLoading>
        <span className="loading loading-spinner loading-lg" />
      </CenteredLoading>
    );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-primary/10 bg-primary/5 p-5"
    >
      <div>
        <label className="mb-1.5 block text-xs font-medium text-base-content/60">
          API Base URL
        </label>
        <input
          className={inputClass}
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.openai.com/v1"
          required
        />
        <p className="mt-2 text-xs text-base-content/45">
          兼容 OpenAI 的接口地址。
        </p>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-xs font-medium text-base-content/60">
            API Key
          </label>
          {data?.ai_api_key && (
            <span className="inline-flex items-center gap-1 text-xs text-base-content/40">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              当前已配置
            </span>
          )}
        </div>
        <input
          className={inputClass}
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="留空则不修改"
        />
        <p className="mt-2 text-xs text-base-content/45">留空则不修改。</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-base-content/60">
          模型
        </label>
        <input
          className={inputClass}
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="gpt-4o-mini"
          required
        />
        <p className="mt-2 text-xs text-base-content/45">当前使用的模型。</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-base-content/60">
          温度
        </label>
        <input
          className={inputClass}
          type="number"
          step="0.1"
          min="0"
          max="2"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
        />
        <p className="mt-2 text-xs text-base-content/45">
          值越高输出越多样化和创造性，值越低输出越确定和保守
        </p>
      </div>

      <div className="rounded-lg bg-base-200/70 px-4 py-3 text-sm text-base-content/65">
        保存后立即生效。
      </div>

      <div className="flex items-center justify-end border-t border-base-200 pt-4">
        <button
          type="submit"
          className="btn btn-primary btn-sm rounded-md"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            "保存设置"
          )}
        </button>
      </div>
    </form>
  );
}
