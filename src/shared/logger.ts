type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

interface LogEntry extends LogFields {
  level: LogLevel;
  message: string;
  timestamp: string;
}

const isProd = process.env.NODE_ENV === "production";

function write(level: LogLevel, message: string, fields?: LogFields): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...fields,
  };

  if (isProd) {
    console[level === "debug" ? "log" : level](JSON.stringify(entry));
    return;
  }

  console[level === "debug" ? "log" : level](`[${entry.timestamp}] ${level.toUpperCase()} ${message}`, fields ?? "");
}

export const logger = {
  debug: (message: string, fields?: LogFields) => write("debug", message, fields),
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};
