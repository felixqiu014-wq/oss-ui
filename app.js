(function () {
  const SESSION_KEY = "oss-ui-authenticated";
  const PROJECTS_KEY = "oss-ui-projects";
  const CART_KEY = "oss-ui-cart";

  const els = {
    loginView: document.getElementById("loginView"),
    consoleView: document.getElementById("consoleView"),
    topbarEyebrow: document.getElementById("topbarEyebrow"),
    topbarTitle: document.getElementById("topbarTitle"),
    topbarTitleMeta: document.getElementById("topbarTitleMeta"),
    topbarSubtitle: document.getElementById("topbarSubtitle"),
    topbarBackIcon: document.getElementById("topbarBackIcon"),
    packagePage: document.getElementById("packagePage"),
    projectsPage: document.getElementById("projectsPage"),
    projectDetailPage: document.getElementById("projectDetailPage"),
    marketButton: document.getElementById("marketButton"),
    cartButton: document.getElementById("cartButton"),
    cartCount: document.getElementById("cartCount"),
    loginForm: document.getElementById("loginForm"),
    passwordInput: document.getElementById("passwordInput"),
    loginError: document.getElementById("loginError"),
    lockButton: document.getElementById("lockButton"),
    backToProjectsButton: document.getElementById("backToProjectsButton"),
    openProjectModalButton: document.getElementById("openProjectModalButton"),
    exportProjectTimelineButton: document.getElementById("exportProjectTimelineButton"),
    shopForProjectTopButton: document.getElementById("shopForProjectTopButton"),
    projectModal: document.getElementById("projectModal"),
    closeProjectModalButton: document.getElementById("closeProjectModalButton"),
    cancelProjectModalButton: document.getElementById("cancelProjectModalButton"),
    projectForm: document.getElementById("projectForm"),
    projectNameInput: document.getElementById("projectNameInput"),
    projectOwnerInput: document.getElementById("projectOwnerInput"),
    projectsList: document.getElementById("projectsList"),
    projectDetailContent: document.getElementById("projectDetailContent"),
    cartDialog: document.getElementById("cartDialog"),
    closeCartButton: document.getElementById("closeCartButton"),
    cartItems: document.getElementById("cartItems"),
    cartProjectSelect: document.getElementById("cartProjectSelect"),
    cartProjectLabelText: document.getElementById("cartProjectLabelText"),
    clearCartButton: document.getElementById("clearCartButton"),
    generateRecordButton: document.getElementById("generateRecordButton"),
    operationDocDialog: document.getElementById("operationDocDialog"),
    operationDocTitle: document.getElementById("operationDocTitle"),
    operationDocForm: document.getElementById("operationDocForm"),
    operationDocNameInput: document.getElementById("operationDocNameInput"),
    operationDocContentInput: document.getElementById("operationDocContentInput"),
    closeOperationDocButton: document.getElementById("closeOperationDocButton"),
    cancelOperationDocButton: document.getElementById("cancelOperationDocButton"),
    appsTabs: document.getElementById("appsTabs"),
    middlewareTabs: document.getElementById("middlewareTabs"),
    packageTitle: document.getElementById("packageTitle"),
    packageType: document.getElementById("packageType"),
    packageMeta: document.getElementById("packageMeta"),
    detailControls: document.getElementById("detailControls"),
    linkCards: document.getElementById("linkCards"),
    addPackageToCartButton: document.getElementById("addPackageToCartButton"),
    copyAllButton: document.getElementById("copyAllButton"),
    refreshButton: document.getElementById("refreshButton"),
    channel: document.getElementById("channel"),
    arch: document.getElementById("arch"),
    searchInput: document.getElementById("searchInput"),
    ciVersionField: document.getElementById("ciVersionField"),
    ciVersion: document.getElementById("ciVersion"),
    statusText: document.getElementById("statusText"),
  };

  let selectedPackage = "base-pro";
  let rules = [];
  let detail = null;
  let loadingDetail = false;
  let ciVersions = [];
  let releaseVersions = [];
  let projects = loadStoredList(PROJECTS_KEY);
  let cartItems = loadStoredList(CART_KEY);
  let currentPage = "projects";
  let currentProjectId = "";
  let marketTargetProjectId = "";
  let packageReturnPage = "projects";
  let selectedDetailPackageName = "";
  let pendingOperationTarget = null;
  const expandedGroups = new Set(["base"]);
  const customSelects = new Map();
  const operationEvents = [
    { type: "upgrade", label: "升级" },
    { type: "bugfix", label: "bug 修复" },
    { type: "deploy", label: "部署" },
  ];

  async function request(path, options) {
    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options && options.headers ? options.headers : {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || `request failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function loadStoredList(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function saveProjects() {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }

  function saveCartItems() {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }

  function projectById(projectId) {
    return projects.find((item) => item.id === projectId) || null;
  }

  function closeProjectModal() {
    els.projectModal.classList.add("hidden");
  }

  function openProjectModal() {
    els.projectModal.classList.remove("hidden");
    els.projectNameInput.focus();
  }

  function showConsole() {
    els.loginView.classList.add("hidden");
    els.consoleView.classList.remove("hidden");
    loadRules();
    showProjectsPage();
  }

  function showLogin() {
    els.consoleView.classList.add("hidden");
    els.loginView.classList.remove("hidden");
    els.passwordInput.focus();
  }

  function showPackagePage() {
    closeCartDialog();
    closeProjectModal();
    closeOperationDocDialog();
    els.projectsPage.classList.add("hidden");
    els.projectDetailPage.classList.add("hidden");
    els.packagePage.classList.remove("hidden");
    els.topbarEyebrow.textContent = "package marketplace";
    els.topbarEyebrow.classList.remove("hidden");
    els.topbarTitle.textContent = "安装包市场";
    els.topbarTitleMeta.textContent = "";
    const targetProject = projectById(marketTargetProjectId);
    els.topbarSubtitle.textContent = targetProject ? `正在为项目「${targetProject.name}」选购安装包` : "";
    els.topbarBackIcon.classList.remove("hidden");
    els.marketButton.classList.add("hidden");
    els.openProjectModalButton.classList.add("hidden");
    els.exportProjectTimelineButton.classList.add("hidden");
    els.shopForProjectTopButton.classList.add("hidden");
    els.cartButton.classList.remove("hidden");
    els.backToProjectsButton.classList.add("hidden");
    currentPage = "package";
  }

  function showProjectsPage() {
    closeCartDialog();
    closeProjectModal();
    closeOperationDocDialog();
    els.packagePage.classList.add("hidden");
    els.projectDetailPage.classList.add("hidden");
    els.projectsPage.classList.remove("hidden");
    els.topbarEyebrow.textContent = "project operation records";
    els.topbarEyebrow.classList.remove("hidden");
    els.topbarTitle.textContent = "项目列表";
    els.topbarTitleMeta.textContent = "";
    els.topbarSubtitle.textContent = "";
    els.topbarBackIcon.classList.add("hidden");
    els.marketButton.classList.remove("hidden");
    els.openProjectModalButton.classList.remove("hidden");
    els.exportProjectTimelineButton.classList.add("hidden");
    els.shopForProjectTopButton.classList.add("hidden");
    els.cartButton.classList.add("hidden");
    els.backToProjectsButton.classList.add("hidden");
    packageReturnPage = "projects";
    currentPage = "projects";
    renderProjects();
  }

  function showProjectDetailPage(projectId) {
    const project = projectById(projectId);
    if (!project) {
      showProjectsPage();
      return;
    }
    closeCartDialog();
    closeProjectModal();
    closeOperationDocDialog();
    currentProjectId = project.id;
    els.packagePage.classList.add("hidden");
    els.projectsPage.classList.add("hidden");
    els.projectDetailPage.classList.remove("hidden");
    els.topbarEyebrow.textContent = "project package timeline";
    els.topbarEyebrow.classList.remove("hidden");
    els.topbarTitle.textContent = project.name;
    els.topbarTitleMeta.textContent = `负责人：${project.owner} · ${project.records.length} 条记录`;
    els.topbarSubtitle.textContent = "";
    els.topbarBackIcon.classList.remove("hidden");
    els.marketButton.classList.add("hidden");
    els.openProjectModalButton.classList.add("hidden");
    els.exportProjectTimelineButton.classList.remove("hidden");
    els.shopForProjectTopButton.classList.remove("hidden");
    els.cartButton.classList.add("hidden");
    els.backToProjectsButton.classList.add("hidden");
    packageReturnPage = "project-detail";
    currentPage = "project-detail";
    renderProjectDetail(project);
  }

  function openCartDialog() {
    renderCart();
    els.cartDialog.classList.remove("hidden");
  }

  function closeCartDialog() {
    els.cartDialog.classList.add("hidden");
  }

  function closeOperationDocDialog() {
    els.operationDocDialog.classList.add("hidden");
    pendingOperationTarget = null;
  }

  function closeEventDropdowns() {
    for (const dropdown of document.querySelectorAll(".event-dropdown.is-open")) {
      dropdown.classList.remove("is-open");
      const trigger = dropdown.querySelector("[data-event-menu-trigger]");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    }
  }

  function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function formatDateTime(value) {
    return new Date(value).toLocaleString("zh-CN", { hour12: false });
  }

  function formatDateTimeForFileName(value) {
    const date = new Date(value);
    const parts = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
      String(date.getHours()).padStart(2, "0"),
      String(date.getMinutes()).padStart(2, "0"),
      String(date.getSeconds()).padStart(2, "0"),
    ];
    return parts.join("-");
  }

  function sanitizeFileName(value) {
    return String(value == null ? "" : value)
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "record";
  }

  function textValue(value, fallback = "-") {
    const normalized = String(value == null ? "" : value).trim();
    return normalized || fallback;
  }

  function actionLabel(value) {
    const normalized = textValue(value, "未知操作");
    return normalized === "添加到购物车" ? "添加到项目" : normalized;
  }

  function buildRecordMarkdown(project, record) {
    const items = Array.isArray(record.items) ? record.items : [];
    const lines = [
      `# ${textValue(record.title, "安装包操作记录")}`,
      "",
      `- 项目名称：${textValue(project && project.name, "未命名项目")}`,
      `- 项目负责人：${textValue(project && project.owner, "未填写")}`,
      `- 记录创建时间：${formatDateTime(record.createdAt || new Date().toISOString())}`,
      `- 操作数量：${items.length}`,
      `- 导出时间：${formatDateTime(new Date().toISOString())}`,
    ];

    items.forEach((item, index) => {
      const itemValue = textValue(item.value || item.objectKey, "");
      const objectKey = textValue(item.objectKey, "");
      lines.push(
        "",
        `## ${index + 1}. ${textValue(item.packageName, "未命名安装包")}`,
        `- 操作：${actionLabel(item.actionLabel || item.action)}`,
        `- 渠道：${textValue(item.channelLabel)}`,
        `- 架构：${textValue(item.arch)}`,
        `- 版本：${textValue(item.version, "未知版本")}`,
        `- 操作时间：${formatDateTime(item.createdAt || record.createdAt || new Date().toISOString())}`
      );

      if (itemValue) {
        lines.push("", "### 操作内容", "```text", itemValue, "```");
      }

      if (objectKey && objectKey !== itemValue) {
        lines.push("", "### 对象 Key", "```text", objectKey, "```");
      }
    });

    return `${lines.join("\n")}\n`;
  }

  function downloadTextFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }

  function exportProjectRecord(project, record) {
    const timestamp = formatDateTimeForFileName(record.createdAt || new Date().toISOString());
    const filename = sanitizeFileName(`${project.name}-${record.title || "安装包操作记录"}-${timestamp}.md`);
    const markdown = buildRecordMarkdown(project, record);
    downloadTextFile(filename, markdown, "text/markdown;charset=utf-8");
  }

  function buildOperationMarkdown(operation, level = "###") {
    const createdAt = formatDateTime(operation.createdAt || new Date().toISOString());
    if (operation.type === "document") {
      return [
        `${level} 文档：${textValue(operation.title, "未命名操作文档")}`,
        "",
        `- 时间：${createdAt}`,
        "",
        textValue(operation.content, "无内容"),
      ];
    }
    const lines = [
      `${level} 事件：${textValue(operation.label, "操作事件")}`,
      "",
      `- 时间：${createdAt}`,
    ];
    if (operation.content) {
      lines.push("", `#### ${textValue(operation.title || operation.label, "事件文档")}`, "", operation.content);
    }
    return lines;
  }

  function buildPackageTimelineMarkdown(packageName, nodes) {
    const lines = [`## ${packageName}`, ""];
    if (nodes.length === 0) {
      lines.push("暂无时间线记录。");
      return lines;
    }
    nodes.forEach((node, index) => {
      if (node.type === "package-operation") {
        const item = node.item;
        const value = textValue(item.value || item.objectKey, "");
        lines.push(
          `### ${index + 1}. 安装包操作`,
          "",
          `- 时间：${formatDateTime(timelineTimestamp(node))}`,
          `- 操作：${actionLabel(item.actionLabel || item.action)}`,
          `- 渠道：${textValue(item.channelLabel)}`,
          `- 架构：${textValue(item.arch)}`,
          `- 版本：${textValue(item.version, "未知版本")}`,
          `- 对象 Key：${textValue(item.objectKey, "无")}`,
        );
        if (value) {
          lines.push("", "```text", value, "```");
        }
        lines.push("");
        return;
      }
      lines.push(...buildOperationMarkdown(node, `### ${index + 1}.`), "");
    });
    return lines;
  }

  function buildProjectTimelineMarkdown(project) {
    ensureProjectOperationShape(project);
    const groupedPackages = recordsGroupedByPackage(project);
    const lines = [
      `# ${textValue(project.name, "未命名项目")} 项目时间线`,
      "",
      `- 项目负责人：${textValue(project.owner, "未填写")}`,
      `- 安装包操作记录：${project.records.length} 条`,
      `- 导出时间：${formatDateTime(new Date().toISOString())}`,
      "",
      "## 项目整体操作",
      "",
    ];

    const projectOps = sortedOperations(projectOperations(project));
    if (projectOps.length === 0) {
      lines.push("暂无项目整体操作。", "");
    } else {
      projectOps.forEach((operation, index) => {
        lines.push(...buildOperationMarkdown(operation, `### ${index + 1}.`), "");
      });
    }

    lines.push("## 安装包时间线", "");
    if (groupedPackages.length === 0) {
      lines.push("暂无安装包。");
      return `${lines.join("\n")}\n`;
    }
    groupedPackages.forEach((pkg) => {
      pkg.operations = packageOperations(project, pkg.name);
      lines.push(...buildPackageTimelineMarkdown(pkg.name, buildPackageTimelineNodes(pkg, "asc")), "");
    });
    return `${lines.join("\n")}\n`;
  }

  function exportProjectTimeline(project) {
    const timestamp = formatDateTimeForFileName(new Date().toISOString());
    const filename = sanitizeFileName(`${project.name}-项目时间线-${timestamp}.md`);
    downloadTextFile(filename, buildProjectTimelineMarkdown(project), "text/markdown;charset=utf-8");
  }

  function currentPackageVersion(link) {
    if (link.version) return link.version;
    const versionMeta = (detail && detail.meta ? detail.meta : []).find((item) => {
      return item.label === "最新版本" || item.label === "基础包版本";
    });
    return versionMeta ? versionMeta.value : "";
  }

  function currentChannelLabel() {
    return els.channel.value === "ci" ? "测试包" : "正式包";
  }

  function currentParams() {
    const selectedRelease = document.getElementById("detailReleaseVersion");
    const releaseVersion = selectedRelease && releaseVersions.some((item) => item.version === selectedRelease.value)
      ? selectedRelease.value
      : "";
    return new URLSearchParams({
      channel: els.channel.value,
      deployType: selectedPackage === "base-oss" ? "oss" : "pro",
      releaseVersion,
      arch: els.arch.value,
      ciVersion: els.ciVersion.value,
    });
  }

  function packageMatches(pkg, query) {
    if (!query) return true;
    return [
      pkg.id,
      pkg.name,
      pkg.mode,
      ...(pkg.releaseRoots || []),
      ...(pkg.flatFileRoots || []),
      ...(pkg.fileNameFormats || []),
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  }

  function selectedOptionLabel(select) {
    const selected = select.options[select.selectedIndex];
    return selected ? selected.textContent : "";
  }

  function syncCustomSelect(select) {
    const instance = customSelects.get(select);
    if (!instance) return;

    const { root, trigger, value, menu } = instance;
    value.textContent = selectedOptionLabel(select);
    trigger.disabled = select.disabled;
    root.classList.toggle("is-disabled", select.disabled);

    menu.innerHTML = "";
    Array.from(select.options).forEach((option) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "custom-select-option";
      item.dataset.value = option.value;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(option.selected));
      item.textContent = option.textContent;
      item.addEventListener("click", () => {
        if (select.value !== option.value) {
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
        closeCustomSelect(root);
        trigger.focus();
      });
      menu.appendChild(item);
    });
  }

  function closeCustomSelect(root) {
    if (!root.classList.contains("is-open")) return;
    root.classList.remove("is-open");
    root.querySelector(".custom-select-trigger").setAttribute("aria-expanded", "false");
  }

  function closeOtherCustomSelects(activeRoot) {
    for (const { root } of customSelects.values()) {
      if (root !== activeRoot) closeCustomSelect(root);
    }
  }

  function moveCustomSelectFocus(root, direction) {
    const options = Array.from(root.querySelectorAll(".custom-select-option"));
    if (options.length === 0) return;
    const currentIndex = options.indexOf(document.activeElement);
    const selectedIndex = options.findIndex((option) => option.getAttribute("aria-selected") === "true");
    const fallbackIndex = selectedIndex === -1 ? 0 : selectedIndex;
    const nextIndex = currentIndex === -1
      ? fallbackIndex
      : (currentIndex + direction + options.length) % options.length;
    options[nextIndex].focus();
  }

  function enhanceSelect(select) {
    if (!select || customSelects.has(select)) return;

    const root = document.createElement("div");
    root.className = "custom-select";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "custom-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const value = document.createElement("span");
    value.className = "custom-select-value";

    const icon = document.createElement("span");
    icon.className = "custom-select-icon";
    icon.setAttribute("aria-hidden", "true");

    const menu = document.createElement("div");
    menu.className = "custom-select-menu";
    menu.setAttribute("role", "listbox");

    trigger.append(value, icon);
    root.append(trigger, menu);
    select.after(root);
    select.classList.add("native-select");

    customSelects.set(select, { root, trigger, value, menu });

    trigger.addEventListener("click", () => {
      const open = root.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", String(open));
      if (open) {
        closeOtherCustomSelects(root);
        syncCustomSelect(select);
      }
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        root.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        closeOtherCustomSelects(root);
        moveCustomSelectFocus(root, 1);
      }
    });

    menu.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeCustomSelect(root);
        trigger.focus();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveCustomSelectFocus(root, 1);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveCustomSelectFocus(root, -1);
      }
    });

    select.addEventListener("change", () => syncCustomSelect(select));
    syncCustomSelect(select);
  }

  function enhanceSelects(scope) {
    for (const select of scope.querySelectorAll("select")) {
      enhanceSelect(select);
      syncCustomSelect(select);
    }
  }

  function syncCartCount() {
    els.cartCount.textContent = String(cartItems.length);
    els.cartButton.classList.toggle("has-items", cartItems.length > 0);
  }

  function renderProjectOptions() {
    els.cartProjectSelect.innerHTML = projects.length === 0
      ? `<option value="">暂无项目</option>`
      : projects.map((project) => `<option value="${escapeAttribute(project.id)}">${escapeHtml(project.name)}</option>`).join("");
    if (marketTargetProjectId && projects.some((project) => project.id === marketTargetProjectId)) {
      els.cartProjectSelect.value = marketTargetProjectId;
    }
    els.cartProjectSelect.disabled = Boolean(projectById(marketTargetProjectId));
    const targetProject = projectById(marketTargetProjectId);
    els.cartProjectLabelText.textContent = targetProject ? `记录到项目（${targetProject.name}）` : "记录到项目";
    syncCustomSelect(els.cartProjectSelect);
  }

  function renderCart() {
    syncCartCount();
    renderProjectOptions();
    els.generateRecordButton.disabled = cartItems.length === 0 || projects.length === 0;
    els.clearCartButton.disabled = cartItems.length === 0;

    if (cartItems.length === 0) {
      els.cartItems.innerHTML = `<p class="empty-text">购物车为空。</p>`;
      return;
    }

    els.cartItems.innerHTML = cartItems.map((item) => `
      <article class="cart-item">
        <div>
          <strong>${escapeHtml(item.packageName)}</strong>
          <p>${escapeHtml(actionLabel(item.actionLabel))} · ${escapeHtml(item.channelLabel || "-")} · ${escapeHtml(item.arch || "-")} · ${escapeHtml(item.version || "未知版本")} · ${escapeHtml(formatDateTime(item.createdAt))}</p>
          <code>${escapeHtml(item.value)}</code>
        </div>
        <button class="text-button danger" type="button" data-remove-cart="${escapeAttribute(item.id)}">删除</button>
      </article>
    `).join("");

    for (const button of els.cartItems.querySelectorAll("[data-remove-cart]")) {
      button.addEventListener("click", () => {
        cartItems = cartItems.filter((item) => item.id !== button.dataset.removeCart);
        saveCartItems();
        renderCart();
      });
    }
  }

  function renderProjects() {
    renderProjectOptions();
    if (projects.length === 0) {
      els.projectsList.innerHTML = `<p class="empty-text">还没有项目，请先新增一个项目。</p>`;
      return;
    }

    els.projectsList.innerHTML = projects.map((project) => `
      <article class="project-card project-summary-card">
        <div class="project-summary-head">
          <span>
            <strong>${escapeHtml(project.name)}</strong>
            <small>负责人：${escapeHtml(project.owner)}</small>
          </span>
          <span class="record-count">${project.records.length} 条记录</span>
        </div>
        <div class="project-summary-actions">
          <button class="secondary-button" type="button" data-project-detail="${escapeAttribute(project.id)}">详情</button>
        </div>
      </article>
    `).join("");

    for (const button of els.projectsList.querySelectorAll("[data-project-detail]")) {
      button.addEventListener("click", () => {
        showProjectDetailPage(button.dataset.projectDetail);
      });
    }
  }

  function recordsGroupedByPackage(project) {
    const grouped = new Map();
    for (const record of project.records || []) {
      for (const item of record.items || []) {
        const packageName = textValue(item.packageName, "未命名安装包");
        const group = grouped.get(packageName) || { name: packageName, items: [] };
        group.items.push({ record, item });
        grouped.set(packageName, group);
      }
    }
    return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  }

  function ensureProjectOperationShape(project) {
    let changed = false;
    if (!Array.isArray(project.operations)) {
      project.operations = [];
      changed = true;
    }
    if (!project.packageOperations || typeof project.packageOperations !== "object" || Array.isArray(project.packageOperations)) {
      project.packageOperations = {};
      changed = true;
    }
    for (const record of project.records || []) {
      for (const item of record.items || []) {
        if (!item.id) {
          item.id = generateId("item");
          changed = true;
        }
        if (!Array.isArray(item.operations)) {
          item.operations = [];
          changed = true;
          continue;
        }
        if (item.operations.length > 0) {
          const packageName = textValue(item.packageName, "未命名安装包");
          const targetOperations = packageOperations(project, packageName);
          for (const operation of item.operations) {
            targetOperations.push({
              ...operation,
              migratedFromItemId: item.id,
            });
          }
          item.operations = [];
          changed = true;
        }
      }
    }
    if (changed) saveProjects();
  }

  function projectOperations(project) {
    if (!Array.isArray(project.operations)) {
      project.operations = [];
    }
    return project.operations;
  }

  function packageOperations(project, packageName) {
    if (!project.packageOperations || typeof project.packageOperations !== "object" || Array.isArray(project.packageOperations)) {
      project.packageOperations = {};
    }
    const key = textValue(packageName, "未命名安装包");
    if (!Array.isArray(project.packageOperations[key])) {
      project.packageOperations[key] = [];
    }
    return project.packageOperations[key];
  }

  function findOperationTarget(target) {
    const project = projectById(target.projectId);
    if (!project) return null;
    if (target.scope === "project") {
      return { project, operations: projectOperations(project) };
    }
    if (target.scope === "package") {
      return { project, packageName: target.packageName, operations: packageOperations(project, target.packageName) };
    }
    return null;
  }

  function openOperationDocDialog(target, operationId = "") {
    const resolved = findOperationTarget(target);
    if (!resolved) return;
    const operation = operationId
      ? resolved.operations.find((item) => item.id === operationId)
      : null;
    pendingOperationTarget = { ...target, operationId };
    els.operationDocTitle.textContent = operation ? "编辑操作文档" : "添加操作文档";
    els.operationDocNameInput.value = operation ? textValue(operation.title || operation.label, "") : "";
    els.operationDocContentInput.value = operation ? textValue(operation.content, "") : "";
    els.operationDocDialog.classList.remove("hidden");
    els.operationDocNameInput.focus();
  }

  function addOperationEvent(target, eventType) {
    const resolved = findOperationTarget(target);
    const eventOption = operationEvents.find((item) => item.type === eventType);
    if (!resolved || !eventOption) return;
    resolved.operations.push({
      id: generateId("operation"),
      type: "event",
      eventType: eventOption.type,
      label: eventOption.label,
      createdAt: new Date().toISOString(),
    });
    saveProjects();
    renderProjectDetail(resolved.project);
  }

  function sortedOperations(operations) {
    return [...(operations || [])].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }

  function markdownSummary(value) {
    return textValue(value, "")
      .replace(/[#*_`>\-[\]()]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
  }

  function renderOperationActions(target) {
    const targetJson = escapeAttribute(JSON.stringify(target));
    return `
      <div class="operation-actions" data-operation-target="${targetJson}">
        <button class="secondary-button compact-button" type="button" data-add-operation-doc>添加操作文档</button>
        <div class="event-dropdown">
          <button class="secondary-button compact-button event-dropdown-trigger" type="button" data-event-menu-trigger aria-expanded="false">
            添加事件
            <span class="event-dropdown-icon" aria-hidden="true">▾</span>
          </button>
          <div class="event-dropdown-menu" role="menu">
            ${operationEvents.map((event) => `
              <button class="event-dropdown-option" type="button" role="menuitem" data-add-operation-event="${escapeAttribute(event.type)}">${escapeHtml(event.label)}</button>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function renderOperationStream(operations, emptyText) {
    const items = sortedOperations(operations);
    if (items.length === 0) {
      return `<p class="operation-empty">${escapeHtml(emptyText)}</p>`;
    }
    return `
      <div class="operation-stream">
        ${items.map((operation) => {
          if (operation.type === "document") {
            const summary = markdownSummary(operation.content);
            return `
              <button class="operation-entry document" type="button" data-open-operation-doc="${escapeAttribute(operation.id)}">
                <span class="operation-entry-kind">文档</span>
                <strong>${escapeHtml(textValue(operation.title, "未命名操作文档"))}</strong>
                <small>${escapeHtml(formatDateTime(operation.createdAt))}</small>
                ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
              </button>
            `;
          }
          return `
            <button class="operation-entry event" type="button" data-open-operation-doc="${escapeAttribute(operation.id)}">
              <span class="operation-entry-kind">事件</span>
              <strong>${escapeHtml(operation.label || "操作事件")}</strong>
              <small>${escapeHtml(formatDateTime(operation.createdAt))}</small>
              ${operation.content ? `<p>${escapeHtml(markdownSummary(operation.content))}</p>` : ""}
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderOperationArea(target, operations, title, emptyText) {
    const targetJson = escapeAttribute(JSON.stringify(target));
    return `
      <section class="operation-area" data-operation-area-target="${targetJson}">
        <div class="operation-area-head">
          <div>
            <p class="eyebrow">operation area</p>
            <h4>${escapeHtml(title)}</h4>
          </div>
          ${renderOperationActions(target)}
        </div>
        ${renderOperationStream(operations, emptyText)}
      </section>
    `;
  }

  function timelineTimestamp(node) {
    if (node.type === "package-operation") {
      return node.item.createdAt || node.record.createdAt || new Date().toISOString();
    }
    return node.createdAt || new Date().toISOString();
  }

  function buildPackageTimelineNodes(activePackage, direction = "desc") {
    const packageItems = activePackage.items.map((entry) => ({
      type: "package-operation",
      id: `${entry.record.id}-${entry.item.id}`,
      record: entry.record,
      item: entry.item,
      createdAt: entry.item.createdAt || entry.record.createdAt,
    }));
    const operationItems = (activePackage.operations || []).map((operation) => ({
      ...operation,
      type: operation.type === "document" ? "document" : "event",
    }));
    return [...packageItems, ...operationItems].sort((a, b) => {
      const delta = new Date(timelineTimestamp(a)) - new Date(timelineTimestamp(b));
      return direction === "asc" ? delta : -delta;
    });
  }

  function bindOperationActions(scope) {
    for (const actions of scope.querySelectorAll("[data-operation-target]")) {
      const target = JSON.parse(actions.dataset.operationTarget);
      const docButton = actions.querySelector("[data-add-operation-doc]");
      if (docButton) {
        docButton.addEventListener("click", () => openOperationDocDialog(target));
      }
      const eventTrigger = actions.querySelector("[data-event-menu-trigger]");
      if (eventTrigger) {
        eventTrigger.addEventListener("click", (event) => {
          event.stopPropagation();
          const dropdown = eventTrigger.closest(".event-dropdown");
          const nextOpen = !dropdown.classList.contains("is-open");
          closeEventDropdowns();
          dropdown.classList.toggle("is-open", nextOpen);
          eventTrigger.setAttribute("aria-expanded", String(nextOpen));
        });
      }
      for (const button of actions.querySelectorAll("[data-add-operation-event]")) {
        button.addEventListener("click", () => {
          closeEventDropdowns();
          addOperationEvent(target, button.dataset.addOperationEvent);
        });
      }
    }

    for (const button of scope.querySelectorAll("[data-open-operation-doc]")) {
      button.addEventListener("click", () => {
        const area = button.closest("[data-operation-area-target]");
        const targetContainer = area || button.closest("[data-operation-target]");
        if (!targetContainer) return;
        const target = JSON.parse(targetContainer.dataset.operationAreaTarget || targetContainer.dataset.operationTarget);
        openOperationDocDialog(target, button.dataset.openOperationDoc);
      });
    }
  }

  function bindProjectRecordActions(scope) {
    for (const button of scope.querySelectorAll("[data-delete-record]")) {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!window.confirm("确定删除这条操作记录吗？")) return;
        const project = projectById(button.dataset.projectId);
        if (!project) return;
        project.records = project.records.filter((record) => record.id !== button.dataset.deleteRecord);
        saveProjects();
        if (currentPage === "project-detail" && currentProjectId === project.id) {
          renderProjectDetail(project);
        } else {
          renderProjects();
        }
      });
    }

    for (const button of scope.querySelectorAll("[data-export-record]")) {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const project = projectById(button.dataset.projectId);
        if (!project) return;
        const record = project.records.find((item) => item.id === button.dataset.exportRecord);
        if (!record) return;
        exportProjectRecord(project, record);
      });
    }
  }

  function renderPackageOperationTimelineEntry(project, entry, isLatest = false) {
    return `
      <article class="timeline-card${isLatest ? " latest" : ""}">
        <div class="timeline-dot" aria-hidden="true"></div>
        <div class="timeline-body">
          <div class="timeline-head">
            <div>
              <strong>${escapeHtml(entry.record.title)}</strong>
              <p>${escapeHtml(actionLabel(entry.item.actionLabel))} · ${escapeHtml(entry.item.channelLabel || "-")} · ${escapeHtml(entry.item.arch || "-")} · ${escapeHtml(entry.item.version || "未知版本")}</p>
            </div>
            <div class="record-actions">
              <time>${escapeHtml(formatDateTime(entry.item.createdAt || entry.record.createdAt))}</time>
              <button
                class="text-button export"
                type="button"
                aria-label="导出操作记录 Markdown"
                title="导出操作记录 Markdown"
                data-project-id="${escapeAttribute(project.id)}"
                data-export-record="${escapeAttribute(entry.record.id)}"
              ><span class="export-icon" aria-hidden="true"></span></button>
              <button
                class="text-button danger"
                type="button"
                aria-label="删除操作记录"
                title="删除操作记录"
                data-project-id="${escapeAttribute(project.id)}"
                data-delete-record="${escapeAttribute(entry.record.id)}"
              ><span class="trash-icon" aria-hidden="true"></span></button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderOperationTimelineEntry(operation, isLatest = false) {
    const summary = markdownSummary(operation.content);
    return `
      <article class="timeline-card timeline-operation-card${isLatest ? " latest" : ""}">
        <div class="timeline-dot" aria-hidden="true"></div>
        <div class="timeline-body operation-node">
          <button
            class="operation-entry ${operation.type === "document" ? "document" : "event"}"
            type="button"
            data-open-operation-doc="${escapeAttribute(operation.id)}"
          >
            <span class="operation-entry-kind">${operation.type === "document" ? "文档" : "事件"}</span>
            <strong>${escapeHtml(operation.type === "document" ? textValue(operation.title, "未命名操作文档") : textValue(operation.label, "操作事件"))}</strong>
            <small>${escapeHtml(formatDateTime(operation.createdAt))}</small>
            ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
          </button>
        </div>
      </article>
    `;
  }

  function renderPackageTimelineNode(project, node, isLatest = false) {
    if (node.type === "package-operation") {
      return renderPackageOperationTimelineEntry(project, node, isLatest);
    }
    return renderOperationTimelineEntry(node, isLatest);
  }

  function renderProjectDetail(project) {
    ensureProjectOperationShape(project);
    const groupedPackages = recordsGroupedByPackage(project);

    if (groupedPackages.length === 0) {
      selectedDetailPackageName = "";
      els.projectDetailContent.innerHTML = `
        <section class="project-empty-state">
          <div class="project-empty-panel">
            <p class="eyebrow">empty project</p>
            <h3>当前项目还没有安装包</h3>
            <p>先去安装包市场挑选需要的安装包，加入到当前项目里。</p>
            <button id="shopForProjectButton" type="button">选购安装包</button>
          </div>
        </section>
      `;
      const button = document.getElementById("shopForProjectButton");
      if (button) {
        button.addEventListener("click", () => {
          marketTargetProjectId = project.id;
          packageReturnPage = "project-detail";
          showPackagePage();
        });
      }
      return;
    }

    if (!groupedPackages.some((item) => item.name === selectedDetailPackageName)) {
      selectedDetailPackageName = groupedPackages[0].name;
    }
    const activePackage = groupedPackages.find((item) => item.name === selectedDetailPackageName) || groupedPackages[0];
    selectedDetailPackageName = activePackage.name;
    activePackage.operations = packageOperations(project, activePackage.name);
    const activePackageTarget = { scope: "package", projectId: project.id, packageName: activePackage.name };
    const packageTimelineNodes = buildPackageTimelineNodes(activePackage, "asc");
    const activePackageTargetJson = escapeAttribute(JSON.stringify(activePackageTarget));

    els.projectDetailContent.innerHTML = `
      <section class="project-operations-panel">
        ${renderOperationArea(
          { scope: "project", projectId: project.id },
          projectOperations(project),
          "项目整体操作",
          "从项目整体视角记录文档或事件，适合跨安装包的操作事项。",
        )}
      </section>
      <section class="project-detail-layout">
        <aside class="project-package-list">
          <div class="project-package-list-head">
            <div>
              <p class="eyebrow">package list</p>
              <h3>已添加安装包</h3>
            </div>
          </div>
          <div class="project-package-items">
            ${groupedPackages.map((pkg) => `
              <button
                class="project-package-item${pkg.name === activePackage.name ? " active" : ""}"
                type="button"
                data-package-tab="${escapeAttribute(pkg.name)}"
              >
                <strong>${escapeHtml(pkg.name)}</strong>
                <span>${pkg.items.length} 条记录</span>
              </button>
            `).join("")}
          </div>
        </aside>
        <section class="project-timeline-panel">
          <div class="project-timeline-head">
            <div>
              <p class="eyebrow">package timeline</p>
              <h3>${escapeHtml(activePackage.name)}</h3>
            </div>
            ${renderOperationActions(activePackageTarget)}
          </div>
          <div class="timeline-list" data-operation-area-target="${activePackageTargetJson}">
            ${packageTimelineNodes.map((node, index) => renderPackageTimelineNode(project, node, index === packageTimelineNodes.length - 1)).join("")}
          </div>
        </section>
      </section>
    `;

    for (const button of els.projectDetailContent.querySelectorAll("[data-package-tab]")) {
      button.addEventListener("click", () => {
        selectedDetailPackageName = button.dataset.packageTab;
        renderProjectDetail(project);
      });
    }

    bindProjectRecordActions(els.projectDetailContent);
    bindOperationActions(els.projectDetailContent);
  }

  function addCurrentPackageToCart(source) {
    if (!detail || !Array.isArray(detail.links) || detail.links.length === 0) return;
    const createdAt = new Date().toISOString();
    const items = detail.links.map((link) => ({
      id: generateId("cart"),
      action: "add-to-cart",
      actionLabel: "添加到项目",
      packageName: link.name || detail.title || selectedPackage,
      channel: els.channel.value,
      channelLabel: currentChannelLabel(),
      arch: els.arch.value,
      version: currentPackageVersion(link),
      objectKey: link.objectKey,
      value: link.downloadUrl,
      createdAt,
    }));
    cartItems = [...items, ...cartItems];
    saveCartItems();
    syncCartCount();
    animateToCart(source);
  }

  function animateToCart(source) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pulseCartButton();
      return;
    }

    const from = source.getBoundingClientRect();
    const to = els.cartButton.getBoundingClientRect();
    const flyer = document.createElement("span");
    flyer.className = "cart-flyer";
    flyer.textContent = "+1";
    flyer.style.left = `${from.left + from.width / 2}px`;
    flyer.style.top = `${from.top + from.height / 2}px`;
    document.body.appendChild(flyer);

    flyer.animate(
      [
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
        {
          transform: `translate(${to.left + to.width / 2 - from.left - from.width / 2}px, ${to.top + to.height / 2 - from.top - from.height / 2}px) translate(-50%, -50%) scale(0.55)`,
          opacity: 0.15,
        },
      ],
      { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    ).addEventListener("finish", () => {
      flyer.remove();
      pulseCartButton();
    });
  }

  function pulseCartButton() {
    els.cartButton.classList.remove("cart-pulse");
    void els.cartButton.offsetWidth;
    els.cartButton.classList.add("cart-pulse");
  }

  async function loadRules() {
    try {
      els.statusText.textContent = "正在读取规则...";
      const payload = await request("/api/rules");
      rules = payload.rules || [];
      els.statusText.textContent = `已读取 ${rules.length} 个组合包规则，下载链接有效期 ${payload.expireMinutes} 分钟`;
      renderTabs();
      await loadDetail();
    } catch (error) {
      if (error.status === 401) {
        sessionStorage.removeItem(SESSION_KEY);
        showLogin();
        return;
      }
      els.statusText.textContent = "";
      els.linkCards.innerHTML = `<p class="error-text">${escapeHtml(error.message)}</p>`;
    }
  }

  function renderTabs() {
    const query = els.searchInput.value.trim().toLowerCase();
    els.appsTabs.innerHTML = "";
    els.middlewareTabs.innerHTML = "";
    document.querySelector('[data-package="base-pro"]').classList.toggle("active", selectedPackage === "base-pro");
    document.querySelector('[data-package="base-oss"]').classList.toggle("active", selectedPackage === "base-oss");
    syncGroupVisibility();

    for (const pkg of rules.filter((item) => packageMatches(item, query))) {
      const button = document.createElement("button");
      button.className = `package-tab${selectedPackage === pkg.id ? " active" : ""}`;
      button.type = "button";
      button.dataset.package = pkg.id;
      button.innerHTML = `<span>${escapeHtml(pkg.name)}</span><small>${escapeHtml(pkg.id)}</small>`;
      button.addEventListener("click", async () => {
        selectedPackage = pkg.id;
        expandedGroups.add(pkg.category === "middleware" ? "middleware" : "apps");
        ciVersions = [];
        releaseVersions = [];
        els.ciVersion.innerHTML = "";
        renderTabs();
        await loadDetail();
        scrollDetailToTop();
      });
      if (pkg.category === "middleware") {
        els.middlewareTabs.appendChild(button);
      } else {
        els.appsTabs.appendChild(button);
      }
    }
    syncGroupVisibility();
  }

  function syncGroupVisibility() {
    for (const group of document.querySelectorAll(".package-group[data-group]")) {
      const key = group.dataset.group;
      const expanded = expandedGroups.has(key);
      group.classList.toggle("collapsed", !expanded);
      const toggle = group.querySelector("[data-toggle-group]");
      const icon = group.querySelector(".toggle-icon");
      if (toggle) toggle.setAttribute("aria-expanded", String(expanded));
      if (icon) icon.textContent = expanded ? "▾" : "▸";
    }
  }

  function scrollDetailToTop() {
    const panel = document.querySelector(".detail-panel");
    if (!panel) return;
    panel.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  async function loadDetail() {
    if (loadingDetail) return;
    loadingDetail = true;
    detail = null;
    syncChannelControls();
    renderDetailLoading();

    try {
      if (!isBasePackage() && els.channel.value === "ci" && ciVersions.length === 0) {
        await loadCiVersions();
      }
      if (els.channel.value === "release" && releaseVersions.length === 0) {
        await loadReleaseVersions();
      }
      const params = currentParams();
      const endpoint = isBasePackage() ? `/api/packages/base?${params}` : `/api/packages/${encodeURIComponent(selectedPackage)}?${params}`;
      detail = await request(endpoint);
      renderDetail();
    } catch (error) {
      detail = {
        title: selectedPackage,
        type: "error",
        meta: [],
        links: [],
        error: error.message,
      };
      renderDetail();
    } finally {
      loadingDetail = false;
    }
  }

  function renderDetailLoading() {
    els.packageTitle.textContent = "正在加载";
    els.packageType.textContent = isBasePackage() ? "base package" : "package";
    els.packageMeta.innerHTML = "";
    els.detailControls.innerHTML = "";
    els.linkCards.innerHTML = `<p>正在从 OSS 拉取真实包数据...</p>`;
  }

  async function loadCiVersions() {
    const params = currentParams();
    const payload = await request(`/api/packages/${encodeURIComponent(selectedPackage)}/ci-versions?${params}`);
    ciVersions = payload.versions || [];
    const previous = els.ciVersion.value;
    els.ciVersion.innerHTML = ciVersions
      .map((item) => `<option value="${escapeAttribute(item.hash)}">${escapeHtml(item.label)}</option>`)
      .join("");
    if (ciVersions.some((item) => item.hash === previous)) {
      els.ciVersion.value = previous;
    } else if (ciVersions.length > 0) {
      els.ciVersion.value = ciVersions[0].hash;
    }
    syncCustomSelect(els.ciVersion);
  }

  async function loadReleaseVersions() {
    const params = currentParams();
    const endpoint = isBasePackage()
      ? `/api/packages/base/release-versions?${params}`
      : `/api/packages/${encodeURIComponent(selectedPackage)}/release-versions?${params}`;
    const payload = await request(endpoint);
    releaseVersions = payload.versions || [];
  }

  function syncChannelControls() {
    const ciMode = els.channel.value === "ci" && !isBasePackage();
    els.ciVersionField.classList.toggle("hidden", !ciMode);
    if (isBasePackage() && els.channel.value === "ci") {
      els.channel.value = "release";
    }
  }

  function renderDetail() {
    if (!detail) return;

    els.packageTitle.textContent = detail.title || selectedPackage;
    els.packageType.textContent = detail.type || "";
    els.packageMeta.innerHTML = (detail.meta || [])
      .map((item) => `<div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.value)}</span></div>`)
      .join("");
    renderDetailControls();

    if (detail.error) {
      els.linkCards.innerHTML = `<p class="error-text">${escapeHtml(detail.error)}</p>`;
      return;
    }

    if (!detail.links || detail.links.length === 0) {
      els.linkCards.innerHTML = "<p>当前参数下没有找到可用对象。</p>";
      return;
    }

    els.linkCards.innerHTML = detail.links.map(renderLinkCard).join("");
    for (const button of els.linkCards.querySelectorAll("[data-copy]")) {
      button.addEventListener("click", async () => {
        await navigator.clipboard.writeText(button.dataset.copy);
        const original = button.textContent;
        button.textContent = "已复制";
        window.setTimeout(() => {
          button.textContent = original;
        }, 1000);
      });
    }
  }

  function renderDetailControls() {
    const versions = detail && Array.isArray(detail.ciVersions) ? detail.ciVersions : [];
    if (els.channel.value === "ci" && !isBasePackage() && versions.length > 0) {
      const current = els.ciVersion.value || versions[0].hash;
      els.detailControls.innerHTML = `
      <label>
        测试版本（${versions.length} 个）
        <select id="detailCiVersion">
          ${versions
            .map((item) => `<option value="${escapeAttribute(item.hash)}"${item.hash === current ? " selected" : ""}>${escapeHtml(item.label)}</option>`)
            .join("")}
        </select>
      </label>
    `;

      const select = document.getElementById("detailCiVersion");
      enhanceSelect(select);
      select.addEventListener("change", async () => {
        els.ciVersion.value = select.value;
        syncCustomSelect(els.ciVersion);
        await loadDetail();
      });
      return;
    }

    const releaseItems = detail && Array.isArray(detail.releaseVersions) ? detail.releaseVersions : releaseVersions;
    if (els.channel.value === "release" && releaseItems.length > 0) {
      const selectedValue = (detail.meta || []).find((item) => item.label === "最新版本" || item.label === "基础包版本");
      const current = selectedValue ? selectedValue.value : releaseItems[0].version;
      els.detailControls.innerHTML = `
        <label>
          正式版本（${releaseItems.length} 个）
          <select id="detailReleaseVersion">
            ${releaseItems
              .map((item) => `<option value="${escapeAttribute(item.version)}"${item.version === current ? " selected" : ""}>${escapeHtml(item.label)}</option>`)
              .join("")}
          </select>
        </label>
      `;
      const select = document.getElementById("detailReleaseVersion");
      enhanceSelect(select);
      select.addEventListener("change", async () => {
        await loadDetail();
      });
      return;
    }

    els.detailControls.innerHTML = "";
  }

  function isBasePackage() {
    return selectedPackage === "base-pro" || selectedPackage === "base-oss";
  }

  function renderLinkCard(link) {
    const size = typeof link.size === "number" ? formatBytes(link.size) : "unknown";
    const updated = link.lastModified ? new Date(link.lastModified).toLocaleString() : "unknown";
    return `
      <article class="link-card">
        <div class="link-title-row">
          <div>
            <strong>${escapeHtml(link.name || link.objectKey)}</strong>
            <p>${escapeHtml(link.version || "")} ${escapeHtml(size)} · ${escapeHtml(updated)}</p>
          </div>
          <button
            class="copy-button"
            type="button"
            data-copy="${escapeAttribute(link.downloadUrl)}"
          >复制下载链接</button>
        </div>
        <div class="path-box"><code>${escapeHtml(link.objectKey)}</code></div>
        <div class="url-row">
          <a href="${escapeAttribute(link.downloadUrl)}" target="_blank" rel="noreferrer">${escapeHtml(link.downloadUrl)}</a>
          <button
            class="copy-button"
            type="button"
            data-copy="${escapeAttribute(link.objectKey)}"
          >复制 Key</button>
        </div>
      </article>
    `;
  }

  function formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = bytes;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index++;
    }
    return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  els.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await request("/api/login", {
        method: "POST",
        body: JSON.stringify({ password: els.passwordInput.value }),
      });
      sessionStorage.setItem(SESSION_KEY, "1");
      els.passwordInput.value = "";
      els.loginError.textContent = "";
      showConsole();
    } catch (error) {
      els.loginError.textContent = error.message;
    }
  });

  els.lockButton.addEventListener("click", async () => {
    await request("/api/logout", { method: "POST" }).catch(() => {});
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
  });

  els.marketButton.addEventListener("click", () => {
    marketTargetProjectId = "";
    packageReturnPage = "projects";
    showPackagePage();
  });
  els.exportProjectTimelineButton.addEventListener("click", () => {
    const project = projectById(currentProjectId);
    if (!project) return;
    exportProjectTimeline(project);
  });
  els.backToProjectsButton.addEventListener("click", () => {
    marketTargetProjectId = "";
    if (currentPage === "project-detail") {
      showProjectsPage();
      return;
    }
    if (currentPage === "package" && packageReturnPage === "project-detail" && currentProjectId) {
      showProjectDetailPage(currentProjectId);
      return;
    }
    showProjectsPage();
  });
  els.topbarBackIcon.addEventListener("click", () => {
    marketTargetProjectId = "";
    if (currentPage === "package" && packageReturnPage === "project-detail" && currentProjectId) {
      showProjectDetailPage(currentProjectId);
      return;
    }
    showProjectsPage();
  });
  els.openProjectModalButton.addEventListener("click", openProjectModal);
  els.shopForProjectTopButton.addEventListener("click", () => {
    if (!currentProjectId) return;
    marketTargetProjectId = currentProjectId;
    packageReturnPage = "project-detail";
    showPackagePage();
  });
  els.closeProjectModalButton.addEventListener("click", closeProjectModal);
  els.cancelProjectModalButton.addEventListener("click", closeProjectModal);
  els.cartButton.addEventListener("click", openCartDialog);
  els.closeCartButton.addEventListener("click", closeCartDialog);
  els.closeOperationDocButton.addEventListener("click", closeOperationDocDialog);
  els.cancelOperationDocButton.addEventListener("click", closeOperationDocDialog);

  els.cartDialog.addEventListener("click", (event) => {
    if (event.target === els.cartDialog) closeCartDialog();
  });
  els.projectModal.addEventListener("click", (event) => {
    if (event.target === els.projectModal) closeProjectModal();
  });
  els.operationDocDialog.addEventListener("click", (event) => {
    if (event.target === els.operationDocDialog) closeOperationDocDialog();
  });

  els.operationDocForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!pendingOperationTarget) return;
    const resolved = findOperationTarget(pendingOperationTarget);
    if (!resolved) return;
    const title = els.operationDocNameInput.value.trim() || "未命名操作文档";
    const content = els.operationDocContentInput.value.trim();
    if (!content) {
      els.operationDocContentInput.focus();
      return;
    }
    const operation = pendingOperationTarget.operationId
      ? resolved.operations.find((item) => item.id === pendingOperationTarget.operationId)
      : null;
    if (operation) {
      operation.title = title;
      operation.content = content;
      operation.updatedAt = new Date().toISOString();
    } else {
      resolved.operations.push({
        id: generateId("operation"),
        type: "document",
        title,
        content,
        createdAt: new Date().toISOString(),
      });
    }
    saveProjects();
    closeOperationDocDialog();
    renderProjectDetail(resolved.project);
  });

  els.projectForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = els.projectNameInput.value.trim();
    const owner = els.projectOwnerInput.value.trim();
    if (!name || !owner) return;

    projects.unshift({
      id: generateId("project"),
      name,
      owner,
      records: [],
      createdAt: new Date().toISOString(),
    });
    saveProjects();
    els.projectNameInput.value = "";
    els.projectOwnerInput.value = "";
    closeProjectModal();
    renderProjects();
  });

  els.clearCartButton.addEventListener("click", () => {
    cartItems = [];
    saveCartItems();
    renderCart();
  });

  els.generateRecordButton.addEventListener("click", () => {
    const projectId = marketTargetProjectId || els.cartProjectSelect.value;
    const project = projects.find((item) => item.id === projectId);
    if (!project || cartItems.length === 0) return;

    project.records.unshift({
      id: generateId("record"),
      title: `${cartItems.length} 项安装包操作`,
      items: cartItems,
      createdAt: new Date().toISOString(),
    });
    cartItems = [];
    saveProjects();
    saveCartItems();
    renderCart();
    renderProjects();
    currentProjectId = project.id;
    marketTargetProjectId = project.id;
    showProjectDetailPage(project.id);
  });

  for (const button of document.querySelectorAll("[data-package='base-pro'], [data-package='base-oss']")) {
    button.addEventListener("click", async () => {
      selectedPackage = button.dataset.package;
      expandedGroups.add("base");
      ciVersions = [];
      releaseVersions = [];
      els.ciVersion.innerHTML = "";
      syncCustomSelect(els.ciVersion);
      renderTabs();
      await loadDetail();
      scrollDetailToTop();
    });
  }

  for (const button of document.querySelectorAll("[data-toggle-group]")) {
    button.addEventListener("click", () => {
      const group = button.dataset.toggleGroup;
      if (expandedGroups.has(group)) {
        expandedGroups.delete(group);
      } else {
        expandedGroups.add(group);
      }
      syncGroupVisibility();
    });
  }

  for (const input of [els.arch, els.channel]) {
    input.addEventListener("change", async () => {
      ciVersions = [];
      releaseVersions = [];
      els.ciVersion.innerHTML = "";
      syncCustomSelect(els.ciVersion);
      await loadDetail();
    });
  }
  els.ciVersion.addEventListener("change", loadDetail);
  els.searchInput.addEventListener("input", renderTabs);
  els.refreshButton.addEventListener("click", loadDetail);

  els.addPackageToCartButton.addEventListener("click", () => {
    addCurrentPackageToCart(els.addPackageToCartButton);
    const original = els.addPackageToCartButton.textContent;
    els.addPackageToCartButton.textContent = "已添加";
    window.setTimeout(() => {
      els.addPackageToCartButton.textContent = original;
    }, 1000);
  });

  els.copyAllButton.addEventListener("click", async () => {
    const urls = Array.from(els.linkCards.querySelectorAll(".url-row a")).map((node) => node.href);
    await navigator.clipboard.writeText(urls.join("\n"));
    els.copyAllButton.textContent = "已复制";
    window.setTimeout(() => {
      els.copyAllButton.textContent = "复制全部下载链接";
    }, 1000);
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".custom-select")) return;
    if (event.target.closest(".event-dropdown")) return;
    closeOtherCustomSelects(null);
    closeEventDropdowns();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeOtherCustomSelects(null);
    closeEventDropdowns();
    closeCartDialog();
  });

  enhanceSelects(document);
  syncCartCount();
  renderProjectOptions();

  if (sessionStorage.getItem(SESSION_KEY) === "1") {
    showConsole();
  } else {
    showLogin();
  }
})();
