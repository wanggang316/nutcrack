/**
 * Winston Logger - 异步日志系统
 *
 * 预定义 logger: system, api, task, admin, scraper, ai
 * 通用方法: logError, logWarn, logInfo, logDebug
 * 便捷方法: logApiRequest, logTaskExecution, logAdminAction, logAiAnalysis, logScraping, logSystemStart
 */

import winston from "winston";

// 日志配置
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// 检测是否在 Vercel 环境（serverless）
const IS_VERCEL =
  process.env.VERCEL === "1" || process.env.VERCEL_ENV === "production";

// 自定义日志格式 - 去掉 module 概念
const logFormat = winston.format.printf(
  ({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level.toUpperCase()}] ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ""
    }`;
  },
);

// 创建 transports
const transports: winston.transport[] = [new winston.transports.Console()];

// 在 Vercel 环境中只使用 Console 传输
if (!IS_VERCEL) {
  transports.push(
    new winston.transports.File({
      filename: "error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "combined.log",
    }),
  );
}

// 创建基础 logger
const baseLogger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    logFormat,
  ),
  transports,
});

// 预定义的分类 logger
export const systemLogger = baseLogger.child({ service: "system" });
export const apiLogger = baseLogger.child({ service: "api" });
export const taskLogger = baseLogger.child({ service: "task" });
export const adminLogger = baseLogger.child({ service: "admin" });
export const scraperLogger = baseLogger.child({ service: "scraper" });
export const aiLogger = baseLogger.child({ service: "ai" });

// 便捷的日志方法 - 通用方法
export const logError = (message: string, meta?: any, service?: string) => {
  const targetLogger = service ? baseLogger.child({ service }) : baseLogger;
  targetLogger.error(message, meta);
};

export const logWarn = (message: string, meta?: any, service?: string) => {
  const targetLogger = service ? baseLogger.child({ service }) : baseLogger;
  targetLogger.warn(message, meta);
};

export const logInfo = (message: string, meta?: any, service?: string) => {
  const targetLogger = service ? baseLogger.child({ service }) : baseLogger;
  targetLogger.info(message, meta);
};

export const logDebug = (message: string, meta?: any, service?: string) => {
  const targetLogger = service ? baseLogger.child({ service }) : baseLogger;
  targetLogger.debug(message, meta);
};

// API请求日志记录器
export const logApiRequest = (
  method: string,
  url: string,
  statusCode?: number,
  duration?: number,
  meta?: any,
) => {
  apiLogger.info("API Request", {
    method,
    url,
    statusCode,
    duration,
    ...meta,
  });
};

// 任务执行日志记录器
export const logTaskExecution = (
  taskName: string,
  status: "start" | "success" | "error",
  duration?: number,
  meta?: any,
) => {
  const level = status === "error" ? "error" : "info";
  taskLogger[level](`Task ${taskName} ${status}`, {
    taskName,
    status,
    duration,
    ...meta,
  });
};

// Admin操作日志记录器
export const logAdminAction = (
  action: string,
  userId?: string,
  details?: any,
) => {
  adminLogger.info(`Admin action: ${action}`, {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// AI分析日志记录器
export const logAiAnalysis = (
  url: string,
  status: "start" | "success" | "error",
  prompt?: string,
  response?: any,
  error?: any,
  duration?: number,
) => {
  const level = status === "error" ? "error" : "info";
  aiLogger[level](`AI analysis ${status} for ${url}`, {
    url,
    status,
    prompt: prompt
      ? prompt.length > 500
        ? prompt.substring(0, 500) + "..."
        : prompt
      : undefined,
    response: response
      ? JSON.stringify(response).substring(0, 1000)
      : undefined,
    error: error ? error.message || error : undefined,
    duration,
  });
};

// 网页抓取日志记录器
export const logScraping = (
  url: string,
  status: "start" | "success" | "error",
  duration?: number,
  contentLength?: number,
  error?: any,
) => {
  const level = status === "error" ? "error" : "info";
  scraperLogger[level](`Scraping ${status} for ${url}`, {
    url,
    status,
    duration,
    contentLength,
    error: error ? error.message || error : undefined,
  });
};

// 系统启动时记录配置信息
export const logSystemStart = () => {
  systemLogger.info("System starting", {
    nodeEnv: process.env.NODE_ENV,
    logLevel: LOG_LEVEL,
    isVercel: IS_VERCEL,
    version: process.env.npm_package_version,
  });
};

// 导出默认 logger
export default baseLogger;
