import os from "node:os";
import path from "node:path";

export function getConfigDir() {
  return path.join(os.homedir(), ".config", "nutcrack");
}

export function getConfigPath() {
  return path.join(getConfigDir(), "config.json");
}
