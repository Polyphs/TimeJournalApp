# Team Environment Setup & Automated Git Workflow Guide

This guide ensures our entire team runs on an identical development environment using **WSL 2**, **Docker Compose**, and **VS Code Dev Containers (Node 22-alpine)**. It enforces code quality and unified git history via automated pre-commit and commit-msg hooks.

---

## 🛠️ Phase 1: Lead Admin Setup (Do This Once)
As the Admin, you need to add these configuration files to the root of your project repository, commit them, and push them to your Git repository.

### 1. Update `package.json`
Add `commitlint`, `husky`, and `lint-staged` to your project's `devDependencies`. Then, define the `lint-staged` configuration block to auto-format staged `.js`, `.ts`, and `.vue` files:
```json
{
  "dependencies": {
    "quasar": "^2.0.0"
  },
  "devDependencies": {
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0",
    "eslint": "^9.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0"
  },
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{js,ts,vue}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### 2. Create `commitlint.config.js`
Create this file in your project root to handle standard message layouts:
```javascript
module.exports = { 
  extends: ['@commitlint/config-conventional'] 
};
```

### 3. Create `.devcontainer/devcontainer.json`
Create a folder named `.devcontainer` in your project root. Inside it, create `devcontainer.json`. This version provisions the environment and injects both the **pre-commit** (code-linting) and **commit-msg** (text validation) pipeline commands:
```json
{
  "name": "Quasar Node 22 Development Container",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "quasar-app",
  "workspaceFolder": "/app",
  "customizations": {
    "vscode": {
      "extensions": [
        "Vue.volar",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": "always"
        },
        "eslint.validate": [
          "javascript",
          "typescript",
          "vue"
        ]
      }
    }
  },
  "mounts": [
    "source=${localEnv:HOME}/.gitconfig,target=/root/.gitconfig,type=bind,consistency=cached"
  ],
  "postStartCommand": "git config --global --add safe.directory /app && npx husky add .husky/pre-commit 'npx lint-staged' && npx husky add .husky/commit-msg 'npx --no -- commitlint --edit \"$1\"'"
}
```

### 4. Create `docker-compose.yml`
Create this file in your project root to handle the network and port mapping:
```yaml
version: '3.8'

services:
  quasar-app:
    image: node:22-alpine
    container_name: quasar_dev_container
    volumes:
      - .:/app
    working_dir: /app
    ports:
      - "9000:9000"
      - "8080:8080"
    command: >
      sh -c "rm -rf node_modules package-lock.json && 
             npm install && 
             npx quasar dev --host 0.0.0.0"
    stdin_open: true
    tty: true
```

*Once these files are added, commit and push them to your main branch.*

---

## 💻 Phase 2: Individual Developer Setup (For the Team)
Run these steps on the fresh Windows machines.

### Step 1: Install WSL 2 & Ubuntu
1. Right-click the Windows **Start Menu** and select **Terminal (Admin)** or **PowerShell (Admin)**.
2. Run this command:
   ```powershell
   wsl --install
   ```
3. **Restart your computer** when prompted. 
4. A Linux console will open after restarting. Choose a Unix **username and password**.

### Step 2: Configure Global Git on Windows
Before cloning the project, open a regular **PowerShell** window and configure your global Git identity:
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 3: Install Apps via WinGet
In the same **PowerShell** window, run this command to install Docker Desktop and VS Code:
```powershell
winget install Docker.DockerDesktop Microsoft.VisualStudioCode --silent
```

> 💡 **Required Docker Configuration:** 
> 1. Launch **Docker Desktop** from your Windows Start Menu and accept the terms.
> 2. Go to **Settings (Gear Icon)** -> **Resources** -> **WSL Integration**.
> 3. Check **"Enable integration with my default WSL distro"** and toggle on **Ubuntu**. Click **Apply & Restart**.

### Step 4: Clone the Project into WSL
1. Open a regular **PowerShell** window and jump into Linux:
   ```powershell
   wsl
   ```
2. Navigate to your Linux home directory, clone the project, and move into it:
   ```bash
   cd ~
   git clone <YOUR_REPOSITORY_URL_HERE>
   cd <YOUR_PROJECT_FOLDER_NAME>
   ```
3. Open the project in VS Code:
   ```bash
   code .
   ```

### Step 5: Booting into the Dev Container
1. When VS Code opens, it will ask to install the **WSL Extension**. Click **Install**.
2. Look at the bottom-right corner. A pop-up will say **"Folder contains a Dev Container configuration. Reopen folder to develop in a container"**.
3. Click **Reopen in Container**. 

VS Code will spin up the environment, auto-install node dependencies, wire up the **Husky code/text verification gateway**, and launch the application cleanly!

---

## 🚀 Phase 3: Automated Commits & Safety Parameters
Open the integrated terminal inside VS Code (``Ctrl + ` ``) to run these commands.

### 🛡️ How the Automated Gates Work
When you type `git commit -m "..."`, the following security validations execute in the background:
1. **Pre-Commit Code Guard (`lint-staged`):** It runs ESLint/Prettier over your modified files. If it spots simple formatting slip-ups, it silently cleans them up for you. If it encounters a critical compilation or code breaking bug, **it immediately cancels the commit**, preserving repository health.
2. **Commit-Msg Formatting Guard (`commitlint`):** Once code safety is validated, it verifies your commit text layout. If it doesn't align with conventional prefixes, **the operation is blocked**.

### 📝 Conventional Commit Guidelines (Strictly Enforced)
Every commit message must start with a lowercase prefix telling us what kind of change you made, followed by a colon, a space, and a description:

*   `feat:` A new feature for the application (e.g., `feat: add toggle switch to dark mode`)
*   `fix:` A bug fix (e.g., `fix: resolve sidebar alignment error on mobile`)
*   `docs:` Changes to documentation only (e.g., `docs: update setup steps in readme`)
*   `style:` Formatting, missing semi-colons, style tweaks (no production code changes)
*   `refactor:` Refactoring production code without changing features or fixing bugs
*   `chore:` Updating build tasks, package manager dependencies, etc.

**Example Error Scenario:**
```bash
git commit -m "updated the tables"
# RESULT: Commit blocked! System forces you to supply an intent tag.

git commit -m "style: fix padding alignment in tables"
# RESULT: Commit passed and saved successfully!
```

### 💻 Essential Git Command Cheat Sheet

#### 1. Getting Updates (Do this first thing in the morning)
```bash
git checkout main
git pull
```

#### 2. Starting New Work
```bash
git checkout -b feature/your-task
```

#### 3. Checking Your Status
```bash
git status
```

#### 4. Saving Your Work (Staging & Committing)
```bash
git add .
git commit -m "feat: added login form validation"
```

#### 5. Sending Work to the Team
```bash
git push -u origin feature/your-task
```

#### 6. Emergency: "I broke something, undo my local changes!"
```bash
git reset --hard HEAD
```
