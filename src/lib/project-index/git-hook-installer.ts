import fs from "node:fs";
import path from "node:path";

export class GitHookInstaller {
  constructor(
    private readonly root: string,
    private readonly hooksSource = ".githooks",
  ) {}

  install(): { installed: string[]; skipped: string[] } {
    const srcDir = path.join(this.root, this.hooksSource);
    const destDir = path.join(this.root, ".git", "hooks");
    const installed: string[] = [];
    const skipped: string[] = [];

    if (!fs.existsSync(srcDir)) {
      return { installed, skipped: ["missing-.githooks"] };
    }
    if (!fs.existsSync(path.join(this.root, ".git"))) {
      return { installed, skipped: ["missing-.git"] };
    }

    fs.mkdirSync(destDir, { recursive: true });
    const names = fs
      .readdirSync(srcDir)
      .filter((n) => !n.startsWith(".") && fs.statSync(path.join(srcDir, n)).isFile());

    for (const name of names) {
      const from = path.join(srcDir, name);
      const to = path.join(destDir, name);
      fs.copyFileSync(from, to);
      try {
        fs.chmodSync(to, 0o755);
      } catch {}
      installed.push(name);
    }
    return { installed, skipped };
  }
}
