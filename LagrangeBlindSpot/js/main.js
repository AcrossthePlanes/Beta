/* =========================================================
           0. 终端全局弹窗引擎 (SysModal) - 赛博动画升级版
           ========================================================= */
// 💥 全局 SVG 加载动画生成器
window.getCyberLoaderHTML = function(text = 'UPLINKING...', color = '#12a8ff') {
    return `
        <div class="cyber-loader-container" style="color: ${color};">
            <svg viewBox="0 0 50 50" class="cyber-spinner">
                <circle cx="25" cy="25" r="20" fill="none" stroke-width="3" class="bg-circle"></circle>
                <circle cx="25" cy="25" r="20" fill="none" stroke-width="3" class="anim-circle"></circle>
            </svg>
            <div class="cyber-loader-text">[ ${text} ]</div>
        </div>
    `;
};

/* =========================================================
           💥 关系网检索与绑定引擎 💥
           ========================================================= */
        window.openBindCharModal = function() {
            document.getElementById('bind-search-input').value = '';
            document.getElementById('bind-search-results').innerHTML = '<div style="color:#8bb9d6; font-size:12px; text-align:center; padding: 20px 0;">请输入关键词进行检索</div>';
            document.getElementById('bindCharModal').classList.add('active');
            setTimeout(() => document.getElementById('bind-search-input').focus(), 100);
        };

        window.searchBindChar = function() {
            const query = document.getElementById('bind-search-input').value.trim().toLowerCase();
            const resBox = document.getElementById('bind-search-results');
            if (!query) return;

            // 过滤出已通过审核的，且不是自己的档案
            const results = characterDB.filter(c => c.status === 'approved' && c.owner_id !== currentUser.id && (c.callsign.toLowerCase().includes(query) || c.name.toLowerCase().includes(query)));

            if (results.length === 0) {
                resBox.innerHTML = '<div style="color:#f44336; font-size:12px; text-align:center; padding: 20px 0;">[ ✕ 未检索到相关档案 ]</div>';
                return;
            }

            resBox.innerHTML = results.map(c => `
                <div style="background: rgba(18,168,255,0.05); border: 1px solid rgba(18,168,255,0.3); padding: 10px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: #fff; font-weight: bold; font-size: 14px; margin-bottom: 4px;">${c.callsign} // ${c.name}</div>
                        <div style="color: #8bb9d6; font-size: 11px; font-family: monospace;">阵营: ${c.faction}</div>
                    </div>
                    <button class="sys-modal-btn confirm" style="padding: 4px 10px; font-size: 12px; margin: 0;" onclick="selectBindChar('${c.callsign}')">[ 申请绑定 ]</button>
                </div>
            `).join('');
        };

        window.selectBindChar = async function(callsign) {
            // 💥 核心修复：先关闭检索弹窗，把屏幕让出来
            document.getElementById('bindCharModal').classList.remove('active');
            
            // 延迟 300 毫秒，等待检索弹窗的关闭动画结束，再弹出输入框
            setTimeout(async () => {
                const relation = await SysModal.prompt(`请输入您与【${callsign}】的关系：\n（例如：兄妹、宿敌、前任、导师等）`, "", "绑定关系");
                if (relation) {
                    const textarea = document.getElementById('f-family-ties');
                    const newLine = `[已绑定: ${callsign}] - 关系: ${relation.trim()}`;
                    
                    if (textarea.value.trim() === '') {
                        textarea.value = newLine;
                    } else {
                        textarea.value += '\n' + newLine;
                    }
                    
                    // 自动撑开高度
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 'px';

                    SysModal.alert(`已将【${callsign}】添加至您的关系网络中。\n\n注：当前为单向登记，后续将开放双向确认功能。`, "登记成功");
                }
            }, 300);
        };

        // 💥 渲染器：将 [已绑定: XXX] 转换为赛博徽章 (SVG 升级版)
        window.formatFamilyTies = function(text) {
            if (!text || text === 'N/A') return '<span style="color:#8bb9d6; font-size:12px;">[ 暂无记录 ]</span>';
            
            // 科幻链接 SVG 图标
            const linkSvg = `<svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: currentColor; vertical-align: middle; margin-top: -2px; margin-right: 3px;"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`;
            
            return text.replace(/\[已绑定:\s*(.*?)\]/g, `<span style="color:#12a8ff; border:1px solid #12a8ff; background:rgba(18,168,255,0.1); padding:2px 6px; border-radius:2px; font-size:12px; margin-right:4px; font-family:monospace;">${linkSvg}$1</span>`);
        };
/* =========================================================
           💥 头像裁剪与云端上传引擎 💥
           ========================================================= */
        let cropperInstance = null;
        let currentAvatarTarget = ''; // 记录当前在传哪个头像：'profile', 'forum_public', 'forum_hidden'

        window.openAvatarUploader = function(target) {
            currentAvatarTarget = target;
            const titleEl = document.getElementById('avatarModalTitle');
            if (target === 'profile') titleEl.innerText = '[ 更新个人终端证件照 ]';
            if (target === 'forum_public') titleEl.innerText = '[ 更新论坛表身份头像 ]';
            if (target === 'forum_hidden') titleEl.innerText = '[ 更新论坛里身份头像 ]';

            document.getElementById('avatarFileInput').value = '';
            document.getElementById('cropperContainer').style.display = 'none';
            document.getElementById('btnSaveAvatar').style.display = 'none';
            if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
            
            document.getElementById('avatarUploadModal').classList.add('active');
        };

        window.closeAvatarUploader = function() {
            document.getElementById('avatarUploadModal').classList.remove('active');
            if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
        };

        // 监听文件选择
        document.getElementById('avatarFileInput').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                const imgEl = document.getElementById('cropperImage');
                imgEl.src = event.target.result;
                document.getElementById('cropperContainer').style.display = 'block';
                document.getElementById('btnSaveAvatar').style.display = 'block';

                if (cropperInstance) cropperInstance.destroy();
                // 启动裁剪器，强制 1:1 正方形比例
                cropperInstance = new Cropper(imgEl, {
                    aspectRatio: 1,
                    viewMode: 1,
                    background: false,
                    dragMode: 'move'
                });
            };
            reader.readAsDataURL(file);
        });

        // 点击裁剪并上传
        document.getElementById('btnSaveAvatar').addEventListener('click', async function() {
            if (!cropperInstance) return;
            const btn = this;
            btn.innerText = '[ 📡 UPLOADING... ]';
            btn.disabled = true;

            // 1. 获取裁剪后的 Canvas，并压缩为 200x200 的 WebP 格式 (极度省空间)
            const canvas = cropperInstance.getCroppedCanvas({ width: 200, height: 200 });
            canvas.toBlob(async (blob) => {
                try {
                    const myChar = characterDB.find(c => c.owner_id === currentUser.id);
                    if (!myChar) throw new Error("未找到公民档案");

                    // 2. 生成唯一文件名并上传到 Supabase Storage
                    const fileName = `${myChar.id}_${currentAvatarTarget}_${Date.now()}.webp`;
                    const { data: uploadData, error: uploadError } = await supabaseClient.storage
                        .from('avatars')
                        .upload(fileName, blob, { contentType: 'image/webp', upsert: true });
                    
                    if (uploadError) throw uploadError;

                    // 3. 获取公开 URL
                    const { data: publicUrlData } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
                    const finalUrl = publicUrlData.publicUrl;

                    // 4. 更新到数据库的对应字段
                    const updatePayload = {};
                    if (currentAvatarTarget === 'profile') updatePayload.avatar_url = finalUrl;
                    if (currentAvatarTarget === 'forum_public') updatePayload.forum_avatar_url = finalUrl;
                    if (currentAvatarTarget === 'forum_hidden') updatePayload.hidden_avatar_url = finalUrl;

                    const { error: dbError } = await supabaseClient.from('characters').update(updatePayload).eq('id', myChar.id);
                    if (dbError) throw dbError;

                    // 5. 刷新本地数据与 UI
                    if (currentAvatarTarget === 'profile') myChar.avatar_url = finalUrl;
                    if (currentAvatarTarget === 'forum_public') myChar.forum_avatar_url = finalUrl;
                    if (currentAvatarTarget === 'forum_hidden') myChar.hidden_avatar_url = finalUrl;

                    closeAvatarUploader();
                    SysModal.alert("影像数据已成功同步至星际网络！", "✅ UPLOAD SUCCESS");
                    
                    // 刷新对应界面
                    if (currentAvatarTarget === 'profile') renderProfile();
                    else {
                        openForumProfile(currentUser.id, currentAvatarTarget === 'forum_hidden');
                        if (window.updatePostBoxUI) window.updatePostBoxUI();
                        loadForumData(true);
                    }
                } catch (err) {
                    console.error(err);
                    SysModal.alert("上传失败，请检查网络或存储桶权限。", "✕ ERROR");
                } finally {
                    btn.innerText = '[ ✂️ 裁剪并上传 ]';
                    btn.disabled = false;
                }
            }, 'image/webp', 0.8);
        });

/* =========================================================
           💥 深空多语言随机生成器 (英、日、法、德、俄) 💥
           ========================================================= */
        const CyberLang = {
            icon: `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor; vertical-align: middle; margin-top: -2px; margin-right: 4px;"><path d="M12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 2c0-3.31-2.69-6-6-6s-6 2.69-6 6c0 2.22 1.21 4.15 3 5.19l1-1.74c-1.19-.7-2-1.97-2-3.45 0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.48-.81 2.75-2 3.45l1 1.74c1.79-1.04 3-2.97 3-5.19zM12 3C7.03 3 3 7.03 3 12c0 3.32 1.8 6.22 4.46 7.99l1-1.74C6.38 16.89 5 14.61 5 12c0-3.86 3.14-7 7-7s7 3.14 7 7c0 2.61-1.38 4.89-3.46 6.25l1 1.74C19.2 18.22 21 15.32 21 12c0-4.97-4.03-9-9-9z"/></svg>`,
            sysMsg: ["SYSTEM MESSAGE", "システムメッセージ", "MESSAGE SYSTÈME", "SYSTEMMELDUNG", "СИСТЕМНОЕ СООБЩЕНИЕ"],
            verifying: ["VERIFYING...", "検証中...", "VÉRIFICATION...", "ÜBERPRÜFUNG...", "ПРОВЕРКА..."],
            merging: ["MERGING...", "マージ中...", "FUSION...", "ZUSAMMENFÜHREN...", "СЛИЯНИЕ..."],
            processing: ["PROCESSING...", "処理中...", "TRAITEMENT...", "VERARBEITUNG...", "ОБРАБОТКА..."],
            saving: ["SAVING...", "保存中...", "SAUVEGARDE...", "SPEICHERN...", "СОХРАНЕНИЕ..."],
            uploading: ["UPLOADING...", "アップロード中...", "TÉLÉCHARGEMENT...", "HOCHLADEN...", "ЗАГРУЗКА..."],
            importing: ["IMPORTING...", "インポート中...", "IMPORTATION...", "IMPORTIEREN...", "ИМПОРТ..."],
            get(key) {
                const arr = this[key] || this.sysMsg;
                return arr[Math.floor(Math.random() * arr.length)];
            }
        };

        // 💥 新增：防偷设私密开关引擎 (瞬间刷新修复版)
        window.togglePrivacy = async function(charId, currentStatus) {
            const newStatus = !currentStatus;
            const msg = newStatus 
                ? "确认将档案设为【私密】吗？\n\n设为私密后，您的档案将从人设库、3D隧道和全局搜索中彻底隐藏，仅您自己和管理员可见。这可以有效防止偷设。" 
                : "确认将档案【公开】吗？\n\n公开后，所有人都可以查阅您的档案。";
            
            const isSure = await SysModal.confirm(msg, "[ 隐私设置 ]");
            if (!isSure) return;

            try {
                // 1. 更新云端数据库
                const { error } = await supabaseClient.from('characters').update({ is_private: newStatus }).eq('id', charId);
                if (error) throw error;
                
                // 2. 💥 核心修复：强制转换为字符串对比，确保 100% 命中本地缓存
                const myChar = characterDB.find(c => String(c.id) === String(charId));
                if (myChar) myChar.is_private = newStatus;
                
                // 顺便把排队库里的也更新了，防止处于审核状态时点击无效
                const myPendingChar = pendingDB.find(c => String(c.id) === String(charId));
                if (myPendingChar) myPendingChar.is_private = newStatus;
                
                // 3. 💥 核心修复：把刷新 UI 的操作移到 alert 弹窗的前面！
                // 这样在你看到“设置成功”弹窗的同时，背后的页面就已经瞬间变样了
                renderProfile();
                renderRoster();
                updateSearchIndex();
                if (window.innerWidth > 768) init3DTunnel(); 

                // 4. 弹出成功提示
                await SysModal.alert(newStatus ? "档案已隐藏，现在仅您和管理员可见。" : "档案已公开。", "设置成功");
                
            } catch (e) {
                console.error(e);
                SysModal.alert("设置失败，请检查网络。", "✕ ERROR");
            }
        };

        // 💥 新增：账号彻底注销引擎
        window.destroyAccount = async function() {
            const confirmKey = await SysModal.prompt("危险操作：永久注销账号\n\n此操作将彻底抹除您的终端密钥、个人档案、通讯记录及所有相关数据，且不可恢复！\n\n请输入您的终端密钥以确认注销：", "", "ACCOUNT DESTRUCTION");
            
            if (confirmKey === null) return; // 用户点击取消
            if (confirmKey.trim().toUpperCase() !== currentUser.id) {
                await SysModal.alert("密钥验证失败，注销已取消。", "✕ VERIFICATION FAILED");
                return;
            }

            const isSure = await SysModal.confirm("最后一次确认：您真的要永久注销并销毁所有数据吗？", "最终确认");
            if (!isSure) return;

            try {
                // 1. 删除该用户的所有角色档案
                await supabaseClient.from('characters').delete().eq('owner_id', currentUser.id);
                // 2. 删除该用户创建的组织/阵营/情报等文章
                await supabaseClient.from('articles').delete().eq('owner_id', currentUser.id);
                // 3. 删除论坛帖子和评论
                await supabaseClient.from('forum_posts').delete().eq('owner_id', currentUser.id);
                await supabaseClient.from('forum_comments').delete().eq('owner_id', currentUser.id);
                // 4. 删除用户主表记录
                await supabaseClient.from('users').delete().eq('id', currentUser.id);

                localStorage.removeItem('tf141_device_id');
                await SysModal.alert("您的所有数据已从星际网络中彻底抹除。\n再见，公民。", "ACCOUNT DESTROYED");
                location.reload();
            } catch (err) {
                console.error(err);
                SysModal.alert("注销失败，请检查网络连接。", "✕ ERROR");
            }
        };

        // 💥 新增：右上角密钥显示/隐藏控制逻辑
        window.isKeyVisible = false;
        window.toggleKeyVisibility = function(e) {
            e.stopPropagation();
            window.isKeyVisible = !window.isKeyVisible;
            const keySpan = document.getElementById('top-secret-key');
            const iconSpan = document.getElementById('top-key-toggle-icon');
            if (!keySpan || !iconSpan || !currentUser) return;
            
            if (window.isKeyVisible) {
                keySpan.innerText = ` [${currentUser.id}]`;
                // 睁眼 SVG
                iconSpan.innerHTML = `<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor;"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
            } else {
                keySpan.innerText = ` [********]`;
                // 闭眼 SVG
                iconSpan.innerHTML = `<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor;"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.28 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;
            }
        };

        const SysModal = {
            closeTimeout: null,
            init() {
                this.overlay = document.getElementById('sysModalOverlay');
                this.title = document.getElementById('sysModalTitle');
                this.msg = document.getElementById('sysModalMsg');
                this.inputWrapper = document.getElementById('sysModalInputWrapper');
                this.input = document.getElementById('sysModalInput');
                this.textarea = document.getElementById('sysModalTextarea'); // 💥 新增
                this.btnConfirm = document.getElementById('sysModalConfirmBtn');
                this.btnCancel = document.getElementById('sysModalCancelBtn');
            },
            show(opts) {
                return new Promise(resolve => {
                    if (!this.overlay) this.init();
                    if (this.closeTimeout) clearTimeout(this.closeTimeout);
                    this.overlay.classList.remove('closing');
                    
                    this.title.innerHTML = opts.title || `[ ${CyberLang.get('sysMsg')} ]`;
                    this.msg.innerHTML = (opts.msg || '').replace(/\n/g, '<br>'); 
                    
                    if (opts.type === 'prompt') {
                        this.inputWrapper.style.display = 'flex';
                        // 💥 核心：根据传入的类型决定显示单行还是多行输入框
                        if (opts.inputType === 'textarea') {
                            this.input.parentElement.style.display = 'none';
                            this.textarea.style.display = 'block';
                            this.textarea.value = opts.defaultText || '';
                            setTimeout(() => this.textarea.focus(), 100);
                        } else {
                            this.textarea.style.display = 'none';
                            this.input.parentElement.style.display = 'flex';
                            this.input.value = opts.defaultText || '';
                            setTimeout(() => this.input.focus(), 100);
                        }
                    } else {
                        this.inputWrapper.style.display = 'none';
                    }

                    this.btnCancel.style.display = opts.type === 'alert' ? 'none' : 'block';

                    this.btnConfirm.onclick = () => {
                        this.close();
                        if (opts.type === 'prompt') resolve(opts.inputType === 'textarea' ? this.textarea.value.trim() : this.input.value.trim());
                        else if (opts.type === 'confirm') resolve(true);
                        else resolve();
                    };

                    this.btnCancel.onclick = () => {
                        this.close();
                        if (opts.type === 'prompt') resolve(null);
                        else if (opts.type === 'confirm') resolve(false);
                    };

                    this.input.onkeydown = (e) => { if (e.key === 'Enter') this.btnConfirm.click(); };
                    this.overlay.classList.add('active');
                });
            },
            close() { 
                this.overlay.classList.add('closing');
                this.closeTimeout = setTimeout(() => { this.overlay.classList.remove('active', 'closing'); }, 300); 
            },
            alert(msg, title) { return this.show({ type: 'alert', msg, title }); },
            confirm(msg, title) { return this.show({ type: 'confirm', msg, title }); },
            // 💥 核心：prompt 增加 inputType 参数
            prompt(msg, defaultText, title, inputType = 'text') { return this.show({ type: 'prompt', msg, defaultText, title, inputType }); }
        };

        /* =========================================================
   💥 职位名额管线引擎 (Position Management Engine)
   ========================================================= */
window.parsePositionsStr = function(str) {
    if (!str) return null;
    const parts = str.split(/[,，|]/);
    const posObj = {};
    let valid = false;
    parts.forEach(p => {
        const kv = p.split(/[:：]/);
        if (kv.length === 2) {
            const k = kv[0].trim();
            const v = parseInt(kv[1].trim(), 10);
            if (k && !isNaN(v)) {
                posObj[k] = v;
                valid = true;
            }
        }
    });
    return valid ? posObj : null;
};

// 💥 终极升级版：使用原生 DOM 解析器，并强力清洗双重转义字符
        window.getOrgPositions = function(content) {
            if (!content) return null;
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const div = doc.querySelector('div[data-positions]');
                if (div) {
                    let rawStr = div.getAttribute('data-positions');
                    let cleanStr = rawStr.replace(/&quot;/g, '"').replace(/&apos;/g, "'");
                    return JSON.parse(cleanStr);
                }
            } catch(e) { 
                console.error("职位解析失败:", e); 
            }
            return null;
        };

        // 💥 解析自戏考核要求
        window.getOrgRpPositions = function(content) {
            if (!content) return "";
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const div = doc.querySelector('div[data-rp-positions]');
                if (div) {
                    let rawStr = div.getAttribute('data-rp-positions') || "";
                    return rawStr.replace(/&quot;/g, '"').replace(/&apos;/g, "'");
                }
            } catch(e) { 
                console.error("自戏要求解析失败:", e); 
            }
            return "";
        };

        // 💥 新增：解析职位具体要求
        window.getOrgReqs = function(content) {
            if (!content) return "";
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const div = doc.querySelector('div[data-reqs]');
                if (div) {
                    let rawStr = div.getAttribute('data-reqs') || "";
                    // 还原换行符和引号
                    return rawStr.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#10;/g, '\n');
                }
            } catch(e) { 
                console.error("要求解析失败:", e); 
            }
            return "";
        };

        // 💥 升级：解析阵营/组织的近况与公告 (支持富文本)
        window.getArticleUpdates = function(content) {
            if (!content) return "";
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                
                // 1. 先尝试读取新的富文本格式
                const newDiv = doc.querySelector('#hidden-updates-data');
                if (newDiv) return newDiv.innerHTML;
                
                // 2. 兼容旧的纯文本格式
                const oldDiv = doc.querySelector('div[data-updates]');
                if (oldDiv) {
                    let rawStr = oldDiv.getAttribute('data-updates') || "";
                    return rawStr.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#10;/g, '\n');
                }
            } catch(e) { 
                console.error("公告解析失败:", e); 
            }
            return "";
        };

// 💥 渲染组织名额状态 (去除了 Emoji)
        window.renderOrgPositionsStatus = function(orgName, content) {
            const positions = getOrgPositions(content);
            if (!positions) return '';
            
            const approvedChars = characterDB.filter(c => c.status === 'approved');
            let html = '<div style="margin-bottom: 20px;">';
            html += '<h4 style="color: #8bc34a; margin: 0 0 15px 0; font-family: monospace; letter-spacing: 2px;">[ 📊 编制与名额状态 ]</h4>';
            html += '<div style="display: flex; flex-wrap: wrap; gap: 10px;">';
            
            for (const [pos, limit] of Object.entries(positions)) {
                let count = 0;
                approvedChars.forEach(c => {
                    if (c.organization === orgName && c.occupation === pos) count++;
                    if (c.has_hidden && c.hidden_org === orgName && c.hidden_occupation === pos) count++;
                });
                
                const isFull = limit > 0 && count >= limit;
                const color = isFull ? '#f44336' : '#8bc34a';
                const bg = isFull ? 'rgba(244,67,54,0.1)' : 'rgba(139,195,74,0.15)';
                const text = limit > 0 ? (isFull ? `${pos}: ${count}/${limit} [满员]` : `${pos}: ${count}/${limit} [招募中]`) : `${pos}: ${count}人 [不限额]`;
                
                html += `<span style="padding: 6px 12px; border: 1px solid ${color}; background: ${bg}; color: ${color}; font-size: 13px; border-radius: 4px; font-family: monospace;">${text}</span>`;
            }
            
            html += '</div></div>';
            return html;
        };

// 审核前：检查冲突
window.processIdentityCapacity = async function(orgName, occupation, charId) {
    const orgData = articlesDB.find(a => a.type === 'org' && a.title === orgName);
    if (!orgData) return { rejected: false };
    
    const positions = getOrgPositions(orgData.content);
    if (!positions || !positions[occupation] || positions[occupation] <= 0) return { rejected: false };
    
    const limit = positions[occupation];
    // 强制从云端实时拉取，防止两人同时点击通过导致的超员
    const { data: currentChars } = await supabaseClient.from('characters').select('id, organization, occupation, hidden_org, hidden_occupation, has_hidden').eq('status', 'approved');
    
    let count = 0;
    if (currentChars) {
        currentChars.forEach(c => {
            if (c.organization === orgName && c.occupation === occupation) count++;
            if (c.has_hidden && c.hidden_org === orgName && c.hidden_occupation === occupation) count++;
        });
    }
    
    if (count >= limit) {
        return { rejected: true, msg: `组织【${orgName}】的【${occupation}】席位刚刚已被其他公民填满（${count}/${limit}）。\n无法通过当前档案，请将其驳回修改。` };
    }
    return { rejected: false };
};

// 审核后：自动踢回所有竞争失败者
window.triggerConflictRejection = async function(charDraft) {
    const checkAndReject = async (orgName, occupation, approvedId) => {
        if (!orgName || !occupation) return;
        const orgData = articlesDB.find(a => a.type === 'org' && a.title === orgName);
        if (!orgData) return;
        const positions = getOrgPositions(orgData.content);
        if (!positions || !positions[occupation] || positions[occupation] <= 0) return;
        
        const limit = positions[occupation];
        const { data: currentChars } = await supabaseClient.from('characters').select('id, organization, occupation, hidden_org, hidden_occupation, has_hidden').eq('status', 'approved');
        
        let count = 0;
        if (currentChars) {
            currentChars.forEach(c => {
                if (c.organization === orgName && c.occupation === occupation) count++;
                if (c.has_hidden && c.hidden_org === orgName && c.hidden_occupation === occupation) count++;
            });
        }
        
        // 如果位置刚刚满员，开启自动屠杀
        if (count >= limit) {
            const conflictChars = pendingDB.filter(c => 
                c.id !== approvedId && c.status === 'pending' &&
                (
                    (c.organization === orgName && c.occupation === occupation) ||
                    (c.has_hidden && c.hidden_org === orgName && c.hidden_occupation === occupation)
                )
            );
            
            if (conflictChars.length > 0) {
                for (let conflict of conflictChars) {
                    const rejectMsg = {
                        general: `【系统自动返回】\n您申请的组织【${orgName}】中的【${occupation}】职位，刚刚已被管理员批准给其他公民并满编。\n请修改您的职业意向后重新提交档案。`,
                        fields: {}
                    };
                    if (conflict.organization === orgName && conflict.occupation === occupation) {
                        rejectMsg.fields['occupation'] = { label: "职位/职业", text: "竞争失败，名额已满" };
                    } else {
                        rejectMsg.fields['hidden_occupation'] = { label: "真实职业/身份", text: "竞争失败，名额已满" };
                    }
                    
                    await supabaseClient.from('characters').update({
                        status: 'rejected',
                        review_comments: rejectMsg
                    }).eq('id', conflict.id);
                }
                setTimeout(() => {
                    SysModal.alert(`系统检测到【${orgName} - ${occupation}】已满编。\n已自动将 ${conflictChars.length} 份竞争排队申请退回。`, "职位争夺判定生效");
                }, 1000);
            }
        }
    };

    await checkAndReject(charDraft.organization, charDraft.occupation, charDraft.id);
    if (charDraft.has_hidden) {
        await checkAndReject(charDraft.hidden_org, charDraft.hidden_occupation, charDraft.id);
    }
};

        /* =========================================================
           1. 网页交互逻辑（导航、侧边栏切换等）
           ========================================================= */
        // 💥 全局监听：让所有 textarea 自动撑开高度
        document.addEventListener('input', function(e) {
            if (e.target.tagName.toLowerCase() === 'textarea') {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
            }
        });

        // 💥 自动撑开所有填入数据的文本框
            setTimeout(() => {
                document.querySelectorAll('.tactical-form textarea').forEach(el => {
                    el.style.height = 'auto';
                    el.style.height = el.scrollHeight + 'px';
                });
            }, 50);

        const menuBtn = document.getElementById('menuBtn');
        const closeBtn = document.getElementById('closeBtn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const wikiButtons = document.querySelectorAll('.wiki-item-btn');
        const viewPanels = document.querySelectorAll('.view-panel');

        // 💥 打开侧边栏：触发抽屉滑出、长虹玻璃弥散、主界面后推
        menuBtn.addEventListener('click', () => { 
            sidebar.classList.add('open'); 
            overlay.classList.add('show'); 
            document.body.classList.add('sidebar-open'); // 触发主界面后推
        });

        // 💥 关闭侧边栏：全部恢复原状
        function closeSidebar() { 
            sidebar.classList.remove('open'); 
            overlay.classList.remove('show'); 
            document.body.classList.remove('sidebar-open'); // 恢复主界面
        }
        
        closeBtn.addEventListener('click', closeSidebar);
        
        // 点击遮罩层关闭
        overlay.addEventListener('click', () => {
            closeSidebar(); 
            
            // 联动：如果点的是目录球的遮罩，也一并收起
            const toc = document.querySelector('.world-toc');
            if (toc && toc.classList.contains('open')) {
                toc.classList.remove('open');
                overlay.classList.remove('show');
                document.body.classList.remove('sidebar-open'); 
            }
        });


        /* =========================================================
           2. 沉浸式环境特效 (鼠标追光、粒子场、点击雷达)
           ========================================================= */
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth * 100;
            const y = e.clientY / window.innerHeight * 100;
            document.documentElement.style.setProperty('--mouse-x', `${x}%`);
            document.documentElement.style.setProperty('--mouse-y', `${y}%`);
        });

        document.addEventListener('click', (e) => {
            const ping = document.createElement('div');
            ping.className = 'radar-ping';
            ping.style.left = `${e.pageX}px`;
            ping.style.top = `${e.pageY}px`;
            document.body.appendChild(ping);
            setTimeout(() => ping.remove(), 1000);
        });


        /* =========================================================
           5. 战术终端搜索与全屏文章阅读系统
           ========================================================= */
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const searchDropdown = document.getElementById('searchDropdown');
        const searchGroup = document.getElementById('searchGroup');
        const articles = document.querySelectorAll('.article-card');

        // 文章阅读页相关元素
        const articleView = document.getElementById('articleView');
        const pageTitle = document.getElementById('pageTitle');
        const pageMeta = document.getElementById('pageMeta');
        const pageContent = document.getElementById('pageContent');
        const backToMainBtn = document.getElementById('backToMainBtn');

        // 💥 新增：用于记忆打开文章前所在的视图 ID
        let previousViewId = 'mainView';

        // 1. 初始化全局搜索索引
        window.searchIndex = [];

        // 2. 打开全屏文章的函数 (终极融合版：支持官方档案与个人记录)
        window.openArticle = function(item) {
            window.lastScrollY = window.scrollY || window.pageYOffset; // 💥 记录当前滚动位置
            
            const isRp = item.type === 'rp_log' || (item.tag && item.tag.includes('RP LOG'));
            const isSolo = item.type === 'solo_log' || (item.tag && item.tag.includes('SOLO LOG'));

            if (isRp || isSolo) {
                // ==========================================
                // 走个人记录专属阅读器 (logReaderView)
                // ==========================================
                const themeColor = isRp ? '#e040fb' : '#12a8ff';
                const shadowColor = isRp ? 'rgba(224,64,251,0.5)' : 'rgba(18,168,255,0.5)';
                
                document.getElementById('logReaderBackBtn').style.color = themeColor;
                document.getElementById('logReaderBackBtn').style.borderColor = themeColor;
                document.getElementById('logReaderSysStatus').style.color = themeColor;
                document.getElementById('logReaderHeaderBox').style.borderColor = themeColor;
                document.getElementById('logReaderMeta').style.color = themeColor;
                document.getElementById('logReaderTitle').style.color = themeColor;
                document.getElementById('logReaderTitle').style.textShadow = `0 0 15px ${shadowColor}`;
                document.getElementById('logReaderSummary').style.color = isRp ? '#e1bee7' : '#8bb9d6';
                document.getElementById('logReaderFooter').style.color = themeColor;

                document.getElementById('logReaderTitle').innerText = item.title;
                document.getElementById('logReaderMeta').innerText = item.tag || (isRp ? 'RP LOG // 对戏记录' : 'SOLO LOG // 自戏记录');
                document.getElementById('logReaderSummary').innerText = item.summary || '';

                const contentBox = document.getElementById('logReaderContent');
                
                if (isRp) {
                    try {
                        const msgs = JSON.parse(item.content);
                        let html = '<div class="chat-container" style="border: none; background: transparent; padding: 0; box-shadow: none;">';
                        msgs.forEach(m => {
                            const isMe = m.sender === 'me';
                            // 💥 核心：如果有时间，就渲染出来
                            const timeHtml = m.time ? `<span style="opacity:0.6; font-weight:normal; font-size:11px; margin-left:8px;">${m.time}</span>` : '';
                            html += `
                                <div class="chat-msg ${isMe ? 'me' : 'other'}">
                                    <div class="chat-name">${m.name} ${timeHtml}</div>
                                    <div class="chat-bubble">${m.text}</div>
                                </div>
                            `;
                        });
                        html += '</div>';
                        contentBox.innerHTML = html;
                    } catch(e) {
                        contentBox.innerHTML = "<div style='color:#f44336;'>[ ✕ 解析对戏记录失败，数据可能已损坏 ]</div>";
                    }
                } else {
                    contentBox.innerHTML = `<div class="solo-log-content">${item.content}</div>`;
                }

                const currentActivePanel = document.querySelector('.view-panel.active');
                if (currentActivePanel && currentActivePanel.id !== 'logReaderView') {
                    previousViewId = currentActivePanel.id;
                }
                
                document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
                document.getElementById('logReaderView').classList.add('active');
                window.scrollTo({ top: 0, behavior: 'instant' });
                
            } else {
                // ==========================================
                // 走官方档案阅读器 (articleView)
                // ==========================================
                pageTitle.innerText = item.title;
                pageMeta.innerText = item.tag || 'CLASSIFIED';
                
                // 💥 权限判定：是否显示编辑按钮
                let canEditUpdates = false;
                if (currentUser) {
                    if (['admin', 'super_admin'].includes(currentUser.role)) canEditUpdates = true;
                    if (item.owner_id === currentUser.id) canEditUpdates = true;
                    if (item.channel_admins && item.channel_admins.includes(currentUser.id)) canEditUpdates = true;
                }

                let editBtnHtml = canEditUpdates ? `<button class="sys-modal-btn confirm" style="float: right; padding: 4px 10px; font-size: 12px; border-color: #ffeb3b; color: #ffeb3b; margin-top: -4px;" onclick="openUpdatesEditor('${item.id}')">[ 编辑公告 ]</button>` : '';

                // 💥 提取近况与公告
                const updatesText = window.getArticleUpdates(item.content);
                let updatesHtml = '';
                if (updatesText || canEditUpdates) {
                    updatesHtml = `
                        <div style="margin-bottom: 25px; padding: 20px; background: rgba(255,235,59,0.05); border-left: 4px solid #ffeb3b; border-radius: 4px; box-shadow: 0 0 20px rgba(255,235,59,0.1);">
                            <h4 style="color: #ffeb3b; margin: 0 0 10px 0; font-family: monospace; letter-spacing: 1px; font-size: 16px;">
                                [ 近况与公告 ]
                                ${editBtnHtml}
                            </h4>
                            <div style="color: #fff8b0; font-size: 15px; line-height: 1.8; word-break: break-word;">${updatesText || '<span style="opacity:0.5;">暂无公告</span>'}</div>
                        </div>
                    `;
                }

                // 💥 剔除所有隐藏代码，得到纯净正文
                let cleanContent = item.content.replace(/<div[^>]*data-positions=['"].*?['"][^>]*><\/div>/g, '')
                                               .replace(/<div[^>]*data-rp-positions=['"].*?['"][^>]*><\/div>/g, '')
                                               .replace(/<div[^>]*data-reqs=['"].*?['"][^>]*><\/div>/g, '')
                                               .replace(/<div[^>]*data-updates=['"].*?['"][^>]*><\/div>/g, '')
                                               .replace(/<div id=['"]hidden-updates-data['"] style=['"]display:none;['"]>[\s\S]*?<\/div>/g, '');

                let renderContent = cleanContent;
                
                // 💥 拦截：如果是阵营，直接把公告顶在最上面
                if (item.type === 'faction') {
                    renderContent = updatesHtml + cleanContent;
                }
                
                // 💥 拦截：如果是组织档案，启用 Tab 选项卡排版，并把公告顶在最上面
                if (item.type === 'org') {
                    const positionsHtml = renderOrgPositionsStatus(item.title, item.content);
                    const rpReqs = window.getOrgRpPositions(item.content);
                    const reqs = window.getOrgReqs(item.content);
                    
                    let recruitHtml = positionsHtml;
                    
                    if (rpReqs) {
                        recruitHtml += `<div style="margin-top: 20px; padding: 15px; background: rgba(18,168,255,0.05); border-left: 4px solid #12a8ff;"><h4 style="color: #12a8ff; margin: 0 0 10px 0; font-family: monospace;">[ 自戏考核要求 ]</h4><p style="color: #8bb9d6; font-size: 14px; margin: 0;">以下职位需要提交不少于 200 字的自戏考核：<br><strong style="color: #e0f2fe;">${rpReqs}</strong></p></div>`;
                    }
                    if (reqs) {
                        recruitHtml += `<div style="margin-top: 20px; padding: 15px; background: rgba(255,235,59,0.05); border-left: 4px solid #ffeb3b;"><h4 style="color: #ffeb3b; margin: 0 0 10px 0; font-family: monospace;">[ 职位具体要求 ]</h4><div style="color: #fff8b0; font-size: 14px; line-height: 1.8; white-space: pre-wrap;">${reqs}</div></div>`;
                    }
                    
                    if (!positionsHtml && !rpReqs && !reqs) {
                        recruitHtml = `<div style="color: #8bb9d6; font-family: monospace; padding: 20px 0;">[ 暂无特殊招募要求，所有人均可自由申请加入 ]</div>`;
                    }

                    // 剔除隐藏数据
                    const cleanContent = item.content.replace(/<div[^>]*data-positions=['"].*?['"][^>]*><\/div>/g, '')
                                                     .replace(/<div[^>]*data-rp-positions=['"].*?['"][^>]*><\/div>/g, '')
                                                     
                                                     .replace(/<div[^>]*data-reqs=['"].*?['"][^>]*><\/div>/g, '');
                    
                    // 组装 Tab 结构 (把公告放在 Tab 上方)
                    renderContent = `
                        ${updatesHtml}
                        <div class="org-tabs">
                            <button class="org-tab-btn active" onclick="document.querySelectorAll('.org-tab-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active'); document.getElementById('org-lore').style.display='block'; document.getElementById('org-recruit').style.display='none';">详细设定</button>
                            <button class="org-tab-btn" onclick="document.querySelectorAll('.org-tab-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active'); document.getElementById('org-lore').style.display='none'; document.getElementById('org-recruit').style.display='block';">招募大厅</button>
                        </div>
                        <div id="org-lore" class="org-tab-content active">${cleanContent}</div>
                        <div id="org-recruit" class="org-tab-content">${recruitHtml}</div>
                    `;
                }

                if (renderContent.includes('<') && renderContent.includes('>')) {
                    pageContent.innerHTML = renderContent;
                } else {
                    pageContent.innerHTML = renderContent.replace(/\n/g, '<br>');
                }
                
                const currentActivePanel = document.querySelector('.view-panel.active');
                if (currentActivePanel && currentActivePanel.id !== 'articleView') {
                    previousViewId = currentActivePanel.id;
                }
                
                // 🔷 科幻解密动画
const overlay = document.getElementById('article-decode-overlay');
document.getElementById('decode-title-ghost').innerText = item.title || 'ACCESSING...';
window.lastScrollY = window.scrollY || window.pageYOffset;
overlay.classList.add('visible');
setTimeout(() => {
    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
    sessionStorage.setItem('tf141_current_view', 'articleView');
sessionStorage.setItem('tf141_last_article_id', item.id);
    articleView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
    overlay.classList.remove('visible');
}, 600);
            }

            if(typeof searchDropdown !== 'undefined') searchDropdown.classList.remove('active');
            if(typeof searchInput !== 'undefined') searchInput.value = '';
        };

        // 3. 返回按钮逻辑 (升级版：返回记忆的视图)
        backToMainBtn.addEventListener('click', () => {
            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            const targetPanel = document.getElementById(previousViewId) || document.getElementById('mainView');
            targetPanel.classList.add('active');
            sessionStorage.setItem('tf141_current_view', targetPanel.id);
            
            window.scrollTo({ top: window.lastScrollY || 0, behavior: 'auto' }); // 💥 瞬间恢复滚动位置
        });

        // 4. 给主界面的每个卡片绑定点击事件
        searchIndex.forEach(item => {
            item.element.addEventListener('click', () => openArticle(item));
        });

        // 5. 核心检索函数 (支持全局跳转)
        function handleSearch() {
            const query = searchInput.value.trim().toLowerCase();
            
            if (!query) {
                searchDropdown.classList.remove('active');
                return;
            }

            // 模糊匹配：只要关键词或标题包含搜索词即可
            const results = window.searchIndex.filter(item => 
                item.keywords.includes(query) || item.title.toLowerCase().includes(query)
            );

            searchDropdown.innerHTML = '';

            if (results.length === 0) {
                searchDropdown.innerHTML = `
                    <div class="dropdown-item" style="pointer-events: none; border-left: 4px solid #f44336;">
                        <span class="dropdown-title" style="color: #f44336;">[ ✕ 未查询到结果 ]</span>
                        <span class="dropdown-tag" style="color: #f44336;">未检索到相关文章或档案</span>
                    </div>
                `;
            } else {
                results.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'dropdown-item';
                    div.innerHTML = `
                        <span class="dropdown-title">${item.title}</span>
                        <span class="dropdown-tag">${item.tag}</span>
                    `;
                    
                    // 💥 核心：点击下拉项的智能跳转逻辑
                    div.onclick = () => {
                        if (item.type === 'character') {
                            // 如果搜到的是人设，跳转到人设库并打开详情
                            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
                            document.getElementById('logView').classList.add('active');
                            sessionStorage.setItem('tf141_current_view', 'logView');
                            
                            if (window.innerWidth <= 768) {
                                window.showMobileDetail(item.charIndex);
                            } else {
                                // PC端：如果有3D隧道，触发飞行；否则直接显示面板
                                document.getElementById('viewport').scrollIntoView({behavior: 'smooth', block: 'center'});
                                const targetItems = window.tunnelItems ? window.tunnelItems.filter(i => i.type === 'card' && i.charIndex === item.charIndex) : [];
                                if(targetItems.length > 0 && window.triggerTunnelFly) {
                                    window.triggerTunnelFly(targetItems[0].uniqueItemIndex);
                                } else {
                                    window.showDetailOverlay(item.charIndex);
                                }
                            }
                        } else {
                            // 如果搜到的是其他文章(情报/阵营/组织/剧情/记录)，直接调用全屏阅读器
                            openArticle(item.originalData);
                        }
                        
                        // 搜索完毕后清空并收起搜索框
                        searchDropdown.classList.remove('active');
                        searchInput.value = '';
                    };
                    
                    searchDropdown.appendChild(div);
                });
            }
            
            searchDropdown.classList.add('active');
        }

        searchInput.addEventListener('input', handleSearch);

        searchBtn.addEventListener('click', () => {
            if (!searchInput.value.trim()) {
                searchGroup.classList.add('search-error');
                setTimeout(() => searchGroup.classList.remove('search-error'), 400);
            } else {
                handleSearch();
            }
        });

        document.addEventListener('click', (e) => {
            if (!searchGroup.contains(e.target)) {
                searchDropdown.classList.remove('active');
            }
        });

        /* =========================================================
           💥 世界观左侧导航栏滚动与监听引擎 (全动态升级版) 💥
           ========================================================= */
        let isAutoScrolling = false;
        let autoScrollTimeout = null;

        // 1. 封装单个目录按钮的点击事件
        window.bindSingleTocEvent = function(btn) {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-scroll');
                if (!targetId) return;

                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    isAutoScrolling = true;
                    if (autoScrollTimeout) clearTimeout(autoScrollTimeout);

                    document.querySelectorAll('.toc-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    const parentSub = btn.closest('.sub-toc-list');
                    if (parentSub) {
                        parentSub.classList.add('open');
                        const parentDiv = parentSub.previousElementSibling;
                        if (parentDiv) {
                            const parentBtn = parentDiv.querySelector('.toc-btn');
                            if (parentBtn) parentBtn.classList.add('active');
                            const arrow = parentDiv.querySelector('.toc-arrow');
                            if (arrow) arrow.classList.add('open');
                        }
                    }

                    const yOffset = -80; 
                    const y = targetEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });

                    autoScrollTimeout = setTimeout(() => {
                        isAutoScrolling = false;
                    }, 800);
                }
            });
        };

        // 初始化绑定静态目录按钮
        document.querySelectorAll('.toc-btn').forEach(btn => bindSingleTocEvent(btn));

        // 点击展开/收起子目录的函数
        window.toggleSubMenu = function(id) {
            const sub = document.getElementById(id);
            if(sub) {
                sub.classList.toggle('open');
                const arrow = sub.previousElementSibling.querySelector('.toc-arrow');
                if(arrow) arrow.classList.toggle('open');
            }
        };

        // 2. 战术雷达扫描
        const observerOptions = {
            root: null,
            rootMargin: '-80px 0px -30% 0px', 
            threshold: 0
        };

        const sectionObserver = new IntersectionObserver((entries) => {
            if (isAutoScrolling) return;

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    
                    document.querySelectorAll('.toc-btn').forEach(btn => btn.classList.remove('active'));
                    
                    const activeBtn = document.querySelector(`.toc-btn[data-scroll="${id}"]`);
                    if (activeBtn) {
                        activeBtn.classList.add('active');
                        
                        const parentSub = activeBtn.closest('.sub-toc-list');
                        if (parentSub) {
                            parentSub.classList.add('open');
                            const parentDiv = parentSub.previousElementSibling;
                            if (parentDiv) {
                                const parentBtn = parentDiv.querySelector('.toc-btn');
                                if (parentBtn) parentBtn.classList.add('active');
                                
                                const arrow = parentDiv.querySelector('.toc-arrow');
                                if (arrow) arrow.classList.add('open');
                            }
                        }
                    }
                }
            });
        }, observerOptions);

        // 3. 动态更新雷达监听目标
        window.updateRadarTargets = function() {
            sectionObserver.disconnect(); // 先断开所有旧监听
            
            // 监听静态区块
            const staticTargets = '#main-hero, #sec-intro, #sec-conflict, #sec-factions, #faction-psc, #faction-frontier, #faction-pmc, #faction-freeport, #sec-onboard, #intel-grid, #gallery-strip';
            document.querySelectorAll(staticTargets).forEach(section => {
                if (section) sectionObserver.observe(section);
            });
            
            // 监听所有情报卡片（包括动态生成的）
            document.querySelectorAll('.intel-grid .intel-card').forEach(card => {
                sectionObserver.observe(card);
            });
        };

        /* =========================================================
           💥 手机端专属：屏幕中心雷达探测器 (滚动聚焦)
           ========================================================= */
        const centerFocusObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-centered'); // 进入中心区域，亮起
                } else {
                    entry.target.classList.remove('is-centered'); // 离开中心区域，熄灭
                }
            });
        }, {
            root: null,
            // 💥 核心魔法：上下各往内缩进 35%，只留下屏幕正中间 30% 的区域作为“触发区”
            rootMargin: '-35% 0px -35% 0px',
            threshold: 0
        });

        window.updateCenterFocusTargets = function() {
            centerFocusObserver.disconnect(); // 先清空旧的监听
            
            // 只在手机和平板端 (<= 900px) 启用这个炫酷的滚动聚焦功能
            if (window.innerWidth <= 900) {
                document.querySelectorAll('#mainView .intel-card, #mainView .faction-card').forEach(card => {
                    centerFocusObserver.observe(card);
                });
            }
        };

        // 4. 💥 核心：动态生成情报目录 (安全修复版) 💥
        window.generateIntelTOC = function() {
            const intelSubToc = document.getElementById('intel-sub');
            if (!intelSubToc) return;
            
            intelSubToc.innerHTML = ''; // 清空旧目录
            
            // 💥 修复：只抓取主界面情报网格里的卡片，避开管理员后台的卡片
            const allCards = document.querySelectorAll('#main-intel-grid .intel-card');
            allCards.forEach(card => {
                const id = card.getAttribute('id');
                const nameEl = card.querySelector('.card-name'); // 先安全地获取元素
                
                // 💥 修复：确保元素存在，再去读取 innerText
                if (id && nameEl) {
                    const title = nameEl.innerText;
                    const li = document.createElement('li');
                    li.innerHTML = `<button class="toc-btn sub-btn" data-scroll="${id}">└ ${title}</button>`;
                    intelSubToc.appendChild(li);
                    
                    // 给新生成的按钮绑定点击事件
                    bindSingleTocEvent(li.querySelector('.toc-btn'));
                }
            });
            
            // 目录生成完毕后，更新雷达监听
            updateRadarTargets();
        };

        // 页面刚加载时，先根据 HTML 里写死的卡片生成一次目录
        generateIntelTOC();

        /* =========================================================
           3. 💥 云端数据库联网逻辑 (Supabase 升级版) 💥
           ========================================================= */
        
        // 1. 初始化 Supabase 客户端
        const { createClient } = supabase;
        const _supabaseUrl = 'https://bhfbtnylovoettdgvuzj.supabase.co';
        const _supabaseKey = 'sb_publishable_afZtwvnLJunR_uFDVxQvjg_t_ZqCkoO';
        const supabaseClient = createClient(_supabaseUrl, _supabaseKey);

        let characterDB = [];
        let currentUser = null; // 记录当前登录的群友身份

        // 💥 新增：一键复制终端密钥功能
        window.copyOpKey = function(key) {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(key).then(() => {
                    SysModal.alert(`终端密钥【 ${key} 】已成功复制到剪贴板！\n\n请妥善保管，在其他设备上输入此密钥即可恢复您的身份与档案。`, "✅ 复制成功");
                }).catch(err => {
                    // 如果浏览器不支持剪贴板 API，降级为弹窗手动复制
                    SysModal.prompt("您的浏览器不支持自动复制，请手动复制以下密钥：", key, "终端密钥");
                });
            } else {
                SysModal.prompt("请手动复制以下密钥：", key, "终端密钥");
            }
        };

        // 2. 💥 终端身份认证系统 (支持密钥恢复与游客模式)
        async function initIdentity() {
            let deviceId = localStorage.getItem('tf141_device_id');
            
            if (!deviceId) {
                // 第一次来，弹窗询问
                let input = await SysModal.prompt("初次连接星际网络终端。\n\n▶ 新公民：请输入您的代号 (Nickname)\n▶ 老公民：请输入您的终端密钥 (如 OP-XXXX)\n\n※ 点击 [取消] 可作为游客免登录浏览世界观。", "", "SYSTEM PROMPT // 身份认证");
                
                if (input === null) {
                    // 💥 用户点击了取消，进入游客模式！
                    currentUser = { id: 'GUEST', nickname: '游客', role: 'guest' };
                } else {
                    input = input.trim();
                    if (!input) input = "Unknown_Operator";
                    
                    // 判断：如果输入的是 OP- 开头的密钥，执行身份恢复逻辑
                    if (input.toUpperCase().startsWith('OP-')) {
                        const { data, error } = await supabaseClient
                            .from('users')
                            .select('*')
                            .eq('id', input.toUpperCase())
                            .single();
                        
                        if (data) {
                            deviceId = data.id;
                            localStorage.setItem('tf141_device_id', deviceId);
                            currentUser = data;
                            await SysModal.alert(`欢迎回来，${currentUser.nickname}。权限级别已恢复。`, "IDENTITY CONFIRMED // 身份确认");
                        } else {
                            await SysModal.alert("数据库中未找到该终端密钥，系统将重新初始化。", "✕ INVALID KEY // 密钥无效");
                            localStorage.removeItem('tf141_device_id');
                            return initIdentity(); 
                        }
                    } else {
                        // 💥 核心修复：输入的是普通代号，触发邀请码拦截！
                        const inviteCode = await SysModal.prompt("【安全验证】\n检测到您正在注册新终端。\n请输入星际网络接入许可码（邀请码）：\n（请在群公告或群文件中获取）", "", "🔒 SECURITY CHECK");
                        
                        // 这里的 "DS2240" 就是邀请码，你可以随意修改成你想要的密码！
                        if (inviteCode !== "DS2240") {
                            await SysModal.alert("许可码无效，连接被强制切断。\n如果您是老用户，请确保输入了正确的 OP- 密钥。", "✕ ACCESS DENIED");
                            currentUser = { id: 'GUEST', nickname: '游客', role: 'guest' };
                        } else {
                            // 邀请码正确，执行新用户注册逻辑
                            deviceId = 'OP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
                            localStorage.setItem('tf141_device_id', deviceId);

                            const { data } = await supabaseClient
                                .from('users')
                                .insert([{ id: deviceId, nickname: input, role: 'user' }])
                                .select();
                            
                            if(data) {
                                currentUser = data[0];
                                await SysModal.alert(`欢迎接入泛星网络，${input}。\n\n⚠️ 请务必截图或牢记您的专属终端密钥：\n【 ${deviceId} 】\n\n在其他设备上输入此密钥即可恢复您的身份与档案！`, "REGISTRATION SUCCESS // 注册成功");
                            }
                        }
                    }
                }
            } else {
                // 设备里已经有密钥了，直接登录
                const { data } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('id', deviceId)
                    .single();
                
                if (data) {
                    currentUser = data;
                } else {
                    localStorage.removeItem('tf141_device_id');
                    return initIdentity();
                }
            }
            
            // 💥 更新右上角身份状态栏 (使用科幻 SVG 铃铛)
            const statusContainer = document.querySelector('.lang-text');
            if (currentUser.role === 'guest') {
                // 游客状态
                statusContainer.innerHTML = `
                    <span class="op-key-text" style="color: #8bb9d6;"><span class="hide-on-mobile">OP: </span>GUEST<span class="hide-on-mobile"> [UNREGISTERED]</span></span>
                    <span class="logout-btn" title="注册或登录终端">⏻登录</span>
                `;
            } else {
                // 正式公民状态 (加入防截图隐藏密钥功能)
                const keyDisplay = window.isKeyVisible ? currentUser.id : '********';
                const eyeSvg = window.isKeyVisible 
                    ? `<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor;"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`
                    : `<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor;"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.28 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;

                statusContainer.innerHTML = `
                    <div id="notif-wrapper" style="position: relative; display: flex; align-items: center; margin-right: 15px;">
                        <span id="notif-bell" style="cursor: pointer; position: relative; color: #12a8ff; filter: drop-shadow(0 0 5px rgba(18,168,255,0.6)); display: flex; align-items: center;" title="消息提示" onclick="toggleNotifications(event)">
                            <svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: currentColor; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span id="notif-badge" style="display:none; position:absolute; top:-6px; right:-6px; background:#f44336; color:#fff; font-size:10px; padding:1px 4px; border-radius:8px; font-family:monospace; box-shadow:0 0 5px #f44336; line-height:1;">0</span>
                        </span>
                        <div id="notif-dropdown" class="notif-dropdown-box">
                            <div style="color:#8bb9d6; font-size:12px; text-align:center;">[ 暂无新消息 ]</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span class="op-key-text" title="点击一键复制密钥" onclick="copyOpKey('${currentUser.id}')" style="cursor: pointer; transition: 0.2s;" onmouseover="this.style.color='#fff'; this.style.textShadow='0 0 8px #12a8ff'" onmouseout="this.style.color=''; this.style.textShadow='none'">
                            <span class="hide-on-mobile">OP: </span><span class="nav-nickname">${currentUser.nickname}</span><span class="hide-on-mobile" id="top-secret-key"> [${keyDisplay}]</span>
                        </span>
                        <span onclick="toggleKeyVisibility(event)" style="cursor: pointer; color: #12a8ff; display: flex; align-items: center; opacity: 0.7; transition: 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" title="显示/隐藏密钥" id="top-key-toggle-icon">
                            ${eyeSvg}
                        </span>
                    </div>
                    <span class="logout-btn" title="断开终端连接" style="margin-left: 10px;">⏻退出</span>
                `;
            }
            
            // 💥 绑定右上角按钮的点击事件
            document.querySelector('.logout-btn').onclick = async function() {
                if (currentUser.role === 'guest') {
                    // 游客点击登录，直接刷新页面重新弹窗
                    location.reload(); 
                } else {
                    const msg = `即将断开当前公民的终端连接。\n请确保您已妥善保管当前密钥：【 ${currentUser.id} 】\n\n确认断开并切换身份吗？`;
                    const isSure = await SysModal.confirm(msg, "TERMINAL DISCONNECT // 断开连接");
                    if (isSure) {
                        localStorage.removeItem('tf141_device_id');
                        location.reload(); 
                    }
                }
            };

            fetchCloudData();
            fetchArticles(); 

            // 如果是管理员，解锁侧边栏的控制台入口
            if (currentUser && ['admin', 'super_admin'].includes(currentUser?.role)) {
                const adminMenu = document.getElementById('adminMenuWrapper');
                if (adminMenu) adminMenu.style.display = 'block';
                
                // 管理员：解除防复制限制
                document.body.classList.remove('secure-no-select');
            } else {
                // 非管理员/游客：开启全局防复制模式
                document.body.classList.add('secure-no-select');
            }
        } // <-- 这是 initIdentity 函数原本的结尾大括号

        let pendingDB = []; // 专门存待审核的档案
        let editingCharId = null; // 💥 新增：记录当前正在修改的档案 ID

        // 💥 新增：军事狗牌 ID 生成引擎 (例如: PSC-SSA-23783)
        window.getDogTag = function(char) {
            if (!char) return "UNK-00000";
            
            // 1. 提取阵营代号 (3个字母)
            let fCode = "UNK";
            if (char.faction) {
                if (char.faction.includes("联盟")) fCode = "PSC";
                else if (char.faction.includes("外环")) fCode = "FNT";
                else if (char.faction.includes("承包商")) fCode = "PMC";
                else if (char.faction.includes("自由港") || char.faction.includes("空间站")) fCode = "FRP";
                else if (char.faction.includes("独立")) fCode = "IND";
            }
            
            // 2. 提取组织代号 (优先取英文缩写，没有则用哈希算法生成3个字母)
            let oCode = "XXX";
            if (char.organization) {
                const match = char.organization.match(/[A-Za-z0-9]{3,}/);
                if (match) {
                    oCode = match[0].substring(0, 3).toUpperCase();
                } else {
                    let oHash = 0;
                    for (let i = 0; i < char.organization.length; i++) {
                        oHash = ((oHash << 5) - oHash) + char.organization.charCodeAt(i);
                        oHash |= 0;
                    }
                    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                    oCode = letters[Math.abs(oHash) % 26] + letters[Math.abs(oHash >> 2) % 26] + letters[Math.abs(oHash >> 4) % 26];
                }
            }
            
            // 3. 提取唯一编号 (将数据库的 UUID 转换为固定的 5 位数字)
            let hash = 0;
            const strId = String(char.id || Math.random());
            for (let i = 0; i < strId.length; i++) {
                hash = ((hash << 5) - hash) + strId.charCodeAt(i);
                hash |= 0;
            }
            const num = String(Math.abs(hash)).slice(0, 5).padStart(5, '0');
            
            return `${fCode}-${oCode}-${num}`;
        };

        // 3. 从云端拉取数据 (分类处理)
        async function fetchCloudData() {
            const grid = document.getElementById('roster-grid');
            grid.innerHTML = window.getCyberLoaderHTML('正在连接卫星获取档案...', '#12a8ff');
            
            try {
                // 一次性把所有档案拉下来
                const { data, error } = await supabaseClient.from('characters').select('*');
                if (error) throw error;
                
                // 分流：正式库 vs 待审核库
                characterDB = data.filter(c => c.status === 'approved');
                pendingDB = data.filter(c => c.status === 'pending' || c.status === 'rejected');
                
                renderRoster();  // ✅ 改回正确的拼写
                init3DTunnel();  // 渲染 3D 隧道
                renderQueue();   // 渲染战术等候室
                renderProfile(); // 渲染个人终端主页
                
                // 👇👇👇 加上这三行：如果刷新时停留在论坛，数据拉完后自动唤醒论坛 👇👇👇
                if (document.getElementById('forumView').classList.contains('active')) {
                    if (typeof initForum === 'function') initForum();
                }
// 👇👇👇 加上这行代码 👇👇👇
                updateSearchIndex(); // 数据拉取完毕，更新全局搜索索引
                
            } catch (error) {
                console.error("卫星连接失败:", error);
                grid.innerHTML = '<div style="color:#f44336;">[ ✕ ERROR: 无法连接到情报服务器 ]</div>';
            }

        // 👇👇👇 加上这三行：如果刷新时停留在论坛，数据拉完后自动唤醒论坛 👇👇👇
                if (document.getElementById('forumView').classList.contains('active')) {
                    if (typeof initForum === 'function') initForum();
                }
                updateSearchIndex(); // 数据拉取完毕，更新全局搜索索引
                if (typeof checkNotifications === 'function') checkNotifications(); // 💥 检查新消息提示
        
        }

        // 💥 渲染战术等候室
        function renderQueue() {
            const board = document.getElementById('queue-status-board');
            const grid = document.getElementById('queue-grid');
            grid.innerHTML = '';

            const myPending = pendingDB.filter(c => c.owner_id === currentUser.id);

            // 看板提示语 (温和显眼的综合通知面板，使用纯扁平化 SVG 图标)
            const iconInfo = `<svg viewBox="0 0 24 24" style="width: 22px; height: 22px; fill: #12a8ff; margin-right: 8px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`;
            const iconPass = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor; margin-right: 6px;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
            const iconPend = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor; margin-right: 6px;"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`;
            const iconFail = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor; margin-right: 6px;"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;

            let notifyHtml = `
                <div style="background: rgba(18, 168, 255, 0.05); border: 1px solid rgba(18, 168, 255, 0.3); border-left: 4px solid #12a8ff; padding: 20px; border-radius: 6px; margin-bottom: 25px; box-shadow: inset 0 0 20px rgba(18, 168, 255, 0.05);">
                    <div style="color: #e0f2fe; font-size: 16px; margin-bottom: 12px; display: flex; align-items: center; font-weight: bold; letter-spacing: 1px;">
                        ${iconInfo}
                        亲爱的 ${currentUser?.nickname || '公民'}，欢迎来到办事大厅
                    </div>
                    <div style="color: #8bb9d6; font-size: 14px; line-height: 1.8; margin-bottom: 15px;">
                        我们会在处理完毕后第一时间于此反馈您的各项申请结果。请随时关注档案状态，若有需要修改的地方，您可以点击详情查看管理员的批注意见。
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px; padding-top: 15px; border-top: 1px dashed rgba(18, 168, 255, 0.3);">
            `;

            if (['admin', 'super_admin'].includes(currentUser?.role)) {
                // 管理员视角的统计
                const orgsCount = (typeof pendingOrgsDB !== 'undefined' ? pendingOrgsDB.length : 0);
                notifyHtml += `
                    <div style="color:#ffeb3b; display:flex; align-items:flex-start; font-family:monospace;">
                        <div style="flex-shrink:0; padding-top:2px;">${iconPend}</div>
                        <span>[ 管理员模式 ] 正在待命：人设待审核 ${pendingDB.length} 份，组织创立待审核 ${orgsCount} 份。</span>
                    </div>
                `;
            } else {
                // 普通用户视角的各项进度统计
                const myApprovedChar = characterDB.filter(c => c.owner_id === currentUser.id);
                const myPendingOrgs = (typeof pendingOrgsDB !== 'undefined' ? pendingOrgsDB : []).filter(o => o.owner_id === currentUser.id);
                const myApprovedOrgs = (articlesDB || []).filter(o => o.type === 'org' && o.owner_id === currentUser.id);

                const getStatusLine = (label, pendingArr, approvedArr) => {
                    if (pendingArr.length > 0) {
                        const item = pendingArr[0];
                        if (item.status === 'rejected') {
                            return `<div style="color: #f44336; display: flex; align-items: flex-start;"><div style="flex-shrink:0; padding-top:2px;">${iconFail}</div><span>您的 <strong>${label}</strong> 已被退回，请点击下方您的档案查看修改建议。</span></div>`;
                        } else {
                            return `<div style="color: #ffeb3b; display: flex; align-items: flex-start;"><div style="flex-shrink:0; padding-top:2px;">${iconPend}</div><span>您的 <strong>${label}</strong> 正在排队审核中，请耐心等候哦。</span></div>`;
                        }
                    } else if (approvedArr.length > 0) {
                        return `<div style="color: #4caf50; display: flex; align-items: flex-start;"><div style="flex-shrink:0; padding-top:2px;">${iconPass}</div><span>好消息！您的 <strong>${label}</strong> 已顺利通过并归档。</span></div>`;
                    } else {
                        return `<div style="color: #8bb9d6; display: flex; align-items: flex-start; opacity: 0.8;"><div style="flex-shrink:0; padding-top:2px;">${iconPend}</div><span>您暂未提交 <strong>${label}</strong>。</span></div>`;
                    }
                };

                notifyHtml += getStatusLine('公民个人档案', myPending, myApprovedChar);

                if (myPendingOrgs.length > 0 || myApprovedOrgs.length > 0) {
                    myPendingOrgs.forEach(o => notifyHtml += getStatusLine(`组织创立申请 [${o.title}]`, [o], []));
                    myApprovedOrgs.forEach(o => notifyHtml += getStatusLine(`创立的组织 [${o.title}]`, [], [o]));
                } else {
                    notifyHtml += `<div style="color: #8bb9d6; display: flex; align-items: flex-start; opacity: 0.8;"><div style="flex-shrink:0; padding-top:2px;">${iconPend}</div><span>您暂未提交组织创立申请。</span></div>`;
                }
            }

            notifyHtml += `</div></div>`;
            board.innerHTML = notifyHtml;

            // 渲染排队按钮
            pendingDB.forEach((char) => {
                const btn = document.createElement('button');
                btn.className = 'roster-btn';
                
                if (['admin', 'super_admin'].includes(currentUser?.role) || char.owner_id === currentUser.id) {
                    btn.style.borderColor = char.status === 'rejected' ? '#f44336' : '#ffeb3b';
                    btn.style.color = char.status === 'rejected' ? '#f44336' : '#ffeb3b';
                    let prefixTag = '';
                    if (char.status === 'pending') prefixTag = '待审核';
                    else if (char.status === 'rejected') prefixTag = '已退回';
                    else if (char.status === 'approved') prefixTag = '已通过';

                    if (char.target_edit_id) {
                        prefixTag = "修改申请"; 
                        btn.style.boxShadow = "inset 0 0 10px rgba(18, 168, 255, 0.4)"; 
                    }

                    // 💥 核心新增：仅管理员可见的机密信息尾巴
                    let adminInfo = '';
                    if (['admin', 'super_admin'].includes(currentUser?.role)) {
                        const timeStr = new Date(char.updated_at || char.created_at || Date.now()).toLocaleString();
                        const isRevision = !!char.target_edit_id;
                        const auditCount = (char.review_comments && char.review_comments.audit_count) ? char.review_comments.audit_count : 0;
                        adminInfo = `<div style="font-size: 10px; color: #8bb9d6; margin-top: 4px; font-family: monospace; font-weight: normal;">${timeStr} | 驳回: ${auditCount}次 ${isRevision ? '<span style="color:#ff9800; margin-left:5px;">[老卡修改]</span>' : ''}</div>`;
                        btn.style.display = 'flex';
                        btn.style.flexDirection = 'column';
                        btn.style.alignItems = 'flex-start';
                    }

                    btn.innerHTML = `<div style="font-weight:bold;">[${prefixTag}] ${char.name}</div>${adminInfo}`;
                    btn.onclick = () => showQueueDetail(char);
                }else {
                    // 其他群友：只能看到加密的占位符，不能点开
                    btn.style.opacity = '0.4';
                    btn.style.borderColor = '#666';
                    btn.style.color = '#888';
                    btn.innerHTML = `[已加密] ${char.name}`;
                    btn.onclick = () => SysModal.alert("审核中的人设仅管理员与提交者本人可查看。", "访问拒绝");
                }
                grid.appendChild(btn);
            });
            // 👇 直接在这里接上组织创立排队列表的渲染逻辑
    const orgGrid = document.getElementById('queue-org-grid');
    if (!orgGrid) return;
    orgGrid.innerHTML = '';

    if (typeof pendingOrgsDB === 'undefined' || pendingOrgsDB.length === 0) {
        orgGrid.innerHTML = '<div style="color:#8bc34a; font-size:12px;">[ 当前无组织创立申请 ]</div>';
        return;
    }

    const svgOrg = `<svg viewBox="0 0 24 24" style="width: 1.1em; height: 1.1em; fill: currentColor; vertical-align: middle; margin-top: -2px; margin-right: 4px;"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>`;

    pendingOrgsDB.forEach(org => {
        const btn = document.createElement('button');
        btn.className = 'roster-btn';
        
        if (['admin', 'super_admin'].includes(currentUser?.role) || org.owner_id === currentUser.id) {
            btn.style.borderColor = org.status === 'rejected' ? '#f44336' : '#8bc34a';
            btn.style.color = org.status === 'rejected' ? '#f44336' : '#8bc34a';
            let prefixTag = '';
            if (org.status === 'pending') prefixTag = '待审核';
            else if (org.status === 'rejected') prefixTag = '已退回';
            else if (org.status === 'approved') prefixTag = '已通过';

            if (org.target_edit_id) {
                prefixTag = "修改申请"; 
                btn.style.boxShadow = "inset 0 0 10px rgba(139, 195, 74, 0.4)";
            }

            // 💥 核心新增：仅管理员可见的机密信息尾巴
            let adminInfoOrg = '';
            if (['admin', 'super_admin'].includes(currentUser?.role)) {
                const timeStr = new Date(org.updated_at || org.created_at || Date.now()).toLocaleString();
                const isRevision = !!org.target_edit_id;
                let reviewObj = org.review_comments;
                if (typeof reviewObj === 'string') { try { reviewObj = JSON.parse(reviewObj); } catch(e) {} }
                const auditCount = (reviewObj && reviewObj.audit_count) ? reviewObj.audit_count : 0;
                adminInfoOrg = `<div style="font-size: 10px; color: #8bb9d6; margin-top: 4px; font-family: monospace; font-weight: normal;">${timeStr} | 驳回: ${auditCount}次 ${isRevision ? '<span style="color:#ff9800; margin-left:5px;">[老组织修改]</span>' : ''}</div>`;
                btn.style.display = 'flex';
                btn.style.flexDirection = 'column';
                btn.style.alignItems = 'flex-start';
            }

            btn.innerHTML = `<div style="font-weight:bold;">[${prefixTag}] ${svgOrg} ${org.title}</div>${adminInfoOrg}`;
            btn.onclick = () => showOrgQueueDetail(org);
        } else {
            btn.style.opacity = '0.4';
            btn.style.borderColor = '#666';
            btn.style.color = '#888';
            btn.innerHTML = `[已加密] ${svgOrg} ${org.title}`;
            btn.onclick = () => SysModal.alert("审核中的组织仅管理员与提交者本人可查看。", "访问拒绝");
        }
        orgGrid.appendChild(btn);
    });
} // <-- 这是 renderQueue 函数的结尾大括号

        // 💥 渲染个人终端主页 (终极修复版：支持无档案显示组织)
        function renderProfile() {
            const container = document.getElementById('profile-content');
            if (!container) return;

            let myChar = characterDB.find(c => c.owner_id === currentUser.id);
            if (!myChar) {
                myChar = pendingDB.find(c => c.owner_id === currentUser.id);
            }

            // 💥 抓取该玩家名下所有组织 (无论有没有个人档案都要抓)
            const myOrgs = articlesDB.filter(a => a.type === 'org' && a.owner_id === currentUser.id);
            let myOrgsHtml = '';
            const svgOrg = `<svg viewBox="0 0 24 24" style="width: 1.2em; height: 1.2em; fill: currentColor; vertical-align: middle; margin-top: -2px; margin-right: 2px;"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>`;
            
            if (myOrgs.length > 0) {
                myOrgsHtml = `<div style="margin-top: 20px; border-top: 1px dashed #12a8ff; padding-top: 15px;">
                    <h4 style="color: #12a8ff; margin-bottom: 10px; font-family: monospace; font-size: 14px;">[ ${svgOrg} 我管理的组织档案 ]</h4>
                    <div class="my-orgs-grid">`;
                myOrgs.forEach(org => {
                    myOrgsHtml += `<div class="my-org-card">
                        <div class="my-org-info">
                            <span class="my-org-icon" style="display: flex; align-items: center;">${org.icon || svgOrg}</span>
                            <strong class="my-org-name">${org.title}</strong>
                        </div>
                        <div class="my-org-actions">
                            <button class="sys-modal-btn confirm my-org-action-btn" onclick="openArticleById('${org.id}')">[ 查看组织 ]</button>
                            <button class="sys-modal-btn confirm my-org-action-btn" onclick="editMyOrg('${org.id}')">[ 修改档案 ]</button>
                        </div>
                    </div>`;
                });
                myOrgsHtml += `</div></div>`;
            }

            // 💥 状态 1：如果完全没有个人档案，但要把组织列表显示出来！
            if (!myChar) {
                container.innerHTML = `
                    <div class="profile-card" style="justify-content: center; align-items: center; text-align: center; min-height: 300px; border-color: #666; flex-direction: column;">
                        <div>
                            <div style="font-size: 48px; margin-bottom: 20px; filter: grayscale(1);">👤</div>
                            <h3 style="color: #8bb9d6; font-family: monospace; letter-spacing: 2px; margin-bottom: 10px;">
                                OP: ${currentUser.nickname} 
                                <span onclick="changeTerminalName()" style="color: #12a8ff; cursor: pointer; font-size: 14px; margin-left: 10px; text-decoration: underline; text-underline-offset: 3px;">[改名]</span>
                            </h3>
                            <p style="color: #666; margin-bottom: 20px;">您尚未在终端录入任何个人数据。</p>
                            <button class="submit-btn" onclick="openView('queueView')">[ 前往办事大厅 ]</button>
                            <div style="margin-top: 25px;">
                                <span onclick="destroyAccount()" style="color: #f44336; cursor: pointer; font-size: 13px; text-decoration: underline; text-underline-offset: 3px; font-family: monospace;">[ 永久注销账号 ]</span>
                            </div>
                        </div>
                        <div style="width: 100%; text-align: left;">
                            ${myOrgsHtml}
                        </div>
                    </div>
                `;
                return;
            }

            let statusClass = 'status-approved';
            let statusText = '审核通过';
            let themeColor = '#12a8ff'; 
            let rgbColor = '18, 168, 255';

            if (myChar.status === 'pending') {
                statusClass = 'status-pending';
                statusText = '审核中';
                themeColor = '#ffeb3b';
                rgbColor = '255, 235, 59';
            } else if (myChar.status === 'rejected') {
                statusClass = 'status-rejected';
                statusText = '已退回';
                themeColor = '#f44336';
                rgbColor = '244, 67, 54';
            }

            const avatarLetter = myChar.callsign ? myChar.callsign.charAt(0).toUpperCase() : '?';

            // 💥 渲染真实头像
            const avatarContent = myChar.avatar_url ? `<img src="${myChar.avatar_url}" style="width:100%; height:100%; object-fit:cover;">` : avatarLetter;
            
            // 💥 如果是本人，允许点击修改
            const avatarClickAttr = myChar.owner_id === currentUser.id ? `onclick="openAvatarUploader('profile')" style="cursor:pointer;" title="点击修改证件照"` : '';


            let feedbackHtml = '';
            if (myChar.status === 'rejected' && myChar.review_comments) {
                let listHtml = '';
                if (myChar.review_comments.fields) {
                    for (const key in myChar.review_comments.fields) {
                        listHtml += `<li style="margin-bottom: 4px;"><strong style="color:#f44336;">[${myChar.review_comments.fields[key].label}]</strong>: ${myChar.review_comments.fields[key].text}</li>`;
                    }
                }
                let summaryText = typeof myChar.review_comments.general === 'string' ? myChar.review_comments.general : '';
                
                feedbackHtml = `
                    <div class="system-notice" style="border-color:#f44336; background: rgba(244,67,54,0.1); margin-top: 15px;">
                        <div style="color: #f44336; font-weight: bold; margin-bottom: 8px; font-family: monospace;">[ 管理员批注 ]</div>
                        ${listHtml ? `<ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #ffb4a9;">${listHtml}</ul>` : ''}
                        ${summaryText ? `<div style="margin-top:8px; border-top:1px dashed rgba(244,67,54,0.4); padding-top:8px; color:#fff;"><strong>总结：</strong>${summaryText}</div>` : ''}
                        <div style="margin-top: 15px; display: flex; gap: 10px;">
                            <button class="sys-modal-btn confirm" onclick="editQueueChar('${myChar.id}')">[ 修改档案 ]</button>
                            <button class="sys-modal-btn cancel" onclick="deleteQueueChar('${myChar.id}')">[ 永久删除 ]</button>
                        </div>
                    </div>
                `;
            } else if (myChar.status === 'pending') {
                feedbackHtml = `
                    <div class="system-notice" style="border-color:#ffeb3b; background: rgba(255,235,59,0.05); margin-top: 15px;">
                        <div style="color: #ffeb3b; font-weight: bold; font-family: monospace;">[ 等待管理员审核 ]</div>
                        <p style="color: #ccc; font-size: 13px; margin-top: 5px;">您的人设已提交，请耐心等待审核，在此期间您可以撤回修改。</p>
                        <button class="sys-modal-btn confirm" style="margin-top: 10px;" onclick="editQueueChar('${myChar.id}')">[ 撤回修改 ]</button>
                    </div>
                `;
            }

            // 💥 组装公开档案 Tab
            let publicHtml = `
                <div class="form-grid" style="gap: 10px;">
                    <div class="detail-item"><span class="detail-lbl">所属阵营:</span> ${renderDualTag(myChar, 'faction', 'hidden_faction', false)}</div>
                    <div class="detail-item"><span class="detail-lbl">所属组织:</span> ${renderDualTag(myChar, 'organization', 'hidden_org', true)}</div>
                    <div class="detail-item"><span class="detail-lbl">职位/职业:</span> ${renderDual(myChar, 'occupation', 'hidden_occupation')}</div>
                    <div class="detail-item"><span class="detail-lbl">籍贯:</span> ${renderDual(myChar, 'hometown', 'hidden_hometown')}</div>
                </div>
                
                <div class="form-grid-3 profile-stats-box">
                    <div class="detail-item"><span class="detail-lbl">性别:</span> ${myChar.gender}</div>
                    <div class="detail-item"><span class="detail-lbl">性别备注:</span> ${myChar.gender_notes || 'N/A'}</div>
                    <div class="detail-item"><span class="detail-lbl">年龄:</span> ${myChar.age}</div>
                    <div class="detail-item"><span class="detail-lbl">性取向:</span> ${myChar.orientation || 'N/A'}</div>
                    <div class="detail-item"><span class="detail-lbl">属性:</span> ${myChar.role || 'N/A'}</div>
                    <div class="detail-item"><span class="detail-lbl">血型:</span> ${myChar.blood}</div>
                    <div class="detail-item"><span class="detail-lbl">身高:</span> ${myChar.height}</div>
                    <div class="detail-item"><span class="detail-lbl">体重:</span> ${myChar.weight}</div>
                    <div class="detail-item"><span class="detail-lbl">出生日期:</span> ${myChar.dob}</div>
                </div>
                
                ${feedbackHtml}
                
                ${myChar.status === 'approved' ? `
                    <div class="detail-text-block mt-15"><span class="detail-lbl">外貌:</span><br>${myChar.appearance}</div>
                    <div class="detail-text-block"><span class="detail-lbl">性格:</span><br>${myChar.personality}</div>
                    <div class="detail-text-block"><span class="detail-lbl">备注 NOTES:</span><br>${renderDual(myChar, 'notes', 'hidden_notes')}</div>
                    <div class="detail-text-block"><span class="detail-lbl">公开关系网:</span><br>${window.formatFamilyTies(myChar.family_ties)}</div>
                    
                    <div class="detail-action-row" style="border-top: 1px dashed rgba(18,168,255,0.3); padding-top: 15px;">
                        <button class="sys-modal-btn confirm profile-update-btn" onclick="editQueueChar('${myChar.id}')">[ 提交公开档案修改申请 ]</button>
                    </div>
                ` : ''}
            `;

            // 💥 组装私密设定 Tab (分展示模式和编辑模式)
            let privateHtml = '';
            if (myChar.status === 'approved') {
                // 1. 展示模式 HTML
                let privViewHtml = `
                    <div id="priv-view-mode" style="display: block; margin-top: 10px;">
                        <div style="color: #ffeb3b; font-family: monospace; margin-bottom: 15px; font-weight: bold; font-size: 13px;">[ 以下内容仅您自己可见 ]</div>
                        
                        ${myChar.relationships ? `<div class="detail-text-block secret-note-box"><span class="detail-lbl text-cyber-yellow">人物关系:</span><br><span class="text-cyber-yellow" style="white-space: pre-wrap;">${myChar.relationships}</span></div>` : '<div class="detail-text-block secret-note-box"><span class="detail-lbl text-cyber-yellow">人物关系:</span><br><span style="color:#8bb9d6; font-size:12px;">[ 暂无记录 ]</span></div>'}
                        
                        ${myChar.history ? `<div class="detail-text-block secret-note-box"><span class="detail-lbl text-cyber-yellow">角色历史:</span><br><span class="text-cyber-yellow" style="white-space: pre-wrap;">${myChar.history}</span></div>` : '<div class="detail-text-block secret-note-box"><span class="detail-lbl text-cyber-yellow">角色历史:</span><br><span style="color:#8bb9d6; font-size:12px;">[ 暂无记录 ]</span></div>'}
                        
                        ${myChar.biography ? `<div class="detail-text-block secret-note-box"><span class="detail-lbl text-cyber-yellow">个人小传:</span><br><span class="text-cyber-yellow" style="white-space: pre-wrap;">${myChar.biography}</span></div>` : '<div class="detail-text-block secret-note-box"><span class="detail-lbl text-cyber-yellow">个人小传:</span><br><span style="color:#8bb9d6; font-size:12px;">[ 暂无记录 ]</span></div>'}
                        
                        ${myChar.secret_notes ? `<div class="detail-text-block secret-note-box"><span class="detail-lbl text-cyber-yellow">隐藏备注:</span><br><span class="text-cyber-yellow" style="white-space: pre-wrap;">${myChar.secret_notes}</span></div>` : '<div class="detail-text-block secret-note-box"><span class="detail-lbl text-cyber-yellow">隐藏备注:</span><br><span style="color:#8bb9d6; font-size:12px;">[ 暂无记录 ]</span></div>'}

                        <div class="detail-action-row" style="border-top: 1px dashed rgba(255,235,59,0.3); padding-top: 15px; margin-top: 15px;">
                            <button class="sys-modal-btn confirm" style="color: #ffeb3b; border-color: #ffeb3b;" onclick="document.getElementById('priv-view-mode').style.display='none'; document.getElementById('priv-edit-mode').style.display='block';">[ 编辑其他设定 ]</button>
                        </div>
                    </div>
                `;

                // 2. 编辑模式 HTML
                let privEditHtml = `
                    <div id="priv-edit-mode" style="display: none; background: rgba(255,235,59,0.05); border: 1px solid rgba(255,235,59,0.3); padding: 20px; border-radius: 4px; margin-top: 10px;">
                        <div style="color: #ffeb3b; font-family: monospace; margin-bottom: 15px; font-weight: bold; font-size: 13px;">[ 编辑模式 ]</div>
                        
                        <div class="input-group full-width" style="margin-bottom: 15px;">
                            <label style="color: #ffeb3b; font-size: 12px; margin-bottom: 5px; display: block;">人物关系</label>
                            <textarea id="priv-relationships" style="width: 100%; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,235,59,0.4); color: #fff; padding: 10px; font-family: 'PingFang SC', sans-serif; resize: vertical; min-height: 60px; outline: none;" placeholder="记录与其他角色的关系、羁绊、仇恨等...">${myChar.relationships || ''}</textarea>
                        </div>
                        
                        <div class="input-group full-width" style="margin-bottom: 15px;">
                            <label style="color: #ffeb3b; font-size: 12px; margin-bottom: 5px; display: block;">角色历史</label>
                            <textarea id="priv-history" style="width: 100%; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,235,59,0.4); color: #fff; padding: 10px; font-family: 'PingFang SC', sans-serif; resize: vertical; min-height: 80px; outline: none;" placeholder="角色过去经历的重大事件、时间线...">${myChar.history || ''}</textarea>
                        </div>
                        
                        <div class="input-group full-width" style="margin-bottom: 15px;">
                            <label style="color: #ffeb3b; font-size: 12px; margin-bottom: 5px; display: block;">个人小传</label>
                            <textarea id="priv-biography" style="width: 100%; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,235,59,0.4); color: #fff; padding: 10px; font-family: 'PingFang SC', sans-serif; resize: vertical; min-height: 100px; outline: none;" placeholder="角色的详细生平、内心独白、核心动机...">${myChar.biography || ''}</textarea>
                        </div>

                        <div class="input-group full-width" style="margin-bottom: 15px;">
                            <label style="color: #ffeb3b; font-size: 12px; margin-bottom: 5px; display: block;">其他备注</label>
                            <textarea id="priv-secret-notes" style="width: 100%; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,235,59,0.4); color: #fff; padding: 10px; font-family: 'PingFang SC', sans-serif; resize: vertical; min-height: 60px; outline: none;" placeholder="其他相关的设定...">${myChar.secret_notes || ''}</textarea>
                        </div>

                        <div style="display: flex; gap: 10px; margin-top: 5px;">
                            <button class="submit-btn" style="flex: 1; color: #060b14; background: #ffeb3b; border-color: #ffeb3b; font-weight: bold; margin: 0;" onclick="savePrivateLore('${myChar.id}')">[ 保存其他设定 ]</button>
                            <button class="sys-modal-btn cancel" style="padding: 0 15px; margin: 0;" onclick="document.getElementById('priv-edit-mode').style.display='none'; document.getElementById('priv-view-mode').style.display='block';">[ 取消 ]</button>
                        </div>
                    </div>
                `;

                privateHtml = privViewHtml + privEditHtml;
            } else {
                privateHtml = `<div style="color: #8bb9d6; font-family: monospace; padding: 30px; text-align: center; border: 1px dashed rgba(255,235,59,0.3); background: rgba(255,235,59,0.05); margin-top: 10px;">[ 档案通过审核后方可解锁其他设定功能 ]</div>`;
            }

            // 💥 状态 2：组装完整的 ID 卡片 (加入 Tab 切换)
            container.innerHTML = `
                <div class="profile-card" style="border-color: ${themeColor}; box-shadow: inset 0 0 30px rgba(${rgbColor}, 0.1);">
                    <div class="profile-avatar-section">
                        <div class="avatar-placeholder" style="border-color: ${themeColor}; color: ${themeColor}; text-shadow: 0 0 15px ${themeColor}; overflow: hidden;" ${avatarClickAttr}>
                            ${avatarContent}
                        </div>
                        <div class="profile-status-badge ${statusClass}">${statusText}</div>
                        <div class="profile-meta-text">
                            OP: ${currentUser.nickname} <span onclick="changeTerminalName()" class="profile-rename-btn">[改名]</span><br>
                            KEY: ${currentUser.id}<br>
                            UPLINK: SECURE<br>
                            <span onclick="togglePrivacy('${myChar.id}', ${myChar.is_private || false})" style="color: ${myChar.is_private ? '#ff9800' : '#8bb9d6'}; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; display: inline-block; margin-top: 12px; font-weight: bold;">${myChar.is_private ? '[ 已设为私密 (点击公开) ]' : '[ 设为私密档案 ]'}</span><br>
                            <span onclick="destroyAccount()" style="color: #f44336; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; display: inline-block; margin-top: 12px; font-weight: bold;">[ 永久注销账号 ]</span>
                        </div>
                    </div>
                    
                    <div class="profile-details-section">
                        <div class="profile-title-box" style="border-bottom-color: ${themeColor};">
                            <h1 style="text-shadow: 0 0 10px ${themeColor};">
                                ${renderDual(myChar, 'name', 'hidden_name')} ${getDecryptBtn(myChar)}
                            </h1>
                            <div class="profile-callsign" style="color: ${themeColor};">代号/呼号: ${renderDual(myChar, 'callsign', 'hidden_callsign')}</div>
                        </div>
                        
                        <!-- 💥 新增：个人终端 Tab 切换栏 -->
                        <div class="profile-tabs">
                            <button class="profile-tab-btn active" data-tab="ptab-public" onclick="switchProfileTab('ptab-public')">公开档案</button>
                            <button class="profile-tab-btn" data-tab="ptab-private" onclick="switchProfileTab('ptab-private')" style="color: #ffeb3b; border-color: rgba(255,235,59,0.3);">其他设定</button>
                        </div>
                        
                        <div id="ptab-public" class="profile-tab-content active">
                            ${publicHtml}
                        </div>
                        
                        <div id="ptab-private" class="profile-tab-content">
                            ${privateHtml}
                        </div>
                        
                        ${myOrgsHtml}
                    </div>
                </div>
            `;
        }

        // 💥 新增：管理员批注状态管线
        window.currentAdminAnnotations = {};

        window.addAnnotation = async function(key, label) {
            const currentNote = window.currentAdminAnnotations[key] ? window.currentAdminAnnotations[key].text : '';
            const note = await SysModal.prompt(`请输入对【${label}】的修改意见：`, currentNote, "添加批注");
            
            if (note !== null) {
                if (note.trim() === '') {
                    delete window.currentAdminAnnotations[key]; // 为空则删除该批注
                } else {
                    window.currentAdminAnnotations[key] = { label, text: note.trim() };
                }
                refreshAnnotationList();
            }
        };

        window.refreshAnnotationList = function() {
            const listDiv = document.getElementById('annotation-list');
            if (!listDiv) return;
            const keys = Object.keys(window.currentAdminAnnotations);
            
            if (keys.length === 0) {
                listDiv.innerHTML = '<div style="opacity:0.5;">(点击各属性旁边的 [+] 进行针对性批注)</div>';
                return;
            }
            
            let html = '';
            keys.forEach(k => {
                const item = window.currentAdminAnnotations[k];
                html += `<div style="margin-bottom: 6px; padding: 6px; border-left: 2px solid #f44336; background: rgba(244,67,54,0.1); display: flex; justify-content: space-between;">
                    <span><strong style="color:#f44336;">[${item.label}]</strong> - ${item.text}</span>
                    <span style="color:#f44336; cursor:pointer; font-size:12px; font-weight:bold; padding-left: 10px;" onclick="removeAnnotation('${k}')">[删]</span>
                </div>`;
            });
            listDiv.innerHTML = html;
        };

        window.removeAnnotation = function(key) {
            delete window.currentAdminAnnotations[key];
            refreshAnnotationList();
        };

        // 💥 新增：管理员批注状态管线 (行内无缝展开版)
        window.currentAdminAnnotations = {};

        // 切换行内批注框的显示/隐藏
        window.toggleInlineAnnotation = function(key) {
            const box = document.getElementById('anno-box-' + key);
            const input = document.getElementById('anno-input-' + key);
            
            if (box.style.display === 'none') {
                box.style.display = 'block';
                input.focus();
                // 自动适应初始高度
                input.style.height = 'auto';
                input.style.height = input.scrollHeight + 'px';
            } else {
                // 如果里面没写字，再点一次 [+] 就直接收起隐藏
                if (input.value.trim() === '') {
                    box.style.display = 'none';
                } else {
                    input.focus();
                }
            }
        };

        // 输入时实时调整高度，并同步到总控制台
        window.updateInlineAnnotation = function(key, label, el) {
            // 魔法：高度自适应撑开
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
            
            const text = el.value.trim();
            if (text === '') {
                delete window.currentAdminAnnotations[key]; // 为空自动删除该条批注
            } else {
                window.currentAdminAnnotations[key] = { label, text };
            }
            refreshAnnotationList(); // 实时刷新底部汇总表
        };

        // 刷新底部工作台的汇总列表
        window.refreshAnnotationList = function() {
            const listDiv = document.getElementById('annotation-list');
            if (!listDiv) return;
            const keys = Object.keys(window.currentAdminAnnotations);
            
            if (keys.length === 0) {
                listDiv.innerHTML = '<div style="opacity:0.5;">(点击各属性旁边的 [+] 即可在其下方展开批注框)</div>';
                return;
            }
            
            let html = '';
            keys.forEach(k => {
                const item = window.currentAdminAnnotations[k];
                html += `<div style="margin-bottom: 6px; padding: 6px; border-left: 2px solid #f44336; background: rgba(244,67,54,0.1); display: flex; justify-content: space-between;">
                    <span><strong style="color:#f44336;">[${item.label}]</strong> - ${item.text}</span>
                    <span style="color:#f44336; cursor:pointer; font-size:12px; font-weight:bold; padding-left: 10px;" onclick="removeAnnotation('${k}')">[删]</span>
                </div>`;
            });
            listDiv.innerHTML = html;
        };

        // 在底部工作台点击 [删] 时，同步清空并折叠上面的行内输入框
        window.removeAnnotation = function(key) {
            delete window.currentAdminAnnotations[key];
            refreshAnnotationList();
            
            const input = document.getElementById('anno-input-' + key);
            const box = document.getElementById('anno-box-' + key);
            if (input && box) {
                input.value = '';
                box.style.display = 'none';
                input.style.height = 'auto'; // 恢复默认高度
            }
        };


        // 💥 显示审核详情与管理员操作面板 (清爽重构版)
        window.showQueueDetail = function(char) {
            const detail = document.getElementById('queue-detail');
            detail.style.display = 'block';

            window.currentAdminAnnotations = {};
            if (char.status === 'rejected' && char.review_comments && char.review_comments.fields) {
                window.currentAdminAnnotations = JSON.parse(JSON.stringify(char.review_comments.fields));
            }

            const getExistingAnno = (key) => window.currentAdminAnnotations[key] ? window.currentAdminAnnotations[key].text : '';

            // 💥 核心构建器：使用 CSS 类替代内联样式
            const renderField = (key, label, value, isBlock = false) => {
                let btnHtml = '';
                let inlineAnnoHtml = '';
                const existingText = getExistingAnno(key);
                
                const isActingAsAdmin = ['admin', 'super_admin'].includes(currentUser?.role) && (currentUser.role === 'super_admin' || char.owner_id !== currentUser.id);
                if (isActingAsAdmin && char.status !== 'approved') {
                    btnHtml = `<span class="anno-btn" onclick="toggleInlineAnnotation('${key}')" title="批注此项">[+]</span>`;
                    inlineAnnoHtml = `
                        <div id="anno-box-${key}" style="display: ${existingText ? 'block' : 'none'}; margin-top: 8px; width: 100%;">
                            <textarea id="anno-input-${key}" class="anno-input-box" rows="1" placeholder="在此输入对【${label}】的批注..." oninput="updateInlineAnnotation('${key}', '${label}', this)">${existingText}</textarea>
                        </div>
                    `;
                } else if (existingText) {
                    inlineAnnoHtml = `<div class="anno-text-box"><strong style="color:#f44336;">[ 管理员批注 ]</strong> ${existingText}</div>`;
                }

                if (isBlock) {
                    return `
                        <div class="detail-text-block detail-flex-col">
                            <div><span class="detail-lbl">${label}: ${btnHtml}</span><br>${value}</div>
                            ${inlineAnnoHtml}
                        </div>
                    `;
                } else {
                    return `
                        <div class="detail-item detail-flex-col">
                            <div style="width: 100%;"><span class="detail-lbl">${label}: ${btnHtml}</span> ${value}</div>
                            ${inlineAnnoHtml}
                        </div>
                    `;
                }
            };

            let summaryText = '';
            if (char.status === 'rejected' && char.review_comments) {
                summaryText = typeof char.review_comments.general === 'string' ? char.review_comments.general : (typeof char.review_comments === 'string' ? char.review_comments : '');
            }

            let adminControls = '';
            const canApprove = ['admin', 'super_admin'].includes(currentUser?.role) && (currentUser.role === 'super_admin' || char.owner_id !== currentUser.id);
            
            if (canApprove) {
                adminControls = `
                    <div class="anno-summary-panel">
                        <div style="color: #f44336; font-family: monospace; font-weight: bold; margin-bottom: 10px;">[ 审核批注汇总 ]</div>
                        <div id="annotation-list" style="margin-bottom: 10px; font-size: 13px; color: #ffb4a9;">
                            <div style="opacity:0.5;">(点击各属性旁边的 [+] 即可在其下方展开批注框)</div>
                        </div>
                        <textarea id="admin-summary-input" rows="2" class="anno-input-box" style="background: rgba(0,0,0,0.5); border-color: rgba(244,67,54,0.4); color: #fff;" placeholder="在此输入总体驳回意见或修改总结 (选填)...">${summaryText}</textarea>
                        <div class="detail-action-row">
                            <button class="submit-btn" style="color:#4caf50; border-color:#4caf50; flex: 1;" onclick="approveChar('${char.id}')">[ 审核通过 ]</button>
                            <button class="submit-btn" style="color:#f44336; border-color:#f44336; flex: 1;" onclick="rejectChar('${char.id}')">[ 提交批注并送回 ]</button>
                        </div>
                    </div>
                `;
            } else if (['admin', 'super_admin'].includes(currentUser?.role) && char.owner_id === currentUser.id) {
                adminControls = `<div style="margin-top: 20px; color: #ffeb3b; font-family: monospace; background: rgba(255,235,59,0.1); padding: 10px; border-left: 3px solid #ffeb3b;">[ 系统提示 ] 管理员无法审核自己的档案，请等待其他管理员处理。</div>`;
            }

            let userControls = '';
            if (char.owner_id === currentUser.id) {
                userControls = `
                    <div class="detail-action-row">
                        <button class="sys-modal-btn confirm" onclick="editQueueChar('${char.id}')">[ 修改档案 ]</button>
                        <button class="sys-modal-btn cancel" onclick="deleteQueueChar('${char.id}')">[ 永久删除 ]</button>
                    </div>
                `;
            }

            let feedbackHtml = '';
            if (char.status === 'rejected' && char.review_comments) {
                feedbackHtml = `
                    <div class="system-notice" style="border-color:#f44336; background: rgba(244,67,54,0.1);">
                        <div style="color: #f44336; font-weight: bold; margin-bottom: ${summaryText ? '8px' : '0'}; font-family: monospace;">[ 需要修改 ]</div>
                        ${summaryText ? `<div style="color:#fff;"><strong>管理员总结：</strong>${summaryText}</div>` : ''}
                        <div style="margin-top: 5px; font-size: 12px; color: #ffb4a9;">请查看下方档案中各字段的详细批注。</div>
                    </div>
                `;
            }

            let headerAnnoBtn = '';
            let headerAnnoBox = '';
            const existingNameText = getExistingAnno('name');
            const isActingAsAdminHeader = ['admin', 'super_admin'].includes(currentUser?.role) && (currentUser.role === 'super_admin' || char.owner_id !== currentUser.id);

            if (isActingAsAdminHeader && char.status !== 'approved') {
                headerAnnoBtn = `<span class="anno-btn" style="font-size:16px; margin-left:10px;" onclick="toggleInlineAnnotation('name')" title="批注姓名/代号">[+]</span>`;
                headerAnnoBox = `
                    <div id="anno-box-name" style="display: ${existingNameText ? 'block' : 'none'}; margin-top: 10px; width: 100%;">
                        <textarea id="anno-input-name" class="anno-input-box" rows="1" placeholder="在此输入对【姓名/代号】的批注..." oninput="updateInlineAnnotation('name', '姓名/代号', this)">${existingNameText}</textarea>
                    </div>
                `;
            } else if (existingNameText) {
                headerAnnoBox = `<div class="anno-text-box"><strong style="color:#f44336;">[ 管理员备注 ]</strong> ${existingNameText}</div>`;
            }

            const factionField = renderField('faction', '阵营', renderDualTag(char, 'faction', 'hidden_faction', false));
            const orgField = renderField('organization', '组织', renderDualTag(char, 'organization', 'hidden_org', true));
            const hometownField = renderField('hometown', '籍贯', renderDual(char, 'hometown', 'hidden_hometown'));
            const familyTiesField = renderField('family_ties', '公开关系网', window.formatFamilyTies(char.family_ties), true);
            const genderField = renderField('gender', '性别', char.gender);
            const genderNotesField = renderField('gender_notes', '性别备注', char.gender_notes || '无');
            const ageField = renderField('age', '年龄', char.age);
            const heightField = renderField('height', '身高', char.height);
            const appearanceField = renderField('appearance', '外貌', char.appearance, true);
            const personalityField = renderField('personality', '性格', char.personality, true);
            const notesField = renderField('notes', '备注', renderDual(char, 'notes', 'hidden_notes'), true);
            const occupationField = renderField('occupation', '职位/职业', renderDual(char, 'occupation', 'hidden_occupation'));
            const rpSampleField = char.rp_sample ? renderField('rp_sample', '自戏考核', `<div style="white-space:pre-wrap; font-size:14px; color:#e0f2fe; background:rgba(18,168,255,0.05); padding:15px; border:1px solid #12a8ff; border-left:4px solid #12a8ff; border-radius:4px; margin-top:10px; line-height:1.8; font-family:'PingFang SC', sans-serif;">${char.rp_sample}</div>`, true) : '';
            const orientationField = renderField('orientation', '性取向', char.orientation || 'N/A');
            const roleField = renderField('role', '属性', char.role || 'N/A');

            // 💥 核心新增：管理员专属机密视窗
            let adminBanner = '';
            if (['admin', 'super_admin'].includes(currentUser?.role)) {
                const timeStr = new Date(char.updated_at || char.created_at || Date.now()).toLocaleString();
                const isRevision = !!char.target_edit_id;
                const auditCount = (char.review_comments && char.review_comments.audit_count) ? char.review_comments.audit_count : 0;
                adminBanner = `
                    <div style="background: rgba(255, 152, 0, 0.1); border: 1px dashed #ff9800; padding: 12px; margin-bottom: 15px; border-radius: 4px;">
                        <div style="color: #ff9800; font-weight: bold; font-size: 13px; font-family: monospace; margin-bottom: 6px;">[ 🛡️ 管理员机密视窗 ]</div>
                        <div style="color: #ffcc80; font-size: 12px; line-height: 1.6;">
                            • <strong>最新提交时间：</strong>${timeStr}<br>
                            • <strong>历史驳回次数：</strong>${auditCount} 次<br>
                            • <strong>档案性质：</strong>${isRevision ? '<span style="color:#f44336; font-weight:bold; background:rgba(244,67,54,0.2); padding:2px 6px; border-radius:2px;">已通过档案的修改申请 (批准后将覆盖原档案)</span>' : '<span style="color:#4caf50;">全新档案申请</span>'}
                        </div>
                    </div>
                `;
            }

            // 💥 最终装配输出 (清爽版)
            detail.innerHTML = `
                <div class="detail-header-box">
                    <div class="detail-title-row">
                        <h3 class="detail-title-text" style="color: #ffeb3b;">
                            ${renderDual(char, 'name', 'hidden_name')} // ${renderDual(char, 'callsign', 'hidden_callsign')} ${getDecryptBtn(char)} ${headerAnnoBtn}
                        </h3>
                        <button class="close-btn" onclick="document.getElementById('queue-detail').style.display='none'">[X] CLOSE</button>
                    </div>
                    ${headerAnnoBox}
                </div>
                
                ${adminBanner}
                ${feedbackHtml}
                
                <div class="form-grid" style="margin-bottom: 10px; border-bottom: 1px dashed rgba(255,235,59,0.3); padding-bottom: 10px;">
                    ${factionField} ${orgField} ${occupationField} ${hometownField}
                </div>
                ${familyTiesField}
                <div class="form-grid-3" style="margin-bottom: 15px;">
                    ${genderField} ${genderNotesField} ${ageField} ${orientationField} ${roleField} ${heightField}
                </div>
                ${appearanceField} ${personalityField} ${notesField} ${rpSampleField}
                
                ${adminControls}
                ${userControls}
            `;

            setTimeout(() => {
                refreshAnnotationList();
                if (['admin', 'super_admin'].includes(currentUser?.role)) {
                    document.querySelectorAll('textarea[id^="anno-input-"]').forEach(el => {
                        if (el.value.trim() !== '') {
                            el.style.height = 'auto';
                            el.style.height = el.scrollHeight + 'px';
                        }
                    });
                }
            }, 50);
        };

        // 💥 管理员操作：批准（引入职位上限与冲突阻断系统）
        window.approveChar = async function(id) {
            const btn = event.target;
            btn.innerHTML = `[ ${CyberLang.icon} ${CyberLang.get('verifying')} ]`;
            
            const charDraft = pendingDB.find(c => String(c.id) === String(id));
            if (!charDraft) return;

            // 💥 CAPACITY CHECK (名额查验)
            const pubCheck = await window.processIdentityCapacity(charDraft.organization, charDraft.occupation, charDraft.id);
            if (pubCheck && pubCheck.rejected) {
                await SysModal.alert(pubCheck.msg, "⚠️ 审核阻断：职位满员");
                btn.innerText = "[ 审核通过 ]";
                return;
            }

            if (charDraft.has_hidden && charDraft.hidden_org && charDraft.hidden_occupation) {
                const hidCheck = await window.processIdentityCapacity(charDraft.hidden_org, charDraft.hidden_occupation, charDraft.id);
                if (hidCheck && hidCheck.rejected) {
                    await SysModal.alert(`(里身份) ${hidCheck.msg}`, "⚠️ 审核阻断：暗网职位满员");
                    btn.innerText = "[ 审核通过 ]";
                    return;
                }
            }

            btn.innerHTML = `[ ${CyberLang.icon} ${CyberLang.get('merging')} ]`;
            try {
                if (charDraft.target_edit_id) {
                    const updateData = {
                        name: charDraft.name, callsign: charDraft.callsign, faction: charDraft.faction, organization: charDraft.organization,
                        hometown: charDraft.hometown,
                        gender: charDraft.gender, age: charDraft.age, dob: charDraft.dob, height: charDraft.height, weight: charDraft.weight,
                        blood: charDraft.blood, appearance: charDraft.appearance, personality: charDraft.personality, notes: charDraft.notes,
                        occupation: charDraft.occupation,
                        rp_sample: charDraft.rp_sample, /* 💥 保存自戏到正式库 */
                        status: 'approved', review_comments: null,
                        family_ties: charDraft.family_ties,
                        has_hidden: charDraft.has_hidden, hidden_name: charDraft.hidden_name, hidden_callsign: charDraft.hidden_callsign,
                        hidden_hometown: charDraft.hidden_hometown,
                        hidden_faction: charDraft.hidden_faction, hidden_org: charDraft.hidden_org, hidden_occupation: charDraft.hidden_occupation, hidden_notes: charDraft.hidden_notes
                    };
                    await supabaseClient.from('characters').update(updateData).eq('id', charDraft.target_edit_id);
                    await supabaseClient.from('characters').delete().eq('id', charDraft.id);
                } else {
                    await supabaseClient.from('characters').update({ status: 'approved', review_comments: null }).eq('id', id);
                }
                
                // 💥 触发满员冲突自动排查机制 (屠杀排队的后继者)
                await window.triggerConflictRejection(charDraft);

                await SysModal.alert("新档案已通过，正式归档入库！", "APPROVED");
                document.getElementById('queue-detail').style.display='none';
                fetchCloudData(); // 刷新数据
            } catch (error) {
                console.error("审核失败:", error);
                await SysModal.alert("合并数据失败，请重试。", "ERROR");
                btn.innerText = "[ 审核通过 ]";
            }
        }

        // 💥 管理员操作：提交带有多条批注的驳回
        window.rejectChar = async function(id) {
            const summaryInput = document.getElementById('admin-summary-input');
            const generalText = summaryInput ? summaryInput.value.trim() : '';
            const hasFields = Object.keys(window.currentAdminAnnotations).length > 0;

            // 拦截误触：至少写点什么才能驳回
            if (!hasFields && !generalText) {
                await SysModal.alert("驳回操作需至少填写一项 [+] 针对性批注 或 总结意见。", "空批示警告");
                return;
            }

            const btn = event.target;
            const originalText = btn.innerText;
            btn.innerHTML = `[ ${CyberLang.icon} ${CyberLang.get('processing')} ]`;
            
            // 💥 核心新增：读取历史驳回次数并 +1
            const charDraft = pendingDB.find(c => String(c.id) === String(id));
            const currentAuditCount = (charDraft && charDraft.review_comments && charDraft.review_comments.audit_count) ? charDraft.review_comments.audit_count : 0;

            // 将全部意见打包成一个 JSON 对象存进云端
            const reviewData = {
                general: generalText,
                fields: window.currentAdminAnnotations,
                audit_count: currentAuditCount + 1 // 💥 记录驳回次数
            };
            try {
                await supabaseClient.from('characters').update({ 
                    status: 'rejected',
                    review_comments: reviewData
                }).eq('id', id);
                
                await SysModal.alert("档案已送回，申请人将收到详细的修改批示列表！", "执行完毕");
                document.getElementById('queue-detail').style.display='none';
                fetchCloudData(); // 刷新数据
            } catch (error) {
                console.error("送回失败:", error);
                await SysModal.alert("操作失败，请检查网络连接。", "✕ ERROR");
                btn.innerText = originalText;
            }
        }

        // 💥 新增：群友自己撤回排队中/被打回的档案
        window.deleteQueueChar = async function(id) {
            const isSure = await SysModal.confirm("确认要撤回并删除这份档案吗？\n此操作不可逆！删除后您可以重新录入一份新档案。", "删除档案");
            if (!isSure) return; // 用户点取消就退出

            // 告诉 Supabase 删掉这条数据
            await supabaseClient.from('characters').delete().eq('id', id);

            await SysModal.alert("旧档案已彻底删除，您可以前往终端录入新档案了。", "已删除");
            document.getElementById('queue-detail').style.display = 'none';
            fetchCloudData(); // 刷新数据，清理掉界面上的卡片
        }

        // 💥 新增：一键调取被驳回/排队中的档案到填写卡
         window.editQueueChar = async function(id) {
            window.lastScrollY = window.scrollY || window.pageYOffset; // 💥 记录滚动位置
            // 💥 修复：强制转换为文本进行对比，防止数字和文本严格相等判断失败
            const char = pendingDB.find(c => String(c.id) === String(id)) || 
                         characterDB.find(c => String(c.id) === String(id));
            
            if (!char) {
                await SysModal.alert("无法从数据库中提取该档案的数据。可能已被删除。", "✕ 提取失败");
                return;
            }

            // 补充处理职业下拉回显逻辑
            setTimeout(() => {
                const fixOccSelect = (val, selectId, customId) => {
                    const sel = document.getElementById(selectId);
                    const cus = document.getElementById(customId);
                    if (!sel || !cus || !val) return;
                    
                    let found = false;
                    for (let i = 0; i < sel.options.length; i++) {
                        if (sel.options[i].value === val && !sel.options[i].disabled) {
                            sel.value = val;
                            found = true;
                            cus.style.display = 'none';
                            cus.value = val;
                            break;
                        }
                    }
                    if (!found) {
                        sel.value = 'custom';
                        cus.style.display = 'block';
                        cus.value = val;
                    }
                };
                fixOccSelect(char.occupation, 'f-occupation-select', 'f-occupation-custom');
                if (char.has_hidden) fixOccSelect(char.hidden_occupation, 'h-occupation-select', 'h-occupation-custom');
            }, 100);

            // 0. 记录来路，方便返回
            window.formPreviousView = document.querySelector('.view-panel.active')?.id || 'queueView';

            // 1. 设置系统进入“编辑模式”
            editingCharId = char.id;

            // 2. 将数据塞回表单里
            document.getElementById('f-name').value = char.name || '';
            document.getElementById('f-callsign').value = char.callsign || '';
            // 💥 拆分并回显公开籍贯
            if (char.hometown && char.hometown !== 'N/A') {
                const parts = char.hometown.split(' - ');
                const pName = parts[0];
                const bName = parts.length > 1 ? parts[1] : '';
                
                document.getElementById('f-hometown-planet').value = pName;
                populateBaseSelect(pName, 'f');
                
                const baseSel = document.getElementById('f-hometown-base');
                const customWrap = document.getElementById('f-hometown-custom-wrapper');
                const customInput = document.getElementById('f-hometown-custom');
                
                let found = false;
                for(let i=0; i<baseSel.options.length; i++) {
                    if(baseSel.options[i].value === bName) {
                        baseSel.value = bName;
                        found = true; break;
                    }
                }
                if(!found && bName) {
                    baseSel.value = 'custom';
                    customWrap.style.display = 'flex';
                    customInput.value = bName;
                }
            } else {
                document.getElementById('f-hometown-planet').value = '';
                document.getElementById('f-hometown-base').innerHTML = '<option value="" disabled selected>-- 请先选择星球 --</option>';
            }
            document.getElementById('f-gender').value = char.gender || '';
            // 💥 新增：载入性别备注
            document.getElementById('f-gender-notes').value = char.gender_notes || '';
            document.getElementById('f-age').value = char.age || '';
            document.getElementById('f-dob').value = char.dob || '';
            document.getElementById('f-height').value = char.height || '';
            document.getElementById('f-weight').value = char.weight || '';
            document.getElementById('f-blood').value = char.blood || '';
            document.getElementById('f-appearance').value = char.appearance || '';
            document.getElementById('f-personality').value = char.personality || '';
            document.getElementById('f-notes').value = char.notes || '';
            
            // 💥 核心修复：加上 -custom，防止找不到元素报错卡死
            document.getElementById('f-occupation-custom').value = char.occupation || ''; 
            
            // 💥 回填自戏内容
            document.getElementById('f-rp-sample').value = char.rp_sample || '';
            setTimeout(window.checkRpRequirement, 200); // 延迟触发检测，确保下拉框已加载
            
            // 💥 回填隐藏备注与公开关系网
            document.getElementById('f-secret-notes').value = char.secret_notes || '';
            document.getElementById('f-family-ties').value = char.family_ties || '';

            document.getElementById('f-orientation').value = char.orientation || '';
            document.getElementById('f-role').value = char.role || '';

            // 💥 回填里身份数据
            if (char.has_hidden) {
                if (!isHiddenEnabled) document.getElementById('btn-toggle-hidden').click();
                // 💥 新增：回填真实姓名
                document.getElementById('h-name').value = char.hidden_name || '';
                document.getElementById('h-callsign').value = char.hidden_callsign || '';
                // 💥 拆分并回显里身份籍贯
                if (char.hidden_hometown) {
                    const parts = char.hidden_hometown.split(' - ');
                    const pName = parts[0];
                    const bName = parts.length > 1 ? parts[1] : '';
                    
                    document.getElementById('h-hometown-planet').value = pName;
                    populateBaseSelect(pName, 'h');
                    
                    const baseSel = document.getElementById('h-hometown-base');
                    const customWrap = document.getElementById('h-hometown-custom-wrapper');
                    const customInput = document.getElementById('h-hometown-custom');
                    
                    let found = false;
                    for(let i=0; i<baseSel.options.length; i++) {
                        if(baseSel.options[i].value === bName) {
                            baseSel.value = bName;
                            found = true; break;
                        }
                    }
                    if(!found && bName) {
                        baseSel.value = 'custom';
                        customWrap.style.display = 'flex';
                        customInput.value = bName;
                    }
                }
                
                // 💥 核心修复：加上 -custom
                document.getElementById('h-occupation-custom').value = char.hidden_occupation || ''; 
                
                document.getElementById('h-notes').value = char.hidden_notes || '';
                
                const hFac = document.getElementById('h-faction');
                hFac.value = char.hidden_faction || '';
                hFac.dispatchEvent(new Event('change'));
                const hOrg = document.getElementById('h-org');
                hOrg.value = char.hidden_org || '';
                hOrg.dispatchEvent(new Event('change')); // 💥 核心修复：里身份的组织也要触发！
            } else {
                if (isHiddenEnabled) document.getElementById('btn-toggle-hidden').click();
            }

            // 💥 处理二级联动的阵营和组织下拉框
            const factionSelect = document.getElementById('f-faction');
            const orgSelect = document.getElementById('f-org');
            
            factionSelect.value = char.faction || '';
            factionSelect.dispatchEvent(new Event('change'));
            orgSelect.value = char.organization || '';
            orgSelect.dispatchEvent(new Event('change')); // 💥 核心修复：必须触发组织的 change 事件，下拉框才会出来！
            // 3. 修改提交按钮的文字，提示用户现在是“更新”操作
            document.getElementById('btn-submit-char').innerText = "[ 更新并覆盖旧档案 ]";

            // 4. 关闭等候室弹窗，自动跳转到“人设填写卡”界面
            document.getElementById('queue-detail').style.display = 'none';
            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById('createView').classList.add('active');
            window.scrollTo({ top: 0, behavior: 'instant' });
            
            await SysModal.alert("旧档案数据已成功载入，请直接在表单上进行修改。", "调取成功");
        };

        // 💥 新增：管理员专属的正式库删除功能
        window.deleteChar = async function(id) {
            const isSure = await SysModal.confirm("警告：您正在删除正式库中的公民档案！\n此操作不可逆，确认删除吗？", "⚠️ 永久删除档案");
            if (!isSure) return;

            try {
                await supabaseClient.from('characters').delete().eq('id', id);
                await SysModal.alert("正式档案已彻底删除。", "删除成功");
                
                // 关闭可能打开的面板
                if (window.isOverlayOpen) window.closeDetailOverlay(); 
                document.getElementById('roster-detail').style.display = 'none'; 
                
                fetchCloudData(); // 刷新数据
            } catch (error) {
                console.error("删除失败:", error);
                await SysModal.alert("删除失败，请检查网络连接。", "✕ ERROR");
            }
        };


        // 4. 提交表单录入数据 (支持新增、修改被驳回的草稿、针对正式版提交新草稿)
        document.getElementById('btn-submit-char').addEventListener('click', async () => {
            const callsign = document.getElementById('f-callsign').value.trim();
            const faction = document.getElementById('f-faction').value; 
            const org = document.getElementById('f-org').value;         
            
            if(!callsign) { await SysModal.alert('必须填写代号！', 'SYSTEM NOTE'); return; }
            if(!faction || !org) { await SysModal.alert('请选择您的星际阵营与所属组织！', 'SYSTEM NOTE'); return; }

            const myPending = pendingDB.find(c => c.owner_id === currentUser.id);
            const myApproved = characterDB.find(c => c.owner_id === currentUser.id);

            // 1. 复杂权限判定
            if (currentUser.role !== 'super_admin') { // 💥 限制：只有超级管理员可以无限建卡
                if (!editingCharId && (myApproved || myPending)) {
                    await SysModal.alert("检测到您的终端已绑定一份记录。\n如需修改已有档案，请前往「人设库」「办事大厅」「个人终端」点击修改按钮！", "⚠️ ACTION DENIED");
                    return; 
                }
                
                // 重点：如果他在修改正式库，但他已经在排队了，拦截！
                const originalChar = editingCharId ? (characterDB.find(c => String(c.id) === String(editingCharId)) || pendingDB.find(c => String(c.id) === String(editingCharId))) : null;
                if (originalChar && originalChar.status === 'approved' && myPending) {
                    await SysModal.alert("您已经有一份【修改申请】正在排队中，请前往「办事大厅」处理，请勿重复发起", "⚠️ DUPLICATE REQUEST");
                    return;
                }
            }

            const submitBtn = document.getElementById('btn-submit-char');
            submitBtn.innerText = "[ 📡 UPLOADING TO SERVER... ]";
            submitBtn.disabled = true;

            const rpGroup = document.getElementById('rp-sample-group');
            const rpSample = document.getElementById('f-rp-sample').value.trim();
            if (rpGroup.style.display === 'block') {
                if (rpSample.length < 200) {
                    await SysModal.alert('该职位需要自戏考核，且字数不能少于 200 字！\n当前字数：' + rpSample.length, 'SYSTEM NOTE');
                    return;
                }
            }

            // 💥 拼接公开籍贯
            let fPlanet = document.getElementById('f-hometown-planet').value.trim();
            let fBaseSel = document.getElementById('f-hometown-base').value;
            let fBase = fBaseSel === 'custom' ? document.getElementById('f-hometown-custom').value.trim() : fBaseSel;
            let finalHometown = (fPlanet && fBase) ? `${fPlanet} - ${fBase}` : (fPlanet || 'N/A');

            // 💥 拼接里身份籍贯
            let hPlanet = document.getElementById('h-hometown-planet') ? document.getElementById('h-hometown-planet').value.trim() : '';
            let hBaseSel = document.getElementById('h-hometown-base') ? document.getElementById('h-hometown-base').value : '';
            let hBase = hBaseSel === 'custom' ? document.getElementById('h-hometown-custom').value.trim() : hBaseSel;
            let finalHiddenHometown = (hPlanet && hBase) ? `${hPlanet} - ${hBase}` : hPlanet;

            const newChar = {
                owner_id: currentUser.id, name: document.getElementById('f-name').value || 'UNKNOWN',
                callsign: callsign, faction: faction, organization: org,
                hometown: finalHometown, // 💥 使用拼接后的籍贯
                occupation: document.getElementById('f-occupation-custom').value || 'N/A',
                rp_sample: rpGroup.style.display === 'block' ? rpSample : '',
                family_ties: document.getElementById('f-family-ties').value.trim() || '',
                gender: document.getElementById('f-gender').value || 'N/A',
                gender_notes: document.getElementById('f-gender-notes').value || '', 
                orientation: document.getElementById('f-orientation').value || 'N/A',
                role: document.getElementById('f-role').value || 'N/A',
                age: document.getElementById('f-age').value || 'N/A',
                dob: document.getElementById('f-dob').value || 'N/A', height: document.getElementById('f-height').value || 'N/A',
                weight: document.getElementById('f-weight').value || 'N/A', blood: document.getElementById('f-blood').value || 'N/A',
                appearance: document.getElementById('f-appearance').value || 'N/A', personality: document.getElementById('f-personality').value || 'N/A',
                notes: document.getElementById('f-notes').value || 'N/A', status: 'pending'
            }; 

            newChar.has_hidden = isHiddenEnabled;
            newChar.hidden_name = document.getElementById('h-name') ? document.getElementById('h-name').value.trim() : '';
            newChar.hidden_callsign = document.getElementById('h-callsign') ? document.getElementById('h-callsign').value.trim() : '';
            newChar.hidden_faction = document.getElementById('h-faction') ? document.getElementById('h-faction').value : '';
            newChar.hidden_org = document.getElementById('h-org') ? document.getElementById('h-org').value : '';
            newChar.hidden_occupation = document.getElementById('h-occupation-custom') ? document.getElementById('h-occupation-custom').value.trim() : '';
            newChar.hidden_hometown = finalHiddenHometown; // 💥 使用拼接后的里身份籍贯
            newChar.hidden_notes = document.getElementById('h-notes') ? document.getElementById('h-notes').value.trim() : '';
            
            
            try {
                const originalChar = editingCharId ? (characterDB.find(c => String(c.id) === String(editingCharId)) || pendingDB.find(c => String(c.id) === String(editingCharId))) : null;

                if (originalChar && originalChar.status === 'approved') {
                    // 💥 模式 A：针对正式库的公民，生成一份独立的【更新草稿】
                    newChar.target_edit_id = originalChar.id; // 锁定覆盖目标！
                    const { error } = await supabaseClient.from('characters').insert([newChar]);
                    if (error) throw error;
                    await SysModal.alert('档案修改申请已提交至审核队列，\n\n在此期间，您的原档案将继续在正式库保持生效。', 'REVISION SUBMITTED');
                } else if (editingCharId) {
                    // 💥 模式 B：更新一份已被驳回/在排队中的【草稿】
                    const { error } = await supabaseClient.from('characters').update(newChar).eq('id', editingCharId);
                    if (error) throw error;
                    await SysModal.alert('草稿数据已更新，等待再次审核。', 'DRAFT UPDATED');
                } else {
                    // 💥 模式 C：萌新第一次全新提交
                    const { error } = await supabaseClient.from('characters').insert([newChar]);
                    if (error) throw error;
                    await SysModal.alert('新档案已成功上传！请前往「办事大厅」查看进度。', 'UPLINK SUCCESS');
                }
                
                document.getElementById('character-form').reset(); 
                document.getElementById('f-org').innerHTML = '<option value="" disabled selected>-- 请先确认主阵营 --</option>';
                document.getElementById('f-org').disabled = true;
                editingCharId = null; submitBtn.innerText = "[ 提交并生成档案 ]";
                fetchCloudData();
                closeForm(); // 💥 提交完毕后自动返回上一页
            } catch (error) {
                console.error("上传失败:", error);
                await SysModal.alert("档案操作失败，请检查网络连接。", "✕ CONNECTION ERROR");
                submitBtn.innerText = editingCharId ? "[ 更新档案 ]" : "[ 提交并生成档案 ]";
            } finally {
                submitBtn.disabled = false;
            }
        });

        /* =========================================================
           4. 💥 升级版 3D 赛博空间漫游引擎 (精准锁定修复版) 💥
           ========================================================= */
        let tunnelRAF; 
        function init3DTunnel() {
            // 💥 新增：如果是手机端，直接退出函数，彻底关闭 3D 渲染引擎，省电防卡顿！
            if (window.innerWidth <= 768) return;
            if(tunnelRAF) cancelAnimationFrame(tunnelRAF);

            const CONFIG = { itemCount: 20, starCount: 150, zGap: 800, loopSize: 0, camSpeed: 2.5 };
            CONFIG.loopSize = CONFIG.itemCount * CONFIG.zGap;

            // 💥 核心防偷设拦截：3D 隧道中也过滤掉私密档案
            const visibleChars = characterDB.map((c, idx) => ({...c, originalIndex: idx})).filter(c => {
                if (c.is_private && c.owner_id !== currentUser?.id && !['admin', 'super_admin'].includes(currentUser?.role)) return false;
                return true;
            });

            let TEXTS = visibleChars.map(c => c.callsign);
            if (TEXTS.length === 0) TEXTS = ["NO_DATA", "EMPTY", "AWAITING_INPUT"];
            while(TEXTS.length < 10) TEXTS = TEXTS.concat(TEXTS);

            const state = { 
                scroll: 0, velocity: 0, mouseX: 0, mouseY: 0,
                camX: 0, camY: 0, 
                isFlying: false, targetCamX: 0, targetCamY: 0, flyingToChar: -1
            };
            let targetScroll = 0;

            const viewport = document.getElementById('viewport');
            const world = document.getElementById('world');
            if(!viewport || !world) return;
            
            world.innerHTML = ''; 
            window.tunnelItems = []; 

            const containerWidth = viewport.clientWidth; 
            const containerHeight = viewport.clientHeight;

            for (let i = 0; i < CONFIG.itemCount; i++) {
                const el = document.createElement('div');
                el.className = 'tunnel-item';
                
                const charIndex = i % (visibleChars.length || 1);
                const charData = visibleChars.length > 0 ? visibleChars[charIndex] : { id: 'OP-XXXX', callsign: TEXTS[i % TEXTS.length] };
                const actualCharIndex = visibleChars.length > 0 ? charData.originalIndex : 0; // 映射回真实的全局索引
                
                // 💥 核心修复：给每一个生成的 3D 元素分配一个独一无二的物理索引
                const uniqueItemIndex = window.tunnelItems.length;

                const isHeading = i % 4 === 0;
                if (isHeading) {
                    const txt = document.createElement('div');
                    txt.className = 'tunnel-text';
                    txt.innerText = charData.callsign;
                    el.appendChild(txt);
                    window.tunnelItems.push({ el, type: 'text', x: 0, y: 0, rot: 0, currentRot: 0, baseZ: -i * CONFIG.zGap, charIndex: actualCharIndex, uniqueItemIndex });
                } else {
                    const card = document.createElement('div');
                    card.className = 'tunnel-card';
                    const lockIcon = charData.is_private ? '<svg viewBox="0 0 24 24" style="width: 1.2em; height: 1.2em; fill: #ff9800; vertical-align: middle; margin-top: -3px; margin-right: 4px; filter: drop-shadow(0 0 5px rgba(255,152,0,0.8));"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>' : '';
                    card.innerHTML = `
                        <div class="tunnel-card-header">
                            <span class="card-id">${window.getDogTag(charData)}</span>
                            <div style="width: 10px; height: 10px; background: #12a8ff; box-shadow: 0 0 5px #12a8ff;"></div>
                        </div>
                        <h2>${lockIcon}${charData.callsign}</h2>
                        <div style="display:flex; justify-content:space-between; font-size:12px; margin-top:15px; color:#607D8B;">
                            <span>STATUS: ACTIVE</span>
                            <span>CLASS: ASSAULT</span>
                        </div>
                    `;
                    el.appendChild(card);

                    card.onclick = (e) => {
                        e.stopPropagation();
                        if(window.triggerTunnelFly) window.triggerTunnelFly(uniqueItemIndex);
                    };

                    const angle = (i / CONFIG.itemCount) * Math.PI * 6;
                    const x = Math.cos(angle) * (containerWidth * 0.4);
                    const y = Math.sin(angle) * (containerHeight * 0.4);
                    const rot = (Math.random() - 0.5) * 30;

                    window.tunnelItems.push({ el, type: 'card', x, y, rot, currentRot: rot, baseZ: -i * CONFIG.zGap, charIndex: actualCharIndex, uniqueItemIndex });
                }
                world.appendChild(el);
            }

            for (let i = 0; i < CONFIG.starCount; i++) {
                const el = document.createElement('div');
                el.className = 'tunnel-star';
                world.appendChild(el);
                window.tunnelItems.push({ el, type: 'star', x: (Math.random() - 0.5) * 2000, y: (Math.random() - 0.5) * 2000, baseZ: -Math.random() * CONFIG.loopSize });
            }

            // 💥 接收物理索引，精准飞向你点击的那张卡
            window.triggerTunnelFly = function(targetUniqueIndex) {
                if (state.isFlying) return;

                const target = window.tunnelItems[targetUniqueIndex];
                if (!target) return;

                window.tunnelItems.forEach(i => {
                    if(i.type === 'card') {
                        i.el.querySelector('.tunnel-card').style.borderColor = 'rgba(18,168,255,0.2)';
                        i.el.querySelector('.tunnel-card').style.boxShadow = 'none';
                    }
                });
                const targetCard = target.el.querySelector('.tunnel-card');
                targetCard.style.borderColor = '#fff';
                targetCard.style.boxShadow = '0 0 40px #12a8ff, inset 0 0 20px #12a8ff';

                state.isFlying = true;
                state.flyingToChar = target.charIndex; // 记录公民数据索引，用于最后展开面板

                let currentRelZ = target.baseZ + state.scroll * CONFIG.camSpeed;
                let currentVizZ = ((currentRelZ % CONFIG.loopSize) + CONFIG.loopSize) % CONFIG.loopSize;
                if (currentVizZ > 500) currentVizZ -= CONFIG.loopSize;

                let zDiff = 180 - currentVizZ;
                targetScroll = state.scroll + (zDiff / CONFIG.camSpeed);

                state.targetCamX = target.x;
                state.targetCamY = target.y;
            };

            viewport.addEventListener('mousemove', (e) => {
                if(state.isFlying) return; 
                const rect = viewport.getBoundingClientRect();
                state.mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
                state.mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            });

            // 💥 新增全局状态，记录面板是否打开
            window.isOverlayOpen = false; 

            viewport.addEventListener('wheel', (e) => {
                if (window.isOverlayOpen) return; // 💥 修复1：如果面板打开了，释放滚轮控制权，允许上下滑动！
                e.preventDefault(); 
                if(state.isFlying) return; 
                targetScroll += e.deltaY * 2.5; 
            }, { passive: false });

            const feedbackVel = document.getElementById('vel-readout');
            const feedbackFPS = document.getElementById('fps');
            const feedbackCoord = document.getElementById('coord');
            let lastTime = 0;

            function raf(time) {
                const delta = time - lastTime;
                lastTime = time;
                if (time % 10 < 1 && delta > 0) feedbackFPS.innerText = Math.round(1000 / delta);

                let tiltX = 0, tiltY = 0;

                if (state.isFlying) {
                    state.camX += (state.targetCamX - state.camX) * 0.08;
                    state.camY += (state.targetCamY - state.camY) * 0.08;
                    tiltX = 0; tiltY = 0; 

                    if (Math.abs(targetScroll - state.scroll) < 2 && Math.abs(state.targetCamX - state.camX) < 2) {
                        state.isFlying = false;
                        window.showDetailOverlay(state.flyingToChar); 
                    }
                } else {
                    state.camX += (0 - state.camX) * 0.1;
                    state.camY += (0 - state.camY) * 0.1;
                    tiltX = state.mouseY * 10 - state.velocity * 0.2;
                    tiltY = state.mouseX * 10;
                }

                const prevScroll = state.scroll;
                state.scroll += (targetScroll - state.scroll) * 0.08; 
                const currentVel = (state.scroll - prevScroll);
                state.velocity += (currentVel - state.velocity) * 0.1;

                feedbackVel.innerText = Math.abs(state.velocity).toFixed(2);
                feedbackCoord.innerText = `${state.scroll.toFixed(0)}`;

                world.style.transform = `translate3d(${-state.camX}px, ${-state.camY}px, 0) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

                const baseFov = 800;
                const fov = Math.max(300, baseFov - Math.abs(state.velocity) * 5);
                viewport.style.perspective = `${fov}px`;

                const cameraZ = state.scroll * CONFIG.camSpeed;
                const modC = CONFIG.loopSize;

                window.tunnelItems.forEach(item => {
                    let relZ = item.baseZ + cameraZ;
                    let vizZ = ((relZ % modC) + modC) % modC;
                    if (vizZ > 500) vizZ -= modC; 

                    let alpha = 1;
                    if (vizZ < -3000) alpha = 0;
                    else if (vizZ < -2000) alpha = (vizZ + 3000) / 1000;
                    if (vizZ > 220 && item.type !== 'star') alpha = 1 - ((vizZ - 220) / 280);
                    if (alpha < 0) alpha = 0;
                    
                    item.el.style.opacity = alpha;

                    // 💥 核心修复：如果卡片透明度太低（快消失了），直接禁用它的点击事件，防止“幽灵遮挡”
                    if (item.type === 'card') {
                        item.el.style.pointerEvents = alpha > 0.2 ? 'auto' : 'none';
                    }

                    if (alpha > 0) {
                        let trans = `translate3d(${item.x}px, ${item.y}px, ${vizZ}px)`;

                        if (item.type === 'star') {
                            const stretch = Math.max(1, Math.min(1 + Math.abs(state.velocity) * 0.05, 5));
                            trans += ` scale3d(1, 1, ${stretch})`;
                        } else if (item.type === 'text') {
                            trans += ` rotateZ(${item.rot}deg)`;
                            
                            // 💥 恢复：根据滚动速度产生红蓝双色故障色差特效 💥
                            if (Math.abs(state.velocity) > 2) {
                                const offset = state.velocity * 0.8;
                                item.el.style.textShadow = `${offset}px 0 rgba(255,0,60,0.8), ${-offset}px 0 rgba(0,243,255,0.8)`;
                            } else {
                                item.el.style.textShadow = 'none';
                            }
                        } else {
                            const t = time * 0.001;
                            let currentFloat = Math.sin(t + item.x) * 5;

                            if (state.isFlying && state.flyingToChar === item.charIndex) {
                                item.currentRot += (0 - item.currentRot) * 0.1;
                                currentFloat *= 0.1;
                            } else {
                                item.currentRot += (item.rot - item.currentRot) * 0.1;
                            }

                            trans += ` rotateZ(${item.currentRot}deg) rotateY(${currentFloat}deg)`;
                        }
                        item.el.style.transform = trans;
                    }
                });
                tunnelRAF = requestAnimationFrame(raf);
            }
            tunnelRAF = requestAnimationFrame(raf);
        }

        // 💥 渲染下方的小按钮列表 (支持搜索、分类、狗牌显示与【阵营视觉分组】)
        window.renderRoster = function() {
            const grid = document.getElementById('roster-grid');
            if (!grid) return;
            grid.innerHTML = '';
            
            if(characterDB.length === 0) {
                grid.innerHTML = '<div style="color:#8bb9d6; font-size:12px;">[ 暂无公民档案，请前往录入终端添加 ]</div>';
                return;
            }

            // 1. 获取当前的过滤条件
            const searchQuery = (document.getElementById('roster-search')?.value || '').trim().toLowerCase();
            const factionFilter = document.getElementById('roster-faction-filter')?.value || 'ALL';
            const orgFilter = document.getElementById('roster-org-filter')?.value || 'ALL';

            // 2. 先过滤出符合条件的人设
            const filteredChars = characterDB.map((char, index) => ({ char, originalIndex: index })).filter(item => {
                const c = item.char;
                
                // 💥 核心防偷设拦截：如果是私密档案，且不是本人，且不是管理员，直接在列表中隐藏！
                if (c.is_private && c.owner_id !== currentUser?.id && !['admin', 'super_admin'].includes(currentUser?.role)) {
                    return false;
                }

                if (searchQuery && !c.callsign.toLowerCase().includes(searchQuery) && !c.name.toLowerCase().includes(searchQuery)) return false;
                if (factionFilter !== 'ALL' && c.faction !== factionFilter) return false;
                if (orgFilter !== 'ALL' && c.organization !== orgFilter) return false;
                return true;
            });

            if (filteredChars.length === 0) {
                grid.innerHTML = '<div style="color:#f44336; font-size:12px;">[ ✕ 未检索到符合条件的档案 ]</div>';
                return;
            }

            // 3. 按阵营进行分组
            const groups = {};
            filteredChars.forEach(item => {
                const fac = item.char.faction || '未知阵营';
                if (!groups[fac]) groups[fac] = [];
                groups[fac].push(item);
            });

            // 4. 设定阵营的显示顺序 (四大阵营优先，其他靠后)
            const order = ["泛星联盟", "外环", "独立防务承包商", "自治空间站与自由港", "无阵营 / 独立势力"];
            const sortedFactions = Object.keys(groups).sort((a, b) => {
                let idxA = order.findIndex(o => a.includes(o));
                let idxB = order.findIndex(o => b.includes(o));
                if (idxA === -1) idxA = 99;
                if (idxB === -1) idxB = 99;
                if (idxA === idxB) return a.localeCompare(b);
                return idxA - idxB;
            });

            // 5. 分块渲染到页面上
            sortedFactions.forEach(fac => {
                // 创建阵营区块容器
                const section = document.createElement('div');
                section.style.width = '100%'; // 强制占满一行
                section.style.marginBottom = '25px';

                // 匹配阵营专属主题色
                let themeColor = '#12a8ff'; // 默认赛博蓝
                if (fac.includes('联盟')) themeColor = '#12a8ff';
                else if (fac.includes('外环')) themeColor = '#f44336';
                else if (fac.includes('承包商')) themeColor = '#4caf50';
                else if (fac.includes('自由港') || fac.includes('空间站')) themeColor = '#ffeb3b';
                else if (fac.includes('无阵营') || fac.includes('独立')) themeColor = '#9e9e9e';

                // 渲染阵营标题
                const header = document.createElement('div');
                header.style.color = themeColor;
                header.style.fontFamily = 'monospace';
                header.style.fontSize = '15px';
                header.style.fontWeight = 'bold';
                header.style.borderBottom = `1px dashed ${themeColor}`;
                header.style.paddingBottom = '8px';
                header.style.marginBottom = '12px';
                header.style.textShadow = `0 0 8px ${themeColor}80`; // 加上微弱的发光
                header.innerText = `[ ${fac} ] - ${groups[fac].length} 人`;
                section.appendChild(header);

                // 创建按钮容器
                const btnContainer = document.createElement('div');
                btnContainer.style.display = 'flex';
                btnContainer.style.flexWrap = 'wrap';
                btnContainer.style.gap = '10px';

                // 渲染该阵营下的所有狗牌按钮
                groups[fac].forEach(item => {
                    const char = item.char;
                    const index = item.originalIndex;

                    const btn = document.createElement('button');
                    btn.className = 'roster-btn';
                    const lockIcon = char.is_private ? '<svg viewBox="0 0 24 24" style="width: 1.1em; height: 1.1em; fill: #ff9800; vertical-align: middle; margin-top: -2px; margin-right: 4px; filter: drop-shadow(0 0 3px rgba(255,152,0,0.5));"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>' : '';
                    btn.innerHTML = `[${window.getDogTag(char)}] ${lockIcon}${char.name}`;
                    
                    // 鼠标悬停时，按钮边框变成该阵营的主题色
                    btn.onmouseover = () => { btn.style.borderColor = themeColor; btn.style.color = '#fff'; btn.style.boxShadow = `0 0 10px ${themeColor}80`; };
                    btn.onmouseout = () => { btn.style.borderColor = ''; btn.style.color = ''; btn.style.boxShadow = ''; };

                    btn.onclick = () => {
                        if (window.innerWidth <= 768) {
                            window.showMobileDetail(index);
                            return;
                        }
                        document.getElementById('viewport').scrollIntoView({behavior: 'smooth', block: 'center'});
                        const executeFly = () => {
                            const targetItems = window.tunnelItems ? window.tunnelItems.filter(i => i.type === 'card' && i.charIndex === index) : [];
                            if(targetItems.length > 0 && window.triggerTunnelFly) {
                                window.triggerTunnelFly(targetItems[0].uniqueItemIndex);
                            } else {
                                window.showDetailOverlay(index);
                            }
                        };
                        if (window.isOverlayOpen) {
                            if (window.currentOpenCharIndex === index) return; 
                            window.closeDetailOverlay();
                            setTimeout(executeFly, 350); 
                        } else {
                            executeFly();
                        }
                    };
                    btnContainer.appendChild(btn);
                });

                section.appendChild(btnContainer);
                grid.appendChild(section);
            });
        };

        // 💥 填充人设库的分类下拉框
        window.updateRosterFilters = function() {
            const facSelect = document.getElementById('roster-faction-filter');
            const orgSelect = document.getElementById('roster-org-filter');
            if (!facSelect || !orgSelect) return;

            const currentFac = facSelect.value;
            const currentOrg = orgSelect.value;

            const factions = articlesDB.filter(a => a.type === 'faction').map(a => a.title);
            let facHtml = '<option value="ALL">-- 所有阵营 --</option>';
            facHtml += '<option value="无阵营 / 独立势力">无阵营 / 独立势力</option>';
            factions.forEach(f => facHtml += `<option value="${f}">${f}</option>`);
            facSelect.innerHTML = facHtml;
            if (currentFac && facHtml.includes(`value="${currentFac}"`)) facSelect.value = currentFac;

            window.updateRosterOrgFilter = function() {
                const selectedFac = facSelect.value;
                let orgHtml = '<option value="ALL">-- 所有组织 --</option>';
                if (selectedFac !== 'ALL') {
                    const orgs = articlesDB.filter(a => a.type === 'org' && a.keywords && a.keywords.includes(`[PARENT:${selectedFac}]`)).map(a => a.title);
                    orgHtml += '<option value="无归属 / 独狼">无归属 / 独狼</option>';
                    orgs.forEach(o => orgHtml += `<option value="${o}">${o}</option>`);
                }
                orgSelect.innerHTML = orgHtml;
            };

            updateRosterOrgFilter();
            if (currentOrg && orgSelect.innerHTML.includes(`value="${currentOrg}"`)) orgSelect.value = currentOrg;
        };

        // 监听输入和选择事件
        document.addEventListener('input', function(e) {
            if (e.target.id === 'roster-search') window.renderRoster();
        });
        document.addEventListener('change', function(e) {
            if (e.target.id === 'roster-faction-filter') {
                window.updateRosterOrgFilter();
                window.renderRoster();
            }
            if (e.target.id === 'roster-org-filter') {
                window.renderRoster();
            }
        });

        // 💥 新增：手机端专属的静态详情面板展开逻辑
        window.showMobileDetail = function(index) {
            const char = characterDB[index];
            if(!char) return;

            const detailContainer = document.getElementById('roster-detail');
            detailContainer.style.display = 'block'; // 显示面板

            // 同样提供修改按钮（如果是本人的档案）
            let editActionHtml = '';
            if (char.owner_id === currentUser.id) {
                editActionHtml += `<button class="sys-modal-btn confirm" style="margin-top: 15px; margin-right: 10px;" onclick="editQueueChar('${char.id}')">[ CREATE_REVISION // 提交修改申请 ]</button>`;
            }
            // 💥 补回：如果是管理员，额外给他一个强制删除按钮
            if (['admin', 'super_admin'].includes(currentUser?.role)) {
                editActionHtml += `<button class="sys-modal-btn cancel" style="margin-top: 15px;" onclick="deleteChar('${char.id}')">[ 删除档案 ]</button>`;
            }

            // 将数据填入面板
            detailContainer.innerHTML = `
                <div class="detail-header">
                    <h3 style="color: #e0f2fe; text-shadow: 0 0 8px rgba(18, 168, 255, 0.6);">
                        ${char.is_private ? '<svg viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: #ff9800; vertical-align: middle; margin-top: -2px; margin-right: 6px; filter: drop-shadow(0 0 5px rgba(255,152,0,0.6));"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>' : ''}
                        ${renderDual(char, 'name', 'hidden_name')} // ${renderDual(char, 'callsign', 'hidden_callsign')} ${getDecryptBtn(char)}
                    </h3>
                    <button class="close-btn" onclick="document.getElementById('roster-detail').style.display='none'">[X] CLOSE</button>
                </div>
                <div class="form-grid" style="margin-bottom: 10px; border-bottom: 1px dashed rgba(18,168,255,0.4); padding-bottom: 10px;">
                    <div class="detail-item"><span class="detail-lbl">阵营:</span> ${renderDualTag(char, 'faction', 'hidden_faction', false)}</div>
                    <div class="detail-item"><span class="detail-lbl">组织:</span> ${renderDualTag(char, 'organization', 'hidden_org', true)}</div>
                    <div class="detail-item"><span class="detail-lbl">职位/职业:</span> ${renderDual(char, 'occupation', 'hidden_occupation')}</div>
                    <div class="detail-item"><span class="detail-lbl">籍贯:</span> ${renderDual(char, 'hometown', 'hidden_hometown')}</div>
                </div>
                <div class="form-grid-3" style="margin-bottom: 15px;">
                    <div class="detail-item"><span class="detail-lbl">性别:</span> ${char.gender}</div>
                    <div class="detail-item"><span class="detail-lbl">性别备注:</span> ${char.gender_notes || '无'}</div>
                    <div class="detail-item"><span class="detail-lbl">年龄:</span> ${char.age}</div>
                    <div class="detail-item"><span class="detail-lbl">性取向:</span> ${char.orientation || 'CLASSIFIED'}</div>
                    <div class="detail-item"><span class="detail-lbl">属性:</span> ${char.role || 'CLASSIFIED'}</div>
                    <div class="detail-item"><span class="detail-lbl">身高:</span> ${char.height}</div>
                    <div class="detail-item"><span class="detail-lbl">体重:</span> ${char.weight}</div>
                    <div class="detail-item"><span class="detail-lbl">血型:</span> ${char.blood}</div>
                </div>
                <div class="detail-text-block"><span class="detail-lbl">外貌:</span><br>${char.appearance}</div>
                <div class="detail-text-block"><span class="detail-lbl">性格:</span><br>${char.personality}</div>
                <div class="detail-text-block"><span class="detail-lbl">备注:</span><br>${renderDual(char, 'notes', 'hidden_notes')}</div>
                <div class="detail-text-block"><span class="detail-lbl">公开关系网:</span><br>${window.formatFamilyTies(char.family_ties)}</div>
                <div style="display: flex; justify-content: flex-end; margin-top: 15px;">
                    ${editActionHtml}
                </div>
            `;

            // 自动平滑滚动到详情面板，方便手机用户直接阅读
            setTimeout(() => {
                detailContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        };

        // 💥 展开详情面板
        window.showDetailOverlay = function(index) {
            window.isOverlayOpen = true; 
            window.currentOpenCharIndex = index; 

            const char = characterDB[index];
            if(!char) return;
            const overlay = document.getElementById('tunnel-detail-overlay');
            
            // 💥 修复：重置表里状态与行内动画，防止上一个角色的状态残留
            overlay.classList.remove('show-hidden');
            overlay.style.animation = ''; 
            
            overlay.style.display = 'flex';

            // 💥 新增：判断如果这个档案是当前用户自己的，给他一个编辑按钮
            let editActionHtml = '';
            if (char.owner_id === currentUser.id) {
                editActionHtml += `<button class="sys-modal-btn confirm" style="margin-top: 20px; margin-right: 15px;" onclick="editQueueChar('${char.id}')">[ 提交修改申请 ]</button>`;
            }
            // 💥 补回：如果是管理员，额外给他一个强制删除按钮
            if (['admin', 'super_admin'].includes(currentUser?.role)) {
                editActionHtml += `<button class="sys-modal-btn cancel" style="margin-top: 20px;" onclick="deleteChar('${char.id}')">[ 档案删除 ]</button>`;
            }

            overlay.innerHTML = `
                <div class="detail-header">
                     <!-- 标题等保持不变 -->
                    <h3 style="font-size: 26px; margin: 0; text-shadow: 0 0 15px #12a8ff; letter-spacing: 2px;">
                        ${char.is_private ? '<svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: #ff9800; vertical-align: middle; margin-top: -4px; margin-right: 8px; filter: drop-shadow(0 0 8px rgba(255,152,0,0.6));"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>' : ''}
                        <span style="color:#fff;">${renderDual(char, 'name', 'hidden_name')}</span> // ${renderDual(char, 'callsign', 'hidden_callsign')} ${getDecryptBtn(char)}
                    </h3>
                    <button class="close-btn" onclick="closeDetailOverlay()" style="font-size: 16px; padding: 5px 10px; border: 1px solid #f44336;">[X] CLOSE</button>
                </div>
                
                <!-- 中间的阵营、生理指标等所有内容全部保持你原来的代码 -->
                <div class="form-grid" style="margin-bottom: 10px; background: rgba(18,168,255,0.1); padding: 10px 20px; border-left: 3px solid #12a8ff;">
                    <div class="detail-item" style="margin:0;"><span class="detail-lbl">阵营:</span> ${renderDualTag(char, 'faction', 'hidden_faction', false)}</div>
                    <div class="detail-item" style="margin:0;"><span class="detail-lbl">组织:</span> ${renderDualTag(char, 'organization', 'hidden_org', true)}</div>
                    <div class="detail-item" style="margin:0;"><span class="detail-lbl">职位/职业:</span> ${renderDual(char, 'occupation', 'hidden_occupation')}</div>
                    <div class="detail-item" style="margin:0;"><span class="detail-lbl">籍贯:</span> ${renderDual(char, 'hometown', 'hidden_hometown')}</div>
                </div>

                <div class="form-grid-3" style="margin-bottom: 20px; background: rgba(18,168,255,0.05); padding: 20px; border: 1px solid rgba(18,168,255,0.3); box-shadow: inset 0 0 20px rgba(18,168,255,0.1);">
                    <div class="detail-item"><span class="detail-lbl">性别:</span> ${char.gender}</div>
                    <div class="detail-item"><span class="detail-lbl">性别备注:</span> ${char.gender_notes || '无'}</div>
                    <div class="detail-item"><span class="detail-lbl">年龄:</span> ${char.age}</div>
                    <div class="detail-item"><span class="detail-lbl">性取向:</span> ${char.orientation || 'CLASSIFIED'}</div>
                    <div class="detail-item"><span class="detail-lbl">属性:</span> ${char.role || 'CLASSIFIED'}</div>
                    <div class="detail-item"><span class="detail-lbl">生日:</span> ${char.dob}</div>
                    <div class="detail-item"><span class="detail-lbl">身高:</span> ${char.height}</div>
                    <div class="detail-item"><span class="detail-lbl">体重:</span> ${char.weight}</div>
                    <div class="detail-item"><span class="detail-lbl">血型:</span> ${char.blood}</div>
                </div>
                <div class="detail-text-block" style="font-size: 15px;"><span class="detail-lbl">外貌:</span><br>${char.appearance}</div>
                <div class="detail-text-block" style="font-size: 15px;"><span class="detail-lbl">性格:</span><br>${char.personality}</div>
                <div class="detail-text-block" style="font-size: 15px;"><span class="detail-lbl">备注:</span><br>${renderDual(char, 'notes', 'hidden_notes')}</div>
                <div class="detail-text-block" style="font-size: 15px;"><span class="detail-lbl">公开关系网:</span><br>${window.formatFamilyTies(char.family_ties)}</div>
                
                <!-- 💥 在底部的删除按钮旁边插入修改按钮 -->
                <div style="display: flex; justify-content: flex-start; align-items: center; margin-top: 20px;">
                    ${editActionHtml}
                </div>
            `;
        };

        // 💥 关闭详情面板
        window.closeDetailOverlay = function() {
            window.isOverlayOpen = false; // 记录状态：已关闭

            const overlay = document.getElementById('tunnel-detail-overlay');
            overlay.style.animation = 'cyber-collapse 0.3s forwards';
            setTimeout(() => {
                overlay.style.display = 'none';
                // 💥 修复核心：彻底清空行内动画属性，让 CSS 接管下一次的展开特效
                overlay.style.animation = ''; 
                
                if(window.tunnelItems) {
                    window.tunnelItems.forEach(i => {
                        if(i.type === 'card') {
                            i.el.querySelector('.tunnel-card').style.borderColor = 'rgba(18,168,255,0.4)';
                            i.el.querySelector('.tunnel-card').style.boxShadow = '0 0 15px rgba(18,168,255,0.2)';
                        }
                    });
                }
            }, 300);
        };

        /* =========================================================
           💥 人设填写表：世界观资料查询助手 💥
           ========================================================= */
        window.showLoreHelp = function(type) {
            let title = "";
            let msg = "";
            
            switch(type) {
                case 'faction':
                    title = "DATABASE // 阵营说明";
                    msg = "▶ 泛星联盟 (P.S.C)：\n掌握核心资源与星门，秩序与霸权的代表。适合扮演特工、正规军、财团雇员。\n\n▶ 外环 (Frontier)：\n边缘矿区与反抗者的聚集地，混乱但自由。适合扮演矿工、反抗军、走私客。\n\n▶ 独立防务承包商 (PMCs)：\n拿钱办事的私人武装。适合扮演雇佣兵、赏金猎人。\n\n▶ 自治空间站与自由港：\n中立的黑市与医疗站。适合扮演黑市商人、地下医生、极客。";
                    break;
                case 'org':
                    title = "DATABASE // 组织说明";
                    msg = "请先选择您的【所属阵营】，系统会自动列出该阵营下的已知组织与分支机构。\n\n如果您是独狼或自由人，可以在承包商或自由港阵营中选择无归属选项。";
                    break;
                case 'appearance':
                    title = "DATABASE // 外貌特征参考";
                    msg = "在深空环境下，您可以考虑添加以下特征：\n\n1. 义体改造：神经接口、机械义肢、光学义眼等（需注明是否为军用级）。\n2. 星尘病症状：长期接触 C-62 原矿会导致皮肤下出现微弱的荧光血管纹理，或部分器官纤维化。\n3. 辐射疤痕：深空作业或战斗留下的特殊痕迹。";
                    break;
                case 'notes':
                    title = "DATABASE // 备注说明";
                    msg = "可在此处补充您的：\n\n- 核心背景故事（如：前联盟特工、现外环走私犯）\n- 战斗专长（如：零重力爆破、电子战骇客、重火力压制）\n- 个人雷点或对戏偏好。";
                    break;
            }
            
            // 调用现成的终端弹窗系统
            SysModal.alert(msg, title);
        };

        /* =========================================================
           💥 阵营与组织跳转引擎 & 组织详细档案库 💥
           ========================================================= */
        
        // 3. 点击组织名称，打开全屏文章阅读器
        window.openOrgDetail = function(orgName) {
            const orgData = orgLoreDB[orgName];
            if (!orgData) {
                SysModal.alert("该组织的详细档案尚未解密或不存在。", "ACCESS DENIED");
                return;
            }
            
            // 调用现成的全屏文章阅读器
            openArticle({
                title: orgData.title,
                tag: orgData.tag,
                content: orgData.content
            });
        };

        // 💥 统一的阵营跳转函数 (直接打开全屏文章)
        window.scrollToFaction = function(factionName) {
            openFactionDetail(factionName);
        };

        window.openFactionDetail = function(factionName) {
            const data = factionLoreDB[factionName];
            if (!data) {
                SysModal.alert("该阵营的详细档案尚未解密。", "ACCESS DENIED");
                return;
            }
            openArticle({
                title: data.title,
                tag: data.tag,
                content: data.content
            });
        };

        /* =========================================================
           💥 全动态阵营与组织引擎 (支持散人与自创组织) 💥
           ========================================================= */
        
        // 1. 动态生成下拉菜单选项
        window.updateDropdowns = function() {
    const fFaction = document.getElementById('f-faction');
    const hFaction = document.getElementById('h-faction');
    const oParentFaction = document.getElementById('o-parent-faction'); // 组织申请表的阵营下拉框

    // 从数据库里抓取所有类型为 faction 的文章标题
    const factions = articlesDB.filter(a => a.type === 'faction').map(a => a.title);
    
    const buildFactionOptions = (defaultText) => {
        let html = `<option value="" disabled selected>${defaultText}</option>`;
        html += '<option value="无阵营 / 独立势力">无阵营 / 独立势力</option>';
        factions.forEach(f => {
            html += `<option value="${f}">${f}</option>`;
        });
        return html;
    };

    // 记录当前选中的值，防止刷新时丢失
    const fVal = fFaction ? fFaction.value : null;
    const hVal = hFaction ? hFaction.value : null;
    const oVal = oParentFaction ? oParentFaction.value : null;
    
    if (fFaction) {
        fFaction.innerHTML = buildFactionOptions('-- 接入星际网络选择阵营 --');
        if (fVal) fFaction.value = fVal;
    }
    if (hFaction) {
        hFaction.innerHTML = buildFactionOptions('-- 选择真实阵营 --');
        if (hVal) hFaction.value = hVal;
    }
    if (oParentFaction) {
        oParentFaction.innerHTML = buildFactionOptions('-- 选择所属阵营 --');
        if (oVal) oParentFaction.value = oVal;
    }

    if (typeof updateRosterFilters === 'function') updateRosterFilters(); // 同步更新人设库的下拉框
};

        // 2. 监听阵营选择，动态生成对应的下属组织
        const bindFactionChange = (factionSelectId, orgSelectId) => {
            const factionSelect = document.getElementById(factionSelectId);
            const orgSelect = document.getElementById(orgSelectId);
            if (!factionSelect || !orgSelect) return;

            factionSelect.addEventListener('change', function() {
                const selectedFaction = this.value;
                
                // 从数据库里抓取属于该阵营的组织
                const orgs = articlesDB.filter(a => a.type === 'org' && a.keywords && a.keywords.includes(`[PARENT:${selectedFaction}]`)).map(a => a.title);
                
                orgSelect.innerHTML = '<option value="" disabled selected>-- 选择所属分支机构 --</option>';
                // 💥 永远保留“无归属”选项，允许阵营内的独狼，或纯散人
                orgSelect.innerHTML += '<option value="无归属 / 独狼">无归属 / 独狼</option>'; 
                
                orgs.forEach(org => {
                    orgSelect.innerHTML += `<option value="${org}">${org}</option>`;
                });
                orgSelect.disabled = false;
            });
        };

        const bindOrgChangeForPositions = (orgSelectId, occSelectWrapperId, occSelectId, occCustomId) => {
            const orgSelect = document.getElementById(orgSelectId);
            const occSelectWrapper = document.getElementById(occSelectWrapperId);
            const occSelect = document.getElementById(occSelectId);
            const occCustom = document.getElementById(occCustomId);

            if (!orgSelect || !occSelect) return;

            orgSelect.addEventListener('change', function() {
                const orgName = this.value;
                console.log(`[系统诊断] 选择了组织: ${orgName}`);
                const orgData = articlesDB.find(a => a.type === 'org' && a.title === orgName);
                
                occSelect.innerHTML = '<option value="custom">-- 自定义新职位 --</option>';
                
                if (orgData) {
                    const posObj = window.getOrgPositions(orgData.content);
                    console.log(`[系统诊断] 解析到的职位数据:`, posObj);
                    
                    if (posObj && Object.keys(posObj).length > 0) {
                        occSelectWrapper.style.display = 'flex'; 
                        occCustom.style.display = 'none'; 
                        occCustom.value = '';

                        const approvedChars = characterDB.filter(c => c.status === 'approved');
                        let firstAvailable = null;
                        
                        for (const [pos, limit] of Object.entries(posObj)) {
                            let count = 0;
                            approvedChars.forEach(c => {
                                if (c.organization === orgName && c.occupation === pos) count++;
                                if (c.has_hidden && c.hidden_org === orgName && c.hidden_occupation === pos) count++;
                            });
                            
                            const isFull = limit > 0 && count >= limit;
                            const opt = document.createElement('option');
                            opt.value = pos;
                            opt.textContent = limit > 0 ? `${pos} (${count}/${limit}) ${isFull ? '- 已满员 🚫' : ''}` : `${pos} (招募不限额)`;
                            
                            if (isFull) {
                                opt.disabled = true;
                            } else if (!firstAvailable) {
                                firstAvailable = pos; // 记录第一个没满员的职位
                            }
                            occSelect.appendChild(opt);
                        }
                        
                        // 💥 智能体验升级：如果有没满员的职位，默认选中第一个；否则选中自定义
                        if (firstAvailable) {
                            occSelect.value = firstAvailable;
                            occCustom.style.display = 'none';
                            occCustom.value = firstAvailable;
                        } else {
                            occSelect.value = 'custom';
                            occCustom.style.display = 'block'; 
                        }
                        console.log(`[系统诊断] 下拉框已成功显示！`);
                    } else {
                        console.log(`[系统诊断] 该组织没有预设职位`);
                        occSelectWrapper.style.display = 'none';
                        occCustom.style.display = 'block';
                        occCustom.value = '';
                    }
                } else {
                    console.log(`[系统诊断] 未找到组织数据`);
                    occSelectWrapper.style.display = 'none';
                    occCustom.style.display = 'block';
                }
                
                if (window.checkRpRequirement) window.checkRpRequirement();
            });

            occSelect.addEventListener('change', function() {
                if (this.value === 'custom') {
                    occCustom.style.display = 'block';
                    occCustom.value = '';
                    occCustom.focus();
                } else {
                    occCustom.style.display = 'none';
                    occCustom.value = this.value;
                }
                if (window.checkRpRequirement) window.checkRpRequirement();
            });
        };

        bindOrgChangeForPositions('f-org', 'f-occupation-select-wrapper', 'f-occupation-select', 'f-occupation-custom');
        bindOrgChangeForPositions('h-org', 'h-occupation-select-wrapper', 'h-occupation-select', 'h-occupation-custom');

        // 💥 动态检测是否需要显示自戏考核框
        window.checkRpRequirement = function() {
            const orgName = document.getElementById('f-org').value;
            const occSelect = document.getElementById('f-occupation-select').value;
            const occCustom = document.getElementById('f-occupation-custom').value.trim();
            const occ = occSelect === 'custom' ? occCustom : occSelect;

            const rpGroup = document.getElementById('rp-sample-group');
            
            if (!orgName || !occ) {
                rpGroup.style.display = 'none';
                return;
            }

            const orgData = articlesDB.find(a => a.type === 'org' && a.title === orgName);
            if (orgData) {
                const rpReqStr = window.getOrgRpPositions(orgData.content);
                if (!rpReqStr) {
                    rpGroup.style.display = 'none';
                    return;
                }
                
                if (rpReqStr === 'ALL') {
                    rpGroup.style.display = 'block';
                } else {
                    const reqList = rpReqStr.split(/[,，]/).map(s => s.trim());
                    if (reqList.includes(occ)) {
                        rpGroup.style.display = 'block';
                    } else {
                        rpGroup.style.display = 'none';
                    }
                }
            } else {
                rpGroup.style.display = 'none';
            }
        };

        document.getElementById('f-org').addEventListener('change', window.checkRpRequirement);
        document.getElementById('f-occupation-select').addEventListener('change', window.checkRpRequirement);
        document.getElementById('f-occupation-custom').addEventListener('input', window.checkRpRequirement);



        // 绑定表里两套表单的联动
        bindFactionChange('f-faction', 'f-org');
        bindFactionChange('h-faction', 'h-org');

        // 3. 动态点击标签，直接从数据库调取文章
        window.openOrgDetail = function(orgName) {
            if (orgName === '无归属 / 独狼') {
                SysModal.alert("该公民为独立自由人，无所属组织档案。", "SYSTEM NOTE");
                return;
            }
            const article = articlesDB.find(a => a.type === 'org' && a.title === orgName);
            if (article) {
                openArticle({ title: article.title, tag: article.tag, content: article.content });
            } else {
                SysModal.alert("该组织的详细档案尚未解密或不存在。", "ACCESS DENIED");
            }
        };

        window.scrollToFaction = function(factionName) {
            if (factionName === '无阵营 / 独立势力') {
                SysModal.alert("该公民属于独立势力，无特定阵营档案。", "SYSTEM NOTE");
                return;
            }
            const article = articlesDB.find(a => a.type === 'faction' && a.title === factionName);
            if (article) {
                openArticle({ title: article.title, tag: article.tag, content: article.content });
            } else {
                SysModal.alert("该阵营的详细档案尚未解密或不存在。", "ACCESS DENIED");
            }
        };

        /* =========================================================
           💥 移动端：悬浮目录小圆球拖拽与智能展开逻辑 💥
           ========================================================= */
        const worldToc = document.querySelector('.world-toc');
        if (worldToc) {
            let isDragging = false;
            let hasMoved = false;
            let startX, startY, initialLeft, initialTop;

            // 1. 手指按下
            worldToc.addEventListener('touchstart', (e) => {
                if (window.innerWidth > 900) return;
                
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                
                // 💥 核心修复：使用 offsetLeft/Top 替代 getBoundingClientRect
                // 这样可以无视 transform 动画带来的坐标偏移，彻底解决“向右平移”的灵异跳动！
                initialLeft = worldToc.offsetLeft;
                initialTop = worldToc.offsetTop;
                
                isDragging = true;
                hasMoved = false;
            }, { passive: false });

            // 2. 手指滑动
            worldToc.addEventListener('touchmove', (e) => {
                if (!isDragging || window.innerWidth > 900) return;
                
                const touch = e.touches[0];
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;
                
                // 💥 核心修复：将防误触阈值提高到 15px，过滤掉点击时的轻微手抖
                if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
                    hasMoved = true;
                    // 💥 核心修复：先问浏览器能不能取消，能取消再阻止默认滚动
                    if (e.cancelable) {
                        e.preventDefault(); 
                    }
                    worldToc.classList.remove('open');
                    document.getElementById('overlay').classList.remove('show'); // 💥 拖拽时收起毛玻璃
                }

                if (hasMoved) {
                    let newLeft = initialLeft + dx;
                    let newTop = initialTop + dy;
                    
                    // 💥 核心修复：减去 15px 安全边距，防止球被拖到屏幕外面去
                    const maxLeft = document.documentElement.clientWidth - worldToc.offsetWidth - 15;
                    const maxTop = document.documentElement.clientHeight - worldToc.offsetHeight - 15;
                    
                    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
                    newTop = Math.max(0, Math.min(newTop, maxTop));
                    
                    worldToc.style.left = `${newLeft}px`;
                    worldToc.style.top = `${newTop}px`;
                    worldToc.style.bottom = 'auto'; 
                    worldToc.style.right = 'auto';  
                }
            }, { passive: false });

            // 3. 手指抬起 (智能边缘检测 + 晃动动画)
            worldToc.addEventListener('touchend', (e) => {
                if (window.innerWidth > 900) return;
                isDragging = false;
                
                if (!hasMoved) {
                    // 💥 核心修复：如果点到的是展开的菜单内部（包括文字和下拉箭头），直接放行，不要触发圆球的收起逻辑！
                    if (e.target.closest('.toc-list')) return;

                    // 触发按钮本体的上下弹动动画
                    worldToc.classList.remove('wobble');
                    void worldToc.offsetWidth; // 触发重绘，重置动画
                    worldToc.classList.add('wobble');

                    // 💥 智能边缘检测逻辑 💥
                    const rect = worldToc.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;

                    // 清除旧的定位类
                    worldToc.classList.remove('expand-up', 'expand-down', 'align-left', 'align-right');

                    // 判断上下：如果在屏幕下半部分，就向上展开；否则向下展开
                    if (centerY > window.innerHeight / 2) {
                        worldToc.classList.add('expand-up');
                    } else {
                        worldToc.classList.add('expand-down');
                    }

                    // 判断左右：如果在屏幕右半部分，文字就靠右对齐；否则靠左对齐
                    let isAlignLeft = false;
                    if (centerX > window.innerWidth / 2) {
                        worldToc.classList.add('align-right');
                    } else {
                        worldToc.classList.add('align-left');
                        isAlignLeft = true;
                    }

                    // 💥 DYNAMIC CLAMPING: 自动探测手机屏幕宽度，计算出安全边界！
                    let offsetFix = 0;
                    const menuWidth = 180; // 目录的固定宽度
                    if (isAlignLeft) {
                        // 靠左对齐时，目录向右展开。检查展开后右边缘是否会戳破屏幕
                        const expectedRight = rect.left + 23 + menuWidth;
                        if (expectedRight > window.innerWidth - 10) {
                            offsetFix = (window.innerWidth - 10) - expectedRight; // 产生负值，强制向左推回屏幕内
                        }
                    } else {
                        // 靠右对齐时，目录向左展开。检查展开后左边缘是否会戳破屏幕
                        const expectedLeft = rect.right - 23 - menuWidth;
                        if (expectedLeft < 10) {
                            offsetFix = 10 - expectedLeft; // 产生正值，强制向右推回屏幕内
                        }
                    }
                    // 把计算好的偏移量交给 CSS 去执行推移动作
                    worldToc.style.setProperty('--menu-shift', `${offsetFix}px`);

                    // 切换菜单显示状态
                    worldToc.classList.toggle('open');
                    // 💥 联动：展开时显示全屏毛玻璃，收起时隐藏
                    if (worldToc.classList.contains('open')) {
                        document.getElementById('overlay').classList.add('show');
                    } else {
                        document.getElementById('overlay').classList.remove('show');
                    }
                }
            });

            // 4. 点击菜单里的按钮后，自动收起菜单并触发晃动
            const tocBtnsMobile = worldToc.querySelectorAll('.toc-btn');
            tocBtnsMobile.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (window.innerWidth <= 900) {
                        worldToc.classList.remove('open');
                        document.getElementById('overlay').classList.remove('show'); // 💥 点击跳转后收起毛玻璃
                        worldToc.classList.remove('wobble');
                        void worldToc.offsetWidth;
                        worldToc.classList.add('wobble');
                    }
                });
            });
        }

        /* =========================================================
           💥 CMS 内容管理系统引擎 (全动态终极完整版) 💥
           ========================================================= */
        let articlesDB = [];
        let editingArticleId = null;

        // 👇👇👇 复制这段代码放在这里 👇👇👇
        // 💥 管理员控制台：切换 阵营/组织 Tab 选项卡
        window.switchAdminTab = function(tabId) {
            document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
            
            const targetBtn = document.querySelector(`.admin-tab-btn[data-tab="${tabId}"]`);
            const targetContent = document.getElementById(tabId);
            
            if(targetBtn && targetContent) {
                targetBtn.classList.add('active');
                targetContent.classList.add('active');
                sessionStorage.setItem('tf141_admin_tab', tabId); // 💥 记忆管理员 Tab
            }
        };
        // 👆👆👆 复制到这里结束 👆👆👆

        // 1. 打开全屏编辑器 (智能记忆来路版)
        window.openAdminEditor = function(defaultType = 'intel') {
            window.lastScrollY = window.scrollY || window.pageYOffset; // 💥 记录滚动位置
            // 💥 记录是从哪个页面点进来的
            const currentActivePanel = document.querySelector('.view-panel.active');
            if (currentActivePanel && currentActivePanel.id !== 'adminEditorView') {
                window.editorPreviousViewId = currentActivePanel.id;
            }

            // 💥 动态修改返回按钮的文字
            const returnBtn = document.querySelector('#adminEditorView .btn-ghost');
            if (returnBtn) {
                if (window.editorPreviousViewId === 'storyView') {
                    returnBtn.innerHTML = '&lt; 返回';
                } else {
                    returnBtn.innerHTML = '&lt; 返回';
                }
            }

            editingArticleId = null;
            document.getElementById('admin-article-form').reset();

            // 清空富文本编辑器
            if(window.quill) {
                window.quill.root.innerHTML = '';
            }
            
            const typeSelect = document.getElementById('a-type');
            const parentGroup = document.getElementById('parent-faction-group');
            const parentSelect = document.getElementById('a-parent-faction');

            if (typeSelect) {
                typeSelect.value = defaultType;
                typeSelect.style.pointerEvents = 'none';
                typeSelect.style.opacity = '0.6';
            }

            if (defaultType === 'org') {
                document.getElementById('admin-org-positions-group').style.display = 'block';
                document.getElementById('admin-org-rp-group').style.display = 'block';
                document.getElementById('admin-org-reqs-group').style.display = 'block';
                parentGroup.style.display = 'flex';
                parentSelect.innerHTML = '<option value="" disabled selected>-- 请选择所属阵营 --</option>';
                const factions = articlesDB.filter(a => a.type === 'faction');
                factions.forEach(f => {
                    parentSelect.innerHTML += `<option value="${f.title}">${f.title}</option>`;
                });
                // 允许管理员创建不属于任何大阵营的独立组织
                parentSelect.innerHTML += '<option value="无阵营 / 独立势力">无阵营 / 独立势力</option>';
            } else {
                // 💥 核心修复：如果不是组织，把这三个框全部隐藏！
                document.getElementById('admin-org-positions-group').style.display = 'none';
                document.getElementById('admin-org-rp-group').style.display = 'none';
                document.getElementById('admin-org-reqs-group').style.display = 'none';
                parentGroup.style.display = 'none';
            }

            if (defaultType === 'faction' || defaultType === 'org') {
                document.getElementById('admin-channel-admins-group').style.display = 'block'; 
            } else {
                document.getElementById('admin-channel-admins-group').style.display = 'none';
            }

            let titleText = "[ 📝 新建核心情报 ]";
            if (defaultType === 'faction') titleText = "[ 📝 新建主阵营 ]";
            if (defaultType === 'org') titleText = "[ 📝 新建下属组织 ]";
            if (defaultType === 'timeline') titleText = "[ 📝 新建时间轴事件 ]"; 
            if (defaultType === 'plot') titleText = "[ 📝 更新主线剧情 ]"; // 💥 顺便加上剧情的标题提示
            if (defaultType === 'warning') titleText = "[ 📝 发布系统警告 ]"; // 👈 新增这一行
            
            document.getElementById('editor-main-title').innerText = titleText;
            document.getElementById('btn-publish-article').innerText = "[ UPLOAD TO DATABASE // 发布至数据库 ]";

            const tagInput = document.getElementById('a-tag');
            if (defaultType === 'timeline' && tagInput) {
                tagInput.placeholder = "必须填写纯数字年份 (例如: 2190)";
            } else if (tagInput) {
                tagInput.placeholder = "例如: ✦ LORE // 核心物质";
            }

            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById('adminEditorView').classList.add('active');
            window.scrollTo({ top: 0, behavior: 'instant' });
        };

        // 2. 关闭全屏编辑器 (智能返回版)
        window.closeAdminEditor = function() {
            editingArticleId = null;
            document.getElementById('admin-article-form').reset();
            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            
            const targetPanelId = window.editorPreviousViewId || 'adminView';
            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel) {
                targetPanel.classList.add('active');
                sessionStorage.setItem('tf141_current_view', targetPanelId);
            }
            
            // 💥 核心修复：延迟 50ms 等待 DOM 渲染完毕后再滚动，确保定位精准！
            setTimeout(() => {
                window.scrollTo({ top: window.lastScrollY || 0, behavior: 'auto' });
            }, 50);
        };

        // 3. 发布/更新文章到 Supabase
        document.getElementById('btn-publish-article').addEventListener('click', async () => {
            const btn = document.getElementById('btn-publish-article');
            const type = document.getElementById('a-type').value;
            const title = document.getElementById('a-title').value.trim();
            const tag = document.getElementById('a-tag').value.trim();
            const icon = "";
            let keywords = document.getElementById('a-keywords').value.trim();
            const summary = document.getElementById('a-summary').value.trim();
            let content = window.quill.root.innerHTML.trim();

            // 💥 新增：获取频道管理员输入框的值
            const channel_admins = document.getElementById('a-channel-admins') ? document.getElementById('a-channel-admins').value.trim() : '';

            content = content.replace(/<div data-positions='.*?' style='display:none;'><\/div>/g, '').replace(/<div data-rp-positions='.*?' style='display:none;'><\/div>/g, '').replace(/<div data-reqs='.*?' style='display:none;'><\/div>/g, '').replace(/<div data-updates='.*?' style='display:none;'><\/div>/g, '');
            if (type === 'org') {
                const posStr = document.getElementById('a-org-positions').value.trim();
                const posObj = parsePositionsStr(posStr);
                if (posObj && Object.keys(posObj).length > 0) {
                    content += `<div data-positions='${JSON.stringify(posObj)}' style='display:none;'></div>`;
                }
                const rpPosStr = document.getElementById('a-rp-positions').value.trim();
                if (rpPosStr) {
                    content += `<div data-rp-positions='${rpPosStr}' style='display:none;'></div>`;
                }
                const reqsStr = document.getElementById('a-org-reqs').value.trim();
                if (reqsStr) {
                    const encodedReqs = reqsStr.replace(/\n/g, '&#10;');
                    content += `<div data-reqs='${encodedReqs}' style='display:none;'></div>`;
                }
            }

            if (!title || !content) {
                SysModal.alert("标题和正文不能为空！", "⚠️ 格式错误");
                return;
            }

            if (type === 'org') {
                const parentFaction = document.getElementById('a-parent-faction').value;
                if (!parentFaction) {
                    SysModal.alert("新建组织必须选择所属阵营！", "⚠️ 格式错误");
                    return;
                }
                if (!keywords.includes(`[PARENT:${parentFaction}]`)) {
                    keywords += ` [PARENT:${parentFaction}]`;
                }
            }

            btn.innerHTML = `[ ${CyberLang.icon} ${CyberLang.get('processing')} ]`;
            btn.disabled = true;

            try {
                const currentTime = new Date().toISOString();

                if (editingArticleId) {
                    // 💥 核心：把 channel_admins 存入数据库
                    const { error } = await supabaseClient.from('articles').update({
                        type, title, tag, icon, keywords, summary, content, channel_admins, updated_at: currentTime
                    }).eq('id', editingArticleId);
                    if (error) throw error;
                    await SysModal.alert("数据已成功更新！", "更新成功");
                } else {
                    // 💥 核心：把 channel_admins 存入数据库
                    const { error } = await supabaseClient.from('articles').insert([{
                        type, title, tag, icon, keywords, summary, content, channel_admins, updated_at: currentTime,
                        status: 'approved', owner_id: 'system'
                    }]);
                    if (error) throw error;
                    await SysModal.alert("数据已成功写入星际网络！", "发布成功");
                }

                closeAdminEditor();
                fetchArticles(); 
            } catch (err) {
                console.error(err);
                SysModal.alert("操作失败，请检查网络或数据库权限。", "✕ ERROR");
                btn.innerText = editingArticleId ? "[ UPDATE DATABASE // 覆盖保存 ]" : "[ UPLOAD TO DATABASE // 发布至数据库 ]";
            } finally {
                btn.disabled = false;
            }
        });

        // 5. 动态渲染主界面和世界观的阵营区
        function renderFactions() {
            const mainGrid = document.getElementById('main-faction-grid');
            const worldGrid = document.getElementById('world-faction-grid');
            if (!mainGrid || !worldGrid) return;

            mainGrid.innerHTML = '';
            worldGrid.innerHTML = '';

            const factions = articlesDB.filter(a => a.type === 'faction');
            const orgs = articlesDB.filter(a => a.type === 'org');

            if (factions.length === 0) {
                mainGrid.innerHTML = '<div style="color:#8bb9d6; font-family:monospace;">[ 暂无阵营数据，请等待管理员上传 ]</div>';
                worldGrid.innerHTML = '<div style="color:#8bb9d6; font-family:monospace;">[ 暂无阵营数据，请等待管理员上传 ]</div>';
                return;
            }

            const order = ["泛星联盟", "外环", "独立防务承包商", "自治空间站与自由港"];
            factions.sort((a, b) => {
                let idxA = order.findIndex(o => a.title.includes(o));
                let idxB = order.findIndex(o => b.title.includes(o));
                if (idxA === -1) idxA = 99;
                if (idxB === -1) idxB = 99;
                return idxA - idxB;
            });

            factions.forEach(faction => {
                const childOrgs = orgs.filter(o => o.keywords && o.keywords.includes(`[PARENT:${faction.title}]`));

                let colorClass = 'pmc';
                let factionId = `faction-${faction.id}`; // 默认兜底 ID
                
                // 💥 修复：为四大阵营精准分配 ID，以便左侧目录能够成功跳转！
                if (faction.title.includes('联盟')) { colorClass = 'psc'; factionId = 'faction-psc'; }
                else if (faction.title.includes('外环')) { colorClass = 'frontier'; factionId = 'faction-frontier'; }
                else if (faction.title.includes('承包商')) { colorClass = 'pmc'; factionId = 'faction-pmc'; }
                else if (faction.title.includes('自由港') || faction.title.includes('空间站')) { colorClass = 'freeport'; factionId = 'faction-freeport'; }

                let subOrgsHTMLMain = childOrgs.map(org => `
                    <button class="sub-org-btn" onclick="openArticleById('${org.id}')">
                        <strong>${org.title}</strong>
                        <span>${org.summary}</span>
                    </button>
                `).join('');

                mainGrid.innerHTML += `
                    <div class="faction-card ${colorClass}" id="${factionId}">
                        <div class="faction-header">
                            <h3 style="cursor: pointer; text-decoration: underline; text-underline-offset: 4px; transition: 0.2s;" onclick="openArticleById('${faction.id}')" onmouseover="this.style.color='#12a8ff'" onmouseout="this.style.color='#fff'">${faction.title}</h3>
                            <span class="faction-tag">${faction.tag}</span>
                        </div>
                        <p class="faction-desc">${faction.summary}</p>
                        <div class="sub-org-list">
                            ${subOrgsHTMLMain}
                        </div>
                    </div>
                `;

                let subOrgsHTMLWorld = childOrgs.map(org => `
                    <button class="index-org-btn" onclick="openArticleById('${org.id}')">└ ${org.title}</button>
                `).join('');

                worldGrid.innerHTML += `
                    <div class="intel-card" style="cursor: default; display: flex; flex-direction: column;">
                        <span class="card-level">${faction.tag}</span>
                        <h3 class="card-name" style="font-size: 1.6rem;">${faction.title}</h3>
                        <p class="card-desc" style="flex-grow: 1;">${faction.summary}</p>
                        <button class="btn-ghost" style="width: 100%; padding: 12px; font-size: 14px; margin-bottom: 20px;" onclick="openArticleById('${faction.id}')">点击阅读 →</button>
                        <div style="border-top: 1px dashed rgba(18,168,255,0.3); padding-top: 15px; display: flex; flex-direction: column; gap: 5px;">
                            <span style="color: #12a8ff; font-size: 12px; font-family: monospace; margin-bottom: 5px;">[ 下属组织档案 ]</span>
                            ${subOrgsHTMLWorld}
                        </div>
                    </div>
                `;
            });
            // 💥 新增：单独渲染“无阵营 / 独立势力”的虚拟卡片
            const independentOrgs = orgs.filter(o => o.keywords && o.keywords.includes('[PARENT:无阵营 / 独立势力]'));
            if (independentOrgs.length > 0) {
                let subOrgsHTMLMain = independentOrgs.map(org => `
                    <button class="sub-org-btn" onclick="openArticleById('${org.id}')">
                        <strong>${org.title}</strong>
                        <span>${org.summary}</span>
                    </button>
                `).join('');

                mainGrid.innerHTML += `
                    <div class="faction-card" style="border-top: 4px solid #9e9e9e;">
                        <div class="faction-header">
                            <h3 style="color: #fff;">无阵营 / 独立势力</h3>
                            <span class="faction-tag" style="color: #9e9e9e; background: rgba(158,158,158,0.1); border: 1px solid rgba(158,158,158,0.3);">INDEPENDENT</span>
                        </div>
                        <p class="faction-desc">不隶属于任何大型星际政体的独立组织、佣兵团与游荡者聚落。</p>
                        <div class="sub-org-list">${subOrgsHTMLMain}</div>
                    </div>
                `;

                let subOrgsHTMLWorld = independentOrgs.map(org => `
                    <button class="index-org-btn" onclick="openArticleById('${org.id}')">└ ${org.title}</button>
                `).join('');

                worldGrid.innerHTML += `
                    <div class="intel-card" style="cursor: default; display: flex; flex-direction: column;">
                        <span class="card-level" style="color: #9e9e9e; border-color: #9e9e9e; background: rgba(158,158,158,0.1);">INDEPENDENT</span>
                        <h3 class="card-name" style="font-size: 1.6rem;">无阵营 / 独立势力</h3>
                        <p class="card-desc" style="flex-grow: 1;">不隶属于任何大型星际政体的独立组织、佣兵团与游荡者聚落。</p>
                        <div style="border-top: 1px dashed rgba(158,158,158,0.3); padding-top: 15px; display: flex; flex-direction: column; gap: 5px;">
                            <span style="color: #9e9e9e; font-size: 12px; font-family: monospace; margin-bottom: 5px;">[ 下属组织档案 ]</span>
                            ${subOrgsHTMLWorld}
                        </div>
                    </div>
                `;
            }
            // 💥 新增：阵营卡片渲染完毕后，更新中心探测雷达
            if (typeof updateCenterFocusTargets === 'function') updateCenterFocusTargets();
        }

        window.openArticleById = function(id) {
            const article = articlesDB.find(a => String(a.id) === String(id));
            if (article) {
                // 💥 核心修复：直接把整个包含 type 和 summary 的对象传过去！
                openArticle(article); 
            } else {
                SysModal.alert("该档案尚未解密或不存在。", "ACCESS DENIED");
            }
        };

        // 6. 动态渲染时间轴
        function renderTimeline() {
            const nav = document.getElementById('dynamic-timeline-nav');
            const content = document.getElementById('dynamic-timeline-content');
            if (!nav || !content) return;

            nav.innerHTML = '';
            content.innerHTML = '';

            let timelineArticles = articlesDB.filter(a => a.type === 'timeline');
            
            // 💥 修复：只提取第一个出现的数字作为排序依据，防止 "2190-2200" 变成 21902200 被排到最后
            timelineArticles.sort((a, b) => {
                const matchA = String(a.tag || '').match(/\d+/);
                const matchB = String(b.tag || '').match(/\d+/);
                const yearA = matchA ? parseInt(matchA[0], 10) : 0;
                const yearB = matchB ? parseInt(matchB[0], 10) : 0;
                return yearA - yearB;
            });

            // 💥 新增：动态更新世界观页面的时间线预览卡片
            const previewTitle = document.getElementById('timeline-preview-title');
            const previewNodes = document.getElementById('timeline-preview-nodes');
            
            if (previewTitle && previewNodes) {
                if (timelineArticles.length > 0) {
                    // 提取最早和最晚的年份
                    const firstYear = timelineArticles[0].tag || '未知';
                    const lastYear = timelineArticles[timelineArticles.length - 1].tag || '未知';
                    previewTitle.innerText = `星历 ${firstYear} - ${lastYear}`;
                    
                    // 智能抽取最多 5 个节点展示在微缩图上
                    let displayYears = [];
                    if (timelineArticles.length <= 5) {
                        displayYears = timelineArticles.map(a => a.tag);
                    } else {
                        displayYears.push(timelineArticles[0].tag);
                        const step = (timelineArticles.length - 1) / 4;
                        for (let i = 1; i < 4; i++) {
                            displayYears.push(timelineArticles[Math.round(i * step)].tag);
                        }
                        displayYears.push(timelineArticles[timelineArticles.length - 1].tag);
                        displayYears = [...new Set(displayYears)]; // 去重
                    }
                    previewNodes.innerHTML = displayYears.map(y => `<span>${y}</span>`).join(' <span>→</span> ');
                } else {
                    previewTitle.innerText = `星历 暂无数据`;
                    previewNodes.innerHTML = `<span>AWAITING_DATA</span>`;
                }
            }

            if (timelineArticles.length === 0) {
                content.innerHTML = '<div style="color:#8bb9d6; padding: 50px; font-family: monospace;">[ 暂无时间轴数据，请等待管理员上传 ]</div>';
                return;
            }

            timelineArticles.forEach((item, index) => {
                const id = `tl-sec-${item.id}`;
                
                const li = document.createElement('li');
                if (index === 0) li.className = 'active';
                li.innerHTML = `
                    <a data-scroll="${id}">
                        <span class="timeline-nav__counter">${item.tag || '未知'}</span>
                        <h3 class="timeline-nav__title">${item.title}</h3>
                        <p class="timeline-nav__body">${item.summary}</p>
                    </a>
                `;
                nav.appendChild(li);

                const sec = document.createElement('section');
                sec.className = 'timeline-section';
                sec.id = id;
                sec.innerHTML = `
                    <h2 class="parallax-ghost" data-speed="0.2">${item.tag || '0000'}</h2>
                    <div class="content-box">
                        <!-- 💥 手机端专属头部：显示年份、标题和简介 -->
                        <div class="timeline-mobile-header">
                            <div class="tm-year">${item.tag || '未知'}</div>
                            <h3 class="tm-title">${item.title}</h3>
                            <p class="tm-summary">${item.summary}</p>
                        </div>
                        ${item.content}
                    </div>
                `;
                content.appendChild(sec);
            });

            document.querySelectorAll('.timeline-nav a').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('data-scroll');
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) {
                        const yOffset = window.innerWidth <= 900 ? -120 : 0;
                        const y = targetEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                });
            });

            if (window.tlObserver) {
                window.tlObserver.disconnect();
                document.querySelectorAll('.timeline-section').forEach(sec => {
                    window.tlObserver.observe(sec);
                });
            }
        }

        // 💥 动态渲染主页的系统警告卡片 (V2 硬核版)
        window.renderSystemWarning = function() {
            const container = document.getElementById('dynamic-warning-container');
            if (!container) return;
            
            // 从数据库中筛选出 type 为 warning 的文章，按时间倒序（最新的在最前面）
            const warnings = articlesDB.filter(a => a.type === 'warning').sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            
            // 默认的兜底文案
            let warningTitle = "SYSTEM WARNING // 医疗警告";
            let warningContent = "<p>开采是有代价的。原矿带有极强的神经毒性辐射，长期接触的底层矿工会患上不可逆的“星尘病”（器官纤维化与幻觉）。为了争夺这种沾满鲜血的能源，整个星系被撕裂成了三大阵营。</p>";
            
            // 如果数据库里有数据，就用数据库里最新的那条覆盖！
            if (warnings.length > 0) {
                warningTitle = warnings[0].title;
                warningContent = warnings[0].content;
            }
            
            container.innerHTML = `
    <div class="cyber-warning-card" id="warning-card-main">
    <div class="warning-scanline"></div>
    <div class="hazard-stripes top"></div>

    <div class="warning-top-bar">
        <div class="warning-header-text">
            <svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:#f44336;flex-shrink:0;"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            ${warningTitle}
        </div>
        <div class="warning-countdown">
            NEXT ALERT IN&nbsp;<span class="warning-countdown-digits" id="warning-cd">00:00:00</span>
        </div>
    </div>

    <div class="warning-expandable">
        <div class="warning-expandable-inner">
            <div class="warning-stats-bar">
                <div class="warning-stat">INFECTED<span class="warning-stat-val" id="wstat-a">──</span></div>
                <div class="warning-stat">FATALITY RATE<span class="warning-stat-val" id="wstat-b">──</span></div>
                <div class="warning-stat">ALERT LEVEL<span class="warning-stat-val" id="wstat-c">──</span></div>
                <div class="warning-stat">SECTORS AT RISK<span class="warning-stat-val" id="wstat-d">──</span></div>
            </div>
            <div class="warning-body">
                <div class="warning-content-text">${warningContent}</div>
            </div>
            <div class="hazard-stripes bottom"></div>
        </div>
    </div>
</div>
`;

function animateVal(id, target, suffix = '') {
    const el = document.getElementById(id);
    if (!el) return;
    const duration = 1200;
    const startTime = performance.now();
    function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString() + suffix;
    }
    requestAnimationFrame(step);
}

function resetWarningStats() {
    ['wstat-a','wstat-b','wstat-c','wstat-d'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '──';
    });
}

setTimeout(() => {
    const card = document.getElementById('warning-card-main');
    if (!card) return;

    let isExpanded = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // 1. 展开：当卡片露出 15% 时触发
            if (entry.isIntersecting && entry.intersectionRatio >= 0.15 && !isExpanded) {
                isExpanded = true;
                const expandable = card.querySelector('.warning-expandable');
                if (expandable) expandable.style.transition = ''; // 确保动画开启
                card.classList.add('expanded');
                
                setTimeout(() => {
                    animateVal('wstat-a', 84291, '+');
                    animateVal('wstat-b', 37, '%');
                    animateVal('wstat-c', 9, '/10');
                    animateVal('wstat-d', 14, '');
                }, 600);
            } 
            // 2. 收起：当卡片【100% 完全】离开屏幕时触发 (0%)
            else if (entry.intersectionRatio === 0 && isExpanded) {
                const rect = card.getBoundingClientRect();
                const isAbove = rect.top < 0;

                if (isAbove) {
                    // 💥 手机端防卡顿终极修复：
                    // 当卡片从屏幕上方离开（用户向下划）时，什么都不做！
                    // 彻底干掉以前那种“瞬间收起+计算高度差+强推滚动条”的逻辑。
                    // 只要它在上面保持展开，就不会产生任何高度突变，完全不会打断手机的惯性滚动！
                    return; 
                } else {
                    // 当卡片从屏幕下方离开（用户向上划回页面最顶部）时，默默收起
                    // 因为卡片在你的视线下方，它的高度塌陷绝对不会影响你当前的滚动条位置
                    isExpanded = false;
                    card.classList.remove('expanded');
                    resetWarningStats();
                }
            }
        });
    }, { threshold: [0, 0.15] }); // 💥 核心：设置两个阈值，0用来判断完全离开，0.15用来判断进入

    observer.observe(card);
}, 500);

/* 倒计时 */
function updateWarningCountdown() {
    const el = document.getElementById('warning-cd');
    if (!el) return;
    const now = new Date();
    const next = new Date(now);
    next.setHours(next.getHours() + 1, 0, 0, 0);
    const diff = next - now;
    const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    el.textContent = `${h}:${m}:${s}`;
}
updateWarningCountdown();
setInterval(updateWarningCountdown, 1000);
        };

        // 7. 后台专属：渲染管理员仪表盘
        function renderAdminDashboard() {
            const intelGrid = document.getElementById('admin-intel-grid');
            const factionGrid = document.getElementById('admin-faction-grid');
            const orgGrid = document.getElementById('admin-org-grid'); 
            const timelineGrid = document.getElementById('admin-timeline-grid'); 
            const warningGrid = document.getElementById('admin-warning-grid'); // 👈 新增：获取警告网格

            // 💥 修复：把 warningGrid 也加入判空，防止报错
            if (!intelGrid || !factionGrid || !timelineGrid || !orgGrid || !warningGrid) return;

            intelGrid.innerHTML = '';
            factionGrid.innerHTML = '';
            orgGrid.innerHTML = ''; 
            timelineGrid.innerHTML = '';
            warningGrid.innerHTML = ''; // 👈 新增：清空警告网格

            const intelQuery = (document.getElementById('admin-intel-search')?.value || '').trim().toLowerCase();
            const factionQuery = (document.getElementById('admin-faction-search')?.value || '').trim().toLowerCase();
            const timelineQuery = (document.getElementById('admin-timeline-search')?.value || '').trim().toLowerCase(); 

            let intelArticles = articlesDB.filter(a => a.type === 'intel');
            if (intelQuery) intelArticles = intelArticles.filter(a => (a.title && a.title.toLowerCase().includes(intelQuery)) || (a.keywords && a.keywords.toLowerCase().includes(intelQuery)));

            let factionArticles = articlesDB.filter(a => a.type === 'faction');
            let orgArticles = articlesDB.filter(a => a.type === 'org');

            if (factionQuery) {
                factionArticles = factionArticles.filter(a => (a.title && a.title.toLowerCase().includes(factionQuery)) || (a.keywords && a.keywords.toLowerCase().includes(factionQuery)));
                orgArticles = orgArticles.filter(a => (a.title && a.title.toLowerCase().includes(factionQuery)) || (a.keywords && a.keywords.toLowerCase().includes(factionQuery)));
            }

            let timelineArticles = articlesDB.filter(a => a.type === 'timeline');
            
            timelineArticles.sort((a, b) => {
                const matchA = String(a.tag || '').match(/\d+/);
                const matchB = String(b.tag || '').match(/\d+/);
                const yearA = matchA ? parseInt(matchA[0], 10) : 0;
                const yearB = matchB ? parseInt(matchB[0], 10) : 0;
                return yearA - yearB; 
            });

            if (timelineQuery) timelineArticles = timelineArticles.filter(a => (a.title && a.title.toLowerCase().includes(timelineQuery)) || (a.tag && a.tag.toLowerCase().includes(timelineQuery)));

            const createAdminCard = (item, themeColor, isHorizontal = false) => {
                const card = document.createElement('div');
                card.className = 'intel-card';
                card.style.borderColor = themeColor;
                card.style.background = 'rgba(0,0,0,0.4)';
                card.style.padding = '15px';
                card.style.cursor = 'default';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.minHeight = '180px'; 
                
                if (isHorizontal) card.style.flex = '0 0 260px'; 

                let typeLabel = 'INTEL';
                if (item.type === 'faction') typeLabel = 'FACTION';
                if (item.type === 'org') typeLabel = 'ORG';
                if (item.type === 'timeline') typeLabel = 'TIMELINE'; 
                if (item.type === 'warning') typeLabel = 'WARNING'; // 👈 新增：警告标签

                const tagDisplay = item.type === 'timeline' ? `YEAR: ${item.tag}` : `TAG: ${item.tag || 'N/A'}`;

                let parentDisplay = '';
                if (item.type === 'org') {
                    const match = (item.keywords || '').match(/\[PARENT:(.+?)\]/);
                    if (match) parentDisplay = ` | PARENT: ${match[1]}`;
                }

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span style="font-size: 20px;">${item.icon || '📁'}</span>
                            <span style="font-family: monospace; color: ${themeColor}; font-size: 12px; border: 1px solid ${themeColor}; padding: 2px 6px; border-radius: 2px;">[ ${typeLabel} ]</span>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button onclick="editArticle('${item.id}')" style="background: rgba(255,235,59,0.1); border: 1px solid #ffeb3b; color: #ffeb3b; cursor: pointer; padding: 4px 8px; font-size: 12px; font-family: monospace; border-radius: 2px; transition: 0.2s;">[编辑]</button>
                            <button onclick="deleteArticle('${item.id}')" style="background: rgba(244,67,54,0.1); border: 1px solid #f44336; color: #f44336; cursor: pointer; padding: 4px 8px; font-size: 12px; font-family: monospace; border-radius: 2px; transition: 0.2s;">[删除]</button>
                        </div>
                    </div>
                    <h3 style="color: #fff; margin: 0 0 5px 0; font-size: 16px;">${item.title}</h3>
                    <p style="color: #8bb9d6; font-size: 13px; margin: 0 0 10px 0; flex-grow: 1; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;">${item.summary || '暂无简介'}</p>
                    <div style="font-family: monospace; font-size: 12px; color: #666; margin-top: auto;">${tagDisplay}${parentDisplay}</div>
                `;
                return card;
            };

            if (intelArticles.length === 0) intelGrid.innerHTML = '<div style="color:#8bb9d6; font-family:monospace; padding: 20px 0;">[ 暂无记录 ]</div>';
            else intelArticles.forEach(item => intelGrid.appendChild(createAdminCard(item, '#12a8ff', true)));

            if (factionArticles.length === 0) factionGrid.innerHTML = '<div style="color:#8bb9d6; font-family:monospace;">[ 暂无主阵营记录 ]</div>';
            else factionArticles.forEach(item => factionGrid.appendChild(createAdminCard(item, '#4caf50', false)));

            if (orgArticles.length === 0) orgGrid.innerHTML = '<div style="color:#8bb9d6; font-family:monospace;">[ 暂无下属组织记录 ]</div>';
            else orgArticles.forEach(item => orgGrid.appendChild(createAdminCard(item, '#8bc34a', false))); 

            if (timelineArticles.length === 0) timelineGrid.innerHTML = '<div style="color:#8bb9d6; font-family:monospace; padding: 20px 0;">[ 暂无记录 ]</div>';
            else timelineArticles.forEach(item => timelineGrid.appendChild(createAdminCard(item, '#ffeb3b', true)));

            // 👇 新增：渲染警告卡片网格
            let warningArticles = articlesDB.filter(a => a.type === 'warning');
            if (warningArticles.length === 0) {
                warningGrid.innerHTML = '<div style="color:#8bb9d6; font-family:monospace; padding: 20px 0;">[ 暂无警告卡片 ]</div>';
            } else {
                warningArticles.forEach(item => warningGrid.appendChild(createAdminCard(item, '#f44336', true)));
            }
        }

        document.addEventListener('input', function(e) {
            if (e.target.id === 'admin-intel-search' || e.target.id === 'admin-faction-search' || e.target.id === 'admin-timeline-search') {
                renderAdminDashboard();
            }
        });

        // 8. 动态生成情报网格 (主界面 Top 4 + 历史情报库)
        function renderIntelGrid() {
            const mainGrid = document.getElementById('main-intel-grid');
            const historyGrid = document.getElementById('history-intel-grid');
            if (!mainGrid || !historyGrid) return;

            mainGrid.innerHTML = '';
            historyGrid.innerHTML = '';

            const intelArticles = articlesDB.filter(a => a.type === 'intel');

            if (intelArticles.length === 0) {
                mainGrid.innerHTML = '<div style="color:#8bb9d6; font-family:monospace; grid-column: 1/-1; padding: 20px 0;">[ 暂无情报数据，请等待管理员上传 ]</div>';
                historyGrid.innerHTML = '<div style="color:#8bb9d6; font-family:monospace; grid-column: 1/-1; padding: 20px 0;">[ 暂无历史情报 ]</div>';
                return;
            }

            const top4Cards = intelArticles.slice(0, 4);
            const historyCards = intelArticles.slice(4);

            const createCardHTML = (item, index, prefix) => {
                const card = document.createElement('div');
                card.className = 'intel-card article-card dynamic-intel'; 
                card.id = `intel-${prefix}-${index}`;
                card.setAttribute('data-keywords', item.keywords || '');
                card.setAttribute('data-content', item.content || '');
                card.style.display = 'flex';
                card.style.flexDirection = 'column';

                let adminControls = '';
                if (currentUser && ['admin', 'super_admin'].includes(currentUser?.role)) {
                    // 💥 核心修复：废除绝对定位
                    adminControls = `
                        <div style="display: flex; gap: 5px; z-index: 10; flex-shrink: 0;">
                            <button onclick="event.stopPropagation(); editArticle('${item.id}')" style="background: rgba(255,235,59,0.15); border: 1px solid #ffeb3b; color: #ffeb3b; cursor: pointer; padding: 4px 8px; font-size: 12px; font-family: monospace; border-radius: 2px; transition: 0.2s;">[改]</button>
                            <button onclick="event.stopPropagation(); deleteArticle('${item.id}')" style="background: rgba(244,67,54,0.15); border: 1px solid #f44336; color: #f44336; cursor: pointer; padding: 4px 8px; font-size: 12px; font-family: monospace; border-radius: 2px; transition: 0.2s;">[删]</button>
                        </div>
                    `;
                }

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 10px;">
                        <span class="card-level" style="margin: 0; white-space: nowrap;">${item.tag || '✦ INTEL'}</span>
                        ${adminControls}
                    </div>
                    <h3 class="card-name">${item.title}</h3>
                    <p class="card-desc" style="flex-grow: 1;">${item.summary || ''}</p>
                    <div class="card-meta" style="margin-top: auto;">
                        <span class="card-price">[已解密]</span>
                        <span class="card-duration">// 实时数据</span>
                    </div>
                `;
                
                card.onclick = () => openArticle({ title: item.title, tag: item.tag, content: item.content });
                return card;
            };

            top4Cards.forEach((item, index) => mainGrid.appendChild(createCardHTML(item, index, 'main')));

            if (historyCards.length === 0) {
                historyGrid.innerHTML = '<div style="color:#8bb9d6; font-family:monospace; grid-column: 1/-1; padding: 20px 0;">[ 当前没有更早的历史情报归档 ]</div>';
            } else {
                historyCards.forEach((item, index) => historyGrid.appendChild(createCardHTML(item, index, 'history')));
            }

            updateSearchIndex();
            generateIntelTOC();
         if (typeof updateCenterFocusTargets === 'function') updateCenterFocusTargets();
        } // <-- 这是 renderIntelGrid 函数的结尾大括号

        // 9. 管理员专属：永久删除文章
        window.deleteArticle = async function(id) {
            const isSure = await SysModal.confirm("确定要永久删除这条记录吗？\n此操作不可逆！", "⚠️ 删除确认");
            if (!isSure) return;

            try {
                await supabaseClient.from('articles').delete().eq('id', id);
                await SysModal.alert("记录已从数据库中抹除。", "删除成功");
                fetchArticles(); 
            } catch (err) {
                console.error(err);
                SysModal.alert("删除失败，请检查网络。", "✕ ERROR");
            }
        };

       // 10. 管理员专属：编辑文章
        window.editArticle = function(id) {
            const article = articlesDB.find(a => String(a.id) === String(id));
            if (!article) {
                SysModal.alert("无法读取该档案数据，请刷新页面重试。", "系统错误");
                return;
            }

            // 💥 修复：在这里也加上智能记忆来路的代码！
            const currentActivePanel = document.querySelector('.view-panel.active');
            if (currentActivePanel && currentActivePanel.id !== 'adminEditorView') {
                window.editorPreviousViewId = currentActivePanel.id;
            }

            // 💥 动态修改返回按钮的文字
            const returnBtn = document.querySelector('#adminEditorView .btn-ghost');
            if (returnBtn) {
                if (window.editorPreviousViewId === 'storyView') {
                    returnBtn.innerHTML = '&lt; 返回';
                } else {
                    returnBtn.innerHTML = '&lt; 返回';
                }
            }

            // 💥 加上这段回显频道管理员
                if (article.type === 'faction' || article.type === 'org') {
                    document.getElementById('admin-channel-admins-group').style.display = 'block';
                    document.getElementById('a-channel-admins').value = article.channel_admins || '';
                } else {
                    document.getElementById('admin-channel-admins-group').style.display = 'none';
                    document.getElementById('a-channel-admins').value = '';
                }

            editingArticleId = article.id;

            const safeSet = (elId, val) => {
                const el = document.getElementById(elId);
                if (el) el.value = val || '';
            };

            safeSet('a-type', article.type);
            safeSet('a-title', article.title);
            safeSet('a-tag', article.tag);
            safeSet('a-icon', article.icon);
            safeSet('a-keywords', article.keywords);
            safeSet('a-summary', article.summary);
            safeSet('a-content', article.content);

            // 回填富文本内容
            if(window.quill) {
                window.quill.root.innerHTML = article.content || '';
            }

            const typeSelect = document.getElementById('a-type');
            const parentGroup = document.getElementById('parent-faction-group');
            const parentSelect = document.getElementById('a-parent-faction');

            if (typeSelect) {
                typeSelect.style.pointerEvents = 'none';
                typeSelect.style.opacity = '0.6';
            }

            if (article.type === 'org') {
                // 💥 剥离职位数据给管理员面板
                document.getElementById('admin-org-positions-group').style.display = 'block';
                const posObj = getOrgPositions(article.content);
                if (posObj) document.getElementById('a-org-positions').value = Object.entries(posObj).map(([k, v]) => `${k}:${v}`).join(', ');
                else document.getElementById('a-org-positions').value = '';
                
                // 💥 剥离自戏要求数据给管理员面板
                document.getElementById('admin-org-rp-group').style.display = 'block';
                const rpPosStr = window.getOrgRpPositions(article.content);
                document.getElementById('a-rp-positions').value = rpPosStr || '';
                
                // 💥 加上这段回显职位要求
                document.getElementById('admin-org-reqs-group').style.display = 'block';
                document.getElementById('a-org-reqs').value = window.getOrgReqs(article.content) || '';
                
                parentGroup.style.display = 'flex';
                parentSelect.innerHTML = '<option value="" disabled selected>-- 请选择所属阵营 --</option>';
                const factions = articlesDB.filter(a => a.type === 'faction');
                factions.forEach(f => {
                    parentSelect.innerHTML += `<option value="${f.title}">${f.title}</option>`;
                });
                
                const match = article.keywords.match(/\[PARENT:(.+?)\]/);
                if (match && match[1]) {
                    parentSelect.value = match[1];
                }
            } else {
                // 💥 核心修复：如果不是组织，把这三个框全部隐藏！
                document.getElementById('admin-org-positions-group').style.display = 'none';
                document.getElementById('admin-org-rp-group').style.display = 'none';
                document.getElementById('admin-org-reqs-group').style.display = 'none';
                parentGroup.style.display = 'none';
            }

            // 💥 剔除隐藏的 JSON 代码后再喂给富文本编辑器
            let cleanContent = article.content.replace(/<div[^>]*data-positions=['"].*?['"][^>]*><\/div>/g, '').replace(/<div[^>]*data-rp-positions=['"].*?['"][^>]*><\/div>/g, '').replace(/<div[^>]*data-reqs=['"].*?['"][^>]*><\/div>/g, '').replace(/<div[^>]*data-updates=['"].*?['"][^>]*><\/div>/g, '');
            if(window.quill) {
                window.quill.root.innerHTML = cleanContent || '';
            }

            const mainTitle = document.getElementById('editor-main-title');
            if (mainTitle) mainTitle.innerText = "[ ⚙️ 修改数据档案 ]";
            
            const btn = document.getElementById('btn-publish-article');
            if (btn) btn.innerText = "[ UPDATE DATABASE // 覆盖保存 ]";

            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            const editorView = document.getElementById('adminEditorView');
            if (editorView) {
                editorView.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'instant' });
            }
        };

        // 11. 💥 全局搜索引擎：从数据库构建索引
        window.updateSearchIndex = function() {
            window.searchIndex = [];

            // 1. 索引所有文章 (情报、阵营、组织、时间轴、剧情、记录)
            articlesDB.forEach(a => {
                if (a.status === 'pending' || a.status === 'rejected') return; // 过滤掉草稿
                
                let typeLabel = 'DATABASE';
                if (a.type === 'intel') typeLabel = 'INTEL // 情报';
                if (a.type === 'faction') typeLabel = 'FACTION // 阵营';
                if (a.type === 'org') typeLabel = 'ORG // 组织';
                if (a.type === 'timeline') typeLabel = 'TIMELINE // 历史';
                if (a.type === 'plot') typeLabel = 'STORY // 主线';
                if (a.type === 'solo_log') typeLabel = 'SOLO LOG // 自戏';
                if (a.type === 'rp_log') typeLabel = 'RP LOG // 对戏';
                if (a.type === 'warning') typeLabel = 'WARNING // 系统警告'; // 👈 新增这一行

                window.searchIndex.push({
                    type: a.type,
                    title: a.title,
                    tag: a.tag || typeLabel,
                    // 把标题和关键词拼在一起，提高模糊搜索命中率
                    keywords: ((a.keywords || '') + ' ' + (a.title || '')).toLowerCase(),
                    originalData: a
                });
            });

            // 2. 索引所有已通过的公民档案
            characterDB.forEach((c, index) => {
                if (c.status !== 'approved') return;
                
                // 💥 核心防偷设拦截：全局搜索中过滤掉私密档案
                if (c.is_private && c.owner_id !== currentUser?.id && !['admin', 'super_admin'].includes(currentUser?.role)) {
                    return;
                }
                
                // 💥 核心修复：人设只通过名字/代号调取，不再把阵营、组织和职业塞进关键词！
                // 这样搜阵营时就不会搜出一大堆玩家档案了。
                let kw = `${c.callsign} ${c.name} ${c.hidden_callsign || ''} ${c.hidden_name || ''}`.toLowerCase();
                
                window.searchIndex.push({
                    type: 'character',
                    title: `${c.callsign} // ${c.name}`,
                    tag: 'CITIZEN // 公民档案',
                    keywords: kw,
                    originalData: c,
                    charIndex: index // 记录它在数组中的位置，方便点击时打开详情
                });
            });
        };

        // 12. 一键导入旧版时间轴数据
        window.importOldTimeline = async function() {
            const isSure = await SysModal.confirm("此操作将把旧版的 5 个时间轴事件写入数据库。\n⚠️ 请勿重复点击以免产生重复数据。\n\n确认导入吗？", "⚠️ 导入预设数据");
            if (!isSure) return;

            const btn = document.getElementById('btn-import-timeline');
            let originalText = "";
            if (btn) {
                originalText = btn.innerText;
                btn.innerHTML = `[ ${CyberLang.icon} ${CyberLang.get('importing')} ]`;
                btn.disabled = true;
            }

            const oldData = [
                { type: 'timeline', icon: '⏳', tag: '2190', title: '发现黑血', summary: '深空探测器在小行星带深处首次发现高能同位素 C-62。人类文明的能源危机宣告解除。', content: '<h3 style="color: #12a8ff; font-size: 28px; margin-top: 0;">星历 2190 年：潘多拉的魔盒</h3><p style="color: #8bb9d6; line-height: 1.8; font-size: 16px;">探测器“远望者-7”在太阳系外环的柯伊伯带深处，传回了一组异常的辐射读数。随后，第一批勘探队带回了那种散发着幽蓝色微光的黑色矿石——C-62。<br><br>它的能量转化率是核聚变的数百倍。一夜之间，地球的能源危机迎刃而解，星际航行从昂贵的奢望变成了日常。人类欢呼雀跃，以为自己终于握住了上帝的权杖，却不知道他们打开的是潘多拉的魔盒。</p>' },
                { type: 'timeline', icon: '⏳', tag: '2205', title: '星尘病爆发', summary: '首批外环矿工出现严重的器官纤维化与幻觉症状。官方试图封锁消息，但最终失败。', content: '<h3 style="color: #12a8ff; font-size: 28px; margin-top: 0;">星历 2205 年：群星的低语</h3><p style="color: #8bb9d6; line-height: 1.8; font-size: 16px;">随着开采规模的扩大，第一批长期接触原矿的底层矿工开始出现异常。起初只是轻微的咳嗽和皮肤荧光，随后演变为严重的器官纤维化。<br><br>最可怕的是伴随而来的幻觉——患者声称听到了“群星的低语”。泰坦星脉财团试图用高压手段封锁消息，将死者秘密处理。但纸包不住火，这种被称为“星尘病”的绝症最终在整个外环蔓延开来。</p>' },
                { type: 'timeline', icon: '⏳', tag: '2218', title: '泛星联盟成立', summary: '为了统筹黑血资源的分配与镇压外环暴动，内环各大政体与财团联合，成立泛星联盟 (P.S.C)。', content: '<h3 style="color: #12a8ff; font-size: 28px; margin-top: 0;">星历 2218 年：秩序的铁腕</h3><p style="color: #8bb9d6; line-height: 1.8; font-size: 16px;">面对外环日益严重的抗议和黑血走私问题，内环的旧政体意识到，松散的联合已经无法维持对星系的统治。<br><br>在泰坦星脉财团的资金支持下，地球及内环各大行星签署了《泛星条约》，正式成立“泛星联盟 (P.S.C)”。联盟迅速组建了第一舰队和战略安全局（SSA），以铁腕手段接管了所有核心星门和精炼设施。</p>' },
                { type: 'timeline', icon: '⏳', tag: '2230', title: '外环大罢工', summary: '不堪压迫的外环矿工发起全星区罢工，遭到联盟第一舰队的血腥镇压。“黑火”解放战线由此诞生。', content: '<h3 style="color: #12a8ff; font-size: 28px; margin-top: 0;">星历 2230 年：鲜血与火花</h3><p style="color: #8bb9d6; line-height: 1.8; font-size: 16px;">联盟的压迫终于达到了临界点。外环 12 个主要矿区同时爆发大罢工，要求改善工作环境并提供星尘病的治疗药物。<br><br>联盟的回答是第一舰队的轨道轰炸。罢工被血腥镇压，数万人死亡。但在废墟之中，幸存的矿工和逃兵们拿起了武器，“黑火”解放战线正式宣告成立，星系进入了漫长的游击战时代。</p>' },
                { type: 'timeline', icon: '⏳', tag: '2240', title: '碎星事件', summary: '当前纪元。黑火武装劫持 7 号采矿驳船，各大 PMC 卷入冲突，全面战争一触即发。', content: '<h3 style="color: #12a8ff; font-size: 28px; margin-top: 0;">星历 2240 年：深空边缘</h3><p style="color: #8bb9d6; line-height: 1.8; font-size: 16px;">当前纪元。黑火武装成功劫持了联盟的 7 号采矿驳船，造成大量原矿泄漏。这一事件彻底激怒了联盟最高议会。<br><br>随着正规军的集结，各大独立防务承包商（PMC）也闻风而动，纷纷涌入外环寻找发财的机会。在阿刻戎自由港的阴影下，情报贩子们疯狂交换着筹码。全面战争的倒计时，已经开始。</p>' }
            ];

            try {
                const { error } = await supabaseClient.from('articles').insert(oldData);
                if (error) throw error;
                await SysModal.alert("旧版时间轴数据已成功写入数据库！\n\n现在时间轴页面将完全由数据库驱动渲染。", "✅ 导入成功");
                fetchArticles(); 
            } catch (err) {
                console.error(err);
                SysModal.alert("导入失败，请检查网络连接或数据库权限。", "✕ ERROR");
            } finally {
                if (btn) {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            }
        };

        /* =========================================================
   💥 深空通讯网络 (论坛) 交互引擎 💥
   ========================================================= */

// 💥 优先读取记忆中的频道，没有则默认 GLOBAL
        let currentForumChannel = sessionStorage.getItem('tf141_forum_channel') || 'GLOBAL'; 
        let forumPostsDB = [];
        let forumCommentsDB = [];

        /* =========================================================
           💥 论坛个人主页与权限引擎 💥
           ========================================================= */
        
        // 1. 获取当前用户有权访问的所有频道
        window.getMyAccessibleChannels = function() {
            if (!currentUser) return [];
            if (['admin', 'super_admin'].includes(currentUser.role)) return 'ALL'; // 管理员能看所有
            
            let channels = ['GLOBAL', 'ANNOUNCEMENT'];
            const myChar = characterDB.find(c => c.owner_id === currentUser.id);
            if (myChar) {
                if (myChar.faction) channels.push(`FACTION_${myChar.faction}`);
                if (myChar.organization && myChar.organization !== '无归属 / 独狼') channels.push(`ORG_${myChar.organization}`);
                if (myChar.has_hidden) {
                    if (myChar.hidden_faction) channels.push(`FACTION_${myChar.hidden_faction}`);
                    if (myChar.hidden_org && myChar.hidden_org !== '无归属 / 独狼') channels.push(`ORG_${myChar.hidden_org}`);
                }
            }
            // 💥 新增：把我管理的频道也加进去
            articlesDB.forEach(a => {
                if ((a.type === 'faction' || a.type === 'org') && a.channel_admins && a.channel_admins.includes(currentUser.id)) {
                    const prefix = a.type === 'faction' ? 'FACTION_' : 'ORG_';
                    const chanName = prefix + a.title;
                    if (!channels.includes(chanName)) channels.push(chanName);
                }
            });
            return channels;
        };

        // 2. 智能名字渲染器 (处理自定义名字与组织频道的强制实名)
        window.getForumDisplayName = function(char, channel, isHidden) {
            if (!char) return "UNKNOWN";
            
            if (channel.startsWith('ORG_')) {
                // 💥 组织工作频道：强制显示 [组织] 全名 - 职位
                if (isHidden) {
                    return `[${char.hidden_org || '无组织'}] ${char.hidden_name || char.hidden_callsign} - ${char.hidden_occupation || '未知'}`;
                } else {
                    return `[${char.organization || '无组织'}] ${char.name || char.callsign} - ${char.occupation || '未知'}`;
                }
            } else {
                // 💥 其他频道：显示自定义名字，没有则用代号
                if (isHidden) {
                    return char.hidden_forum_name || char.hidden_callsign;
                } else {
                    return char.forum_name || char.callsign;
                }
            }
        };

        // 3. 修改自定义昵称
        window.editForumName = async function(isHidden) {
            const myChar = characterDB.find(c => c.owner_id === currentUser.id);
            const currentName = isHidden ? (myChar.hidden_forum_name || myChar.hidden_callsign) : (myChar.forum_name || myChar.callsign);
            
            const newName = await SysModal.prompt("请输入新的论坛自定义昵称：\n(留空则恢复默认代号)\n\n注：组织工作频道将强制显示真实姓名与职位，不受此昵称影响。", currentName, "修改论坛昵称");
            if (newName === null) return; 
            
            const finalName = newName.trim();
            const updateData = {};
            if (isHidden) updateData.hidden_forum_name = finalName;
            else updateData.forum_name = finalName;
            
            try {
                await supabaseClient.from('characters').update(updateData).eq('id', myChar.id);
                if (isHidden) myChar.hidden_forum_name = finalName;
                else myChar.forum_name = finalName;
                
                openForumProfile(currentUser.id, isHidden); // 刷新主页
                loadForumData(true); // 无痕刷新论坛帖子
            } catch (e) {
                SysModal.alert("修改失败，请检查网络。", "ERROR");
            }
        };

        // 4. 打开个人主页弹窗 (升级为异步云端跨频段拉取)
        window.openForumProfile = async function(targetOwnerId, viewAsHidden) {
            const targetChar = characterDB.find(c => c.owner_id === targetOwnerId);
            if (!targetChar) { SysModal.alert("无法获取该用户的档案信息。"); return; }
            
            const isMe = targetOwnerId === currentUser.id;
            const isAdmin = currentUser && ['admin', 'super_admin'].includes(currentUser.role);
            const modal = document.getElementById('forumProfileModal');
            const box = document.getElementById('forumProfileBox');
            const feed = document.getElementById('fp-feed');
            
            // 💥 核心防掉皮修复：只有本人（或管理员）查看里身份时，才显示粉色特效。
            // 其他普通群友看一律显示正常的蓝色，让他们以为这只是一个普通的公开用户！
            const showAsHiddenTheme = viewAsHidden && (isMe || isAdmin);

            // 样式切换 (表/里)
            if (showAsHiddenTheme) box.classList.add('hidden-mode');
            else box.classList.remove('hidden-mode');

            // 头部信息渲染 (数据依然拉取里身份的数据，只是颜色变了)
            const displayName = viewAsHidden ? (targetChar.hidden_forum_name || targetChar.hidden_callsign) : (targetChar.forum_name || targetChar.callsign);
            const officialName = viewAsHidden ? targetChar.hidden_callsign : targetChar.callsign;
            const faction = viewAsHidden ? targetChar.hidden_faction : targetChar.faction;
            
            // 💥 核心修复：工作频道强制使用真实姓名首字母，且禁用图片头像防掉皮
            let avatarLetter = '?';
            let avatarUrl = null;
            
            if (currentForumChannel.startsWith('ORG_')) {
                const realName = viewAsHidden ? (targetChar.hidden_name || targetChar.hidden_callsign) : (targetChar.name || targetChar.callsign);
                avatarLetter = realName ? realName.charAt(0).toUpperCase() : '?';
                avatarUrl = null; // 强制禁用图片头像
            } else {
                const realName = viewAsHidden ? (targetChar.hidden_forum_name || targetChar.hidden_name || targetChar.hidden_callsign) : (targetChar.forum_name || targetChar.name || targetChar.callsign);
                avatarLetter = realName ? realName.charAt(0).toUpperCase() : '?';
                avatarUrl = viewAsHidden ? targetChar.hidden_avatar_url : targetChar.forum_avatar_url;
            }

            // 💥 渲染真实头像
            const avatarContent = avatarUrl ? `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover;">` : avatarLetter;
            
            // 💥 如果是本人，允许点击修改
            const avatarClickAttr = isMe ? `onclick="openAvatarUploader('${viewAsHidden ? 'forum_hidden' : 'forum_public'}')" style="cursor:pointer;" title="点击修改论坛头像"` : '';

            document.getElementById('fp-avatar').innerHTML = avatarContent;
            if (isMe) {
                document.getElementById('fp-avatar').setAttribute('onclick', `openAvatarUploader('${viewAsHidden ? 'forum_hidden' : 'forum_public'}')`);
                document.getElementById('fp-avatar').style.cursor = 'pointer';
            } else {
                document.getElementById('fp-avatar').removeAttribute('onclick');
                document.getElementById('fp-avatar').style.cursor = 'default';
            }
            
            let editBtnHtml = '';
            if (isMe) {
                const btnColor = showAsHiddenTheme ? '#e91e63' : '#12a8ff';
                // 💥 核心修复：加上 fp-edit-btn 类名，交由 CSS 智能控制边距
                editBtnHtml = `<button class="sys-modal-btn confirm fp-edit-btn" style="padding: 2px 8px; font-size: 12px; border-color: ${btnColor}; color: ${btnColor};" onclick="editForumName(${viewAsHidden})">[ 修改昵称 ]</button>`;
            }

            // 💥 修复：删除了错误覆盖头像的 innerText 赋值
            document.getElementById('fp-name').innerHTML = `${displayName} ${editBtnHtml}`;
            document.getElementById('fp-desc').innerText = `官方代号: ${officialName} | 阵营: ${faction}`;

            // 💥 核心 1：先弹出窗口，并显示科幻加载动画
            feed.innerHTML = window.getCyberLoaderHTML('正在跨频段检索通讯记录...', showAsHiddenTheme ? '#e91e63' : '#12a8ff');
            modal.classList.add('active');

            // 💥 核心 2：直接向云端数据库发起跨频道查询
            try {
                const myChannels = getMyAccessibleChannels();
                let query = supabaseClient
                    .from('forum_posts')
                    .select('*')
                    .eq('owner_id', targetOwnerId)
                    .eq('author_type', viewAsHidden ? 'hidden' : 'public')
                    .order('created_at', { ascending: false });

                // 权限与上下文过滤
                if (currentForumChannel.startsWith('ORG_')) {
                    query = query.eq('channel', currentForumChannel); // 如果在工作频道看主页，只拉取工作频道的帖
                } else if (myChannels !== 'ALL') {
                    query = query.in('channel', myChannels); // 否则，拉取所有我有权限看的频道的帖
                }

                const { data: targetPosts, error } = await query;
                if (error) throw error;

                // 渲染帖子流
                if (!targetPosts || targetPosts.length === 0) {
                    feed.innerHTML = `<div style="color:#666; text-align:center; margin-top: 20px; font-family:monospace;">[ 该身份在您可访问的频道内暂无广播记录 ]</div>`;
                } else {
                    feed.innerHTML = targetPosts.map(post => {
                        const timeStr = new Date(post.created_at).toLocaleString();
                        
                        // 💥 核心防掉皮：帖子边框和标题颜色也受 showAsHiddenTheme 控制
                        const borderColor = showAsHiddenTheme ? 'rgba(233,30,99,0.3)' : 'rgba(18,168,255,0.3)';
                        const titleColor = showAsHiddenTheme ? '#ff80ab' : '#12a8ff';
                        
                        const postName = getForumDisplayName(targetChar, post.channel, viewAsHidden);

                        let channelBadge = '';
                        if (post.channel === 'GLOBAL') {
                            channelBadge = '<span style="color:#12a8ff; border:1px solid #12a8ff; background:rgba(18,168,255,0.1); padding:2px 6px; border-radius:2px; font-size:10px; margin-left:8px; white-space:nowrap;">📢 全频段</span>';
                        } else if (post.channel === 'ANNOUNCEMENT') {
                            channelBadge = '<span style="color:#ffeb3b; border:1px solid #ffeb3b; background:rgba(255,235,59,0.1); padding:2px 6px; border-radius:2px; font-size:10px; margin-left:8px; white-space:nowrap;">⚠️ 公告</span>';
                        } else if (post.channel.startsWith('FACTION_')) {
                            channelBadge = `<span style="color:#12a8ff; border:1px solid #12a8ff; background:rgba(18,168,255,0.1); padding:2px 6px; border-radius:2px; font-size:10px; margin-left:8px; white-space:nowrap;">🛡️ ${post.channel.replace('FACTION_', '')}</span>`;
                        } else if (post.channel.startsWith('ORG_')) {
                            channelBadge = `<span style="color:#8bc34a; border:1px solid #8bc34a; background:rgba(139,195,74,0.1); padding:2px 6px; border-radius:2px; font-size:10px; margin-left:8px; white-space:nowrap;">🏢 ${post.channel.replace('ORG_', '')}</span>`;
                        }

                        // 💥 核心修复：在个人主页中也加入严格的审核状态拦截
                        let finalContentHtml = '';
                        if (post.status === 'auditing') {
                            // 只有本人或管理员能看到原因和半透明内容
                            if (post.owner_id === currentUser?.id || (currentUser && ['admin', 'super_admin'].includes(currentUser.role))) {
                                finalContentHtml = `
                                    <div style="background: rgba(244,67,54,0.1); border: 1px dashed #f44336; padding: 8px; margin-bottom: 8px; border-radius: 4px;">
                                        <div style="color: #f44336; font-weight: bold; font-size: 12px;">[ ⚠️ 审核中 ] 原因：${post.audit_reason || '无'}</div>
                                    </div>
                                    <div style="opacity: 0.5; pointer-events: none;">${formatContentWithCollapse(post.content, true, 'profile-post-' + post.id)}</div>
                                `;
                            } else {
                                // 其他普通群友只能看到隐藏提示
                                finalContentHtml = `
                                    <div style="background: rgba(244,67,54,0.1); border: 1px dashed #f44336; padding: 15px; text-align: center; border-radius: 4px;">
                                        <span style="color: #f44336; font-weight: bold; font-size: 12px;">[ ⚠️ 该贴正在审核中，内容已隐藏 ]</span>
                                    </div>
                                `;
                            }
                        } else {
                            // 正常帖子
                            finalContentHtml = formatContentWithCollapse(post.content, true, 'profile-post-' + post.id);
                        }

                        return `
                            <div style="background: rgba(0,0,0,0.5); border: 1px solid ${borderColor}; padding: 15px; border-radius: 4px;">
                                <div style="display:flex; justify-content:space-between; margin-bottom: 10px; border-bottom: 1px dashed ${borderColor}; padding-bottom: 5px; align-items: flex-start; gap: 10px;">
                                    <div style="display:flex; align-items:center; flex-wrap: wrap; gap: 4px;">
                                        <span style="color: ${titleColor}; font-weight: bold; font-size: 14px;">${postName}</span>
                                        ${channelBadge}
                                    </div>
                                    <span style="color: #666; font-family: monospace; font-size: 11px; white-space: nowrap;">${timeStr}</span>
                                </div>
                                <div style="color: #fff; font-size: 13px; line-height: 1.6; word-break: break-word;">
                                    ${finalContentHtml}
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            } catch (err) {
                console.error(err);
                feed.innerHTML = `<div style="color:#f44336; text-align:center; margin-top: 20px; font-family:monospace;">[ ✕ 跨频段检索失败，请检查网络 ]</div>`;
            }

            // 💥 关闭论坛个人主页
            window.closeForumProfile = function() {
                const modal = document.getElementById('forumProfileModal');
                if (modal) modal.classList.remove('active');
            };
        };

// 1. 初始化论坛
        window.initForum = async function() {
            const channelBox = document.getElementById('forum-channels');
            const postBox = document.getElementById('forum-post-box');
            const authorTypeSelect = document.getElementById('forum-author-type');
            
            let myChar = null;
            if (currentUser && currentUser.role !== 'guest') {
                myChar = characterDB.find(c => c.owner_id === currentUser.id);
            }

            let channelsHtml = `
                <button class="channel-btn ${currentForumChannel === 'GLOBAL' ? 'active' : ''}" onclick="switchForumChannel('GLOBAL')">📢 全频段广播</button>
                <button class="channel-btn ${currentForumChannel === 'ANNOUNCEMENT' ? 'active' : ''}" onclick="switchForumChannel('ANNOUNCEMENT')" style="color: #ffeb3b;">⚠️ 全频道公告</button>
            `;

            if (myChar && myChar.faction) {
                const factionChan = `FACTION_${myChar.faction}`;
                channelsHtml += `<button class="channel-btn ${currentForumChannel === factionChan ? 'active' : ''}" onclick="switchForumChannel('${factionChan}')" style="color: #12a8ff;">🛡️ ${myChar.faction} 内部频段</button>`;
            }
            if (myChar && myChar.has_hidden && myChar.hidden_faction) {
                const hiddenFactionChan = `FACTION_${myChar.hidden_faction}`;
                if (hiddenFactionChan !== `FACTION_${myChar.faction}`) {
                    channelsHtml += `<button class="channel-btn ${currentForumChannel === hiddenFactionChan ? 'active' : ''}" onclick="switchForumChannel('${hiddenFactionChan}')" style="color: #e91e63;">🥷 ${myChar.hidden_faction} 暗网频段</button>`;
                }
            }
            if (myChar && myChar.organization && myChar.organization !== '无归属 / 独狼') {
                const orgChan = `ORG_${myChar.organization}`;
                channelsHtml += `<button class="channel-btn ${currentForumChannel === orgChan ? 'active' : ''}" onclick="switchForumChannel('${orgChan}')" style="color: #8bc34a;">🏢 ${myChar.organization} 工作频段</button>`;
            }
            if (myChar && myChar.has_hidden && myChar.hidden_org && myChar.hidden_org !== '无归属 / 独狼') {
                const hOrgChan = `ORG_${myChar.hidden_org}`;
                if (hOrgChan !== `ORG_${myChar.organization}`) {
                    channelsHtml += `<button class="channel-btn ${currentForumChannel === hOrgChan ? 'active' : ''}" onclick="switchForumChannel('${hOrgChan}')" style="color: #e91e63;">🥷 ${myChar.hidden_org} 暗网工作频段</button>`;
                }
            }

            const isGlobalAdmin = currentUser && ['admin', 'super_admin'].includes(currentUser.role);

            if (isGlobalAdmin) {
                const allFactions = articlesDB.filter(a => a.type === 'faction').map(a => a.title);
                allFactions.forEach(f => {
                    const fChan = `FACTION_${f}`;
                    if ((!myChar || myChar.faction !== f) && (!myChar || !myChar.has_hidden || myChar.hidden_faction !== f)) {
                        channelsHtml += `<button class="channel-btn ${currentForumChannel === fChan ? 'active' : ''}" onclick="switchForumChannel('${fChan}')" style="color: #8bb9d6; opacity: 0.8;">👁️ [监听] ${f} 频段</button>`;
                    }
                });
            }

            articlesDB.forEach(a => {
                if ((a.type === 'faction' || a.type === 'org') && a.channel_admins && a.channel_admins.includes(currentUser.id)) {
                    const prefix = a.type === 'faction' ? 'FACTION_' : 'ORG_';
                    const chanName = prefix + a.title;
                    const label = a.type === 'faction' ? '内部频段' : '工作频段';
                    if (!channelsHtml.includes(`switchForumChannel('${chanName}')`)) {
                        channelsHtml += `<button class="channel-btn ${currentForumChannel === chanName ? 'active' : ''}" onclick="switchForumChannel('${chanName}')" style="color: #ffeb3b; border-color: #ffeb3b;">👑 [管理] ${a.title} ${label}</button>`;
                    }
                }
            });
            
            channelBox.innerHTML = channelsHtml;

            let isChannelAdmin = false;
            if (currentForumChannel.startsWith('FACTION_')) {
                const name = currentForumChannel.replace('FACTION_', '');
                const article = articlesDB.find(a => a.type === 'faction' && a.title === name);
                if (article && article.channel_admins && article.channel_admins.includes(currentUser.id)) isChannelAdmin = true;
            } else if (currentForumChannel.startsWith('ORG_')) {
                const name = currentForumChannel.replace('ORG_', '');
                const article = articlesDB.find(a => a.type === 'org' && a.title === name);
                if (article && article.channel_admins && article.channel_admins.includes(currentUser.id)) isChannelAdmin = true;
            }

            const canManage = isGlobalAdmin || isChannelAdmin;

            let isListeningMode = false;
            if (isGlobalAdmin) {
                if (currentForumChannel.startsWith('FACTION_')) {
                    const targetFaction = currentForumChannel.replace('FACTION_', '');
                    isListeningMode = !(myChar && (myChar.faction === targetFaction || (myChar.has_hidden && myChar.hidden_faction === targetFaction)));
                } else if (currentForumChannel.startsWith('ORG_')) {
                    const targetOrg = currentForumChannel.replace('ORG_', '');
                    isListeningMode = !(myChar && (myChar.organization === targetOrg || (myChar.has_hidden && myChar.hidden_org === targetOrg)));
                }
            }

            // 💥 动态重构发帖身份下拉框 (加入双重公告选项)
            if (authorTypeSelect) {
                let optionsHtml = '';
                
                // 如果不是监听模式，且有档案，才能用个人身份发帖
                if (!isListeningMode && myChar) {
                    optionsHtml += `<option value="public">以 [ 表身份 ] 发言</option>`;
                    if (myChar.has_hidden) {
                        optionsHtml += `<option value="hidden" style="color: #e91e63;">以 [ 里身份 ] 发言</option>`;
                    }
                }
                
                // 网站管理员永远可以以系统总控身份发言
                if (isGlobalAdmin) {
                    optionsHtml += `<option value="admin" style="color: #f44336;">以 [ 系统总控 ] 发言</option>`;
                    optionsHtml += `<option value="npc" style="color: #ff9800;">以 [ 自定义 NPC ] 发言</option>`;
                }

                // 如果有管理权限，且不是全局/公告频道，加入发公告选项
                if (canManage && currentForumChannel !== 'GLOBAL' && currentForumChannel !== 'ANNOUNCEMENT') {
                    if (!isListeningMode && myChar) {
                        optionsHtml += `<option value="announcement_public" style="color: #ffeb3b;">⚠️ 以 [ 个人身份 ] 发布置顶公告</option>`;
                    }
                    if (isGlobalAdmin) {
                        optionsHtml += `<option value="announcement_admin" style="color: #ffeb3b;">⚠️ 以 [ 系统总控 ] 发布置顶公告</option>`;
                        optionsHtml += `<option value="announcement_npc" style="color: #ffeb3b;">⚠️ 以 [ 自定义 NPC ] 发布置顶公告</option>`;
                    }
                }
                authorTypeSelect.innerHTML = optionsHtml;
            }

            // 💥 判断发帖框是否显示 (管理员在监听模式下也能发帖了！)
            if (!myChar && !isGlobalAdmin) {
                postBox.style.display = 'none';
            } else if (isListeningMode && !isGlobalAdmin) {
                postBox.style.display = 'none'; 
            } else {
                if (currentForumChannel === 'ANNOUNCEMENT' && !isGlobalAdmin) {
                    postBox.style.display = 'none'; 
                } else {
                    postBox.style.display = 'block';
                }
            }

            if (window.updatePostBoxUI) window.updatePostBoxUI();
            await loadForumData();
        };

        // 💥 动态更新发帖框的头像、名字和颜色
        window.updatePostBoxUI = function() {
            const myChar = characterDB.find(c => c.owner_id === currentUser.id);
            const isGlobalAdmin = currentUser && ['admin', 'super_admin'].includes(currentUser.role);
            
            if (!myChar && !isGlobalAdmin) return;

            const typeSelect = document.getElementById('forum-author-type');
            const selectedType = typeSelect ? typeSelect.value : 'public';
            
            const isHidden = selectedType === 'hidden';
            const isAnnPublic = selectedType === 'announcement_public';
            const isAnnAdmin = selectedType === 'announcement_admin';
            const isNpc = selectedType === 'npc' || selectedType === 'announcement_npc';
            const isAdminNoChar = selectedType === 'admin' || isAnnAdmin;
            
            // 控制 NPC 输入框的显示与隐藏
            const npcWrapper = document.getElementById('npc-inputs-wrapper');
            if (npcWrapper) npcWrapper.style.display = isNpc ? 'flex' : 'none';

            let displayName = "UNKNOWN";
            if (isAdminNoChar) {
                displayName = "系统总控";
            } else if (isNpc) {
                displayName = document.getElementById('npc-name-input').value.trim() || "未命名 NPC";
            } else if (myChar) {
                displayName = getForumDisplayName(myChar, currentForumChannel, isHidden);
            }
            
            // 💥 核心修复：工作频道强制使用真实姓名首字母，且禁用图片头像防掉皮
            let avatarLetter = '⚙️';
            let avatarUrl = null; 
            
            if (isNpc) {
                avatarLetter = displayName.charAt(0).toUpperCase();
                avatarUrl = document.getElementById('npc-avatar-input').value.trim() || null;
            } else if (!isAdminNoChar && myChar) {
                if (currentForumChannel.startsWith('ORG_')) {
                    // 工作频道：强制使用真实姓名，且禁用自定义图片头像
                    const realName = isHidden ? (myChar.hidden_name || myChar.hidden_callsign) : (myChar.name || myChar.callsign);
                    avatarLetter = realName ? realName.charAt(0).toUpperCase() : '?';
                    avatarUrl = null; 
                } else {
                    // 其他频道：优先使用自定义昵称和图片头像
                    const realName = isHidden ? (myChar.hidden_forum_name || myChar.hidden_name || myChar.hidden_callsign) : (myChar.forum_name || myChar.name || myChar.callsign);
                    avatarLetter = realName ? realName.charAt(0).toUpperCase() : '?';
                    avatarUrl = isHidden ? myChar.hidden_avatar_url : myChar.forum_avatar_url;
                }
            }

            const avatarContent = (avatarUrl && !isAdminNoChar) ? `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover;">` : avatarLetter;
            
            const avatarEl = document.getElementById('post-box-avatar');
            const nameEl = document.getElementById('post-box-name');
            const profileBtn = document.getElementById('post-box-profile-btn');
            const subtitleEl = document.querySelector('.post-box-subtitle');
            
            let themeColor = '#4caf50'; 
            let bgColor = 'rgba(76, 175, 80, 0.1)';
            let subtitleText = '[ UPLINK SECURE // 正在编辑全息广播 ]';

            if (isHidden) {
                themeColor = '#e91e63'; 
                bgColor = 'rgba(233, 30, 99, 0.1)';
                subtitleText = '[ ENCRYPTED // 正在编辑暗网广播 ]';
            } else if (isAnnPublic || isAnnAdmin) {
                themeColor = '#ffeb3b'; 
                bgColor = 'rgba(255, 235, 59, 0.1)';
                subtitleText = '[ OVERRIDE // 正在编辑置顶公告 ]';
            } else if (isAdminNoChar) {
                themeColor = '#f44336'; 
                bgColor = 'rgba(244, 67, 54, 0.1)';
                subtitleText = '[ SYS_ADMIN // 系统总控广播 ]';
            } else if (isNpc) {
                themeColor = '#ff9800'; 
                bgColor = 'rgba(255, 152, 0, 0.1)';
                subtitleText = '[ NPC_MODE // 自定义角色广播 ]';
            }
            
            if (avatarEl) {
                avatarEl.innerHTML = avatarContent;
                avatarEl.style.overflow = 'hidden'; // 确保图片不超出圆角
                avatarEl.style.borderColor = themeColor;
                avatarEl.style.color = themeColor;
                avatarEl.style.background = bgColor;
            }
            if (nameEl) {
                nameEl.innerText = displayName;
                nameEl.style.color = isHidden ? '#ff80ab' : '#fff';
            }
            if (subtitleEl) {
                subtitleEl.innerText = subtitleText;
                subtitleEl.style.color = themeColor;
            }
            if (profileBtn) {
                if (isAdminNoChar) {
                    profileBtn.style.display = 'none'; 
                } else {
                    profileBtn.style.display = 'block';
                    profileBtn.onclick = () => openForumProfile(currentUser.id, isHidden);
                    profileBtn.style.borderColor = themeColor;
                    profileBtn.style.color = themeColor;
                }
            }
        };

        // 💥 新增：频道公告展开/收起逻辑
        window.toggleChannelAnnouncement = function(show) {
            const btn = document.getElementById('btn-show-announcement');
            const box = document.getElementById('channel-announcement-box');
            if (show) {
                btn.style.display = 'none';
                box.style.display = 'block';
            } else {
                btn.style.display = 'block';
                box.style.display = 'none';
            }
        };

        // 💥 新增：频道公告 Tab 切换逻辑
        window.switchAnnTab = function(tabId) {
            document.querySelectorAll('.ann-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.ann-tab-content').forEach(c => c.classList.remove('active'));
            document.querySelector(`.ann-tab-btn[data-tab="${tabId}"]`).classList.add('active');
            document.getElementById(tabId).classList.add('active');
        };

        // 💥 新增：个人终端 Tab 切换逻辑
        window.switchProfileTab = function(tabId) {
            document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
            
            const targetBtn = document.querySelector(`.profile-tab-btn[data-tab="${tabId}"]`);
            const targetContent = document.getElementById(tabId);
            
            if (targetBtn && targetContent) {
                targetBtn.classList.add('active');
                targetContent.classList.add('active');
            }
        };

        // 💥 新增：保存私密设定 (无需审核，直接入库)
        window.savePrivateLore = async function(charId) {
            const btn = event.target;
            const originalText = btn.innerText;
            btn.innerText = "[ 📡 SAVING... ]";
            btn.disabled = true;

            const relationships = document.getElementById('priv-relationships').value.trim();
            const history = document.getElementById('priv-history').value.trim();
            const biography = document.getElementById('priv-biography').value.trim();
            const secret_notes = document.getElementById('priv-secret-notes').value.trim();

            try {
                const { error } = await supabaseClient.from('characters').update({
                    relationships, history, biography, secret_notes
                }).eq('id', charId);

                if (error) throw error;

                // 💥 核心修复 1：强制转换为字符串对比，确保 100% 能找到本地缓存并更新
                const myChar = characterDB.find(c => String(c.id) === String(charId));
                if (myChar) {
                    myChar.relationships = relationships;
                    myChar.history = history;
                    myChar.biography = biography;
                    myChar.secret_notes = secret_notes;
                }

                // 💥 核心修复 2：先瞬间重新渲染 UI，再弹出提示框
                renderProfile();
                switchProfileTab('ptab-private');

                await SysModal.alert("私密设定已成功保存！", "SAVE SUCCESS");
                
            } catch (err) {
                console.error(err);
                await SysModal.alert("保存失败，请检查网络。", "✕ ERROR");
            } finally {
                // 💥 核心修复 3：只有当按钮还在页面上时才恢复状态（因为 renderProfile 已经把它销毁重建了）
                if (document.body.contains(btn)) {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            }
        };

        // 💥 修改：切换频道时，打上“刚刚切换”的标记，用于自动展开公告
        window.switchForumChannel = function(channel) {
            currentForumChannel = channel;
            sessionStorage.setItem('tf141_forum_channel', channel); 
            window.justSwitchedChannel = true; // 标记刚刚切换了频道
            initForum(); 
        };

// 2. 切换频道
        window.switchForumChannel = function(channel) {
            currentForumChannel = channel;
            sessionStorage.setItem('tf141_forum_channel', channel); // 💥 记忆论坛频道
            initForum(); // 重新渲染 UI 和数据
        };

// 3. 从云端加载帖子和评论 (加入保持滚动位置功能)
        window.loadForumData = async function(keepScroll = false) {
            const feed = document.getElementById('forum-feed');
            const currentScroll = window.scrollY || window.pageYOffset; // 记录当前滚动位置

            if (!keepScroll) {
                // 首次进入论坛时，显示加载动画
                feed.innerHTML = window.getCyberLoaderHTML('正在解密通讯信号...', '#4caf50');
            } else {
                // 发送消息刷新时，仅降低透明度，不销毁 DOM，防止页面跳动
                feed.style.opacity = '0.5'; 
            }

            try {
                const { data: posts, error: pErr } = await supabaseClient
                    .from('forum_posts')
                    .select('*')
                    .eq('channel', currentForumChannel)
                    .order('created_at', { ascending: false });
                if (pErr) throw pErr;

                const postIds = posts.map(p => p.id);
                let comments = [];
                if (postIds.length > 0) {
                    const { data: coms, error: cErr } = await supabaseClient
                        .from('forum_comments')
                        .select('*')
                        .in('post_id', postIds)
                        .order('created_at', { ascending: true });
                    if (cErr) throw cErr;
                    comments = coms;
                }

                forumPostsDB = posts;
                // 💥 核心：在前端进行排序，让频道公告永远置顶！
                forumPostsDB.sort((a, b) => {
                    if (a.is_announcement && !b.is_announcement) return -1;
                    if (!a.is_announcement && b.is_announcement) return 1;
                    return new Date(b.created_at) - new Date(a.created_at);
                });
                forumCommentsDB = comments;
                
                renderForumFeed();

                // 恢复滚动位置
                if (keepScroll) {
                    window.scrollTo({ top: currentScroll, behavior: 'auto' });
                }
            } catch (err) {
                console.error(err);
                feed.innerHTML = '<div style="color:#f44336; font-family:monospace;">[ ✕ 信号丢失，无法读取通讯频段 ]</div>';
            } finally {
                feed.style.opacity = '1'; // 恢复透明度
            }
        };

// 💥 格式化文本：高亮艾特 (@某人) 💥
window.formatMentions = function(text) {
    return text.replace(/@([^\s，。！？、：；]+)/g, '<span style="color:#ffeb3b; text-shadow:0 0 5px rgba(255,235,59,0.5); font-weight:bold; cursor:pointer;">@$1</span>');
};

// 💥 智能折叠判定引擎 (修复了首行多余空格的问题)
        window.formatContentWithCollapse = function(text, isPost, id) {
            const formatted = formatMentions(text.replace(/\n/g, '<br>'));
            const lineCount = (text.match(/\n/g) || []).length;
            const charCount = text.length;
            
            // 设定阈值：帖子容忍度高一点，评论容忍度低一点
            const limitLines = isPost ? 6 : 4;
            const limitChars = isPost ? 200 : 100;
            
            // 如果超标，则包裹折叠 HTML
            if (lineCount > limitLines || charCount > limitChars) {
                // 💥 核心修复：去掉了模板字符串里的所有换行和缩进空格，防止被 pre-wrap 渲染出来
                return `<div class="content-collapse-wrapper" id="collapse-${id}">${formatted}</div><button class="expand-toggle-btn" onclick="toggleCollapse('collapse-${id}', this)">[ 展开全文 ↓ ]</button>`;
            }
            // 没超标就正常显示
            return formatted;
        };

        // 💥 展开/收起切换动作
        window.toggleCollapse = function(wrapperId, btn) {
            const wrapper = document.getElementById(wrapperId);
            if (wrapper.classList.contains('expanded')) {
                wrapper.classList.remove('expanded');
                btn.innerText = '[ 展开全文 ↓ ]';
                // 收起时稍微往上滚一点，防止视野丢失
                wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                wrapper.classList.add('expanded');
                btn.innerText = '[ 收起 ↑ ]';
            }
        };

        // 💥 展开/收起多余评论
        window.toggleComments = function(postId, hiddenCount, btn) {
            const hiddenDiv = document.getElementById('hidden-comments-' + postId);
            if (hiddenDiv.style.display === 'none') {
                hiddenDiv.style.display = 'block';
                btn.innerText = '[ 收起回复 ↑ ]';
            } else {
                hiddenDiv.style.display = 'none';
                btn.innerText = `[ 展开其余 ${hiddenCount} 条回复 ↓ ]`;
                // 收起时，让页面滚回到这条帖子的顶部，防止视野丢失
                document.getElementById('forum-post-' + postId).scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };

// 💥 核心重构：将单条帖子的渲染逻辑抽离成独立函数，方便复用
        window.getPostHTML = function(post, context) {
            const { myChar, isGlobalAdmin, isChannelAdmin, canManage, isListeningMode } = context;
            const authorChar = characterDB.find(c => c.owner_id === post.owner_id);
            
            let cardClass = 'post-card';
            if (post.channel === 'ANNOUNCEMENT' || post.is_announcement) cardClass += ' announcement';
            else if (post.channel.startsWith('FACTION_')) cardClass += ' faction';
            else if (post.channel.startsWith('ORG_')) cardClass += ' org';

            let isHiddenPost = false;
            if (post.author_type === 'hidden' && authorChar && authorChar.has_hidden) {
                isHiddenPost = true;
            }
            
            // 💥 核心：解析 NPC 隐写数据
            let actualContent = post.content;
            const isNpcPost = post.author_type === 'npc';
            let npcName = 'NPC';
            let npcAvatar = '';

            if (isNpcPost) {
                const match = actualContent.match(/^\[NPC:(.*?)\|(.*?)\]\n([\s\S]*)$/);
                if (match) {
                    npcName = match[1];
                    npcAvatar = match[2];
                    actualContent = match[3];
                } else {
                    actualContent = actualContent.replace(/^\[NPC:.*?\|.*?\]\n/, ''); // 容错处理
                }
            }

            const isAdminPost = post.owner_id === 'admin' || post.author_type === 'admin';
            let callsign = getForumDisplayName(authorChar, post.channel, isHiddenPost);
            if (isAdminPost) callsign = '系统总控';
            if (isNpcPost) callsign = npcName;

            let avatarLetter = '⚙️';
            let avatarContent = avatarLetter;
            
            if (isNpcPost) {
                avatarLetter = callsign.charAt(0).toUpperCase();
                if (npcAvatar) {
                    avatarContent = `<img src="${npcAvatar}" style="width:100%; height:100%; object-fit:cover;">`;
                } else {
                    avatarContent = avatarLetter;
                }
            } else if (!isAdminPost && authorChar) {
                if (post.channel.startsWith('ORG_')) {
                    const realName = isHiddenPost ? (authorChar.hidden_name || authorChar.hidden_callsign) : (authorChar.name || authorChar.callsign);
                    avatarLetter = realName ? realName.charAt(0).toUpperCase() : '?';
                    avatarContent = avatarLetter; 
                } else {
                    const realName = isHiddenPost ? (authorChar.hidden_forum_name || authorChar.hidden_name || authorChar.hidden_callsign) : (authorChar.forum_name || authorChar.name || authorChar.callsign);
                    avatarLetter = realName ? realName.charAt(0).toUpperCase() : '?';
                    
                    const avatarUrl = isHiddenPost ? authorChar.hidden_avatar_url : authorChar.forum_avatar_url;
                    if (avatarUrl) {
                        avatarContent = `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover;">`;
                    } else {
                        avatarContent = avatarLetter;
                    }
                }
            }
            
            const avatarClickAttr = (isAdminPost || isNpcPost)
                ? `style="overflow:hidden; border-color:${isNpcPost ? '#ff9800' : '#f44336'}; color:${isNpcPost ? '#ff9800' : '#f44336'}; background:rgba(${isNpcPost ? '255,152,0' : '244,67,54'},0.1);"` 
                : `style="cursor:pointer; overflow:hidden;" onclick="openForumProfile('${post.owner_id}', ${isHiddenPost})"`;
            
            const nameClickAttr = (isAdminPost || isNpcPost)
                ? `style="display:inline-block; color:${isNpcPost ? '#ff9800' : '#f44336'};"` 
                : `style="cursor:pointer; display:inline-block;" onclick="openForumProfile('${post.owner_id}', ${isHiddenPost})"`;

            const timeObj = new Date(post.created_at);
            const timeStr = `${timeObj.getFullYear()}-${String(timeObj.getMonth()+1).padStart(2,'0')}-${String(timeObj.getDate()).padStart(2,'0')} ${String(timeObj.getHours()).padStart(2,'0')}:${String(timeObj.getMinutes()).padStart(2,'0')}`;

            const postComments = forumCommentsDB.filter(c => c.post_id === post.id);
            let commentsHtml = '';
            
            if (postComments.length > 0) {
                const renderSingleComment = (c) => {
                    const cAuthor = characterDB.find(char => char.owner_id === c.owner_id);
                    let isHidden = c.author_type === 'hidden' && cAuthor && cAuthor.has_hidden;
                    
                    let cActualContent = c.content;
                    const isNpcComment = c.author_type === 'npc';
                    let cNpcName = 'NPC';

                    if (isNpcComment) {
                        const match = cActualContent.match(/^\[NPC:(.*?)\|(.*?)\]\n([\s\S]*)$/);
                        if (match) {
                            cNpcName = match[1];
                            cActualContent = match[3];
                        }
                    }

                    const isAdminComment = c.author_type === 'admin';
                    let cName = getForumDisplayName(cAuthor, post.channel, isHidden);
                    if (isAdminComment) cName = '系统总控';
                    if (isNpcComment) cName = cNpcName;

                    let cDeleteBtn = (canManage || c.owner_id === currentUser?.id)
                        ? `<span class="comment-action-btn" style="color:#f44336;" onclick="deleteForumComment('${c.id}')">[删]</span>` : '';
                    
                    let cReplyBtn = '';
                    if ((myChar && !isListeningMode) || isGlobalAdmin) {
                        cReplyBtn = `<span class="comment-action-btn" style="color:#8bb9d6; opacity:0.8;" onclick="replyToComment('${post.id}', '${cName}')">[回复]</span>`;
                    }

                    const authorStyleAttr = (isAdminComment || isNpcComment)
                        ? `style="color: ${isNpcComment ? '#ff9800' : '#f44336'}; font-weight: bold;"` 
                        : `style="color: #12a8ff; font-weight: bold; cursor:pointer;" onclick="openForumProfile('${c.owner_id}', ${isHidden})"`;

                    return `
                        <div class="comment-item-box">
                            <div class="comment-header-row">
                                <div class="comment-author-group">
                                    <span class="comment-author" ${authorStyleAttr}>[${cName}]</span>
                                    ${cReplyBtn}
                                    ${cDeleteBtn}
                                </div>
                                <span class="comment-time-text">${new Date(c.created_at).toLocaleString()}</span>
                            </div>
                            <div class="comment-content">${formatContentWithCollapse(cActualContent, false, 'comment-' + c.id)}</div>
                        </div>
                    `;
                };

                const COMMENT_LIMIT = 3; 
                if (postComments.length <= COMMENT_LIMIT) {
                    commentsHtml = postComments.map(renderSingleComment).join('');
                } else {
                    const visibleComments = postComments.slice(0, COMMENT_LIMIT).map(renderSingleComment).join('');
                    const hiddenComments = postComments.slice(COMMENT_LIMIT).map(renderSingleComment).join('');
                    const hiddenCount = postComments.length - COMMENT_LIMIT;
                    commentsHtml = `
                        ${visibleComments}
                        <div id="hidden-comments-${post.id}" style="display: none;">${hiddenComments}</div>
                        <button class="expand-toggle-btn" style="width: 100%; text-align: center; background: rgba(18,168,255,0.05); border: 1px dashed rgba(18,168,255,0.3); margin-top: 5px; padding: 8px 0;" onclick="toggleComments('${post.id}', ${hiddenCount}, this)">
                            [ 展开其余 ${hiddenCount} 条回复 ↓ ]
                        </button>
                    `;
                }
            }

            const hasChar = characterDB.some(c => c.owner_id === currentUser?.id);
            let commentInputHtml = '';
            
            if ((hasChar && !isListeningMode) || isGlobalAdmin) {
                let authorTypeHtml = ''; 
                let optHtml = '';
                if (hasChar && !isListeningMode) {
                    optHtml += `<option value="public">以 [ 表身份 ] 回复</option>`;
                    if (myChar && myChar.has_hidden) {
                        optHtml += `<option value="hidden" style="color: #e91e63;">以 [ 里身份 ] 回复</option>`;
                    }
                }
                if (isGlobalAdmin) {
                    optHtml += `<option value="admin" style="color: #f44336;">以 [ 系统总控 ] 回复</option>`;
                    optHtml += `<option value="npc" style="color: #ff9800;">以 [ 自定义 NPC ] 回复</option>`;
                }
                
                if (optHtml) {
                    authorTypeHtml = `
                        <select id="comment-author-type-${post.id}" style="background: rgba(0,0,0,0.5); color: #fff; border: 1px solid #12a8ff; padding: 4px; font-family: monospace; outline: none; border-radius: 2px; font-size:12px; margin-bottom: 5px; box-sizing: border-box; width: 100%;">
                            ${optHtml}
                        </select>
                    `;
                }

                commentInputHtml = `
                    <div class="comment-input-wrapper">
                        ${authorTypeHtml}
                        <div class="comment-input-row">
                            <textarea id="comment-input-${post.id}" 
                                class="comment-textarea"
                                rows="1" 
                                placeholder="输入回复... (电脑端 Enter 发送)" 
                                oninput="this.style.height='auto'; this.style.height=(this.scrollHeight)+'px';"
                                onkeydown="if(event.key==='Enter') { const isMobile = window.innerWidth <= 900 || /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent); if(!isMobile && !event.shiftKey) { event.preventDefault(); submitComment('${post.id}'); } }"></textarea>
                            <button class="sys-modal-btn confirm comment-submit-btn" onclick="submitComment('${post.id}')">回复</button>
                        </div>
                    </div>
                `;
            }

            let factionHtml = '';
            if (post.channel.startsWith('ORG_')) {
                let factionTag = authorChar ? authorChar.faction : 'LOST_SIGNAL';
                if (isHiddenPost) factionTag = authorChar.hidden_faction;
                factionHtml = `<br><span>${factionTag}</span>`;
            }

            const isOwner = post.owner_id === currentUser?.id;
            
            let deleteBtnHtml = '';
            let editBtnHtml = '';
            let auditBtnHtml = '';

            if (canManage || isOwner) {
                deleteBtnHtml = `<span style="color:#f44336; cursor:pointer; font-size:12px; margin-left: 10px;" onclick="deleteForumPost('${post.id}')">[删]</span>`;
            }

            if (isOwner || (canManage && post.is_announcement)) {
                editBtnHtml = `<span style="color:#ffeb3b; cursor:pointer; font-size:12px; margin-left: 10px;" onclick="editForumPost('${post.id}')">[改]</span>`;
            }

            if (canManage && !isOwner) {
                if (post.status === 'auditing') {
                    auditBtnHtml = `<span style="color:#4caf50; cursor:pointer; font-size:12px; margin-left: 10px;" onclick="unauditForumPost('${post.id}')">[解审]</span>`;
                } else {
                    auditBtnHtml = `<span style="color:#ff9800; cursor:pointer; font-size:12px; margin-left: 10px;" onclick="auditForumPost('${post.id}')">[审核]</span>`;
                }
            }

            let annBadge = '';
            if (post.is_announcement) {
                annBadge = `<span style="color:#ffeb3b; border:1px solid #ffeb3b; background:rgba(255,235,59,0.1); padding:2px 6px; border-radius:2px; font-size:10px; margin-left:8px; white-space:nowrap;">⚠️ 频道公告</span>`;
            }

            let finalPostContentHtml = '';
            let finalCommentsHtml = commentsHtml;
            let finalCommentInputHtml = commentInputHtml;

            if (post.status === 'auditing') {
                if (isOwner || canManage) {
                    finalPostContentHtml = `
                        <div style="background: rgba(244,67,54,0.1); border: 1px dashed #f44336; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
                            <div style="color: #f44336; font-weight: bold; font-size: 13px; margin-bottom: 5px; font-family: monospace;">[ ⚠️ 该贴正在审核中 ]</div>
                            <div style="color: #ffb4a9; font-size: 12px;">原因：${post.audit_reason || '无'}</div>
                            ${isOwner ? '<div style="color: #ffeb3b; font-size: 12px; margin-top: 5px;">您可以点击右上角的 [改] 按钮修改内容，修改后将自动解除审核状态。</div>' : ''}
                        </div>
                        <div style="opacity: 0.5; pointer-events: none;">${formatContentWithCollapse(actualContent, true, 'post-' + post.id)}</div>
                    `;
                } else {
                    finalPostContentHtml = `
                        <div style="background: rgba(244,67,54,0.1); border: 1px dashed #f44336; padding: 20px; text-align: center; border-radius: 4px;">
                            <span style="color: #f44336; font-weight: bold; font-family: monospace; letter-spacing: 1px;">[ ⚠️ 该贴正在审核中 ]</span>
                        </div>
                    `;
                    finalCommentsHtml = ''; 
                    finalCommentInputHtml = ''; 
                }
            } else {
                finalPostContentHtml = formatContentWithCollapse(actualContent, true, 'post-' + post.id);
            }

            return `
                <div class="${cardClass}" id="forum-post-${post.id}">
                    <div class="post-header">
                        <div class="post-author">
                            <div class="post-avatar" ${avatarClickAttr}>${avatarContent}</div>
                            <div class="post-info">
                                <h4 ${nameClickAttr}>${callsign}</h4> ${annBadge} ${editBtnHtml} ${auditBtnHtml} ${deleteBtnHtml}
                                ${factionHtml}
                            </div>
                        </div>
                        <div class="post-time">${timeStr}</div>
                    </div>
                    <div class="post-content">${finalPostContentHtml}</div>
                    <div class="comments-section">
                        ${finalCommentsHtml}
                        ${finalCommentInputHtml}
                    </div>
                </div>
            `;
        };

        // 💥 渲染论坛信息流 (分离公告与普通帖子)
        window.renderForumFeed = function() {
            const feed = document.getElementById('forum-feed');
            feed.innerHTML = '';

            let myChar = null;
            if (currentUser && currentUser.role !== 'guest') {
                myChar = characterDB.find(c => c.owner_id === currentUser.id);
            }

            const isGlobalAdmin = currentUser && ['admin', 'super_admin'].includes(currentUser.role);
            let isChannelAdmin = false;
            
            if (currentForumChannel.startsWith('FACTION_')) {
                const targetFaction = currentForumChannel.replace('FACTION_', '');
                const article = articlesDB.find(a => a.type === 'faction' && a.title === targetFaction);
                if (article && article.channel_admins && article.channel_admins.includes(currentUser.id)) isChannelAdmin = true;
            } else if (currentForumChannel.startsWith('ORG_')) {
                const targetOrg = currentForumChannel.replace('ORG_', '');
                const article = articlesDB.find(a => a.type === 'org' && a.title === targetOrg);
                if (article && article.channel_admins && article.channel_admins.includes(currentUser.id)) isChannelAdmin = true;
            }

            const canManage = isGlobalAdmin || isChannelAdmin;

            let isListeningMode = false;
            if (isGlobalAdmin) {
                if (currentForumChannel.startsWith('FACTION_')) {
                    const targetFaction = currentForumChannel.replace('FACTION_', '');
                    isListeningMode = !(myChar && (myChar.faction === targetFaction || (myChar.has_hidden && myChar.hidden_faction === targetFaction)));
                } else if (currentForumChannel.startsWith('ORG_')) {
                    const targetOrg = currentForumChannel.replace('ORG_', '');
                    isListeningMode = !(myChar && (myChar.organization === targetOrg || (myChar.has_hidden && myChar.hidden_org === targetOrg)));
                }
            }

            const context = { myChar, isGlobalAdmin, isChannelAdmin, canManage, isListeningMode };

            // 💥 核心：分离公告和普通帖子
            let announcements = [];
            let regularPosts = [];
            
            if (currentForumChannel === 'ANNOUNCEMENT') {
                // 如果在纯公告频道，所有帖子都在信息流里正常显示，不使用 Tab
                regularPosts = forumPostsDB;
            } else {
                announcements = forumPostsDB.filter(p => p.is_announcement);
                regularPosts = forumPostsDB.filter(p => !p.is_announcement);
            }

            // 💥 渲染频道公告 Tab 区
            const annWrapper = document.getElementById('channel-announcement-wrapper');
            if (announcements.length > 0) {
                annWrapper.style.display = 'block';
                
                // 渲染最新公告
                const latestHtml = getPostHTML(announcements[0], context);
                document.getElementById('ann-latest').innerHTML = latestHtml;
                
                // 渲染历史公告
                if (announcements.length > 1) {
                    const historyHtml = announcements.slice(1).map(p => getPostHTML(p, context)).join('');
                    document.getElementById('ann-history').innerHTML = historyHtml;
                } else {
                    document.getElementById('ann-history').innerHTML = '<div style="color: #8bb9d6; font-family: monospace; text-align: center; padding: 20px;">[ 暂无历史公告 ]</div>';
                }
                
                // 每次切换频道时，自动展开公告
                if (window.justSwitchedChannel) {
                    toggleChannelAnnouncement(true);
                    window.justSwitchedChannel = false;
                }
            } else {
                annWrapper.style.display = 'none';
            }

            // 渲染管理横幅
            if (isGlobalAdmin && !isChannelAdmin && currentForumChannel !== 'GLOBAL' && currentForumChannel !== 'ANNOUNCEMENT') {
                feed.innerHTML += `
                    <div class="system-notice" style="border-color: #f44336; background: rgba(244,67,54,0.1); margin-bottom: 20px;">
                        <div style="color: #f44336; font-weight: bold; font-family: monospace;">[ 最高权限介入 ]</div>
                        <div style="color: #ffb4a9; font-size: 13px; margin-top: 5px;">您正在以网站管理员权限介入此频段。您可以删帖或发布置顶公告。</div>
                    </div>
                `;
            } else if (isChannelAdmin) {
                feed.innerHTML += `
                    <div class="system-notice" style="border-color: #ffeb3b; background: rgba(255,235,59,0.1); margin-bottom: 20px;">
                        <div style="color: #ffeb3b; font-weight: bold; font-family: monospace;">[ 频道管理员模式 ]</div>
                        <div style="color: #fff8b0; font-size: 13px; margin-top: 5px;">您是当前频道的管理员，拥有删帖与发布置顶公告的权限。</div>
                    </div>
                `;
            }

            if (regularPosts.length === 0) {
                feed.innerHTML += '<div style="color:#8bb9d6; font-family:monospace;">[ 当前频段暂无通讯记录 ]</div>';
                return;
            }

            // 渲染普通帖子流
            feed.innerHTML += regularPosts.map(p => getPostHTML(p, context)).join('');
        };

// 💥 回复快捷键：将用户名填入输入框
window.replyToComment = function(postId, authorName) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (input) {
        input.value = `@${authorName} ` + input.value;
        input.focus();
    }
};

// 💥 删除单条评论
window.deleteForumComment = async function(commentId) {
    const isSure = await SysModal.confirm("确认删除这条评论吗？\n此操作不可逆。", "⚠️ 删除评论");
    if (!isSure) return;
    try {
        await supabaseClient.from('forum_comments').delete().eq('id', commentId);
        loadForumData(true);
    } catch(e) {
        SysModal.alert("删除失败", "ERROR");
    }
};

        // 5. 发布新帖子
        window.submitForumPost = async function() {
            const input = document.getElementById('new-post-content');
            const content = input.value.trim();
            if (!content) return;

            const isGlobalAdmin = currentUser && ['admin', 'super_admin'].includes(currentUser.role);
            if (currentForumChannel === 'ANNOUNCEMENT' && !isGlobalAdmin) {
                SysModal.alert('权限不足，无法发布公告。', 'ACCESS DENIED');
                return;
            }

            const typeSelectVal = document.getElementById('forum-author-type').value;
            let authorType = typeSelectVal;
            let isAnn = false;

            // 💥 核心：解析双重公告选项
            if (typeSelectVal === 'announcement_public') {
                isAnn = true;
                authorType = 'public';
            } else if (typeSelectVal === 'announcement_admin') {
                isAnn = true;
                authorType = 'admin';
            } else if (typeSelectVal === 'announcement_npc') {
                isAnn = true;
                authorType = 'npc';
            } else if (currentForumChannel === 'ANNOUNCEMENT') {
                isAnn = true;
            }

            if (typeSelectVal === 'admin') {
                authorType = 'admin';
            } else if (typeSelectVal === 'npc') {
                authorType = 'npc';
            }

            // 💥 核心：如果是 NPC，把名字和头像隐写在正文最前面
            let finalContent = content;
            if (authorType === 'npc') {
                const npcName = document.getElementById('npc-name-input').value.trim();
                const npcAvatar = document.getElementById('npc-avatar-input').value.trim();
                if (!npcName) {
                    SysModal.alert('请填写 NPC 名字！', 'SYSTEM NOTE');
                    return;
                }
                finalContent = `[NPC:${npcName}|${npcAvatar}]\n${content}`;
            }

            try {
                const { error } = await supabaseClient.from('forum_posts').insert([{
                    owner_id: currentUser.id,
                    channel: currentForumChannel,
                    content: finalContent,
                    author_type: authorType,
                    is_announcement: isAnn
                }]);
                if (error) throw error;
                
                input.value = '';
                const typeSelect = document.getElementById('forum-author-type');
                if (typeSelect) {
                    const myChar = characterDB.find(c => c.owner_id === currentUser.id);
                    typeSelect.value = (myChar ? 'public' : 'admin');
                    if(window.updatePostBoxUI) window.updatePostBoxUI();
                }
                loadForumData(true); 
            } catch (err) {
                console.error(err);
                SysModal.alert('发送失败，请检查网络。', 'ERROR');
            }
        };

        // 💥 修改帖子 (恢复自动解除审核功能)
        window.editForumPost = async function(postId) {
            const post = forumPostsDB.find(p => p.id === postId);
            if (!post) return;
            
            const newContent = await SysModal.prompt("修改广播内容：", post.content, "📝 EDIT POST // 修改广播", 'textarea');
            if (newContent === null || newContent.trim() === '') return;
            
            try {
                // 既然数据库已经有了 status 和 audit_reason 字段，我们可以恢复自动解除审核的功能
                const { error } = await supabaseClient.from('forum_posts').update({ 
                    content: newContent.trim(),
                    status: 'active', // 自动解除审核
                    audit_reason: null
                }).eq('id', postId);
                
                if (error) throw error;
                loadForumData(true);
            } catch (e) {
                console.error("修改广播报错:", e);
                SysModal.alert("修改失败，请检查网络。", "ERROR");
            }
        };

        // 💥 新增：将帖子送去审核
        window.auditForumPost = async function(postId) {
            const reason = await SysModal.prompt("请输入送审原因（仅发帖人可见）：", "", "⚠️ AUDIT POST // 帖子审核", "textarea");
            if (reason === null || reason.trim() === '') return;

            try {
                const { error } = await supabaseClient.from('forum_posts').update({ 
                    status: 'auditing',
                    audit_reason: reason.trim()
                }).eq('id', postId);
                if (error) throw error;
                loadForumData(true);
            } catch (e) {
                SysModal.alert("操作失败，请检查网络。", "ERROR");
            }
        };

        // 💥 新增：管理员手动解除审核
        window.unauditForumPost = async function(postId) {
            const isSure = await SysModal.confirm("确认解除该帖的审核状态吗？", "✅ 解除审核");
            if (!isSure) return;

            try {
                const { error } = await supabaseClient.from('forum_posts').update({ 
                    status: 'active',
                    audit_reason: null
                }).eq('id', postId);
                if (error) throw error;
                loadForumData(true);
            } catch (e) {
                SysModal.alert("操作失败，请检查网络。", "ERROR");
            }
        };

        // 💥 新增：修改评论
        window.editForumComment = async function(commentId) {
            const comment = forumCommentsDB.find(c => c.id === commentId);
            if (!comment) return;
            
            const newContent = await SysModal.prompt("修改回复内容：", comment.content, "📝 EDIT COMMENT // 修改回复", 'textarea');
            if (newContent === null || newContent.trim() === '') return;
            
            try {
                const { error } = await supabaseClient.from('forum_comments').update({ content: newContent.trim() }).eq('id', commentId);
                if (error) throw error;
                loadForumData(true);
            } catch (e) {
                SysModal.alert("修改失败，请检查网络。", "ERROR");
            }
        };

// 6. 发布评论 (修改以支持 author_type)
window.submitComment = async function(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    if (!content) return;

    let authorType = 'public';
    const typeSelect = document.getElementById(`comment-author-type-${postId}`);
    if (typeSelect) {
        authorType = typeSelect.value;
    }

    let finalContent = content;
    if (authorType === 'npc') {
        const npcName = await SysModal.prompt("请输入 NPC 名字：", "", "自定义 NPC 回复");
        if (!npcName) return;
        finalContent = `[NPC:${npcName.trim()}|]\n${content}`;
    }

    try {
        const { error } = await supabaseClient.from('forum_comments').insert([{
            post_id: postId,
            owner_id: currentUser.id,
            content: finalContent,
            author_type: authorType
        }]);
        if (error) throw error;
        
        input.value = '';
        loadForumData(true); 
    } catch (err) {
        console.error(err);
        SysModal.alert('回复失败，请检查网络。', 'ERROR');
    }
};

// 7. 删除帖子
window.deleteForumPost = async function(postId) {
    const isSure = await SysModal.confirm("确认要删除这条广播吗？此操作将同时删除其下的所有评论。", "⚠️ 删除广播");
    if (!isSure) return;

    try {
        await supabaseClient.from('forum_posts').delete().eq('id', postId);
        loadForumData(true);
    } catch (err) {
        SysModal.alert('删除失败。', 'ERROR');
    }
};

/* =========================================================
           💥 全局消息提示系统 (Notifications) 💥
           ========================================================= */
        // 展开/收起消息盒子
        window.toggleNotifications = async function(e) {
            e.stopPropagation();
            const dropdown = document.getElementById('notif-dropdown');
            if (dropdown) {
                if (dropdown.style.display === 'none' || dropdown.style.display === '') {
                    // 1. 展开面板，隐藏小红点
                    dropdown.style.display = 'flex';
                    document.getElementById('notif-badge').style.display = 'none';
                    
                    // 2. 💥 立即显示加载动画，解决“反应慢”的错觉
                    dropdown.innerHTML = '<div style="color:#12a8ff; font-size:12px; text-align:center; padding:15px;"><span class="blink-cursor">_</span> SYNCING SIGNAL...</div>';
                    
                    // 3. 💥 实时拉取最新消息并渲染
                    await checkNotifications();
                    
                    // 4. 💥 渲染完毕后，标记当前时间为已读时间。这样本次你看到的还是 [NEW]，但下次打开时它们就会变成 [HISTORY]
                    localStorage.setItem(`tf141_notif_read_${currentUser.id}`, Date.now());
                } else {
                    dropdown.style.display = 'none';
                }
            }
        };

        // 点击外部关闭消息盒子
        document.addEventListener('click', (e) => {
            const wrapper = document.getElementById('notif-wrapper');
            const dropdown = document.getElementById('notif-dropdown');
            if (wrapper && dropdown && !wrapper.contains(e.target)) {
                if (dropdown.style.display === 'flex') {
                    dropdown.style.display = 'none';
                    // 💥 去掉了原来这里多余的 checkNotifications()，减轻服务器负担
                }
            }
        });

        // 💥 点击消息跳转至对应的频段并定位到具体帖子
        window.gotoPost = async function(channel, postId) {
            const dropdown = document.getElementById('notif-dropdown');
            if (dropdown) dropdown.style.display = 'none';
            
            const forumBtn = document.querySelector('.wiki-item-btn[data-target="forumView"]');
            if(forumBtn) forumBtn.click();
            
            // 切换频道并等待数据加载完毕
            currentForumChannel = channel;
            sessionStorage.setItem('tf141_forum_channel', channel);
            await initForum(); 
            
            // 延迟一下等待 DOM 渲染，然后滚动到对应帖子
            setTimeout(() => {
                const postEl = document.getElementById(`forum-post-${postId}`);
                if (postEl) {
                    postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // 闪烁高亮特效 (赛博黄锁定)
                    postEl.style.transition = 'box-shadow 0.3s, border-color 0.3s';
                    postEl.style.boxShadow = '0 0 30px #ffeb3b, inset 0 0 20px #ffeb3b';
                    postEl.style.borderColor = '#ffeb3b';
                    
                    // 2秒后恢复原样
                    setTimeout(() => {
                        postEl.style.boxShadow = '';
                        postEl.style.borderColor = '';
                    }, 2000);
                }
            }, 300);
        };

        // 💥 检查被提及的新消息 (增强版：支持楼内回复监听)
        window.checkNotifications = async function() {
            if (!currentUser || currentUser.role === 'guest') return;
            const dropdown = document.getElementById('notif-dropdown');
            
            const myChar = characterDB.find(c => c.owner_id === currentUser.id);
            if (!myChar) {
                if (dropdown) dropdown.innerHTML = `<div style="color:#8bb9d6; font-size:12px; text-align:center; padding:15px;">[ 需要先录入公民档案，才能接收加密通讯 ]</div>`;
                return;
            }

            const callsign = myChar.callsign;
            const hiddenCallsign = (myChar.has_hidden && myChar.hidden_callsign) ? myChar.hidden_callsign.trim() : null;

            // 💥 新增：获取我发过的所有帖子 ID，用来接收“楼内直接回复”
            const { data: myPosts } = await supabaseClient.from('forum_posts').select('id').eq('owner_id', currentUser.id);
            const myPostIds = myPosts ? myPosts.map(p => p.id) : [];

            // 评论查询：包含 @我的，或者 回复了我的帖子的
            let commentQuery = `content.ilike.%@${callsign}%`;
            if (hiddenCallsign) commentQuery += `,content.ilike.%@${hiddenCallsign}%`;
            if (myPostIds.length > 0) commentQuery += `,post_id.in.(${myPostIds.join(',')})`;

            // 帖子查询：只包含 @我的
            let postQuery = `content.ilike.%@${callsign}%`;
            if (hiddenCallsign) postQuery += `,content.ilike.%@${hiddenCallsign}%`;

            try {
                const { data: comments, error: cErr } = await supabaseClient
                    .from('forum_comments')
                    .select('*, forum_posts(channel)')
                    .or(commentQuery)
                    .order('created_at', { ascending: false })
                    .limit(15);
                    
                const { data: posts, error: pErr } = await supabaseClient
                    .from('forum_posts')
                    .select('*')
                    .or(postQuery)
                    .order('created_at', { ascending: false })
                    .limit(15);

                if (cErr || pErr) throw (cErr || pErr);

                let allMentions = [];
                if (comments) allMentions = allMentions.concat(comments.map(c => ({...c, is_post: false, chan: c.forum_posts?.channel})));
                if (posts) allMentions = allMentions.concat(posts.map(p => ({...p, is_post: true, chan: p.channel})));
                
                // 排除自己回复自己的情况
                allMentions = allMentions.filter(m => m.owner_id !== currentUser.id);
                
                allMentions.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
                allMentions = allMentions.slice(0, 15);

                const lastReadTime = parseInt(localStorage.getItem(`tf141_notif_read_${currentUser.id}`) || '0', 10);
                
                const newMentions = allMentions.filter(m => new Date(m.created_at).getTime() > lastReadTime);
                const historyMentions = allMentions.filter(m => new Date(m.created_at).getTime() <= lastReadTime);

                const badge = document.getElementById('notif-badge');
                
                if (newMentions.length > 0) {
                    if (badge) {
                        badge.style.display = 'inline-block';
                        badge.innerText = newMentions.length > 9 ? '9+' : newMentions.length;
                    }
                } else {
                    if (badge) badge.style.display = 'none';
                }

                if (dropdown) {
                    let html = '';
                    
                    const renderMentionItem = (item, isNew) => {
                        const author = characterDB.find(char => char.owner_id === item.owner_id);
                        let authorName = author ? author.callsign : '某人';
                        if (item.author_type === 'hidden' && author?.has_hidden) authorName = author.hidden_callsign;
                        
                        // 💥 核心修复 1：如果发信人是系统总控，强制覆盖名字，防止在消息列表掉皮
                        if (item.author_type === 'admin') authorName = '系统总控';
                        
                        const timeStr = new Date(item.created_at).toLocaleString();
                        const snippet = item.content.length > 25 ? item.content.substring(0, 25) + '...' : item.content;
                        
                        // 💥 智能判断提示语：是@我，还是直接回复了我的帖子
                        let actionStr = "";
                        if (item.is_post) {
                            actionStr = "在全息广播中提到了你";
                        } else {
                            const isMention = item.content.includes(`@${callsign}`) || (hiddenCallsign && item.content.includes(`@${hiddenCallsign}`));
                            actionStr = isMention ? "在回复中提到了你" : "回复了你的广播";
                        }
                        
                        const borderStyle = isNew ? 'border:1px solid #12a8ff;' : 'border:1px solid rgba(18,168,255,0.3); opacity: 0.6;';
                        const titleColor = isNew ? '#e0f2fe' : '#8bb9d6';
                        
                        // 💥 核心：传入目标帖子的 ID
                        const targetPostId = item.is_post ? item.id : item.post_id;
                        
                        return `
                            <div style="background:rgba(0,5,10,0.8); ${borderStyle} padding:8px; border-radius:4px; cursor:pointer; transition:0.2s; margin-bottom:5px;" onmouseover="this.style.background='rgba(18,168,255,0.2)'; this.style.opacity='1';" onmouseout="this.style.background='rgba(0,5,10,0.8)'; this.style.opacity='${isNew ? 1 : 0.6}';" onclick="gotoPost('${item.chan}', '${targetPostId}')">
                                <div style="color:${titleColor}; font-size:12px; margin-bottom:4px;">
                                    ${isNew ? '<span style="color:#f44336; font-weight:bold; margin-right:4px;">[NEW]</span>' : ''}
                                    <strong>${authorName}</strong> ${actionStr}
                                </div>
                                <div style="color:#8bb9d6; font-size:11px; margin-bottom:4px;">"${snippet}"</div>
                                <div style="color:#12a8ff; font-size:10px; font-family:monospace; opacity:0.8;">${timeStr} | 频道: ${item.chan}</div>
                            </div>
                        `;
                    };

                    if (newMentions.length > 0) {
                        html += `<div style="font-family:monospace; color:#12a8ff; font-weight:bold; border-bottom:1px dashed rgba(18,168,255,0.4); padding-bottom:5px; margin-bottom:5px;">[ 最新提及 MENTIONS ]</div>`;
                        newMentions.forEach(item => html += renderMentionItem(item, true));
                    }
                    
                    if (historyMentions.length > 0) {
                        html += `<div style="font-family:monospace; color:#666; font-weight:bold; border-bottom:1px dashed rgba(255,255,255,0.2); padding-bottom:5px; margin-top:10px; margin-bottom:5px;">[ 历史消息 HISTORY ]</div>`;
                        historyMentions.forEach(item => html += renderMentionItem(item, false));
                    }

                    if (allMentions.length === 0) {
                        html = `<div style="color:#8bb9d6; font-size:12px; text-align:center; padding:15px;">[ 暂无任何通讯记录 ]</div>`;
                    }
                    
                    dropdown.innerHTML = html;
                }
            } catch (e) {
                console.error("Failed to fetch notifications:", e);
                if (dropdown) {
                    dropdown.innerHTML = `<div style="color:#f44336; font-size:12px; text-align:center; padding:15px;">[ ✕ 通讯接收失败，信号丢失 ]</div>`;
                }
            }
        };

// 💥 侧边栏点击逻辑 (终极修复版)
        wikiButtons.forEach(button => {
    button.addEventListener('click', async () => { 
        const targetId = button.getAttribute('data-target');
        
        // 1. 游客权限拦截
        if (currentUser && currentUser.role === 'guest') {
            if (['createView', 'queueView', 'profileView', 'logView', 'storyView'].includes(targetId)) {
                await SysModal.alert("游客无权访问此模块。\n请点击右上角 [ ⏻登录 ] 获取正式身份。", "⚠️ ACCESS DENIED // 拒绝访问");
                return;
            }
        }

        // 2. 档案审核拦截
        if (targetId === 'logView' || targetId === 'forumView' || targetId === 'storyView') {
            const isAdmin = currentUser && ['admin', 'super_admin'].includes(currentUser?.role);
            const hasApprovedProfile = characterDB.some(c => c.owner_id === currentUser.id);

            if (!isAdmin && !hasApprovedProfile) {
                await SysModal.alert("您的档案尚未通过管理员审核，无法访问该页面。\n请前往「办事大厅」查看审核进度。", "⚠️ ACCESS DENIED // 拒绝访问");
                return; 
            }
        }

        // 3. 模块专属初始化逻辑
        if (targetId === 'forumView') {
            if (typeof initForum === 'function') initForum(); 
        }
        if (targetId === 'storyView') {
            if (typeof renderStoryView === 'function') renderStoryView();
            
        }

        

        // 4. 切换视图面板
        viewPanels.forEach(panel => { panel.classList.remove('active'); });
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) { 
            targetPanel.classList.add('active'); 
            sessionStorage.setItem('tf141_current_view', targetId);
            
            // 💥 核心修复：切换页面时，强制将滚动条瞬间重置到顶部！
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
        closeSidebar();

        // 5. 3D 隧道延迟渲染
        if (targetId === 'logView') {
            setTimeout(() => {
                if (typeof init3DTunnel === 'function') init3DTunnel();
            }, 100);
        }
    });
});

        /* =========================================================
           💥 历史时间线 (Timeline) 交互引擎 💥
           ========================================================= */
        
        // 1. 点击左侧导航，平滑滚动到对应年份
        document.querySelectorAll('.timeline-nav a').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('data-scroll');
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    // 手机端因为有吸顶导航，需要减去偏移量防止遮挡
                    const yOffset = window.innerWidth <= 900 ? -120 : 0;
                    const y = targetEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            });
        });

        // 2. 专属雷达：监听滚动，自动展开左侧的折线与文字
        const tlObserverOptions = {
            root: null,
            rootMargin: '-20% 0px -50% 0px', // 当区块到达屏幕中间偏上时触发
            threshold: 0
        };
        
        window.tlObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    
                    // 移除所有时间线节点的激活状态
                    document.querySelectorAll('.timeline-nav li').forEach(li => li.classList.remove('active'));
                    
                    // 找到对应的节点并激活
                    const activeAnchor = document.querySelector(`.timeline-nav a[data-scroll="${id}"]`);
                    if (activeAnchor) {
                        const activeLi = activeAnchor.parentElement;
                        activeLi.classList.add('active');
                        
                        // 💥 核心联动：当你在右侧滚动页面时，左侧导航栏自动跟随滚动！
                        const navContainer = document.querySelector('.timeline-nav');
                        if (navContainer) {
                            if (window.innerWidth <= 900) {
                                // 💥 手机端：横向滚动，并将激活的年份自动居中对齐！
                                navContainer.scrollTo({
                                    left: activeLi.offsetLeft - (window.innerWidth / 2) + (activeLi.offsetWidth / 2),
                                    behavior: 'smooth'
                                });
                            } else {
                                // 电脑端：纵向滚动
                                navContainer.scrollTo({
                                    top: activeLi.offsetTop - 100,
                                    behavior: 'smooth'
                                });
                            }
                        }
                    }
                }
            });
        }, tlObserverOptions);

        // 将所有时间线区块加入雷达监控
        document.querySelectorAll('.timeline-section').forEach(sec => {
            if (sec) window.tlObserver.observe(sec);
        });

        /* =========================================================
           💥 时间线与各子页面的智能切换逻辑 💥
           ========================================================= */
        
        // 1. 时间线视图与返回
        window.openTimelineView = function() {
            window.lastScrollY = window.scrollY || window.pageYOffset; // 💥 记录滚动位置
            const currentActivePanel = document.querySelector('.view-panel.active');
            if (currentActivePanel && currentActivePanel.id !== 'timelineView') {
                previousViewId = currentActivePanel.id; 
            }

            const returnBtn = document.querySelector('.timeline-return-btn');
            if (returnBtn) {
                if (previousViewId === 'adminView') {
                    returnBtn.innerHTML = '&lt; 返回';
                } else {
                    returnBtn.innerHTML = '&lt; 返回';
                }
            }

            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById('timelineView').classList.add('active');
            sessionStorage.setItem('tf141_current_view', 'timelineView');
            window.scrollTo({ top: 0, behavior: 'instant' });
        };

        window.backToWorldView = function() {
            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            
            let targetId = 'worldView';
            if (typeof previousViewId !== 'undefined' && previousViewId === 'adminView') {
                targetId = 'adminView';
            }
            
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
                sessionStorage.setItem('tf141_current_view', targetId);
            }
            
            window.scrollTo({ top: window.lastScrollY || 0, behavior: 'auto' }); // 💥 瞬间恢复滚动位置
        };

        // 2. 历史情报视图与返回
        window.openHistoryIntel = function() {
            window.lastScrollY = window.scrollY || window.pageYOffset; // 💥 记录滚动位置
            const currentActivePanel = document.querySelector('.view-panel.active');
            if (currentActivePanel && currentActivePanel.id !== 'historyIntelView') {
                previousViewId = currentActivePanel.id;
            }
            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById('historyIntelView').classList.add('active');
            sessionStorage.setItem('tf141_current_view', 'historyIntelView');
            window.scrollTo({ top: 0, behavior: 'instant' });
        };

        window.backToMainFromHistory = function() {
            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            const targetPanel = document.getElementById(previousViewId) || document.getElementById('mainView');
            targetPanel.classList.add('active');
            sessionStorage.setItem('tf141_current_view', targetPanel.id);
            
            window.scrollTo({ top: window.lastScrollY || 0, behavior: 'auto' }); // 💥 瞬间恢复滚动位置
        };

        /* =========================================================
           💥 用户终端代号修改逻辑 💥
           ========================================================= */
        window.changeTerminalName = async function() {
            const newName = await SysModal.prompt("请输入新的终端代号：", currentUser.nickname, "⚙️ UPDATE NICKNAME // 修改代号");
            
            // 如果用户点了取消，或者输入为空，或者名字没变，就直接退出
            if (!newName || newName.trim() === "" || newName.trim() === currentUser.nickname) return;
            
            const finalName = newName.trim();
            
            try {
                // 1. 更新 Supabase 数据库里的 users 表
                const { error } = await supabaseClient
                    .from('users')
                    .update({ nickname: finalName })
                    .eq('id', currentUser.id);
                    
                if (error) throw error;
                
                // 2. 更新本地的 currentUser 数据
                currentUser.nickname = finalName;
                
                // 3. 更新右上角的状态栏显示 (修复改名后铃铛丢失的 Bug，并加入防截图隐藏密钥功能)
                const statusContainer = document.querySelector('.lang-text');
                const keyDisplay = window.isKeyVisible ? currentUser.id : '********';
                const eyeSvg = window.isKeyVisible 
                    ? `<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor;"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`
                    : `<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor;"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.28 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;

                statusContainer.innerHTML = `
                    <div id="notif-wrapper" style="position: relative; display: flex; align-items: center; margin-right: 15px;">
                        <span id="notif-bell" style="cursor: pointer; position: relative; color: #12a8ff; filter: drop-shadow(0 0 5px rgba(18,168,255,0.6)); display: flex; align-items: center;" title="消息提示" onclick="toggleNotifications(event)">
                            <svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: currentColor; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                            </svg>
                            <span id="notif-badge" style="display:none; position:absolute; top:-6px; right:-6px; background:#f44336; color:#fff; font-size:10px; padding:1px 4px; border-radius:8px; font-family:monospace; box-shadow:0 0 5px #f44336; line-height:1;">0</span>
                        </span>
                        <div id="notif-dropdown" class="notif-dropdown-box">
                            <div style="color:#8bb9d6; font-size:12px; text-align:center;">[ 暂无新消息 ]</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span class="op-key-text" title="点击一键复制密钥" onclick="copyOpKey('${currentUser.id}')" style="cursor: pointer; transition: 0.2s;" onmouseover="this.style.color='#fff'; this.style.textShadow='0 0 8px #12a8ff'" onmouseout="this.style.color=''; this.style.textShadow='none'">
                            <span class="hide-on-mobile">OP: </span><span class="nav-nickname">${currentUser.nickname}</span><span class="hide-on-mobile" id="top-secret-key"> [${keyDisplay}]</span>
                        </span>
                        <span onclick="toggleKeyVisibility(event)" style="cursor: pointer; color: #12a8ff; display: flex; align-items: center; opacity: 0.7; transition: 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" title="显示/隐藏密钥" id="top-key-toggle-icon">
                            ${eyeSvg}
                        </span>
                    </div>
                    <span class="logout-btn" title="断开终端连接" style="margin-left: 10px;">⏻退出</span>
                `;
                
                // 重新绑定右上角退出按钮的事件
                document.querySelector('.logout-btn').onclick = async function() {
                    const msg = `即将断开当前公民的终端连接。\n请确保您已妥善保管当前密钥：【 ${currentUser.id} 】\n\n确认断开并切换身份吗？`;
                    const isSure = await SysModal.confirm(msg, "TERMINAL DISCONNECT // 断开连接");
                    if (isSure) {
                        localStorage.removeItem('tf141_device_id');
                        location.reload(); 
                    }
                };
                
                // 4. 重新渲染个人终端界面
                renderProfile();
                
                await SysModal.alert(`终端代号已成功更新为：${finalName}`, "✅ UPDATE SUCCESS");
            } catch (err) {
                console.error(err);
                SysModal.alert("修改失败，请检查网络连接。", "✕ ERROR");
            }
        };

        /* =========================================================
           💥 双面人系统 (表里档案) 核心逻辑 💥
           ========================================================= */
        
        // 1. 表单开关与联动
        let isHiddenEnabled = false;
        const btnToggleHidden = document.getElementById('btn-toggle-hidden');
        const hiddenSection = document.getElementById('hidden-identity-section');
        
        if (btnToggleHidden) {
            btnToggleHidden.addEventListener('click', function() {
                isHiddenEnabled = !isHiddenEnabled;
                if(isHiddenEnabled) {
                    hiddenSection.style.display = 'block';
                    this.innerText = "[ ✕ 关闭加密里身份 ]";
                    this.style.background = "rgba(233, 30, 99, 0.1)";
                } else {
                    hiddenSection.style.display = 'none';
                    this.innerText = "[ ⚠️ 启用加密里身份 (双面人模式) ]";
                    this.style.background = "transparent";
                }
            });
        }

        
      

        // 3. 渲染器助手：自动生成表里切换的 HTML (加入了严格的权限判定！)
        window.renderDual = function(char, pubField, hidField) {
            // 💥 权限判定：只有管理员，或者这张卡的主人，才有权查看里身份！
            const canViewHidden = currentUser && (['admin', 'super_admin'].includes(currentUser?.role) || char.owner_id === currentUser.id);
            
            if (!char.has_hidden || !canViewHidden) return char[pubField] || 'N/A';
            return `<span class="public-data">${char[pubField] || 'N/A'}</span><span class="hidden-data">${char[hidField] || 'N/A'}</span>`;
        };

        window.renderDualTag = function(char, pubField, hidField, isOrg = false) {
            const func = isOrg ? 'openOrgDetail' : 'scrollToFaction';
            const canViewHidden = currentUser && (['admin', 'super_admin'].includes(currentUser?.role) || char.owner_id === currentUser.id);
            
            if (!char.has_hidden || !canViewHidden) {
                return `<span class="clickable-tag" onclick="${func}('${char[pubField]}')">${char[pubField] || 'CLASSIFIED'}</span>`;
            }
            return `
                <span class="public-data clickable-tag" onclick="${func}('${char[pubField]}')">${char[pubField] || 'CLASSIFIED'}</span>
                <span class="hidden-data clickable-tag" onclick="${func}('${char[hidField]}')">${char[hidField] || 'CLASSIFIED'}</span>
            `;
        };

        window.getDecryptBtn = function(char) {
            const canViewHidden = currentUser && (['admin', 'super_admin'].includes(currentUser?.role) || char.owner_id === currentUser.id);
            
            if (!char.has_hidden || !canViewHidden) return '';
            return `<button class="decrypt-btn" onclick="
                const card = this.closest('.profile-card, .roster-detail, .tunnel-detail-overlay');
                card.classList.toggle('show-hidden');
                
                // 💥 终极修复：使用 Web Animations API 驱动闪烁。
                // 这种方式独立于 CSS 运行，绝对不会触发面板的二次展开！
                card.animate([
                    { filter: 'contrast(1) brightness(1) hue-rotate(0deg)', transform: 'scale(1) translateX(0)' },
                    { filter: 'contrast(2) brightness(2) hue-rotate(90deg)', transform: 'scale(1) translateX(-6px)', offset: 0.2 },
                    { filter: 'contrast(0.5) brightness(0.5) hue-rotate(-90deg)', transform: 'scale(1) translateX(6px)', offset: 0.4 },
                    { filter: 'contrast(2) brightness(2) hue-rotate(180deg)', transform: 'scale(1) translateX(-3px)', offset: 0.6 },
                    { filter: 'contrast(0.8) brightness(1.5) hue-rotate(45deg)', transform: 'scale(1) translateX(3px)', offset: 0.8 },
                    { filter: 'contrast(1) brightness(1) hue-rotate(0deg)', transform: 'scale(1) translateX(0)' }
                ], {
                    duration: 300,
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                });
            ">[ 解密 ]</button>`;
        };

        /* =========================================================
           💥 组织创立与办事大厅引擎 💥
           ========================================================= */
        
        let pendingOrgsDB = []; // 存放待审核的组织

        // 1. 通用视图切换助手
        window.openView = function(targetId) {
            window.lastScrollY = window.scrollY || window.pageYOffset; // 💥 记录滚动位置
            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) { 
                targetPanel.classList.add('active'); 
                sessionStorage.setItem('tf141_current_view', targetId);
                window.scrollTo({ top: 0, behavior: 'instant' }); // 进入新页面时回到顶部
            }
        };


        // 💥 新增：表单专属返回助手（智能返回上一页）
        window.closeForm = function() {
            const targetId = window.formPreviousView || 'queueView';
            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) { 
                targetPanel.classList.add('active'); 
                sessionStorage.setItem('tf141_current_view', targetId);
                window.scrollTo({ top: window.lastScrollY || 0, behavior: 'auto' }); // 💥 瞬间恢复滚动位置
            }
        };

        window.fetchArticles = async function() {
    try {
        const { data, error } = await supabaseClient.from('articles').select('*');
        if (error) throw error;
        
        // 1. 分流：已通过的放进正式库，待审核的放进排队库
        articlesDB = data.filter(a => a.status === 'approved' || !a.status).sort((a, b) => {
            const timeA = a.updated_at ? new Date(a.updated_at).getTime() : (a.id || 0);
            const timeB = b.updated_at ? new Date(b.updated_at).getTime() : (b.id || 0);
            return timeB - timeA; 
        });
        
        pendingOrgsDB = data.filter(a => a.type === 'org' && (a.status === 'pending' || a.status === 'rejected'));
        
        // 2. 统一触发所有依赖文章数据的渲染更新
        renderIntelGrid(); 
        renderFactions(); 
        renderTimeline(); 
        updateDropdowns(); // 更新填表下拉框
        renderQueue();     // 刷新办事大厅的队列
        renderProfile();   // 刷新个人终端
        renderSystemWarning(); // 👈 新增这一行：渲染警告卡片
        
        if (typeof renderStoryView === 'function') renderStoryView(); // 刷新剧情与日志页
        // 💥 刷新恢复：如果刷新前停留在文章页，数据加载完后自动重新打开
const _savedArticleId = sessionStorage.getItem('tf141_last_article_id');
if (_savedArticleId && sessionStorage.getItem('tf141_current_view') === 'articleView') {
    const _savedArticle = articlesDB.find(a => String(a.id) === String(_savedArticleId));
    if (_savedArticle) openArticle(_savedArticle);
}
        
        // 3. 权限相关渲染
        if (currentUser && ['admin', 'super_admin'].includes(currentUser.role)) {
            renderAdminDashboard();
        }
    } catch (err) {
        console.error("拉取文章失败:", err);
    }
};



        // 5. 提交组织申请
        // 💥 组织修改全局变量
        window.editingOrgId = null;

        // 💥 玩家点击修改自己的组织
        window.editMyOrg = function(id) {
            const org = articlesDB.find(a => String(a.id) === String(id)) || pendingOrgsDB.find(a => String(a.id) === String(id));
            if (!org) return;

            window.formPreviousView = document.querySelector('.view-panel.active')?.id || 'queueView';
            window.editingOrgId = org.id;
            document.getElementById('o-title').value = org.title || '';
            document.getElementById('o-tag').value = org.tag || '';
            document.getElementById('o-summary').value = org.summary || '';
            document.getElementById('o-reqs').value = window.getOrgReqs(org.content) || '';
            
            // 💥 剥离职位数据，填充到职位文本框
            const posObj = getOrgPositions(org.content);
            if (posObj) {
                document.getElementById('o-positions').value = Object.entries(posObj).map(([k, v]) => `${k}:${v}`).join(', ');
            } else {
                document.getElementById('o-positions').value = '';
            }
            
            // 💥 剔除隐藏的 JSON 代码后再扔给正文文本框，防止出现乱码
            document.getElementById('o-content').value = (org.content || '').replace(/<div[^>]*data-positions=['"].*?['"][^>]*><\/div>/g, '').replace(/<div[^>]*data-rp-positions=['"].*?['"][^>]*><\/div>/g, '').replace(/<div[^>]*data-reqs=['"].*?['"][^>]*><\/div>/g, '').replace(/<div[^>]*data-updates=['"].*?['"][^>]*><\/div>/g, '').trim();
            
            const parentMatch = org.keywords.match(/\[PARENT:(.+?)\]/);
            if (parentMatch && parentMatch[1]) {
                document.getElementById('o-parent-faction').value = parentMatch[1];
            }

            document.getElementById('btn-submit-org').innerText = "[ 提交组织修改申请 ]";
            openView('createOrgView');
        };

        // 5. 提交组织申请 (支持新建、更新草稿、覆盖正式版)
        document.getElementById('btn-submit-org').addEventListener('click', async () => {
            const title = document.getElementById('o-title').value.trim();
            const parentFaction = document.getElementById('o-parent-faction').value;
            const tag = document.getElementById('o-tag').value.trim();
            const icon = "";
            const summary = document.getElementById('o-summary').value.trim();
let content = document.getElementById('o-content').value.trim();

// 💥 新增职位数据隐写注入
const posStr = document.getElementById('o-positions').value.trim();
const posObj = parsePositionsStr(posStr);
if (posObj && Object.keys(posObj).length > 0) {
    content += `\n<div data-positions='${JSON.stringify(posObj)}' style='display:none;'></div>`;
}

const rpPosStr = document.getElementById('o-rp-positions').value.trim();
            if (rpPosStr) {
                content += `\n<div data-rp-positions='${rpPosStr}' style='display:none;'></div>`;
            }
            // 💥 加上这段保存职位要求
            const reqsStr = document.getElementById('o-reqs').value.trim();
            if (reqsStr) {
                const encodedReqs = reqsStr.replace(/\n/g, '&#10;'); // 保护换行符
                content += `\n<div data-reqs='${encodedReqs}' style='display:none;'></div>`;
            }

if(!title || !parentFaction || !content) {
                await SysModal.alert('请完整填写组织名称、阵营和详细设定！', 'SYSTEM NOTE');
                return;
            }

            const btn = document.getElementById('btn-submit-org');
            btn.innerHTML = `[ ${CyberLang.icon} ${CyberLang.get('uploading')} ]`;
            btn.disabled = true;

            const newOrg = {
                type: 'org', title: title, tag: tag, icon: icon,
                keywords: `[PARENT:${parentFaction}]`,
                summary: summary, content: content,
                status: 'pending', owner_id: currentUser.id,
                updated_at: new Date().toISOString()
            };

            try {
                const originalOrg = window.editingOrgId ? (articlesDB.find(a => String(a.id) === String(window.editingOrgId)) || pendingOrgsDB.find(a => String(a.id) === String(window.editingOrgId))) : null;

                if (originalOrg && originalOrg.status === 'approved') {
                    // 💥 模式 A：修改正式库的组织，生成一份【更新草稿】
                    newOrg.target_edit_id = originalOrg.id; 
                    const { error } = await supabaseClient.from('articles').insert([newOrg]);
                    if (error) throw error;
                    await SysModal.alert('组织修改申请已提交至审核队列！\n审核期间原档案继续生效。', 'REVISION SUBMITTED');
                } else if (window.editingOrgId) {
                    // 💥 模式 B：更新一份已被驳回/在排队中的【草稿】
                    const { error } = await supabaseClient.from('articles').update(newOrg).eq('id', window.editingOrgId);
                    if (error) throw error;
                    await SysModal.alert('组织草稿已更新，等待再次审核。', 'DRAFT UPDATED');
                } else {
                    // 💥 模式 C：全新创立组织
                    const { error } = await supabaseClient.from('articles').insert([newOrg]);
                    if (error) throw error;
                    await SysModal.alert('组织创立申请已提交！请在办事大厅查看进度。', 'UPLINK SUCCESS');
                }

                document.getElementById('org-form').reset();
                window.editingOrgId = null;
                btn.innerText = "[ 提交组织创立申请 ]";
                closeForm(); // 💥 提交完毕后自动返回上一页
                fetchArticles();
            } catch (err) {
                console.error(err);
                await SysModal.alert('提交失败，请检查网络。', 'ERROR');
                btn.innerText = window.editingOrgId ? "[ 提交组织修改申请 ]" : "[ 提交组织创立申请 ]";
            } finally {
                btn.disabled = false;
            }
        });

       // 6. 组织审核详情面板与操作 (支持行内批注版)
        window.showOrgQueueDetail = function(org) {
            const detail = document.getElementById('queue-org-detail');
            detail.style.display = 'block';

            // 💥 核心修复 1：解析可能为字符串的 JSON 批注数据，防止代码外露
            let reviewObj = org.review_comments;
            if (typeof reviewObj === 'string') {
                try { reviewObj = JSON.parse(reviewObj); } catch(e) {}
            }

            // 1. 初始化批注暂存区 (如果是已驳回状态，自动载入历史批注)
            window.currentAdminAnnotations = {};
            if (org.status === 'rejected' && reviewObj && reviewObj.fields) {
                window.currentAdminAnnotations = JSON.parse(JSON.stringify(reviewObj.fields));
            }

            const getExistingAnno = (key) => {
                return window.currentAdminAnnotations[key] ? window.currentAdminAnnotations[key].text : '';
            };

            // 2. 核心构建器：用来生成带【行内批注框】或【批注展示】的字段HTML
            const renderOrgField = (key, label, value, isBlock = false) => {
                let btnHtml = '';
                let inlineAnnoHtml = '';
                const existingText = getExistingAnno(key);
                
                const isActingAsAdmin = ['admin', 'super_admin'].includes(currentUser?.role) && (currentUser.role === 'super_admin' || org.owner_id !== currentUser.id);

                if (isActingAsAdmin && org.status !== 'approved') {
                    btnHtml = `<span style="color:#f44336; cursor:pointer; font-weight:bold; margin-left:5px; background:rgba(244,67,54,0.1); padding:0 4px; border-radius:2px;" onclick="toggleInlineAnnotation('${key}')" title="批注此项">[+]</span>`;
                    inlineAnnoHtml = `
                        <div id="anno-box-${key}" style="display: ${existingText ? 'block' : 'none'}; margin-top: 8px; width: 100%;">
                            <textarea id="anno-input-${key}" 
                                rows="1"
                                placeholder="在此输入对【${label}】的批注..."
                                style="width: 100%; box-sizing: border-box; background: rgba(244,67,54,0.1); border: 1px dashed #f44336; color: #ffb4a9; padding: 6px; font-family: 'PingFang SC', monospace; resize: none; font-size: 13px; overflow: hidden; outline: none;"
                                oninput="updateInlineAnnotation('${key}', '${label}', this)"
                            >${existingText}</textarea>
                        </div>
                    `;
                } else if (existingText) {
                    inlineAnnoHtml = `
                        <div style="margin-top: 8px; width: 100%; box-sizing: border-box; background: rgba(244,67,54,0.1); border-left: 2px solid #f44336; color: #ffb4a9; padding: 6px 10px; font-size: 13px; line-height: 1.5;">
                            <strong style="color:#f44336;">[ 管理员批注 ]</strong> ${existingText}
                        </div>
                    `;
                }

                if (isBlock) {
                    return `
                        <div class="detail-text-block" style="display: flex; flex-direction: column;">
                            <div><span class="detail-lbl">${label}: ${btnHtml}</span><br>${value}</div>
                            ${inlineAnnoHtml}
                        </div>
                    `;
                } else {
                    return `
                        <div class="detail-item" style="display: flex; flex-direction: column; align-items: flex-start; justify-content: center; width: 100%;">
                            <div style="width: 100%;"><span class="detail-lbl">${label}: ${btnHtml}</span> ${value}</div>
                            ${inlineAnnoHtml}
                        </div>
                    `;
                }
            };

            // 提取全局总结文本
            let summaryText = '';
            if (org.status === 'rejected' && reviewObj) {
                summaryText = reviewObj.general || '';
            }

            // 管理员：底部的审核批注工作台
            let adminControls = '';
            const canApproveOrg = ['admin', 'super_admin'].includes(currentUser?.role) && (currentUser.role === 'super_admin' || org.owner_id !== currentUser.id);
            
            if (canApproveOrg) {
                adminControls = `
                    <div style="margin-top: 20px; border: 1px solid rgba(244, 67, 54, 0.5); padding: 15px; background: rgba(244, 67, 54, 0.05); border-radius: 4px;">
                        <div style="color: #f44336; font-family: monospace; font-weight: bold; margin-bottom: 10px;">[ 审核批注汇总 ]</div>
                        <div id="annotation-list" style="margin-bottom: 10px; font-size: 13px; color: #ffb4a9;">
                            <div style="opacity:0.5;">(点击各属性旁边的 [+] 即可在其下方展开批注框)</div>
                        </div>
                        <textarea id="admin-org-summary-input" rows="2" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid rgba(244,67,54,0.4); color: #fff; padding: 8px; font-family: 'PingFang SC', sans-serif; resize: vertical; outline: none;" placeholder="在此输入总体驳回意见或修改总结 (选填)...">${summaryText}</textarea>
                        <div style="margin-top: 15px; display: flex; gap: 10px;">
                            <button class="submit-btn" style="color:#4caf50; border-color:#4caf50; flex: 1;" onclick="approveOrg('${org.id}')">[ 批准创立 ]</button>
                            <button class="submit-btn" style="color:#f44336; border-color:#f44336; flex: 1;" onclick="rejectOrg('${org.id}')">[ 提交批注并驳回 ]</button>
                        </div>
                    </div>
                `;
            } else if (['admin', 'super_admin'].includes(currentUser?.role) && org.owner_id === currentUser.id) {
                adminControls = `<div style="margin-top: 15px; color: #8bc34a; font-family: monospace; background: rgba(139,195,74,0.1); padding: 10px; border-left: 3px solid #8bc34a;">[ 系统提示 ] 管理员无法审核自己创立的组织，请等待其他管理员处理。</div>`;
            }

            // 号主本人的撤回/修改控制区
            let userControls = '';
            if (org.owner_id === currentUser.id) {
                userControls = `
                    <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="sys-modal-btn confirm" onclick="editMyOrg('${org.id}')">[ 修改设定 ]</button>
                        <button class="sys-modal-btn cancel" onclick="deleteOrgApp('${org.id}')">[ 撤回申请 ]</button>
                    </div>
                `;
            }

            // 用户视角：顶部的全局总结框
            let feedbackHtml = '';
            if (org.status === 'rejected' && reviewObj) {
                feedbackHtml = `
                    <div class="system-notice" style="border-color:#f44336; background: rgba(244,67,54,0.1);">
                        <div style="color: #f44336; font-weight: bold; margin-bottom: ${summaryText ? '8px' : '0'}; font-family: monospace;">[ 需要修改 ]</div>
                        ${summaryText ? `<div style="color:#fff;"><strong>管理员批注：</strong>${summaryText}</div>` : ''}
                        <div style="margin-top: 5px; font-size: 12px; color: #ffb4a9;">请查看下方档案中各字段的详细批注。</div>
                    </div>
                `;
            }

            // 头部 (组织名称/图标) 批注
            let headerAnnoBtn = '';
            let headerAnnoBox = '';
            const existingTitleText = getExistingAnno('title');
            const isActingAsAdminHeader = ['admin', 'super_admin'].includes(currentUser?.role) && (currentUser.role === 'super_admin' || org.owner_id !== currentUser.id);

            if (isActingAsAdminHeader && org.status !== 'approved') {
                headerAnnoBtn = `<span style="color:#f44336; cursor:pointer; font-weight:bold; margin-left:10px; font-size:16px; background:rgba(244,67,54,0.1); padding:0 4px; border-radius:2px;" onclick="toggleInlineAnnotation('title')" title="批注组织名称/图标">[+]</span>`;
                headerAnnoBox = `
                    <div id="anno-box-title" style="display: ${existingTitleText ? 'block' : 'none'}; margin-top: 10px; width: 100%;">
                        <textarea id="anno-input-title" rows="1" placeholder="在此输入对【组织名称/图标】的批注..." style="width: 100%; box-sizing: border-box; background: rgba(244,67,54,0.1); border: 1px dashed #f44336; color: #ffb4a9; padding: 6px; font-family: 'PingFang SC', monospace; resize: none; font-size: 13px; overflow: hidden; outline: none;" oninput="updateInlineAnnotation('title', '组织名称/图标', this)">${existingTitleText}</textarea>
                    </div>
                `;
            } else if (existingTitleText) {
                headerAnnoBox = `
                    <div style="margin-top: 10px; width: 100%; box-sizing: border-box; background: rgba(244,67,54,0.1); border-left: 2px solid #f44336; color: #ffb4a9; padding: 6px 10px; font-size: 13px;">
                        <strong style="color:#f44336;">[ 管理员批注 ]</strong> ${existingTitleText}
                    </div>
                `;
            }

            const rpPosStr = window.getOrgRpPositions(org.content);
            document.getElementById('o-rp-positions').value = rpPosStr || '';

            // 💥 核心修复 2：提取并渲染职位信息
            const posObj = getOrgPositions(org.content);
            let posDisplay = '<span style="color:#8bb9d6; font-size: 13px;">无固定职位限制 (所有人均可自由填写)</span>';
            if (posObj && Object.keys(posObj).length > 0) {
                posDisplay = Object.entries(posObj).map(([k, v]) => {
                    return `<span style="background: rgba(139,195,74,0.1); border: 1px solid rgba(139,195,74,0.3); color: #c5e1a5; padding: 2px 8px; border-radius: 2px; margin-right: 5px; display: inline-block; margin-bottom: 5px; font-family: monospace; font-size: 12px;">${k}: ${v > 0 ? v + '人' : '不限'}</span>`;
                }).join('');
            }
            const positionsField = renderOrgField('positions', '预设职位与名额', posDisplay, true);
            
            // 💥 提取并渲染公告
            const updatesText = window.getArticleUpdates(org.content);
            const updatesField = updatesText ? renderOrgField('updates', '近况与公告', `<div style="white-space:pre-wrap; font-size:13px; color:#fff8b0; background:rgba(255,235,59,0.05); padding:10px; border:1px solid #ffeb3b; border-radius:4px; margin-top:5px;">${updatesText}</div>`, true) : '';

            // 清理 content 中的隐藏 div，防止代码外露
            const cleanContent = (org.content || '').replace(/<div[^>]*data-positions=['"].*?['"][^>]*><\/div>/g, '').replace(/<div[^>]*data-rp-positions=['"].*?['"][^>]*><\/div>/g, '').replace(/<div[^>]*data-reqs=['"].*?['"][^>]*><\/div>/g, '').replace(/<div[^>]*data-updates=['"].*?['"][^>]*><\/div>/g, '').replace(/\n/g, '<br>');

            const svgOrg = `<svg viewBox="0 0 24 24" style="width: 1.2em; height: 1.2em; fill: currentColor; vertical-align: middle; margin-top: -2px; margin-right: 6px;"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>`;

            // 通过构建器渲染各大模块
            const factionField = renderOrgField('faction', '所属阵营', org.keywords.replace('[PARENT:', '').replace(']', ''));
            const tagField = renderOrgField('tag', '类型标签', org.tag);
            const summaryField = renderOrgField('summary', '简介', org.summary, true);
            const contentField = renderOrgField('content', '详细设定', cleanContent, true);

            // 💥 核心新增：管理员专属机密视窗
            let adminBanner = '';
            if (['admin', 'super_admin'].includes(currentUser?.role)) {
                const timeStr = new Date(org.updated_at || org.created_at || Date.now()).toLocaleString();
                const isRevision = !!org.target_edit_id;
                const auditCount = (reviewObj && reviewObj.audit_count) ? reviewObj.audit_count : 0;
                adminBanner = `
                    <div style="background: rgba(255, 152, 0, 0.1); border: 1px dashed #ff9800; padding: 12px; margin-bottom: 15px; border-radius: 4px;">
                        <div style="color: #ff9800; font-weight: bold; font-size: 13px; font-family: monospace; margin-bottom: 6px;">[ 🛡️ 管理员机密视窗 ]</div>
                        <div style="color: #ffcc80; font-size: 12px; line-height: 1.6;">
                            • <strong>最新提交时间：</strong>${timeStr}<br>
                            • <strong>历史驳回次数：</strong>${auditCount} 次<br>
                            • <strong>档案性质：</strong>${isRevision ? '<span style="color:#f44336; font-weight:bold; background:rgba(244,67,54,0.2); padding:2px 6px; border-radius:2px;">已通过组织的修改申请 (批准后将覆盖原档案)</span>' : '<span style="color:#4caf50;">全新组织创立申请</span>'}
                        </div>
                    </div>
                `;
            }

            detail.innerHTML = `
                <div class="detail-header" style="border-bottom-color: #8bc34a; display: flex; flex-direction: column; align-items: flex-start; padding-bottom: 15px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                        <h3 style="color: #c5e1a5; text-shadow: 0 0 8px rgba(139,195,74,0.6); margin:0; display: flex; align-items: center; flex-wrap: wrap;">
                            ${org.icon || svgOrg} ${org.title} ${headerAnnoBtn}
                        </h3>
                        <button class="close-btn" onclick="document.getElementById('queue-org-detail').style.display='none'">[X] CLOSE</button>
                    </div>
                    ${headerAnnoBox}
                </div>
                ${adminBanner} <!-- 💥 插入在这里 -->
                ${feedbackHtml}
                <div class="form-grid" style="margin-bottom: 10px;">
                    ${factionField}
                    ${tagField}
                </div>
                ${positionsField}
                ${updatesField}
                ${summaryField}
                ${contentField}
                ${adminControls}
                ${userControls}
            `;

            // 渲染完毕后，立刻刷新底部的汇总列表，并撑开所有带有历史记录的输入框
            setTimeout(() => {
                refreshAnnotationList();
                if (['admin', 'super_admin'].includes(currentUser?.role)) {
                    document.querySelectorAll('textarea[id^="anno-input-"]').forEach(el => {
                        if (el.value.trim() !== '') {
                            el.style.height = 'auto';
                            el.style.height = el.scrollHeight + 'px';
                        }
                    });
                }
            }, 50);
        };

        window.approveOrg = async function(id) {
            const orgDraft = pendingOrgsDB.find(o => String(o.id) === String(id));
            if (!orgDraft) return;

            if (orgDraft.target_edit_id) {
                // 💥 合并修改申请到正式库
                const updateData = {
                    title: orgDraft.title, tag: orgDraft.tag, icon: orgDraft.icon,
                    keywords: orgDraft.keywords, summary: orgDraft.summary, content: orgDraft.content,
                    status: 'approved', review_comments: null, updated_at: new Date().toISOString()
                };
                await supabaseClient.from('articles').update(updateData).eq('id', orgDraft.target_edit_id);
                await supabaseClient.from('articles').delete().eq('id', orgDraft.id); // 删掉草稿
                SysModal.alert("组织修改已覆盖正式档案！", "MERGE COMPLETED");
            } else {
                // 💥 批准全新组织
                await supabaseClient.from('articles').update({ status: 'approved', review_comments: null }).eq('id', id);
                SysModal.alert("组织已批准成立！其他玩家现在可以加入了。", "APPROVED");
            }
            document.getElementById('queue-org-detail').style.display='none';
            fetchArticles();
        };

        window.rejectOrg = async function(id) {
            const summaryInput = document.getElementById('admin-org-summary-input');
            const generalText = summaryInput ? summaryInput.value.trim() : '';
            const hasFields = Object.keys(window.currentAdminAnnotations).length > 0;

            // 拦截误触：至少写点什么才能驳回
            if (!hasFields && !generalText) {
                await SysModal.alert("驳回操作需至少填写一项 [+] 针对性批注 或 总结意见。", "空批示警告");
                return;
            }

            const btn = event.target;
            const originalText = btn.innerText;
            btn.innerHTML = `[ ${CyberLang.icon} ${CyberLang.get('processing')} ]`;
            
            // 💥 核心新增：读取历史驳回次数并 +1
            const orgDraft = pendingOrgsDB.find(o => String(o.id) === String(id));
            let currentAuditCount = 0;
            if (orgDraft && orgDraft.review_comments) {
                let rev = orgDraft.review_comments;
                if (typeof rev === 'string') { try { rev = JSON.parse(rev); } catch(e){} }
                if (rev && rev.audit_count) currentAuditCount = rev.audit_count;
            }

            // 将全部意见打包成一个 JSON 对象存进云端
            const reviewData = {
                general: generalText,
                fields: window.currentAdminAnnotations,
                audit_count: currentAuditCount + 1 // 💥 记录驳回次数
            };

            try {
                await supabaseClient.from('articles').update({ 
                    status: 'rejected', 
                    review_comments: reviewData 
                }).eq('id', id);
                
                await SysModal.alert("组织申请已驳回，申请人将收到详细的修改批示！", "执行完毕");
                document.getElementById('queue-org-detail').style.display='none';
                fetchArticles();
            } catch (error) {
                console.error("驳回失败:", error);
                await SysModal.alert("操作失败，请检查网络连接。", "✕ ERROR");
                btn.innerText = originalText;
            }
        };

        window.deleteOrgApp = async function(id) {
            const isSure = await SysModal.confirm("确认撤回并删除该组织申请吗？", "撤回申请");
            if (isSure) {
                await supabaseClient.from('articles').delete().eq('id', id);
                document.getElementById('queue-org-detail').style.display='none';
                fetchArticles();
            }
        };

        /* =========================================================
           💥 剧情进度与对戏记录 (Story & Logs) 基础引擎 💥
           ========================================================= */
        
        let currentPlotIndex = 0; // 记录当前轮播图翻到了第几页
        let plotArticlesDB = [];  // 存放所有主线剧情数据

        window.renderStoryView = function() {
            const btnEditMain = document.getElementById('btn-edit-main-plot');
            const btnUploadLog = document.getElementById('btn-upload-log');

            // 1. 权限控制 (💥 加上了安全检查，防止按钮丢失导致崩溃)
            if (btnEditMain) {
                if (currentUser && ['admin', 'super_admin'].includes(currentUser.role)) {
                    btnEditMain.style.display = 'block';
                } else {
                    btnEditMain.style.display = 'none';
                }
            }

            if (btnUploadLog) {
                const hasApprovedProfile = characterDB.some(c => c.owner_id === currentUser?.id);
                if (hasApprovedProfile || ['admin', 'super_admin'].includes(currentUser?.role)) {
                    btnUploadLog.style.display = 'block';
                } else {
                    btnUploadLog.style.display = 'none';
                }
            }

            // 2. 从数据库筛选出主线剧情，并按时间正序排列（最老的在最前面，最新的在最后面）
            plotArticlesDB = articlesDB.filter(a => a.type === 'plot').sort((a, b) => {
                const timeA = new Date(a.updated_at || 0).getTime();
                const timeB = new Date(b.updated_at || 0).getTime();
                return timeA - timeB; // 💥 改为正序：老 -> 新
            });

            // 每次打开页面，默认显示最新的一条（当前进度，即数组的最后一个）
            currentPlotIndex = plotArticlesDB.length > 0 ? plotArticlesDB.length - 1 : 0;
            updatePlotCarousel();

            // 👇 直接在这里接上个人记录（自戏/对戏）的渲染逻辑
    const soloGrid = document.getElementById('solo-logs-grid');
    const rpGrid = document.getElementById('rp-logs-grid');
    const uploadBtns = document.getElementById('log-upload-btns');

    if (!soloGrid || !rpGrid) return;

    // 权限控制：只有登录用户才能看到上传按钮
    if (currentUser && currentUser.role !== 'guest') {
        uploadBtns.style.display = 'flex';
    } else {
        uploadBtns.style.display = 'none';
    }

    // 筛选出当前用户的记录
    const myLogs = articlesDB.filter(a => a.owner_id === currentUser?.id && (a.type === 'solo_log' || a.type === 'rp_log'));
    const soloLogs = myLogs.filter(a => a.type === 'solo_log');
    const rpLogs = myLogs.filter(a => a.type === 'rp_log');

    const createLogCard = (log, isRp) => {
        const card = document.createElement('div');
        card.className = 'intel-card';
        const color = isRp ? '#e040fb' : '#12a8ff';
        const tag = isRp ? 'RP LOG // 对戏' : 'SOLO LOG // 自戏';
        
        card.style.borderColor = color;
        card.style.background = 'rgba(0,0,0,0.4)';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 10px;">
                <span class="card-level" style="color: ${color}; border-color: ${color}; background: ${isRp ? 'rgba(224,64,251,0.1)' : 'rgba(18,168,255,0.1)'}; margin: 0; white-space: nowrap;">${tag}</span>
                <div style="display: flex; gap: 5px; z-index: 10; flex-shrink: 0;">
                    <button onclick="event.stopPropagation(); openLogEditor('${isRp ? 'rp' : 'solo'}', '${log.id}')" style="background: rgba(255,235,59,0.15); border: 1px solid #ffeb3b; color: #ffeb3b; cursor: pointer; padding: 4px 8px; font-size: 12px; font-family: monospace; border-radius: 2px; transition: 0.2s;">[改]</button>
                    <button onclick="event.stopPropagation(); deleteArticle('${log.id}')" style="background: rgba(244,67,54,0.15); border: 1px solid #f44336; color: #f44336; cursor: pointer; padding: 4px 8px; font-size: 12px; font-family: monospace; border-radius: 2px; transition: 0.2s;">[删]</button>
                </div>
            </div>
            <h3 class="card-name" style="font-size: 16px; margin-bottom: 8px;">${log.title}</h3>
            <p class="card-desc" style="font-size: 13px; flex-grow: 1; margin-bottom: 15px;">${log.summary || '无简介'}</p>
            <button class="btn-ghost" style="width: 100%; padding: 8px; font-size: 12px; color: ${color}; border-color: ${color}; margin-top: auto;">查阅记录 →</button>
        `;
        card.onclick = () => openArticleById(log.id);
        return card;
    };

    soloGrid.innerHTML = soloLogs.length ? '' : '<div style="color:#8bb9d6; font-size:12px;">[ 暂无自戏记录 ]</div>';
    soloLogs.forEach(log => soloGrid.appendChild(createLogCard(log, false)));

    rpGrid.innerHTML = rpLogs.length ? '' : '<div style="color:#8bb9d6; font-size:12px;">[ 暂无对戏记录 ]</div>';
    rpLogs.forEach(log => rpGrid.appendChild(createLogCard(log, true)));
};

/* =========================================================
           💥 AR 星图系统数据与逻辑引擎 (Aperture Cartography)
           ========================================================= */
        
        // 1. 星球数据库 (x, y 是百分比位置，50,50 是正中心太阳)
        const planetsDB = [
            // ==========================================
            // ☀️ 恒星中心
            // ==========================================
            { id: "sun", system: "sun_sys", isParent: true, name: "太阳", faction: "恒星", region: "太阳系中心", color: "#ffeb3b", rgb: "255, 235, 59", x: 50, y: 50, sizeScale: 2.5, desc: "太阳系的母星。戴森球计划在战争爆发后被无限期搁置，目前仅有几座无人能量收集站仍在近日轨道运行。" },

            // ==========================================
            // 🌐 内环 - 轨道半径 200
            // ==========================================
            { id: "mercury", system: "mercury_sys", isParent: true, name: "水星", faction: "泛星联盟", region: "内环", color: "#00e5ff", rgb: "0, 229, 255", x: 53.21, y: 50.86, sizeScale: 0.8, desc: "极度靠近太阳的焦热行星，地表布满了联盟的自动化太阳能阵列与反物质工厂。" },
            { id: "mercury_forge", system: "mercury_sys", isParent: false, name: "日冕锻造站", faction: "泛星联盟", region: "内环", color: "#00e5ff", rgb: "0, 229, 255", x: 54.0, y: 51.5, sizeScale: 0.4, desc: "利用太阳辐射进行极端材料冶炼的军工设施。" },

            { id: "venus", system: "venus_sys", isParent: true, name: "金星", faction: "泛星联盟", region: "内环", color: "#00e5ff", rgb: "0, 229, 255", x: 48.33, y: 52.88, sizeScale: 0.9, desc: "被浓厚硫酸云覆盖的行星。联盟的高级研究人员居住在漂浮于云层之上的『云城』中。" },
            { id: "venus_cloud", system: "venus_sys", isParent: false, name: "伊什塔尔云城", faction: "泛星联盟", region: "内环", color: "#00e5ff", rgb: "0, 229, 255", x: 47.5, y: 53.5, sizeScale: 0.5, desc: "悬浮在金星大气层中的奢华都市，内环权贵的度假胜地。" },

            { id: "earth", system: "earth_sys", isParent: true, name: "地球", faction: "泛星联盟", region: "内环", color: "#00e5ff", rgb: "0, 229, 255", x: 47.11, y: 48.33, sizeScale: 1.0, desc: "人类的摇篮。表面被巨大的都市带覆盖，拥有最顶级的医疗和科技，是内环绝对的经济中心。" },
            { id: "luna", system: "earth_sys", isParent: false, name: "月球", faction: "泛星联盟", region: "内环", color: "#00e5ff", rgb: "0, 229, 255", x: 46.2, y: 47.5, sizeScale: 0.5, desc: "泛星议会、联盟总理府、最高星际法院所在地。整个星系的最高权力中枢，防卫极其森严。" },
            { id: "earth_def", system: "earth_sys", isParent: false, name: "近地防御网", faction: "泛星联盟", region: "内环", color: "#00e5ff", rgb: "0, 229, 255", x: 48.0, y: 47.5, sizeScale: 0.4, desc: "环绕地球的巨型武装空间站群，任何未授权的跃迁都会被瞬间摧毁。" },
            { id: "lagrange_l4", system: "earth_sys", isParent: false, name: "拉格朗日点盲区", faction: "自治空间站", region: "内环", color: "#ffeb3b", rgb: "255, 235, 59", x: 46.5, y: 49.5, sizeScale: 0.5, desc: "地球与月球引力平衡的盲区，隐藏着不受联盟监管的巨型黑市空间站，灯下黑的法外之地。" },

            { id: "mars", system: "mars_sys", isParent: true, name: "火星", faction: "泛星联盟", region: "内环", color: "#00e5ff", rgb: "0, 229, 255", x: 52.88, y: 48.33, sizeScale: 0.9, desc: "联盟最大的重工业基地与舰队造船厂。空气中常年弥漫着铁锈味。" },
            { id: "phobos", system: "mars_sys", isParent: false, name: "火卫一", faction: "泛星联盟", region: "内环", color: "#00e5ff", rgb: "0, 229, 255", x: 53.8, y: 49.0, sizeScale: 0.4, desc: "被彻底掏空改造的军事要塞，驻扎着联盟第一舰队的主力。" },
            { id: "deimos", system: "mars_sys", isParent: false, name: "火卫二", faction: "泛星联盟", region: "内环", color: "#00e5ff", rgb: "0, 229, 255", x: 52.0, y: 49.2, sizeScale: 0.4, desc: "火星轨道上的巨型干船坞，负责维修和建造星际战舰。" },
            { id: "utopia", system: "mars_sys", isParent: false, name: "乌托邦平原船坞", faction: "独立防务承包商", region: "内环", color: "#4caf50", rgb: "76, 175, 80", x: 53.0, y: 47.2, sizeScale: 0.5, desc: "承包商在火星的合法驻地，提供雇佣兵招募与战舰改装服务。" },

            // ==========================================
            // 🪨 小行星带 - 轨道半径 500
            // ==========================================
            { id: "ceres", system: "ceres_sys", isParent: true, name: "谷神星", faction: "外环", region: "小行星带", color: "#f44336", rgb: "244, 67, 54", x: 51.44, y: 58.20, sizeScale: 0.7, desc: "外环最大的农业与合成食物生产基地。长期受到各大财团的剥削与控制。" },
            { id: "ceres_ag", system: "ceres_sys", isParent: false, name: "农业空间站", faction: "外环", region: "小行星带", color: "#f44336", rgb: "244, 67, 54", x: 50.5, y: 59.0, sizeScale: 0.4, desc: "巨大的温室空间站，为整个外环提供着勉强糊口的合成淀粉。" },

            { id: "vesta", system: "vesta_sys", isParent: true, name: "灶神星", faction: "独立防务承包商", region: "小行星带", color: "#4caf50", rgb: "76, 175, 80", x: 42.17, y: 47.15, sizeScale: 0.6, desc: "佣兵团的前线补给站，充满了火药味和酒精味。" },
            { id: "vesta_armory", system: "vesta_sys", isParent: false, name: "灶神星军火库", faction: "独立防务承包商", region: "小行星带", color: "#4caf50", rgb: "76, 175, 80", x: 42.8, y: 46.0, sizeScale: 0.4, desc: "全星系最大的私人军火交易市场。" },

            { id: "pallas", system: "pallas_sys", isParent: true, name: "智神星", faction: "自治空间站", region: "小行星带", color: "#ffeb3b", rgb: "255, 235, 59", x: 55.35, y: 43.61, sizeScale: 0.6, desc: "走私客和情报贩子的中转站，连接内环与外环的灰色地带。" },
            { id: "juno", system: "juno_sys", isParent: true, name: "婚神星", faction: "外环", region: "小行星带", color: "#f44336", rgb: "244, 67, 54", x: 58.20, y: 48.55, sizeScale: 0.6, desc: "外环反抗军的秘密联络点，表面上是一个废弃的采矿站。" },

            // ==========================================
            // 🪐 外环 - 轨道半径 900
            // ==========================================
            { id: "jupiter", system: "jupiter_sys", isParent: true, name: "木星", faction: "无阵营 / 废弃", region: "外环", color: "#9e9e9e", rgb: "158, 158, 158", x: 35.90, y: 55.13, sizeScale: 1.8, desc: "旧聚变技术时代的生产基地，在黑血被发现后逐渐衰落并废弃。如今是拾荒者和星际海盗的藏身处。" },
            { id: "io", system: "jupiter_sys", isParent: false, name: "木卫一", faction: "无阵营 / 废弃", region: "外环", color: "#9e9e9e", rgb: "158, 158, 158", x: 37.4, y: 55.1, sizeScale: 0.5, desc: "火山活动剧烈的卫星，地表散落着旧时代的采矿遗迹。" },
            { id: "europa", system: "jupiter_sys", isParent: false, name: "木卫二", faction: "无阵营 / 废弃", region: "外环", color: "#9e9e9e", rgb: "158, 158, 158", x: 36.5, y: 57.0, sizeScale: 0.5, desc: "冰层下隐藏着旧时代的秘密设施，常有拾荒者来此碰运气。" },
            { id: "ganymede", system: "jupiter_sys", isParent: false, name: "木卫三", faction: "独立防务承包商", region: "外环", color: "#4caf50", rgb: "76, 175, 80", x: 34.0, y: 56.5, sizeScale: 0.6, desc: "被某大型承包商买下的私人领地，作为外环的佣兵集散中心。" },
            { id: "callisto", system: "jupiter_sys", isParent: false, name: "木卫四", faction: "外环", region: "外环", color: "#f44336", rgb: "244, 67, 54", x: 33.5, y: 53.5, sizeScale: 0.5, desc: "外环反抗军的秘密据点之一，地表布满了隐蔽的地下掩体。" },
            { id: "jupiter_station", system: "jupiter_sys", isParent: false, name: "废弃聚变站", faction: "自治空间站", region: "外环", color: "#ffeb3b", rgb: "255, 235, 59", x: 36.5, y: 53.5, sizeScale: 0.4, desc: "巨大的钢铁残骸，现已被星际海盗改造为法外据点。" },

            { id: "saturn", system: "saturn_sys", isParent: true, name: "土星", faction: "独立防务承包商", region: "外环", color: "#ff9800", rgb: "255, 152, 0", x: 61.49, y: 59.64, sizeScale: 1.6, desc: "泰坦星脉财团总部所在地。土星环内隐藏着庞大的私人舰队造船厂与雇佣兵训练基地。" },
            { id: "titan", system: "saturn_sys", isParent: false, name: "泰坦星", faction: "独立防务承包商", region: "外环", color: "#ff9800", rgb: "255, 152, 0", x: 63.4, y: 60.7, sizeScale: 0.7, desc: "财团核心总部，地表被甲烷湖泊和重工业穹顶覆盖。" },
            { id: "enceladus", system: "saturn_sys", isParent: false, name: "土卫二", faction: "独立防务承包商", region: "外环", color: "#ff9800", rgb: "255, 152, 0", x: 60.7, y: 61.0, sizeScale: 0.5, desc: "冰层下隐藏着隐秘的雇佣兵训练营与非法生化实验室。" },
            { id: "iapetus", system: "saturn_sys", isParent: false, name: "土卫八", faction: "独立防务承包商", region: "外环", color: "#ff9800", rgb: "255, 152, 0", x: 59.5, y: 58.3, sizeScale: 0.5, desc: "财团的深空通讯中继站，监控着整个外环的信号。" },
            { id: "rhea", system: "saturn_sys", isParent: false, name: "土卫五", faction: "外环", region: "外环", color: "#f44336", rgb: "244, 67, 54", x: 62.4, y: 58.0, sizeScale: 0.5, desc: "被外环劳工占据的卫星，常年与泰坦星的财团武装发生摩擦。" },

            { id: "uranus", system: "uranus_sys", isParent: true, name: "天王星", faction: "外环", region: "外环", color: "#f44336", rgb: "244, 67, 54", x: 47.39, y: 35.22, sizeScale: 1.2, desc: "冰巨星。大气层中漂浮着外环居民的气体采集站。" },
            { id: "titania", system: "uranus_sys", isParent: false, name: "天卫三", faction: "外环", region: "外环", color: "#f44336", rgb: "244, 67, 54", x: 48.5, y: 36.3, sizeScale: 0.5, desc: "外环边缘的哨站，生活条件极其艰苦。" },
            { id: "oberon", system: "uranus_sys", isParent: false, name: "天卫四", faction: "外环", region: "外环", color: "#f44336", rgb: "244, 67, 54", x: 45.6, y: 35.2, sizeScale: 0.5, desc: "反抗军的地下兵工厂，利用冰层掩盖热信号。" },
            { id: "ariel", system: "uranus_sys", isParent: false, name: "天卫一", faction: "自治空间站", region: "外环", color: "#ffeb3b", rgb: "255, 235, 59", x: 48.4, y: 34.2, sizeScale: 0.4, desc: "一个中立的医疗与补给空间站，不问来客身份。" },

            { id: "neptune", system: "neptune_sys", isParent: true, name: "海王星", faction: "泛星联盟", region: "外环", color: "#00e5ff", rgb: "0, 229, 255", x: 64.09, y: 44.87, sizeScale: 1.2, desc: "联盟在外环的最远端据点，主要用于深空观测和预警。" },
            { id: "triton", system: "neptune_sys", isParent: false, name: "海卫一", faction: "泛星联盟", region: "外环", color: "#00e5ff", rgb: "0, 229, 255", x: 64.1, y: 46.5, sizeScale: 0.5, desc: "联盟的深空监狱与黑箱审讯中心，有去无回之地。" },
            { id: "proteus", system: "neptune_sys", isParent: false, name: "海卫八", faction: "独立防务承包商", region: "外环", color: "#4caf50", rgb: "76, 175, 80", x: 63.1, y: 43.9, sizeScale: 0.4, desc: "受雇于联盟的驻扎地，负责看守海卫一监狱的外围。" },
            { id: "nereid", system: "neptune_sys", isParent: false, name: "海卫二", faction: "外环", region: "外环", color: "#f44336", rgb: "244, 67, 54", x: 65.8, y: 43.9, sizeScale: 0.4, desc: "一颗轨道极度偏心的卫星，常被走私客用作引力弹弓的跳板。" },

            // ==========================================
            // ☄️ 柯伊伯带 - 轨道半径 1300
            // ==========================================
            { id: "pluto", system: "pluto_sys", isParent: true, name: "冥王星", faction: "无阵营 / 独立势力", region: "柯伊伯带", color: "#9e9e9e", rgb: "158, 158, 158", x: 42.59, y: 70.35, sizeScale: 0.6, desc: "被遗忘的矮行星，流放者和逃犯的最终归宿。" },
            { id: "charon", system: "pluto_sys", isParent: false, name: "冥卫一", faction: "无阵营 / 独立势力", region: "柯伊伯带", color: "#9e9e9e", rgb: "158, 158, 158", x: 43.2, y: 71.3, sizeScale: 0.4, desc: "星际海盗的隐秘母港，停泊着大量改装过的武装商船。" },

            { id: "acheron", system: "acheron_sys", isParent: true, name: "阿卡戎自由港", faction: "自治空间站", region: "柯伊伯带", color: "#ffeb3b", rgb: "255, 235, 59", x: 36.07, y: 33.40, sizeScale: 0.8, desc: "游离于联盟管辖之外的巨型空间站。这里是全星系最大的黑市，情报贩子、赏金猎人的天堂。" },
            { id: "acheron_docks", system: "acheron_sys", isParent: false, name: "走私船坞", faction: "自治空间站", region: "柯伊伯带", color: "#ffeb3b", rgb: "255, 235, 59", x: 34.8, y: 34.1, sizeScale: 0.4, desc: "黑市交易的核心集散地，每天都有无数来路不明的货物在此吞吐。" },
            { id: "acheron_casino", system: "acheron_sys", isParent: false, name: "霓虹赌场", faction: "自治空间站", region: "柯伊伯带", color: "#ffeb3b", rgb: "255, 235, 59", x: 37.7, y: 32.5, sizeScale: 0.4, desc: "销金窟。在这里，你可以用黑血原矿换取任何东西，包括人命。" },

            { id: "mining_zone", system: "mining_sys", isParent: true, name: "核心矿区", faction: "外环", region: "柯伊伯带", color: "#f44336", rgb: "244, 67, 54", x: 65.32, y: 34.68, sizeScale: 0.9, desc: "位于星系边缘的高危矿区。环境恶劣，辐射极高，星尘病感染率居高不下，也是各方势力争夺最激烈的绞肉机。" },
            { id: "refinery", system: "mining_sys", isParent: false, name: "黑血精炼厂", faction: "外环", region: "柯伊伯带", color: "#f44336", rgb: "244, 67, 54", x: 66.8, y: 34.7, sizeScale: 0.5, desc: "提炼高纯度 C-62 的巨型工厂，常年喷吐着幽蓝色的辐射废气。" },
            { id: "slag_pit", system: "mining_sys", isParent: false, name: "废渣填埋场", faction: "外环", region: "柯伊伯带", color: "#f44336", rgb: "244, 67, 54", x: 65.3, y: 36.2, sizeScale: 0.4, desc: "堆放剧毒矿渣的地方，也是底层矿工们苟延残喘的贫民窟。" },

            { id: "eris", system: "eris_sys", isParent: true, name: "阋神星", faction: "无阵营 / 独立势力", region: "柯伊伯带", color: "#9e9e9e", rgb: "158, 158, 158", x: 70.92, y: 55.60, sizeScale: 0.6, desc: "太阳系已知最边缘的矮行星，极度寒冷，几乎没有生命迹象。" },
            { id: "dysnomia", system: "eris_sys", isParent: false, name: "阋卫一", faction: "无阵营 / 独立势力", region: "柯伊伯带", color: "#9e9e9e", rgb: "158, 158, 158", x: 70.9, y: 54.4, sizeScale: 0.4, desc: "传说中隐藏着旧时代遗物的神秘卫星，但去过的人都没能回来。" }
        ];

        // 💥 基地与国家数据库 (已严格按英文 A-Z 排序)
        const planetLocationsDB = {
            "地球": ["Australia (澳大利亚)", "Brazil (巴西)", "China (中国)", "EU (欧盟)", "India (印度)", "Japan (日本)", "Russia (俄罗斯)", "South Africa (南非)", "USA (美国)"],
            "月球": ["Apollo Site (阿波罗遗址)", "Selene Base (塞勒涅基地)", "Tranquility Port (宁静海太空港)", "Tycho Base (第谷基地)"],
            "火星": ["Hellas Planitia (希腊平原哨站)", "Olympus City (奥林帕斯城)", "Utopia Planitia (乌托邦平原)", "Valles Marineris (水手谷矿区)"],
            "水星": ["Caloris Basin (卡洛里斯盆地)", "Corona Forge (日冕锻造站)"],
            "金星": ["Aphrodite Terra (阿佛洛狄忒高地)", "Ishtar Cloud City (伊什塔尔云城)"],
            "谷神星": ["Ceres Prime (谷神星主站)", "Dawn Farm (曙光农场)", "Piazzi Crater (皮亚齐陨石坑)"],
            "灶神星": ["Armory Prime (军火库主站)", "Rheasilvia (雷亚西尔维亚)"],
            "智神星": ["Athena Hub (雅典娜枢纽)"],
            "婚神星": ["Abandoned Mine (废弃采矿站)"],
            "木星": ["Great Red Spot Obs (大红斑观测站)"],
            "木卫一": ["Loki Patera (洛基火山口)", "Pele Station (佩莱火山站)"],
            "木卫二": ["Conamara Chaos (康纳马拉混沌)", "Sub-Ice City (冰下城)"],
            "木卫三": ["Galileo Regio (伽利略区)", "Mercenary Hub (佣兵集散中心)"],
            "木卫四": ["Valhalla (瓦尔哈拉多环区)"],
            "土星": ["Cassini Obs (卡西尼观测站)"],
            "泰坦星": ["Huygens Station (惠更斯深潜站)", "Kraken Mare (克拉肯海)", "Titan Pulse HQ (泰坦星脉总部)"],
            "土卫二": ["Tiger Stripes (虎皮条纹区)"],
            "土卫八": ["Cassini Regio (卡西尼区)"],
            "土卫五": ["Rhea Prime (雷亚主城)"],
            "天王星": ["Atmospheric Station (大气采集站)"],
            "天卫三": ["Titania Outpost (提泰妮娅哨站)"],
            "天卫四": ["Oberon Forge (奥伯龙兵工厂)"],
            "天卫一": ["Ariel Med-Bay (艾瑞尔医疗站)"],
            "海王星": ["Neptune Orbital (海王星轨道站)"],
            "海卫一": ["Triton Blacksite (特里同黑牢)"],
            "海卫八": ["Proteus Camp (普罗透斯营地)"],
            "海卫二": ["Nereid Jump-Point (涅瑞伊得跳板)"],
            "冥王星": ["Sputnik Planitia (斯普特尼克平原)", "Tombaugh Regio (汤博区)"],
            "冥卫一": ["Charon Pirate Port (卡戎海盗港)", "Mordor Macula (莫多尔斑)"],
            "阿卡戎自由港": ["Core Market (核心交易区)", "Neon Casino (霓虹赌场)", "Smuggler's Dock (走私船坞)"],
            "核心矿区": ["Mine Zero (零号矿坑)", "Refinery (黑血精炼厂)", "Slag Pit (废渣填埋场)"],
            "阋神星": ["Eris Prime (阋神星主站)"],
            "阋卫一": ["Relic Site (遗物发掘场)"]
        };

        // 💥 动态填充基地/国家下拉栏
        window.populateBaseSelect = function(planetFullName, prefix) {
            const planetName = planetFullName.split(' ')[0]; // 提取中文名，如 "地球"
            const selectEl = document.getElementById(`${prefix}-hometown-base`);
            const customWrapper = document.getElementById(`${prefix}-hometown-custom-wrapper`);
            const baseWrapper = document.getElementById(`${prefix}-hometown-base-wrapper`);
            
            if (!selectEl) return;

            let options = planetLocationsDB[planetName] || [];
            
            let html = `<option value="" disabled selected>-- 选择区域/基地 --</option>`;
            options.forEach(opt => {
                html += `<option value="${opt}">${opt}</option>`;
            });
            html += `<option value="custom">-- 其他 / 自定义 --</option>`;
            
            selectEl.innerHTML = html;
            selectEl.value = "";
            
            baseWrapper.style.display = 'flex';
            customWrapper.style.display = 'none';
        };

        // 💥 监听下拉栏，如果选了自定义，就显示输入框
        window.checkCustomBase = function(prefix) {
            const selectEl = document.getElementById(`${prefix}-hometown-base`);
            const customWrapper = document.getElementById(`${prefix}-hometown-custom-wrapper`);
            if (selectEl.value === 'custom') {
                customWrapper.style.display = 'flex';
            } else {
                customWrapper.style.display = 'none';
            }
        };

        let currentSelectedPlanet = null;
        let arEngine = null;
        window.hometownTargetInput = null; // 💥 新增：记录当前是哪个输入框在呼叫星图

        // 2. 打开星图 (支持接收目标输入框 ID)
        window.openStarMap = function(targetInputId = null) {
            window.hometownTargetInput = targetInputId; // 记录呼叫来源
            
            const modal = document.getElementById('starMapModal');
            document.getElementById('planet-detail-panel').classList.remove('active');
            
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            setTimeout(() => {
                if (!arEngine) arEngine = new ARMapEngine();
                arEngine.boot();
            }, 100);
        };

        // 3. 关闭星图
        window.closeStarMap = function() {
            const modal = document.getElementById('starMapModal');
            modal.classList.remove('active');
            document.getElementById('planet-detail-panel').classList.remove('active');
            
            setTimeout(() => { modal.style.display = 'none'; }, 300);
            
            if (arEngine) arEngine.shutdown();
        };

        // 4. 显示星球详情
        window.showPlanetDetail = function(planet) {
            currentSelectedPlanet = planet;
            document.getElementById('planet-name').innerText = planet.name;
            document.getElementById('planet-name').style.textShadow = `0 0 10px ${planet.color}`;
            document.getElementById('planet-faction').innerText = `[ 归属: ${planet.faction} ]`;
            document.getElementById('planet-faction').style.color = planet.color;
            document.getElementById('planet-desc').innerText = planet.desc;
            
            const btn = document.getElementById('btn-set-hometown');
            
            // 💥 核心逻辑：只有当星图是被输入框呼叫出来时，才显示【设为籍贯】按钮
            if (window.hometownTargetInput) {
                btn.style.display = 'block';
                btn.style.background = `rgba(${hexToRgb(planet.color)}, 0.1)`;
                btn.style.borderColor = planet.color;
                btn.style.color = planet.color;
            } else {
                btn.style.display = 'none';
            }

            document.getElementById('planet-detail-panel').classList.add('active');
        };

        // 5. 设为籍贯按钮逻辑
        document.getElementById('btn-set-hometown').addEventListener('click', () => {
            if (currentSelectedPlanet && window.hometownTargetInput) {
                const planetInput = document.getElementById(window.hometownTargetInput);
                if (planetInput) {
                    // 填入星球名字
                    planetInput.value = currentSelectedPlanet.name;
                    
                    // 💥 触发下拉框更新
                    const prefix = window.hometownTargetInput.startsWith('f-') ? 'f' : 'h';
                    populateBaseSelect(currentSelectedPlanet.name, prefix);
                    
                    // 智能联动阵营
                    let factionSelectId = prefix === 'f' ? 'f-faction' : 'h-faction';
                    const factionSelect = document.getElementById(factionSelectId);
                    
                    if (factionSelect && factionSelect.value === "") {
                        for (let i = 0; i < factionSelect.options.length; i++) {
                            if (factionSelect.options[i].value.includes(currentSelectedPlanet.faction.split(' ')[0])) {
                                factionSelect.value = factionSelect.options[i].value;
                                factionSelect.dispatchEvent(new Event('change')); 
                                break;
                            }
                        }
                    }
                }
                
                closeStarMap();
                SysModal.alert(`已锁定星球：【${currentSelectedPlanet.name}】\n请在表单中继续选择具体的国家或基地。`, "导航坐标已锁定");
            }
        });

        function hexToRgb(hex) {
            let r = 0, g = 0, b = 0;
            if (hex.length == 4) { r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3]; } 
            else if (hex.length == 7) { r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6]; }
            return +(r) + "," + +(g) + "," + +(b);
        }

        // ==========================================
        // 💥 AR 引擎核心类 (封装了所有的 Canvas 渲染)
        // ==========================================
        class ARMapEngine {
            constructor() {
                this.container = document.getElementById('ar-map-container');
                this.tCanvas = document.getElementById('transit-canvas');
                this.bCanvas = document.getElementById('binary-canvas');
                this.mCanvas = document.getElementById('map-canvas');
                this.tCtx = this.tCanvas.getContext('2d');
                this.bCtx = this.bCanvas.getContext('2d');
                this.mCtx = this.mCanvas.getContext('2d', { alpha: true }); 
                
                this.bootComplete = false;
                this.transitAnimId = null;
                this.binaryAnimId = null;
                this.mapAnimId = null;
                
                this.WORLD_SIZE = 6000;
                this.tacticalNodes = [];
                this.telemetryLines = [];
                this.organicClouds = [];
                this.dustBuckets = [[], [], []];
                this.bucketAlphas = [0.2, 0.4, 0.6];
                
                this.cam = { x: 0, y: 0, zoom: 0.6 }; // 💥 视野拉远，一览众山小
                this.vel = { x: 0, y: 0 };
                this.isDragging = false;
                this.lastMouse = { x: 0, y: 0 };
                this.clickStartPos = { x: 0, y: 0 };
                this.hoveredNode = null;
                
                // 💥 核心修改：用单一的 selectedNode 替代原本复杂的 activeRoute 数组
                this.selectedNode = null; 
                
                this.globalMouseWorldX = 0;
                this.globalMouseWorldY = 0;

                this.spriteCanvas = document.createElement('canvas');
                this.generateSprites();
                this.generateUniverse();
                this.bindEvents();

                this.cam = { x: 0, y: 0, zoom: 0.6 }; 
                this.targetZoom = 0.6; // 💥 新增：目标缩放率（用于丝滑缓冲）
                this.zoomMouseX = 0;   // 💥 新增：鼠标X坐标（用于定点聚焦）
                this.zoomMouseY = 0;   // 💥 新增：鼠标Y坐标
            }
t
            resize() {
                const w = this.container.clientWidth || window.innerWidth;
                const h = this.container.clientHeight || window.innerHeight;
                this.tCanvas.width = this.bCanvas.width = this.mCanvas.width = w;
                this.tCanvas.height = this.bCanvas.height = this.mCanvas.height = h;
            }

            boot() {
                this.resize();
                this.bootComplete = false;
                this.selectedNode = null; 
                this.cam = { x: 0, y: 0, zoom: 0.6 }; 
                this.targetZoom = 0.6; // 💥 新增：重置时同步重置目标缩放率
                
                // 💥 修复：每次启动星图，先把图层显现出来
                this.tCanvas.style.display = 'block';
                this.bCanvas.style.display = 'block';
                this.mCanvas.style.display = 'block';
                
                document.getElementById('center-status').innerText = "系统导航 // 正在启动跃迁...";
                document.getElementById('center-status').style.opacity = 1;
                document.getElementById('glass-effects').classList.remove('active');
                document.getElementById('ar-reticle').classList.remove('active');
                document.getElementById('hud-overlay').classList.remove('active');


                
                this.mCanvas.style.opacity = 0; 
                this.tCanvas.style.opacity = 1;
                this.bCanvas.style.opacity = 1;

                this.initTransit();
                this.renderTransit();

                setTimeout(() => { this.isDecelerating = true; }, 500); 
                
                setTimeout(() => {
                    document.getElementById('center-status').innerText = "正在初始化全息星图...";
                    this.binaryActive = true;
                    this.renderBinary();
                    document.getElementById('glass-effects').classList.add('active');
                }, 1200); 

                setTimeout(() => {
                    this.mCanvas.style.opacity = 1;
                    this.tCanvas.style.opacity = 0;
                    // 💥 增加这一句，彻底释放底层节点
                    setTimeout(() => { this.tCanvas.style.display = 'none'; }, 500);
                }, 1800); 

                setTimeout(() => {
                    document.getElementById('center-status').style.opacity = 0;
                    this.bCanvas.style.opacity = 0;
                    // 💥 增加这一句，彻底释放底层节点
                    setTimeout(() => { this.bCanvas.style.display = 'none'; }, 500);
                    
                    document.getElementById('hud-overlay').classList.add('active');
                    document.getElementById('ar-reticle').classList.add('active');
                }, 2500);

                setTimeout(() => {
                    this.bootComplete = true;
                    cancelAnimationFrame(this.transitAnimId);
                    this.binaryActive = false;
                    cancelAnimationFrame(this.binaryAnimId);
                    this.renderMap(); 
                }, 3500);
            }

            shutdown() {
                cancelAnimationFrame(this.transitAnimId);
                cancelAnimationFrame(this.binaryAnimId);
                cancelAnimationFrame(this.mapAnimId);
                this.bootComplete = false;
            }

            initTransit() {
                this.transitStars = [];
                this.warpMultiplier = 150;
                this.isDecelerating = false;
                const w = this.tCanvas.width; const h = this.tCanvas.height;
                for (let i = 0; i < Math.floor(w * h / 2500); i++) {
                    this.transitStars.push({ 
                        x: Math.random() * w, y: Math.random() * h, 
                        r: Math.random() * 1.5, a: Math.random(), 
                        speed: 0.001 + Math.random() * 0.002, phase: Math.random() * Math.PI * 2 
                    });
                }
                const fontSize = 24;
                this.drops = [];
                for(let x = 0; x < Math.floor(w / fontSize); x++) this.drops[x] = Math.random() * -100;
            }

            renderTransit() {
                if (this.bootComplete) return;
                this.transitAnimId = requestAnimationFrame(() => this.renderTransit());
                const w = this.tCanvas.width; const h = this.tCanvas.height;
                this.tCtx.clearRect(0, 0, w, h);
                
                if (this.isDecelerating && this.warpMultiplier > 1) {
                    this.warpMultiplier -= (this.warpMultiplier - 1) * 0.08; 
                    if (this.warpMultiplier < 1.05) this.warpMultiplier = 1;
                }

                const t = Date.now();
                for (const s of this.transitStars) {
                    const alpha = s.a * (0.3 + 0.7 * Math.sin(t * s.speed + s.phase));
                    const currentSpeed = s.speed * 80 * this.warpMultiplier;
                    
                    if (this.warpMultiplier > 2) {
                        this.tCtx.beginPath(); this.tCtx.moveTo(s.x, s.y); this.tCtx.lineTo(s.x + currentSpeed * 5, s.y); 
                        this.tCtx.strokeStyle = `rgba(163, 217, 255, ${alpha})`; this.tCtx.lineWidth = s.r; this.tCtx.stroke();
                    } else {
                        this.tCtx.beginPath(); this.tCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                        this.tCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`; this.tCtx.fill();
                    }
                    s.x -= currentSpeed;
                    if (s.x < 0) { s.x = w + Math.random() * 100; s.y = Math.random() * h; }
                }
            }

            renderBinary() {
                if (!this.binaryActive) return;
                this.binaryAnimId = requestAnimationFrame(() => this.renderBinary());
                const w = this.bCanvas.width; const h = this.bCanvas.height;
                const fontSize = 24;
                
                this.bCtx.clearRect(0, 0, w, h); 
                this.bCtx.fillStyle = '#00e5ff';
                this.bCtx.font = fontSize + "px 'JetBrains Mono', monospace";
                this.bCtx.textAlign = 'center';

                for(let i = 0; i < this.drops.length; i++) {
                    const text = Math.random() > 0.5 ? "1" : "0";
                    this.bCtx.fillText(text, i * fontSize, this.drops[i] * fontSize);
                    if(this.drops[i] * fontSize > h && Math.random() > 0.9 && !this.bootComplete) this.drops[i] = 0;
                    this.drops[i]++;
                }
            }

            generateSprites() {
                this.spriteCanvas.width = 2048; this.spriteCanvas.height = 256; 
                const sCtx = this.spriteCanvas.getContext('2d', { alpha: true });

                const nebulaColors =[ {r:0,g:150,b:255}, {r:120,g:50,b:255}, {r:255,g:50,b:150}, {r:0,g:255,b:100} ];
                nebulaColors.forEach((c, i) => {
                    let cx = (i * 256) + 128; let cy = 128;
                    for(let puff=0; puff<4; puff++) {
                        let px = cx + (Math.random()*80 - 40); let py = cy + (Math.random()*80 - 40);
                        let grad = sCtx.createRadialGradient(px, py, 0, px, py, 120);
                        grad.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, 0.5)`);
                        grad.addColorStop(0.4, `rgba(${c.r}, ${c.g}, ${c.b}, 0.15)`);
                        grad.addColorStop(1, 'transparent'); 
                        sCtx.fillStyle = grad; sCtx.beginPath(); sCtx.arc(px, py, 120, 0, Math.PI*2); sCtx.fill();
                    }
                });

                this.starClasses = [
                    { class: 'O型 [蓝巨星]', core: '#e6f0ff', glow: '100, 160, 255', prob: 0.05, size: 3.5 },
                    { class: 'A型 [主序星]', core: '#ffffff', glow: '255, 255, 255', prob: 0.15, size: 2.0 },
                    { class: 'G型 [黄矮星]', core: '#fff9e6', glow: '255, 200, 50', prob: 0.30, size: 1.5 },
                    { class: 'M型 [红矮星]', core: '#ffccbb', glow: '255, 80, 80', prob: 0.40, size: 1.0 },
                    { class: '异常 [脉冲星]', core: '#f2e6ff', glow: '200, 80, 255', prob: 0.10, size: 2.5 }
                ];
                
                this.starClasses.forEach((st, i) => {
                    let cx = 768 + (i * 256) + 128; let cy = 128; 
                    let grad = sCtx.createRadialGradient(cx, cy, 0, cx, cy, 128);
                    grad.addColorStop(0, '#ffffff'); 
                    grad.addColorStop(0.12, st.core); 
                    grad.addColorStop(0.4, `rgba(${st.glow}, 0.6)`); 
                    grad.addColorStop(1, 'transparent'); 
                    sCtx.fillStyle = grad; sCtx.beginPath(); sCtx.arc(cx, cy, 128, 0, Math.PI*2); sCtx.fill();
                });
            }

            generateUniverse() {
                const isMobile = window.innerWidth <= 768;
                const dustCount = isMobile ? 500 : 2500; 
                const cloudCount = isMobile ? 20 : 100;  
                const starCount = isMobile ? 150 : 500;  

                for(let i=0; i<dustCount; i++) {
                    let bucketIdx = Math.floor(Math.random() * 3);
                    this.dustBuckets[bucketIdx].push({ 
                        x: (Math.random() - 0.5) * this.WORLD_SIZE, 
                        y: (Math.random() - 0.5) * this.WORLD_SIZE, 
                        z: Math.random() * 0.5 + 0.1, 
                        size: Math.random() * 1.5 
                    });
                }

                for(let i=0; i<cloudCount; i++) {
                    this.organicClouds.push({
                        x: (Math.random() - 0.5) * this.WORLD_SIZE, 
                        y: (Math.random() - 0.5) * this.WORLD_SIZE, 
                        z: Math.random() * 0.4 + 0.2, 
                        spriteIdx: Math.floor(Math.random() * 4),
                        radius: Math.random() * 800 + 400,
                        rot: Math.random() * Math.PI * 2, 
                        stretchX: (Math.random() * 0.8) + 0.6, 
                        stretchY: (Math.random() * 0.8) + 0.6, 
                        op: Math.random() * 0.2 + 0.05
                    });
                }

                planetsDB.forEach(p => {
                    this.tacticalNodes.push({
                        isPlanetDB: true, 
                        planetData: p,
                        system: p.system, // 记录所属星系
                        isParent: p.isParent, // 记录是否为主星
                        x: (p.x - 50) / 50 * (this.WORLD_SIZE / 2), 
                        y: (p.y - 50) / 50 * (this.WORLD_SIZE / 2),
                        z: 1.0, 
                        baseSize: 10 * (p.sizeScale || 1.0), // 卫星体积缩小
                        typeIdx: 0, classStr: p.faction, name: p.name,
                        orbitals: p.isParent ? 2 : 0, // 只有主星有轨道环
                        isMajor: true, customColor: p.color, customRgb: p.rgb
                    });
                });

                // 💥 核心新增：生成星系内部的专属连线
                const systemGroups = {};
                this.tacticalNodes.filter(n => n.isPlanetDB).forEach(n => {
                    if (!systemGroups[n.system]) systemGroups[n.system] = [];
                    systemGroups[n.system].push(n);
                });

                Object.values(systemGroups).forEach(group => {
                    const parent = group.find(n => n.isParent);
                    if (parent) {
                        group.forEach(child => {
                            if (child !== parent) {
                                this.telemetryLines.push({ p1: parent, p2: child, isSystemLine: true, system: parent.system });
                            }
                        });
                    }
                });

                const prefixes =["SYS", "ARES", "OBS", "VEGA", "LYRA", "ECHO"];
                for (let i = 0; i < starCount; i++) {
                    let r = Math.random(); let typeIdx = this.starClasses.findIndex(t => (r -= t.prob) <= 0);
                    if(typeIdx === -1) typeIdx = 3; let type = this.starClasses[typeIdx];
                    this.tacticalNodes.push({
                        isPlanetDB: false,
                        x: (Math.random() - 0.5) * this.WORLD_SIZE, 
                        y: (Math.random() - 0.5) * this.WORLD_SIZE, 
                        z: Math.random() * 0.7 + 0.2, 
                        baseSize: (Math.random() * 1.5 + 1.0) * type.size, 
                        typeIdx: typeIdx, classStr: type.class, 
                        name: `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${Math.floor(Math.random()*900)+100}`,
                        orbitals: Math.floor(Math.random() * 4), isMajor: false
                    });
                }

                // 生成背景随机连线
                const majorNodes = this.tacticalNodes.filter(s => s.isMajor && s.isParent); // 只连主星
                majorNodes.forEach(node => {
                    let nearby = majorNodes.map(s => ({ node: s, dist: Math.hypot(s.x - node.x, s.y - node.y) }))
                        .filter(s => s.dist > 200 && s.dist < 1500).sort((a, b) => a.dist - b.dist).slice(0, 2);
                    nearby.forEach(n => this.telemetryLines.push({ p1: node, p2: n.node }));
                });
            }

            bindEvents() {
                const tooltip = document.getElementById('tactical-tooltip');

                window.addEventListener('resize', () => {
                    if (document.getElementById('starMapModal').classList.contains('active')) this.resize();
                });

                // --- PC 端鼠标事件 ---
                this.mCanvas.addEventListener('mousedown', e => { 
                    if(!this.bootComplete) return;
                    this.isDragging = true; this.vel.x = 0; this.vel.y = 0; 
                    this.lastMouse = { x: e.clientX, y: e.clientY }; this.clickStartPos = { x: e.clientX, y: e.clientY }; 
                    tooltip.style.display = 'none'; 
                });

                window.addEventListener('mouseup', e => { 
                    if(!this.bootComplete || !this.isDragging) return;
                    this.isDragging = false; 
                    let dx = e.clientX - this.clickStartPos.x; let dy = e.clientY - this.clickStartPos.y;
                    if ((dx * dx + dy * dy) < 25) this.handleMapClick(e.clientX, e.clientY);
                });

                // 右键取消锁定
                this.mCanvas.addEventListener('contextmenu', e => {
                    e.preventDefault(); if(!this.bootComplete) return;
                    this.selectedNode = null; 
                    document.getElementById('planet-detail-panel').classList.remove('active');
                    this.updateNavHUD();
                });

                this.mCanvas.addEventListener('mousemove', e => {
                    if(!this.bootComplete) return;
                    const rect = this.mCanvas.getBoundingClientRect();
                    const mx = e.clientX - rect.left; 
                    const my = e.clientY - rect.top;
                    
                    const cx = this.mCanvas.width / 2;
                    const cy = this.mCanvas.height / 2;
                    this.globalMouseWorldX = (mx - cx) / this.cam.zoom - this.cam.x; 
                    this.globalMouseWorldY = (my - cy) / this.cam.zoom - this.cam.y;
                    
                    if (this.isDragging) {
                        let dx = e.clientX - this.lastMouse.x; let dy = e.clientY - this.lastMouse.y;
                        this.cam.x += dx / this.cam.zoom; this.cam.y += dy / this.cam.zoom; 
                        this.vel.x = dx / this.cam.zoom; this.vel.y = dy / this.cam.zoom;
                        this.lastMouse = { x: e.clientX, y: e.clientY }; return; 
                    }

                    this.hoveredNode = null;
                    const wrapSize = this.WORLD_SIZE;
                    const wrap = (val, max) => { let v = val + max / 2; return ((v % max) + max) % max - max / 2; };

                    for (let node of this.tacticalNodes) {
                        let px = node.x + this.cam.x * node.z;
                        let py = node.y + this.cam.y * node.z;
                        if (!node.isMajor) { px = wrap(px, wrapSize); py = wrap(py, wrapSize); }
                        
                        let screenX = px * this.cam.zoom + cx;
                        let screenY = py * this.cam.zoom + cy;
                        let dx = screenX - mx; let dy = screenY - my; 
                        let thresh = (node.baseSize * node.z + 15) * this.cam.zoom; 
                        
                        if ((dx * dx + dy * dy) < (thresh * thresh)) { this.hoveredNode = node; break; }
                    }

                    if (this.hoveredNode) {
                        tooltip.style.display = 'block'; tooltip.style.left = (e.clientX + 30) + 'px'; tooltip.style.top = (e.clientY + 30) + 'px';
                        document.getElementById('tt-name').innerText = this.hoveredNode.name; 
                        document.getElementById('tt-class').innerText = this.hoveredNode.classStr; 
                        
                        if (this.hoveredNode.isPlanetDB) {
                            document.getElementById('tt-region').innerText = this.hoveredNode.planetData.region || '未知星区';
                            document.getElementById('tt-type').innerText = this.hoveredNode.isParent ? '主星' : '卫星/设施';
                        } else {
                            document.getElementById('tt-region').innerText = '深空未知区域';
                            document.getElementById('tt-type').innerText = '未命名天体';
                        }

                        if (this.selectedNode === this.hoveredNode) {
                            tooltip.classList.add('in-route');
                            document.getElementById('tt-status').innerText = `目标已锁定`;
                            document.getElementById('tt-status').style.color = "#ffb700";
                        } else {
                            tooltip.classList.remove('in-route');
                            document.getElementById('tt-status').innerText = this.hoveredNode.classStr.includes("脉冲星") ? "临界" : "稳定";
                            document.getElementById('tt-status').style.color = this.hoveredNode.classStr.includes("脉冲星") ? "#ff3333" : "#00e5ff";
                        }
                        this.mCanvas.style.cursor = 'crosshair';
                    } else { tooltip.style.display = 'none'; this.mCanvas.style.cursor = 'grab'; }
                });

                // --- 💥 重写 PC 端滚轮：定点聚焦缩放 ---
                this.mCanvas.addEventListener('wheel', e => {
                    if(!this.bootComplete) return;
                    e.preventDefault(); // 阻止网页默认滚动
                    
                    // 1. 记录鼠标相对于画布中心的当前位置
                    const rect = this.mCanvas.getBoundingClientRect();
                    this.zoomMouseX = e.clientX - rect.left - this.mCanvas.width / 2;
                    this.zoomMouseY = e.clientY - rect.top - this.mCanvas.height / 2;

                    // 2. 赋予缩放目标值（加大缩放幅度，制造更爽快的推拉感）
                    const zoomFactor = e.deltaY > 0 ? 0.75 : 1.35; 
                    this.targetZoom = Math.max(0.15, Math.min(this.targetZoom * zoomFactor, 5.0));
                }, { passive: false });

                // --- 手机端触摸事件 ---
                let initialPinchDist = null;

                this.mCanvas.addEventListener('touchstart', e => {
                    if(!this.bootComplete) return;
                    if (e.touches.length === 1) {
                        this.isDragging = true; this.vel.x = 0; this.vel.y = 0;
                        this.lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                        this.clickStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                        tooltip.style.display = 'none';
                    } else if (e.touches.length === 2) {
                        this.isDragging = false;
                        initialPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                    }
                }, {passive: false});

                this.mCanvas.addEventListener('touchmove', e => {
                    if(!this.bootComplete) return;
                    if (e.cancelable) e.preventDefault(); 

                    if (e.touches.length === 1 && this.isDragging) {
                        let dx = e.touches[0].clientX - this.lastMouse.x;
                        let dy = e.touches[0].clientY - this.lastMouse.y;
                        this.cam.x += dx / this.cam.zoom; 
                        this.cam.y += dy / this.cam.zoom;
                        this.vel.x = dx / this.cam.zoom; 
                        this.vel.y = dy / this.cam.zoom;
                        this.lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    } else if (e.touches.length === 2 && initialPinchDist) {
                        let currentDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                        let zoomFactor = currentDist / initialPinchDist;
                        this.cam.zoom = Math.max(0.15, Math.min(this.cam.zoom * zoomFactor, 5.0));
                        this.targetZoom = this.cam.zoom; // 💥 新增：同步目标值，防止松手后回弹
                        initialPinchDist = currentDist;
                    }
                }, {passive: false}); 

                this.mCanvas.addEventListener('touchend', e => {
                    if(!this.bootComplete) return;
                    if (e.touches.length === 0 && this.isDragging) {
                        this.isDragging = false;
                        let dx = this.lastMouse.x - this.clickStartPos.x;
                        let dy = this.lastMouse.y - this.clickStartPos.y;
                        if ((dx * dx + dy * dy) < 25) {
                            this.handleMapClick(this.lastMouse.x, this.lastMouse.y);
                        }
                    }
                    if (e.touches.length < 2) initialPinchDist = null;
                });
            }

            // 💥 核心修复：合并并重构点击逻辑，精准锁定目标
            handleMapClick(clientX, clientY) {
                const rect = this.mCanvas.getBoundingClientRect();
                const mx = clientX - rect.left; 
                const my = clientY - rect.top;
                const cx = this.mCanvas.width / 2;
                const cy = this.mCanvas.height / 2;
                
                let clickedNode = null;
                const wrapSize = this.WORLD_SIZE;
                const wrap = (val, max) => { let v = val + max / 2; return ((v % max) + max) % max - max / 2; };

                for (let node of this.tacticalNodes) {
                    let px = node.x + this.cam.x * node.z;
                    let py = node.y + this.cam.y * node.z;
                    if (!node.isMajor) { px = wrap(px, wrapSize); py = wrap(py, wrapSize); }
                    
                    let screenX = px * this.cam.zoom + cx;
                    let screenY = py * this.cam.zoom + cy;
                    let dx = screenX - mx; let dy = screenY - my; 
                    let thresh = (node.baseSize * node.z + 25) * this.cam.zoom; 
                    
                    if ((dx * dx + dy * dy) < (thresh * thresh)) { clickedNode = node; break; }
                }

                if (clickedNode) {
                    this.selectedNode = clickedNode; // 锁定目标
                    if (clickedNode.isPlanetDB) {
                        showPlanetDetail(clickedNode.planetData);
                    } else {
                        document.getElementById('planet-detail-panel').classList.remove('active');
                    }
                } else {
                    this.selectedNode = null; // 点击空白处取消锁定
                    document.getElementById('planet-detail-panel').classList.remove('active');
                }
                this.updateNavHUD();
            }

            updateNavHUD() {
                const navStatus = document.getElementById('nav-status');
                if (!this.selectedNode) { 
                    navStatus.innerText = "导航: 待命"; 
                    navStatus.style.color = "rgba(255, 183, 0, 0.5)"; 
                } else {
                    navStatus.innerText = `导航: 目标已锁定 [${this.selectedNode.name}]`; 
                    navStatus.style.color = "#ffb700"; 
                }
            }

            renderMap() {
                if (!this.bootComplete) return;
                this.mapAnimId = requestAnimationFrame(() => this.renderMap());

                // --- 💥 1. 丝滑阻尼推拉镜头 + 鼠标定点聚焦 ---
                if (Math.abs(this.targetZoom - this.cam.zoom) > 0.001) {
                    const oldZoom = this.cam.zoom;
                    this.cam.zoom += (this.targetZoom - this.cam.zoom) * 0.12; // 12%的顺滑阻尼

                    // 核心数学魔法：在缩放的同时反向偏移相机，把鼠标瞄准的星球死死“钉”在屏幕上
                    this.cam.x += this.zoomMouseX / this.cam.zoom - this.zoomMouseX / oldZoom;
                    this.cam.y += this.zoomMouseY / this.cam.zoom - this.zoomMouseY / oldZoom;
                }

                // --- 💥 2. 丝滑拖拽阻尼 (保持你原来的) ---
                if (!this.isDragging) { this.cam.x += this.vel.x; this.cam.y += this.vel.y; this.vel.x *= 0.92; this.vel.y *= 0.92; }

                document.getElementById('hud-coords').innerText = `坐标.X: ${(-this.cam.x).toFixed(1).padStart(7, '0')} // 坐标.Y: ${(-this.cam.y).toFixed(1).padStart(7, '0')}`;
                document.getElementById('hud-zoom').innerText = `缩放倍率: ${this.cam.zoom.toFixed(2)}x`;

                this.mCtx.clearRect(0, 0, this.mCanvas.width, this.mCanvas.height);
                
                let halfW = (this.mCanvas.width / 2) / this.cam.zoom; let halfH = (this.mCanvas.height / 2) / this.cam.zoom;

                this.mCtx.save(); 
                this.mCtx.translate(this.mCanvas.width / 2, this.mCanvas.height / 2); 
                this.mCtx.scale(this.cam.zoom, this.cam.zoom);

                const wrapSize = this.WORLD_SIZE;
                const wrap = (val, max) => {
                    let v = val + max / 2;
                    return ((v % max) + max) % max - max / 2;
                };

                // 1. 渲染宇宙尘埃
                this.mCtx.fillStyle = '#fff';
                this.dustBuckets.forEach((bucket, idx) => {
                    this.mCtx.globalAlpha = this.bucketAlphas[idx]; this.mCtx.beginPath(); 
                    bucket.forEach(d => {
                        let px = wrap(d.x + this.cam.x * d.z, wrapSize); 
                        let py = wrap(d.y + this.cam.y * d.z, wrapSize);
                        if (px >= -halfW && px <= halfW && py >= -halfH && py <= halfH) this.mCtx.rect(px | 0, py | 0, d.size/this.cam.zoom, d.size/this.cam.zoom); 
                    }); this.mCtx.fill(); 
                });

                // 2. 渲染星云气体
                this.mCtx.globalCompositeOperation = 'screen'; 
                this.organicClouds.forEach(c => {
                    let px = wrap(c.x + this.cam.x * c.z, wrapSize); 
                    let py = wrap(c.y + this.cam.y * c.z, wrapSize);
                    if (px >= -halfW - c.radius && px <= halfW + c.radius && py >= -halfH - c.radius && py <= halfH + c.radius) {
                        this.mCtx.save(); this.mCtx.translate(px | 0, py | 0); this.mCtx.rotate(c.rot); this.mCtx.scale(c.stretchX, c.stretchY);
                        this.mCtx.globalAlpha = c.op; this.mCtx.drawImage(this.spriteCanvas, c.spriteIdx * 256, 0, 256, 256, -(c.radius | 0), -(c.radius | 0), (c.radius*2) | 0, (c.radius*2) | 0);
                        this.mCtx.restore();
                    }
                });
                this.mCtx.globalCompositeOperation = 'source-over'; 
                this.mCtx.globalAlpha = 1.0;

                // 2.5 💥 渲染星区轨道环
                this.mCtx.lineWidth = 1.5 / this.cam.zoom;
                const orbits = [
                    { r: 200, color: 'rgba(0, 229, 255, 0.15)', name: '内环' },
                    { r: 500, color: 'rgba(76, 175, 80, 0.15)', name: '小行星带' },
                    { r: 900, color: 'rgba(255, 152, 0, 0.15)', name: '外环' },
                    { r: 1300, color: 'rgba(244, 67, 54, 0.15)', name: '柯伊伯带' }
                ];
                orbits.forEach(orbit => {
                    this.mCtx.beginPath();
                    this.mCtx.arc(this.cam.x, this.cam.y, orbit.r, 0, Math.PI * 2);
                    this.mCtx.strokeStyle = orbit.color;
                    this.mCtx.setLineDash([10 / this.cam.zoom, 15 / this.cam.zoom]);
                    this.mCtx.stroke();
                    this.mCtx.setLineDash([]);
                    
                    // 在轨道环上写字
                    this.mCtx.fillStyle = orbit.color;
                    this.mCtx.font = `${12 / this.cam.zoom}px 'Orbitron', monospace`;
                    this.mCtx.textAlign = 'center';
                    this.mCtx.fillText(orbit.name, this.cam.x, this.cam.y - orbit.r - (8 / this.cam.zoom));
                });
                this.mCtx.textAlign = 'left'; // 恢复默认对齐方式

                // 3. 渲染战术连线 (支持星系联动高亮)
                this.mCtx.globalAlpha = 0.6; // 👈 新增这一行：开始画线前，把透明度降为 60%

                this.telemetryLines.forEach(lane => {
                    let p1x = lane.p1.x + this.cam.x * lane.p1.z; let p1y = lane.p1.y + this.cam.y * lane.p1.z;
                    let p2x = lane.p2.x + this.cam.x * lane.p2.z; let p2y = lane.p2.y + this.cam.y * lane.p2.z;
                    
                    let isHoveredSystem = this.hoveredNode && this.hoveredNode.system && this.hoveredNode.system === lane.system;
                    
                    this.mCtx.beginPath();
                    if (isHoveredSystem) {
                        this.mCtx.strokeStyle = lane.p1.customColor || '#00e5ff';
                        this.mCtx.lineWidth = 1.2 / this.cam.zoom; 
                        this.mCtx.setLineDash([]);
                    } else {
                        this.mCtx.strokeStyle = lane.isSystemLine ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 229, 255, 0.1)'; 
                        this.mCtx.lineWidth = 1 / this.cam.zoom; 
                        this.mCtx.setLineDash([8 / this.cam.zoom, 12 / this.cam.zoom]);
                    }
                    this.mCtx.moveTo(p1x | 0, p1y | 0); this.mCtx.lineTo(p2x | 0, p2y | 0);
                    this.mCtx.stroke();
                });

                this.mCtx.setLineDash([]);
                this.mCtx.globalAlpha = 1.0; // 👈 新增这一行：线画完了，立刻把透明度恢复到 100%！

                // 4. 渲染所有星体
                const isMobile = window.innerWidth <= 768; 
                const time = Date.now();
                
                this.mCtx.globalCompositeOperation = 'source-over'; 
                
                this.tacticalNodes.forEach(node => {
                    let px = node.x + this.cam.x * node.z;
                    let py = node.y + this.cam.y * node.z;

                    if (!node.isMajor) {
                        px = wrap(px, wrapSize);
                        py = wrap(py, wrapSize);
                    }

                    if (px < -halfW - 400 || px > halfW + 400 || py < -halfH - 400 || py > halfH + 400) return;
                    
                    let depthScale = node.z; 
                    let currentSize = node.baseSize * depthScale;
                    
                    const alphaBase = (Math.sin((time % 100000) * 0.005 + node.x) * 0.2 + 0.8) * depthScale; 
                    const coreRgb = node.customRgb || (node.classStr.includes("PULSAR") ? "200,80,255" : "0,229,255");

                    this.mCtx.globalAlpha = alphaBase; // 统一接管全局透明度闪烁

                    // 💥 极致分流算法
                    if (!node.isMajor) {
                        // 💥 核心 3D 视觉欺骗：背景恒星距离极远，放大时体积不该成比例暴增！
                        // 用 Math.sqrt 压制放大倍率，当你拉近镜头时，它们只会微微变大，从而产生深邃的 3D 纵深感
                        let visualSize = currentSize / Math.sqrt(this.cam.zoom);

                        if (visualSize < 1.2) {
                            this.mCtx.fillStyle = `rgba(255, 255, 255, 0.8)`;
                            this.mCtx.fillRect(px - visualSize, py - visualSize, visualSize * 2, visualSize * 2);
                        } else {
                            const spriteSize = visualSize * 10; 
                            const sx = 768 + (node.typeIdx * 256);
                            this.mCtx.drawImage(
                                this.spriteCanvas,
                                sx, 0, 256, 256, 
                                px - spriteSize/2, py - spriteSize/2, spriteSize, spriteSize 
                            );
                        }
                    } else {
                        // 2. 主星与基地：需要自定义颜色，保留画圆，但降低重绘层数
                        const glowLayers = isMobile ? 1 : 2; // 即使 PC 端 2 层也足够好看
                        const glowSpread = node.isPlanetDB ? 8 * depthScale : 4 * depthScale; 
                        for(let i = glowLayers; i >= 1; i--) {
                            this.mCtx.beginPath();
                            this.mCtx.arc(px, py, currentSize + (i * glowSpread), 0, Math.PI * 2);
                            this.mCtx.fillStyle = `rgba(${coreRgb}, ${0.15 / i})`; 
                            this.mCtx.fill();
                        }

                        this.mCtx.beginPath();
                        this.mCtx.arc(px, py, currentSize, 0, Math.PI * 2);
                        this.mCtx.fillStyle = '#ffffff';
                        this.mCtx.fill();

                        // 画轨道环
                        const ringRadius = currentSize + 12; 
                        this.mCtx.save();
                        this.mCtx.translate(px, py);
                        
                        this.mCtx.rotate(time * 0.0005);
                        this.mCtx.beginPath();
                        this.mCtx.arc(0, 0, ringRadius, 0, Math.PI * 2);
                        this.mCtx.strokeStyle = `rgba(${coreRgb}, 0.5)`;
                        this.mCtx.lineWidth = 1 / this.cam.zoom;
                        this.mCtx.setLineDash([6 / this.cam.zoom, 6 / this.cam.zoom]);
                        this.mCtx.stroke();
                        
                        this.mCtx.rotate(-time * 0.001); 
                        this.mCtx.beginPath();
                        this.mCtx.arc(0, 0, ringRadius - 3, 0, Math.PI * 2);
                        this.mCtx.setLineDash([]);
                        this.mCtx.strokeStyle = `rgba(${coreRgb}, 0.2)`;
                        this.mCtx.lineWidth = 1 / this.cam.zoom;
                        this.mCtx.stroke();

                        this.mCtx.beginPath();
                        const tick = Math.min(3 / this.cam.zoom, 6); 
                        this.mCtx.moveTo(-ringRadius - tick, 0); this.mCtx.lineTo(-ringRadius + tick, 0);
                        this.mCtx.moveTo(ringRadius - tick, 0); this.mCtx.lineTo(ringRadius + tick, 0);
                        this.mCtx.moveTo(0, -ringRadius - tick); this.mCtx.lineTo(0, -ringRadius + tick);
                        this.mCtx.moveTo(0, ringRadius - tick); this.mCtx.lineTo(0, ringRadius + tick);
                        this.mCtx.strokeStyle = `rgba(${coreRgb}, 0.8)`;
                        this.mCtx.lineWidth = 1.5 / this.cam.zoom;
                        this.mCtx.stroke();

                        // 💥 核心新增：如果该节点属于当前悬停的星系，给它画一个战术高亮框
                        let isHoveredSystem = this.hoveredNode && this.hoveredNode.system && this.hoveredNode.system === node.system;
                        if (isHoveredSystem && node !== this.hoveredNode) {
                            this.mCtx.beginPath();
                            // 💥 圈放大：从 10 改为 18，拉开与星球本体的距离
                            this.mCtx.arc(0, 0, currentSize + (18 / this.cam.zoom), 0, Math.PI * 2);
                            this.mCtx.strokeStyle = node.customColor || '#00e5ff';
                            // 💥 线变细：从 2 降为 1.2
                            this.mCtx.lineWidth = 1.2 / this.cam.zoom;
                            this.mCtx.setLineDash([4 / this.cam.zoom, 4 / this.cam.zoom]);
                            this.mCtx.stroke();
                            this.mCtx.setLineDash([]);
                        }

                        this.mCtx.restore();
                    }

                    if ((node.isMajor && this.cam.zoom > 0.4) || this.cam.zoom > 1.5) {
                        this.mCtx.globalAlpha = depthScale; 
                        this.mCtx.fillStyle = node.customColor ? node.customColor : `rgba(255, 255, 255, ${0.8 * depthScale})`; 
                        this.mCtx.font = `${10 / this.cam.zoom}px 'JetBrains Mono', monospace`;
                        const textOffset = node.isMajor ? 22 : 8;
                        this.mCtx.fillText(`[${node.name.split('-')[0]}]`, px + currentSize + textOffset/this.cam.zoom, py + currentSize + 4/this.cam.zoom); 
                    }
                });

                // 5. 💥 渲染被锁定的目标 (Target Lock)
                if (this.selectedNode) {
                    let node = this.selectedNode;
                    let px = node.x + this.cam.x * node.z;
                    let py = node.y + this.cam.y * node.z;
                    if (!node.isMajor) { px = wrap(px, wrapSize); py = wrap(py, wrapSize); }
                    
                    let s = (node.baseSize * node.z) + (15 / this.cam.zoom); 
                    
                    this.mCtx.strokeStyle = '#ffb700'; this.mCtx.lineWidth = 2 / this.cam.zoom;
                    this.mCtx.beginPath();
                    this.mCtx.moveTo(px - s, py - s/2); this.mCtx.lineTo(px - s, py - s); this.mCtx.lineTo(px - s/2, py - s);
                    this.mCtx.moveTo(px + s, py - s/2); this.mCtx.lineTo(px + s, py - s); this.mCtx.lineTo(px + s/2, py - s);
                    this.mCtx.moveTo(px - s, py + s/2); this.mCtx.lineTo(px - s, py + s); this.mCtx.lineTo(px - s/2, py + s);
                    this.mCtx.moveTo(px + s, py + s/2); this.mCtx.lineTo(px + s, py + s); this.mCtx.lineTo(px + s/2, py + s); this.mCtx.stroke();
                    this.mCtx.fillStyle = '#ffb700'; this.mCtx.font = `bold ${10 / this.cam.zoom}px 'Orbitron', 'Microsoft YaHei', sans-serif`; 
                    this.mCtx.fillText(`锁定`, px + s + (5/this.cam.zoom), py - s);

                    for(let i=0; i<node.orbitals; i++) {
                        let orbR = (node.baseSize * node.z) + (25 + (i * 15)) / this.cam.zoom; this.mCtx.beginPath(); this.mCtx.arc(px, py, orbR, 0, Math.PI*2); this.mCtx.strokeStyle = 'rgba(255, 183, 0, 0.3)'; this.mCtx.lineWidth = 1 / this.cam.zoom; this.mCtx.stroke();
                        let spd = time / 1000 * (1 / (i + 1)); this.mCtx.fillStyle = '#fff'; this.mCtx.beginPath(); this.mCtx.arc(px + Math.cos(spd) * orbR, py + Math.sin(spd) * orbR, 2 / this.cam.zoom, 0, Math.PI*2); this.mCtx.fill();
                    }
                }

                // 6. 渲染鼠标悬停提示框 (避开已锁定的目标)
                if (this.hoveredNode && this.hoveredNode !== this.selectedNode) {
                    let px = this.hoveredNode.x + this.cam.x * this.hoveredNode.z;
                    let py = this.hoveredNode.y + this.cam.y * this.hoveredNode.z;
                    if (!this.hoveredNode.isMajor) { px = wrap(px, wrapSize); py = wrap(py, wrapSize); }

                    let s = (this.hoveredNode.baseSize * this.hoveredNode.z) + (15 / this.cam.zoom); 
                    let color = this.hoveredNode.customColor || '#00e5ff';
                    this.mCtx.strokeStyle = color; this.mCtx.lineWidth = 2 / this.cam.zoom;
                    this.mCtx.beginPath();
                    this.mCtx.moveTo(px - s, py - s/2); this.mCtx.lineTo(px - s, py - s); this.mCtx.lineTo(px - s/2, py - s);
                    this.mCtx.moveTo(px + s, py - s/2); this.mCtx.lineTo(px + s, py - s); this.mCtx.lineTo(px + s/2, py - s);
                    this.mCtx.moveTo(px - s, py + s/2); this.mCtx.lineTo(px - s, py + s); this.mCtx.lineTo(px - s/2, py + s);
                    this.mCtx.moveTo(px + s, py + s/2); this.mCtx.lineTo(px + s, py + s); this.mCtx.lineTo(px + s/2, py + s); this.mCtx.stroke();

                    for(let i=0; i<this.hoveredNode.orbitals; i++) {
                        let orbR = (this.hoveredNode.baseSize * this.hoveredNode.z) + (25 + (i * 15)) / this.cam.zoom; this.mCtx.beginPath(); this.mCtx.arc(px, py, orbR, 0, Math.PI*2); 
                        this.mCtx.strokeStyle = color.replace(')', ', 0.2)').replace('rgb', 'rgba'); 
                        if(this.mCtx.strokeStyle === color) this.mCtx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
                        this.mCtx.lineWidth = 1 / this.cam.zoom; this.mCtx.stroke();
                        let spd = time / 1000 * (1 / (i + 1)); this.mCtx.fillStyle = '#fff'; this.mCtx.beginPath(); this.mCtx.arc(px + Math.cos(spd) * orbR, py + Math.sin(spd) * orbR, 2 / this.cam.zoom, 0, Math.PI*2); this.mCtx.fill();
                    }
                }

                this.mCtx.restore();
            }
        }

        

        /* =========================================================
           💥 个人记录 (自戏/对戏) 核心引擎 💥
           ========================================================= */
        

        // 1. Tab 切换逻辑
        window.switchLogTab = function(tabId) {
            document.querySelectorAll('.log-tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('#storyView .admin-tab-content').forEach(content => content.classList.remove('active'));
            
            const targetBtn = document.querySelector(`.log-tab-btn[data-tab="${tabId}"]`);
            const targetContent = document.getElementById(tabId);
            
            if(targetBtn && targetContent) {
                targetBtn.classList.add('active');
                targetContent.classList.add('active');
                sessionStorage.setItem('tf141_log_tab', tabId); // 💥 记忆对戏/自戏 Tab
            }
        };

        
        let rpMessages = []; // 暂存对戏聊天记录
        window.editingLogId = null; // 记录当前正在编辑的整篇记录 ID
        window.editingRpMsgId = null; // 记录当前正在编辑的单条聊天气泡 ID

        // 3. 打开记录编辑器 (支持传入 logId 进行二次编辑)
        window.openLogEditor = function(type, logId = null) {
            window.lastScrollY = window.scrollY || window.pageYOffset; // 💥 记录滚动位置
            window.editingLogId = logId;
            window.editingRpMsgId = null; // 重置单句编辑状态

            document.getElementById('log-title').value = '';
            document.getElementById('log-summary').value = '';
            document.getElementById('log-type').value = type;
            document.getElementById('btn-save-log').innerText = logId ? "[ UPDATE LOG // 更新记录 ]" : "[ UPLOAD LOG // 保存记录 ]";

            const titleEl = document.getElementById('log-editor-title');
            const soloSec = document.getElementById('solo-editor-section');
            const rpSec = document.getElementById('rp-editor-section');

            // 💥 身份切换器初始化
            const myChar = characterDB.find(c => c.owner_id === currentUser.id);
            const idWrapper = document.getElementById('rp-my-identity-wrapper');
            const idSelect = document.getElementById('rp-my-identity');
            if (myChar && myChar.has_hidden) {
                idWrapper.style.display = 'flex';
                idSelect.innerHTML = `
                    <option value="public">表身份: ${myChar.callsign}</option>
                    <option value="hidden" style="color:#e91e63;">里身份: ${myChar.hidden_callsign}</option>
                `;
            } else {
                idWrapper.style.display = 'none';
            }

            // 恢复数据逻辑
            let existingContent = '';
            if (logId) {
                const log = articlesDB.find(a => String(a.id) === String(logId));
                if (log) {
                    document.getElementById('log-title').value = log.title;
                    document.getElementById('log-summary').value = log.summary || '';
                    existingContent = log.content;
                }
            }

            if (type === 'solo') {
                titleEl.innerText = logId ? "[ 修改自戏记录 ]" : "[ 新增自戏记录 ]";
                titleEl.style.color = "#12a8ff";
                titleEl.style.textShadow = "0 0 15px rgba(18,168,255,0.5)";
                soloSec.style.display = 'block';
                rpSec.style.display = 'none';
                if (window.soloQuill) window.soloQuill.root.innerHTML = existingContent;
            } else {
                titleEl.innerText = logId ? "[ 修改对戏记录 ]" : "[ 新增对戏记录 ]";
                titleEl.style.color = "#e040fb";
                titleEl.style.textShadow = "0 0 15px rgba(224,64,251,0.5)";
                soloSec.style.display = 'none';
                rpSec.style.display = 'block';
                
                if (existingContent) {
                    try { rpMessages = JSON.parse(existingContent); } catch(e) { rpMessages = []; }
                } else {
                    rpMessages = [];
                }
                
                document.getElementById('rp-msg-text').value = '';
                document.getElementById('rp-msg-time').value = '';
                document.getElementById('btn-add-me').innerText = "[ + 添加我的发言 ]";
                document.getElementById('btn-add-other').innerText = "[ + 添加对方发言 ]";
                renderRpPreview();
            }

            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById('logEditorView').classList.add('active');
            window.scrollTo({ top: 0, behavior: 'instant' });
        };

        window.closeLogEditor = function() {
            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById('storyView').classList.add('active');
            sessionStorage.setItem('tf141_current_view', 'storyView');
            
            window.scrollTo({ top: window.lastScrollY || 0, behavior: 'auto' }); // 💥 瞬间恢复滚动位置
        };

        // 绑定专属阅读器的返回按钮
        document.getElementById('logReaderBackBtn').addEventListener('click', () => {
            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            const targetPanel = document.getElementById(previousViewId) || document.getElementById('storyView');
            targetPanel.classList.add('active');
            sessionStorage.setItem('tf141_current_view', targetPanel.id);
            
            window.scrollTo({ top: window.lastScrollY || 0, behavior: 'auto' }); // 💥 瞬间恢复滚动位置
        });

        // 4. 对戏生成器逻辑 (支持单句修改与时间戳)
        window.addRpMessage = function(sender) {
            const textInput = document.getElementById('rp-msg-text');
            const nameInput = document.getElementById('rp-partner-name');
            const timeInput = document.getElementById('rp-msg-time');
            const inheritCheck = document.getElementById('rp-inherit-name');
            
            const text = textInput.value.trim();
            const time = timeInput.value.trim();
            if (!text) return;

            let name = '';
            if (sender === 'me') {
                const myChar = characterDB.find(c => c.owner_id === currentUser.id);
                const idSelect = document.getElementById('rp-my-identity');
                // 💥 判断是否使用了里身份
                if (myChar && myChar.has_hidden && idSelect.value === 'hidden') {
                    name = myChar.hidden_callsign;
                } else {
                    name = myChar ? myChar.callsign : currentUser.nickname;
                }
            } else {
                name = nameInput.value.trim() || 'UNKNOWN';
            }

            // 💥 如果正在编辑某一句，直接覆盖
            if (window.editingRpMsgId) {
                const msg = rpMessages.find(m => m.id === window.editingRpMsgId);
                if (msg) {
                    msg.sender = sender;
                    msg.name = name;
                    msg.text = text;
                    msg.time = time;
                }
                window.editingRpMsgId = null;
                document.getElementById('btn-add-me').innerText = "[ ➕ 添加我的发言 ]";
                document.getElementById('btn-add-other').innerText = "[ ➕ 添加对方发言 ]";
            } else {
                // 否则新增一句
                rpMessages.push({ id: Date.now(), sender, name, text, time });
            }
            
            textInput.value = '';
            if (sender === 'other' && !inheritCheck.checked) {
                nameInput.value = '';
            }
            
            renderRpPreview();
        };

        // 💥 新增：点击修改单句聊天记录
        window.editRpMessage = function(id) {
            const msg = rpMessages.find(m => m.id === id);
            if (!msg) return;
            
            document.getElementById('rp-msg-text').value = msg.text;
            document.getElementById('rp-msg-time').value = msg.time || '';
            if (msg.sender === 'other') {
                document.getElementById('rp-partner-name').value = msg.name;
            }
            
            window.editingRpMsgId = id;
            document.getElementById('btn-add-me').innerText = "[ 💾 保存我的修改 ]";
            document.getElementById('btn-add-other').innerText = "[ 💾 保存对方修改 ]";
        };

        window.removeRpMessage = function(id) {
            rpMessages = rpMessages.filter(m => m.id !== id);
            renderRpPreview();
        };

        window.renderRpPreview = function() {
            const preview = document.getElementById('rp-chat-preview');
            if (rpMessages.length === 0) {
                preview.innerHTML = '<div style="color: #8bb9d6; font-family: monospace; text-align: center; opacity: 0.5;">[ 暂无对话记录，请在下方添加 ]</div>';
                return;
            }

            let html = '';
            rpMessages.forEach(m => {
                const isMe = m.sender === 'me';
                const timeHtml = m.time ? `<span style="color:#8bb9d6; font-weight:normal; font-size:11px; margin-left:5px; opacity:0.8;">${m.time}</span>` : '';
                html += `
                    <div class="chat-msg ${isMe ? 'me' : 'other'}">
                        <div class="chat-name">
                            ${m.name} ${timeHtml}
                            <span style="color:#ffeb3b; cursor:pointer; margin-left:8px;" onclick="editRpMessage(${m.id})">[改]</span>
                            <span style="color:#f44336; cursor:pointer; margin-left:5px;" onclick="removeRpMessage(${m.id})">[删]</span>
                        </div>
                        <div class="chat-bubble">${m.text}</div>
                    </div>
                `;
            });
            preview.innerHTML = html;
            preview.scrollTop = preview.scrollHeight;
        };

        // 5. 保存/更新记录到数据库
        document.getElementById('btn-save-log').addEventListener('click', async () => {
            const type = document.getElementById('log-type').value;
            const title = document.getElementById('log-title').value.trim();
            const summary = document.getElementById('log-summary').value.trim();
            
            if (!title) {
                SysModal.alert("记录标题不能为空！", "⚠️ 格式错误");
                return;
            }

            let content = '';
            if (type === 'solo') {
                content = window.soloQuill.root.innerHTML.trim();
                if (!content || content === '<p><br></p>') {
                    SysModal.alert("自戏正文不能为空！", "⚠️ 格式错误");
                    return;
                }
            } else {
                if (rpMessages.length === 0) {
                    SysModal.alert("对戏记录不能为空，请至少添加一条发言！", "⚠️ 格式错误");
                    return;
                }
                content = JSON.stringify(rpMessages); 
            }

            const btn = document.getElementById('btn-save-log');
            btn.innerHTML = `[ ${CyberLang.icon} ${CyberLang.get('saving')} ]`;
            btn.disabled = true;

            try {
                if (window.editingLogId) {
                    // 💥 更新已有记录
                    const { error } = await supabaseClient.from('articles').update({
                        title, summary, content, updated_at: new Date().toISOString()
                    }).eq('id', window.editingLogId);
                    if (error) throw error;
                    await SysModal.alert("记录已成功更新！", "✅ 更新成功");
                } else {
                    // 💥 插入新记录
                    const { error } = await supabaseClient.from('articles').insert([{
                        type: type === 'solo' ? 'solo_log' : 'rp_log',
                        title, summary, content,
                        owner_id: currentUser.id,
                        status: 'approved', 
                        updated_at: new Date().toISOString()
                    }]);
                    if (error) throw error;
                    await SysModal.alert("记录已成功保存！", "✅ 保存成功");
                }
                
                closeLogEditor();
                fetchArticles(); 
            } catch (err) {
                console.error(err);
                SysModal.alert("保存失败，请检查网络。", "✕ ERROR");
            } finally {
                btn.innerText = window.editingLogId ? "[ UPDATE LOG // 更新记录 ]" : "[ UPLOAD LOG // 保存记录 ]";
                btn.disabled = false;
            }
        });


        // 3. 渲染轮播图卡片
        window.updatePlotCarousel = function(direction = 0) { // 💥 接收方向参数
            const container = document.getElementById('main-plot-content');
            const prevBtn = document.getElementById('plot-prev-btn');
            const nextBtn = document.getElementById('plot-next-btn');

            if (!container) return;

            // 如果数据库里一条剧情都没有
            if (plotArticlesDB.length === 0) {
                container.innerHTML = `<div style="color:#e1bee7; font-family:monospace; padding: 30px; text-align: center; border: 1px dashed rgba(224,64,251,0.4); background: rgba(0,0,0,0.4);">[ 暂无主线剧情记录，请等待管理员更新 ]</div>`;
                if(prevBtn) prevBtn.style.display = 'none';
                if(nextBtn) nextBtn.style.display = 'none';
                return;
            }

            if(prevBtn) prevBtn.style.display = 'flex';
            if(nextBtn) nextBtn.style.display = 'flex';

            const plot = plotArticlesDB[currentPlotIndex];
            
            // 💥 核心逻辑：如果 index 是最后一个，就是“当前进度”，否则就是“往期内容”
            const isCurrent = (currentPlotIndex === plotArticlesDB.length - 1);
            const statusHtml = isCurrent 
                ? `<span class="plot-status-current">▶ 当前进度</span>` 
                : `<span class="plot-status-past">⏳ 往期内容</span>`;

            const timeStr = plot.updated_at ? new Date(plot.updated_at).toISOString().split('T')[0] : 'UNKNOWN';

            let adminControls = '';
            if (currentUser && ['admin', 'super_admin'].includes(currentUser.role)) {
                adminControls = `
                    <div style="display: flex; gap: 5px; z-index: 10;">
                        <button onclick="event.stopPropagation(); editArticle('${plot.id}')" style="background: rgba(255,235,59,0.2); border: 1px solid #ffeb3b; color: #ffeb3b; cursor: pointer; padding: 2px 8px; font-size: 12px; font-family: monospace; border-radius: 2px;">[改]</button>
                        <button onclick="event.stopPropagation(); deleteArticle('${plot.id}')" style="background: rgba(244,67,54,0.2); border: 1px solid #f44336; color: #f44336; cursor: pointer; padding: 2px 8px; font-size: 12px; font-family: monospace; border-radius: 2px;">[删]</button>
                    </div>
                `;
            }

            // 💥 核心新增：根据方向决定动画类名
            let animClass = '';
            if (direction === 1) animClass = 'plot-anim-next'; // 往老剧情翻，卡片从右边滑入
            else if (direction === -1) animClass = 'plot-anim-prev'; // 往新剧情翻，卡片从左边滑入

            // 渲染卡片 HTML (将 animClass 嵌入到 class 里)
            container.innerHTML = `
                <div class="plot-card ${animClass}" onclick="openArticleById('${plot.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                        ${statusHtml}
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <span style="color: #e1bee7; font-size: 12px; font-family: monospace; opacity: 0.8;">[ UPDATED: ${timeStr} ]</span>
                            ${adminControls}
                        </div>
                    </div>
                    <h3 style="color: #e040fb; margin: 0 0 10px 0; font-size: 22px; text-shadow: 0 0 10px rgba(224,64,251,0.4);">${plot.title}</h3>
                    <p style="color: #fff; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${plot.summary || '点击查阅详细剧情...'}</p>
                    <div style="color: #e040fb; font-size: 12px; font-family: monospace;">&gt; 点击查阅完整档案</div>
                </div>
            `;

            if(prevBtn) prevBtn.disabled = (currentPlotIndex === 0);
            if(nextBtn) nextBtn.disabled = (currentPlotIndex === plotArticlesDB.length - 1);
        };

        // 4. 左右翻页逻辑
        window.navigatePlot = function(direction) {
            // direction: -1 是往左（看更新的），1 是往右（看更老的）
            const newIndex = currentPlotIndex + direction;
            if (newIndex >= 0 && newIndex < plotArticlesDB.length) {
                currentPlotIndex = newIndex;
                updatePlotCarousel(direction); // 💥 核心：把方向参数传给渲染函数
            }
        };


        // 💥 页面加载时，恢复刷新前的视图
        const savedView = sessionStorage.getItem('tf141_current_view');
        // 如果有记忆，且不是文章页（文章页刷新会丢失动态数据，所以避开），就自动切换过去
        if (savedView && document.getElementById(savedView) && savedView !== 'articleView') {
            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(savedView).classList.add('active');
        }

        // 💥 页面加载时，恢复 Tab 记忆
        const savedLogTab = sessionStorage.getItem('tf141_log_tab');
        if (savedLogTab) window.switchLogTab(savedLogTab);

        const savedAdminTab = sessionStorage.getItem('tf141_admin_tab');
        if (savedAdminTab) window.switchAdminTab(savedAdminTab);

        // 页面加载时，先核实身份，再拉取数据
        initIdentity();

        /* =========================================================
           💥 初始化 Quill 富文本编辑器 💥
           ========================================================= */
        // 确保 Quill 绑定到你在 HTML 里写的 id="editor-container" 容器上
        window.quill = new Quill('#editor-container', {
            theme: 'snow', // 启用带有工具栏的主题
            placeholder: '在此输入详细正文，支持排版、加粗、插入图片等...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],       // 标题大小设置
                    ['bold', 'italic', 'underline', 'strike'], // 加粗、斜体、下划线、删除线
                    [{ 'color': [] }, { 'background': [] }],   // 字体颜色、背景颜色
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }], // 有序、无序列表
                    ['link', 'image'],                       // 链接和图片插入
                    ['clean']                                // 清除格式按钮
                ]
            }
        });

        // 💥 初始化自戏专属的 Quill 富文本编辑器 💥
        window.soloQuill = new Quill('#solo-quill-container', {
            theme: 'snow',
            placeholder: '在此输入自戏正文，支持排版、加粗、插入图片等...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image'],
                    ['clean']
                ]
            }
        });

        /* =========================================================
           💥 详情页：近况与公告富文本编辑器逻辑 💥
           ========================================================= */
        window.updatesQuill = new Quill('#updates-quill-container', {
            theme: 'snow',
            placeholder: '在此输入近况与公告，支持富文本排版、插入图片等...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    ['link', 'image'],
                    ['clean']
                ]
            }
        });

        window.currentEditingUpdatesId = null;

        window.openUpdatesEditor = function(articleId) {
            const article = articlesDB.find(a => String(a.id) === String(articleId));
            if (!article) return;
            window.currentEditingUpdatesId = articleId;
            
            const currentUpdates = window.getArticleUpdates(article.content);
            window.updatesQuill.root.innerHTML = currentUpdates;
            
            document.getElementById('updatesEditorModal').classList.add('active');
        };

        window.closeUpdatesEditor = function() {
            document.getElementById('updatesEditorModal').classList.remove('active');
            window.currentEditingUpdatesId = null;
        };

        document.getElementById('btnSaveUpdates').addEventListener('click', async function() {
            const btn = this;
            btn.innerText = '[ 📡 SAVING... ]';
            btn.disabled = true;
            
            try {
                const article = articlesDB.find(a => String(a.id) === String(window.currentEditingUpdatesId));
                if (!article) throw new Error("未找到档案");

                const newUpdates = window.updatesQuill.root.innerHTML.trim();
                
                // 💥 核心：只剔除旧的公告代码，保留职位等其他隐藏数据
                let newContent = article.content
                    .replace(/<div[^>]*data-updates=['"].*?['"][^>]*><\/div>/g, '')
                    .replace(/<div id=['"]hidden-updates-data['"] style=['"]display:none;['"]>[\s\S]*?<\/div>/g, '');
                
                // 注入新的富文本公告
                if (newUpdates && newUpdates !== '<p><br></p>') {
                    newContent += `\n<div id="hidden-updates-data" style="display:none;">${newUpdates}</div>`;
                }

                const { error } = await supabaseClient.from('articles').update({
                    content: newContent,
                    updated_at: new Date().toISOString()
                }).eq('id', article.id);

                if (error) throw error;

                // 更新本地缓存
                article.content = newContent; 
                
                closeUpdatesEditor();
                
                // 瞬间重新渲染详情页
                openArticle(article);
                
            } catch (e) {
                console.error(e);
                SysModal.alert("保存失败，请检查网络。", "ERROR");
            } finally {
                btn.innerText = '[ 保存发布 ]';
                btn.disabled = false;
            }
        });

        /* =========================================================
           💥 手机端：主线剧情卡片手势滑动逻辑 💥
           ========================================================= */
        const plotWrapper = document.getElementById('main-plot-content');
        if (plotWrapper) {
            let touchStartX = 0;
            let touchEndX = 0;

            // 手指按下时记录 X 坐标
            plotWrapper.addEventListener('touchstart', e => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            // 手指抬起时记录 X 坐标，并判断滑动方向
            plotWrapper.addEventListener('touchend', e => {
                touchEndX = e.changedTouches[0].screenX;
                handlePlotSwipe();
            }, { passive: true });

            function handlePlotSwipe() {
                const swipeThreshold = 40; // 滑动距离阈值（像素），超过这个距离才算滑动
                
                if (touchEndX < touchStartX - swipeThreshold) {
                    // 向左滑：看下一页（更【新】的剧情，即当前进度）
                    if (typeof navigatePlot === 'function') navigatePlot(1);
                }
                
                if (touchEndX > touchStartX + swipeThreshold) {
                    // 向右滑：看上一页（更【老】的剧情，即往期内容）
                    if (typeof navigatePlot === 'function') navigatePlot(-1);
                }
            }
        }
        
        // （如果你后续需要为人设表单增加“保存”、“导出图片”等高级功能，代码可以继续写在这里）

        /* =========================================================
           💥 终端安全协议：防审查与防篡改机制 (Anti-DevTools) 💥
           ========================================================= */
        (function initSecurityProtocols() {
            // 1. 禁用右键菜单
            document.addEventListener('contextmenu', function(e) {
                if (typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'super_admin') return;
                e.preventDefault();
            });

            // 2. 禁用 F12 和各种审查快捷键
            document.addEventListener('keydown', function(e) {
                if (typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'super_admin') return;
                
                if (
                    e.keyCode === 123 || 
                    ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
                    ((e.ctrlKey || e.metaKey) && (e.keyCode === 85 || e.keyCode === 83))
                ) {
                    e.preventDefault();
                    SysModal.alert("警告：检测到非法审查指令。\n您的权限级别不足以访问底层源代码。", "SYSTEM ALERT");
                }
            });

            // 2.5 拦截复制操作 (豁免输入框和特定文本)
            document.addEventListener('copy', function(e) {
                if (typeof currentUser !== 'undefined' && currentUser && ['admin', 'super_admin'].includes(currentUser.role)) return;
                
                const tagName = e.target.tagName.toLowerCase();
                const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select' || e.target.isContentEditable;
                const isOpKey = e.target.classList && e.target.classList.contains('op-key-text');
                
                // 如果复制的源头不是输入框，也不是右上角的密钥，直接拦截！
                if (!isInput && !isOpKey) {
                    e.preventDefault();
                    // 静默拦截，不弹窗打扰正常操作
                }
            });

            // 3. 触发红屏死机的方法
            function triggerRedScreen() {
                document.body.innerHTML = `
                    <div style="background:#060b14; height:100vh; width:100vw; position:fixed; top:0; left:0; z-index:999999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#f44336; font-family:monospace; text-align:center; padding: 20px;">
                        <svg viewBox="0 0 24 24" style="width:80px; height:80px; fill:#f44336; margin-bottom:20px; filter: drop-shadow(0 0 15px rgba(244,67,54,0.6));"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                        <h1 style="font-size:32px; margin:0 0 10px 0; letter-spacing:2px; text-shadow: 0 0 10px #f44336;">[ UNAUTHORIZED ACCESS ]</h1>
                        <p style="font-size:16px; color:#ffb4a9;">检测到非法调试行为，终端连接已强制切断。</p>
                        <p style="font-size:12px; color:#666; margin-top:20px;">请关闭开发者工具后刷新页面重试。</p>
                    </div>
                `;
            }

            // 4. 双重探测循环
            setInterval(function() {
                if (typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'super_admin') return;

                // 💥 核心修复：判断是否为移动端设备
                const isMobile = window.innerWidth <= 900 || /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

                // 探测 A：视窗挤压探测 (检测停靠在浏览器边缘的控制台)
                // 💥 手机端浏览器导航栏收缩会导致高度剧变，且手机端无控制台，因此在手机端直接跳过此检测！
                if (!isMobile) {
                    const widthDiff = window.outerWidth - window.innerWidth > 300;
                    const heightDiff = window.outerHeight - window.innerHeight > 300;
                    
                    if (widthDiff || heightDiff) {
                        triggerRedScreen();
                    }
                }

                // 探测 B：时间差冻结探测 (检测独立窗口弹出的控制台)
                const before = new Date().getTime();
                debugger; // 网页在这里会被强制暂停
                const after = new Date().getTime();
                
                // 如果网页被暂停了，时间差会变大
                if (after - before > 100) {
                    triggerRedScreen();
                }
            }, 1000);
        
        /* =========================================================
           💥 视差滚动引擎 (GPU 硬件加速版)
           ========================================================= */
        (function initParallaxEngine() {
            let ticking = false;
            const parallaxGhosts = document.getElementsByClassName('parallax-ghost');
            
            function renderParallax() {
                const scrollY = window.scrollY || window.pageYOffset;
                
                // 1. 星空背景深远视差 (你已经加好的)
                const stars = document.getElementById('stars-container');
                if (stars && window.innerWidth > 768) { 
                    stars.style.transform = `translate3d(0, ${(scrollY * -0.15) % 2000}px, 0)`;
                }

                // 👇👇👇 新增：2. Hero 核心内容全息悬浮视差 👇👇👇
                const heroContent = document.querySelector('.hero-content');
                if (heroContent && scrollY < window.innerHeight) {
                    // 向下滚动时，内容稍微向下偏移，产生“滞后”的悬浮感
                    heroContent.style.transform = `translate3d(0, ${scrollY * 0.25}px, 0)`;
                    // 稍微降低一点透明度，模拟全息投影脱离焦点的感觉
                    heroContent.style.opacity = 1 - (scrollY / window.innerHeight) * 1.2;
                }

                // 👇👇👇 新增：3. 卫星图传的“透视窗”视差 👇👇👇
                const galleryItems = document.querySelectorAll('.gallery-item');
                galleryItems.forEach(item => {
                    const rect = item.getBoundingClientRect();
                    // 如果图片进入了屏幕可视范围
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        // 计算图片中心点偏离屏幕中心的比例 (-1 到 1)
                        const offset = (window.innerHeight / 2 - (rect.top + rect.height / 2)) / window.innerHeight;
                        // 改变背景图的 Y 轴位置，产生“透过窗户看风景”的 3D 错觉
                        item.style.backgroundPositionY = `calc(50% + ${offset * 40}px)`;
                    }
                });

                // 4. 巨型幽灵文字动态视差 
                for (let i = 0; i < parallaxGhosts.length; i++) {
                    const el = parallaxGhosts[i];
                    const rect = el.parentElement.getBoundingClientRect();
                    
                    // 极致省流：只有当该元素的父容器进入屏幕视野时，才进行计算
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        const speed = parseFloat(el.getAttribute('data-speed')) || 0.2;
                        
                        // 核心算法：计算父容器中心点偏离屏幕中心的距离
                        // 这样当元素滚动到屏幕正中央时，偏移恰好为 0，完美对齐
                        const offset = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * speed;
                        
                        // 将算好的偏移量传给 CSS
                        el.style.setProperty('--parallax-y', `${offset}px`);
                    }
                }
                ticking = false;
            }

            // 绑定滚动事件 (使用 requestAnimationFrame 确保动画与屏幕刷新率 120Hz 完美同步)
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    window.requestAnimationFrame(renderParallax);
                    ticking = true;
                }
            }, { passive: true });
        })();
        
        
        })();
