/**
 * Docsify 스냅샷 렌더러 플러그인
 *
 * Markdown 문서 내에서 스냅샷을 렌더링합니다.
 *
 * 사용법:
 * ```markdown
 * <!-- snapshot:login-card-light -->
 * ```
 *
 * 또는 테마 전환 지원:
 * ```markdown
 * <!-- snapshot:login-card theme:auto -->
 * ```
 *
 * @version 1.0.0
 */
(function () {
    'use strict';

    // 스냅샷 기본 경로
    const SNAPSHOT_BASE_PATH = 'snapshots/';

    /**
     * 스냅샷 JSON 로드
     * @param {string} snapshotId - 스냅샷 ID
     * @returns {Promise<object|null>}
     */
    async function loadSnapshot(snapshotId) {
        try {
            const response = await fetch(`${SNAPSHOT_BASE_PATH}${snapshotId}.json`);
            if (!response.ok) {
                console.warn(`[SnapshotRenderer] 스냅샷 로드 실패: ${snapshotId}`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`[SnapshotRenderer] 스냅샷 로드 오류: ${snapshotId}`, error);
            return null;
        }
    }

    /**
     * 스냅샷을 DOM으로 렌더링 (XSS 방지)
     * @param {object} snapshot - 스냅샷 JSON
     * @param {HTMLElement} container - 렌더링 대상 컨테이너
     */
    function renderSnapshot(snapshot, container) {
        // 스냅샷 래퍼 생성
        const wrapper = document.createElement('div');
        wrapper.className = 'snapshot-wrapper';
        wrapper.setAttribute('data-snapshot-id', snapshot.id);

        // 메타 정보 헤더
        const header = document.createElement('div');
        header.className = 'snapshot-header';
        header.innerHTML = `
            <span class="snapshot-name">${escapeHtml(snapshot.name)}</span>
            <span class="snapshot-meta">
                ${snapshot.metadata?.hasShadowRoot ? '🔮 Shadow DOM' : '📄 DOM'}
            </span>
        `;
        wrapper.appendChild(header);

        // 콘텐츠 영역
        const content = document.createElement('div');
        content.className = 'snapshot-content';

        // CSS 변수 적용
        if (snapshot.cssVariables) {
            Object.entries(snapshot.cssVariables).forEach(([key, value]) => {
                content.style.setProperty(key, value);
            });
        }

        // Shadow DOM 스타일 삽입
        if (snapshot.shadowDOM && snapshot.shadowDOM.styles) {
            const styleTag = document.createElement('style');
            styleTag.textContent = snapshot.shadowDOM.styles
                .map(s => s.scopedCSS || s.cssText)
                .join('\n');
            content.appendChild(styleTag);
        }

        // HTML 콘텐츠 삽입 (DOMParser로 안전하게)
        const htmlContent = snapshot.shadowDOM?.flattenedHTML || snapshot.html;
        if (htmlContent) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            // <script> 태그 제거 (보안)
            doc.querySelectorAll('script').forEach(el => el.remove());

            // 안전한 노드만 삽입
            while (doc.body.firstChild) {
                content.appendChild(doc.body.firstChild);
            }
        }

        wrapper.appendChild(content);
        container.appendChild(wrapper);
    }

    /**
     * HTML 이스케이프
     * @param {string} text
     * @returns {string}
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 현재 테마 감지
     * @returns {string} 'light' | 'dark'
     */
    function getCurrentTheme() {
        if (document.body.getAttribute('data-theme') === 'dark') {
            return 'dark';
        }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Docsify 플러그인 훅
     */
    function snapshotRendererPlugin(hook, vm) {
        // 페이지 로드 후 스냅샷 렌더링
        hook.doneEach(function () {
            // <!-- snapshot:ID --> 형식의 주석 찾기
            const content = document.querySelector('.markdown-section');
            if (!content) return;

            // TreeWalker로 주석 노드 수집
            const comments = [];
            const walker = document.createTreeWalker(
                content,
                NodeFilter.SHOW_COMMENT,
                null,
                false
            );

            let node;
            while ((node = walker.nextNode())) {
                const match = node.textContent.trim().match(/^snapshot:([a-zA-Z0-9-]+)(?:\s+theme:(auto|light|dark))?$/);
                if (match) {
                    comments.push({
                        node: node,
                        baseId: match[1],
                        themeMode: match[2] || 'light'
                    });
                }
            }

            // 각 스냅샷 렌더링
            comments.forEach(async ({ node, baseId, themeMode }) => {
                // 테마 결정
                let snapshotId;
                if (themeMode === 'auto') {
                    snapshotId = `${baseId}-${getCurrentTheme()}`;
                } else {
                    snapshotId = `${baseId}-${themeMode}`;
                }

                // 스냅샷 로드
                const snapshot = await loadSnapshot(snapshotId);
                if (!snapshot) {
                    // 플레이스홀더 표시
                    const placeholder = document.createElement('div');
                    placeholder.className = 'snapshot-placeholder';
                    placeholder.innerHTML = `
                        <span>📭 스냅샷을 찾을 수 없습니다: ${escapeHtml(snapshotId)}</span>
                    `;
                    node.parentNode.replaceChild(placeholder, node);
                    return;
                }

                // 컨테이너 생성 및 렌더링
                const container = document.createElement('div');
                container.className = 'snapshot-container';
                renderSnapshot(snapshot, container);

                // 주석 노드 교체
                node.parentNode.replaceChild(container, node);
            });
        });
    }

    // 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
        .snapshot-container {
            margin: 20px 0;
            border: 1px solid var(--border-color, #eee);
            border-radius: 8px;
            overflow: hidden;
            background: var(--bg-secondary, #f9f9f9);
        }

        .snapshot-wrapper {
            background: var(--bg-primary, white);
        }

        .snapshot-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background: var(--bg-tertiary, #f0f0f0);
            border-bottom: 1px solid var(--border-color, #eee);
            font-size: 0.9em;
        }

        .snapshot-name {
            font-weight: 600;
            color: var(--text-primary, #333);
        }

        .snapshot-meta {
            font-size: 0.85em;
            color: var(--text-secondary, #666);
        }

        .snapshot-content {
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100px;
        }

        .snapshot-placeholder {
            padding: 40px;
            text-align: center;
            color: var(--text-secondary, #999);
            background: var(--bg-secondary, #f5f5f5);
            border-radius: 8px;
            margin: 20px 0;
        }

        /* 다크 모드 지원 */
        [data-theme="dark"] .snapshot-container {
            border-color: #333;
            background: #1a1a1a;
        }

        [data-theme="dark"] .snapshot-wrapper {
            background: #0d1117;
        }

        [data-theme="dark"] .snapshot-header {
            background: #21262d;
            border-color: #333;
        }
    `;
    document.head.appendChild(style);

    // Docsify 플러그인 등록
    if (window.$docsify) {
        window.$docsify.plugins = [].concat(
            snapshotRendererPlugin,
            window.$docsify.plugins || []
        );
    } else {
        window.$docsify = {
            plugins: [snapshotRendererPlugin]
        };
    }

    console.log('[SnapshotRenderer] 플러그인 로드 완료');
})();
