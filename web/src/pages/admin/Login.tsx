import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../../components";
import { adminApi } from "../../utils/api";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { login, setupPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkPasswordInitialized = async () => {
      try {
        const data = await adminApi.checkInit();
        setIsSetup(!data.initialized);
      } catch (err) {
        console.error("Failed to check initialization:", err);
        toast.error(err instanceof Error ? err.message : "无法检查初始化状态");
        setIsSetup(false);
      } finally {
        setChecking(false);
      }
    };
    checkPasswordInitialized();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSetup) {
        await setupPassword(email, password);
        toast.success("密码设置成功，请登录");
        setIsSetup(false);
        setPassword("");
      } else {
        await login(email, password);
        navigate("/admin");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "操作失败";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-base-100 flex items-start justify-center pt-40">
        <span className="loading loading-spinner loading-md text-base-content/30" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="flex flex-col items-center pt-28 px-6">
        <Logo variant="large" showText />

        <div className="w-full max-w-[360px] mt-12">
          {isSetup && (
            <p className="text-sm text-base-content/50 mb-5">
              首次使用，请设置管理密码
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-base-content/60 mb-1.5">
                邮箱
              </label>
              <input
                type="email"
                className="input w-full input-sm h-9 text-sm border border-base-300 focus:border-primary focus:outline-none rounded-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-base-content/60 mb-1.5">
                密码
              </label>
              <input
                type="password"
                className="input w-full input-sm h-9 text-sm border border-base-300 focus:border-primary focus:outline-none rounded-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full h-10 mt-1 rounded-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : isSetup ? (
                "设置密码"
              ) : (
                "登录"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
