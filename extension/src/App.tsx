import { FormEvent, useEffect, useState } from "react";

type ViewMode = "settings" | "add";

type StoredConfig = {
  host: string;
  apiToken: string;
};

type Feedback = {
  type: "success" | "error" | null;
  message: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
};

const STORAGE_KEYS = {
  host: "host",
  apiToken: "api_token",
} as const;

function normalizeHost(input: string) {
  return input.trim().replace(/\/+$/, "");
}

function Logo() {
  return (
    <div className="brand">
      <svg
        width="18"
        height="23"
        viewBox="0 0 72 91"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M29.4414 83.043L47.1582 70.541L65.5947 83.0674L69.5 85.7217V17.5H25.5V85.8242L29.4414 83.043Z"
          stroke="currentColor"
          strokeWidth="5"
        />
        <path
          d="M6.44141 68.043L24.1592 55.541L32.6611 61.3174L42.5947 68.0674L46.5 70.7217V2.5H2.5V70.8242L6.44141 68.043Z"
          stroke="currentColor"
          strokeWidth="5"
        />
      </svg>
      <span>Nutcrack</span>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 10.5 12 3l9 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.25 9.75V21h13.5V9.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 21v-6h4v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

async function loadStoredConfig(): Promise<StoredConfig> {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.host,
    STORAGE_KEYS.apiToken,
  ]);

  return {
    host:
      typeof stored[STORAGE_KEYS.host] === "string"
        ? stored[STORAGE_KEYS.host]
        : "",
    apiToken:
      typeof stored[STORAGE_KEYS.apiToken] === "string"
        ? stored[STORAGE_KEYS.apiToken]
        : "",
  };
}

async function saveStoredConfig(config: StoredConfig) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.host]: config.host,
    [STORAGE_KEYS.apiToken]: config.apiToken,
  });
}

async function getCurrentTabUrl() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const current = tabs[0]?.url ?? "";
  return current.startsWith("http://") || current.startsWith("https://")
    ? current
    : "";
}

export default function App() {
  const [view, setView] = useState<ViewMode>("settings");
  const [host, setHost] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [url, setUrl] = useState("");
  const [hasSavedConfig, setHasSavedConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({
    type: null,
    message: "",
  });

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const [config, currentUrl] = await Promise.all([
          loadStoredConfig(),
          getCurrentTabUrl(),
        ]);

        if (!active) {
          return;
        }

        setHost(config.host);
        setApiToken(config.apiToken);
        setUrl(currentUrl);
        setHasSavedConfig(Boolean(config.host && config.apiToken));
        setView(config.host && config.apiToken ? "add" : "settings");
      } catch {
        if (!active) {
          return;
        }
        setFeedback({ type: "error", message: "初始化失败，请重新打开插件。" });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedHost = normalizeHost(host);
    const trimmedToken = apiToken.trim();

    if (!normalizedHost || !trimmedToken) {
      setFeedback({ type: "error", message: "请完整填写 Host 和 API Token。" });
      return;
    }

    setSubmitting(true);
    setFeedback({ type: null, message: "" });

    try {
      const response = await fetch(`${normalizedHost}/api/auth/tokens/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trimmedToken}`,
        },
      });

      const payload = (await response.json()) as ApiEnvelope<{
        valid: boolean;
      }>;

      if (!response.ok || !payload.success || !payload.data?.valid) {
        setFeedback({
          type: "error",
          message:
            payload.error?.message || "验证失败，请检查 Host 和 API Token。",
        });
        return;
      }

      await saveStoredConfig({ host: normalizedHost, apiToken: trimmedToken });
      setHost(normalizedHost);
      setApiToken(trimmedToken);
      setHasSavedConfig(true);
      setView("add");
      setFeedback({ type: "success", message: "验证成功。" });
    } catch {
      setFeedback({ type: "error", message: "验证失败，请检查网络连接。" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedHost = normalizeHost(host);
    const trimmedToken = apiToken.trim();
    const trimmedUrl = url.trim();

    if (!normalizedHost || !trimmedToken) {
      setView("settings");
      setFeedback({
        type: "error",
        message: "请先完成 Host 和 API Token 设置。",
      });
      return;
    }

    if (!trimmedUrl) {
      setFeedback({ type: "error", message: "当前页面地址不能为空。" });
      return;
    }

    setSubmitting(true);
    setFeedback({ type: null, message: "" });

    try {
      const response = await fetch(`${normalizedHost}/api/auth/links`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trimmedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const payload = (await response.json()) as ApiEnvelope<{ id: string }>;

      if (!response.ok || !payload.success) {
        setFeedback({
          type: "error",
          message: payload.error?.message || "添加失败，请稍后重试。",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: "添加成功，链接已进入待处理列表。",
      });
    } catch {
      setFeedback({ type: "error", message: "添加失败，请检查网络连接。" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="popup-shell">
        <section className="panel">
          <Logo />
          <div className="status-block">
            <div className="status-dot" />
            <span>正在初始化...</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="popup-shell">
      <section className="panel">
        {view === "settings" ? (
          <>
            <header className="panel-header panel-header-stack">
              <div className="panel-topline">
                <Logo />
                {hasSavedConfig ? (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="返回添加链接页"
                    onClick={() => {
                      setView("add");
                      setFeedback({ type: null, message: "" });
                    }}
                  >
                    <HomeIcon />
                  </button>
                ) : null}
              </div>
              <p className="panel-subtitle">
                首次使用请先配置 Host 和 API Token。
              </p>
            </header>

            <form className="form-grid" onSubmit={handleVerify}>
              <label className="field">
                <span>Host</span>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={host}
                  onChange={(event) => setHost(event.target.value)}
                  autoComplete="off"
                />
              </label>

              <label className="field">
                <span>API Token</span>
                <input
                  type="password"
                  placeholder="请输入 API Token"
                  value={apiToken}
                  onChange={(event) => setApiToken(event.target.value)}
                  autoComplete="off"
                />
              </label>

              <button
                className="primary-button"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "验证中..." : "确认并验证"}
              </button>
            </form>
          </>
        ) : (
          <>
            <header className="panel-header">
              <Logo />
              <button
                type="button"
                className="icon-button"
                aria-label="打开设置"
                onClick={() => {
                  setView("settings");
                  setFeedback({ type: null, message: "" });
                }}
              >
                <SettingsIcon />
              </button>
            </header>

            <form className="form-grid" onSubmit={handleAddLink}>
              <label className="field">
                <span>当前页面地址</span>
                <input
                  type="url"
                  placeholder="https://current.page/url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  autoComplete="off"
                />
              </label>

              <button
                className="primary-button"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "添加中..." : "添加"}
              </button>
            </form>
          </>
        )}

        {feedback.type ? (
          <div className={`feedback feedback-${feedback.type}`}>
            {feedback.message}
          </div>
        ) : null}
      </section>
    </main>
  );
}
