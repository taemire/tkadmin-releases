# tkadmin

`tkadmin`은 TACHYON 솔루션의 고성능 설정 관리 및 운영 자동화 도구입니다.  
복잡한 서버 환경 설정을 웹 인터페이스를 통해 직관적으로 제어하며, 단일 바이너리 배포를 지원합니다.

## 🔗 Quick Links

- **최신 릴리즈**: [🚀 GitHub Releases](https://github.com/taemire/tkadmin-releases/releases)
- **온라인 매뉴얼**: [📖 문서 포털 (Portal)](https://taemire.github.io/tkadmin-releases/docs/)

---

## 📥 다운로드

**[Releases 페이지](https://github.com/taemire/tkadmin-releases/releases)** 에서 최신 버전을 다운로드하세요.

### 포함 파일

| 파일 | 설명 |
|------|------|
| `tkadmin` | tkadmin Linux amd64 바이너리 |
| `tkctl` | tkctl Linux amd64 바이너리 |
| `tkadmin_*.zip` | 릴리즈 아카이브 (tkadmin + tkctl 통합 패키지) |
| `TKADMIN_USER_MANUAL_*.pdf` | 운영자 매뉴얼 (PDF 버전) |
| `TKCTL_USER_MANUAL_*.pdf` | CLI (tkctl) 매뉴얼 (PDF 버전) |

## 📖 온라인 사용자 매뉴얼

**[온라인 사용자 매뉴얼 보기 →](https://taemire.github.io/tkadmin-releases/docs/)**

tkadmin + tkctl 통합 매뉴얼을 온라인에서 바로 확인할 수 있습니다.  
바이너리 내에도 동일한 매뉴얼이 내장되어 있어, 폐쇄망 환경에서도 `http://<서버>:<포트>/tkadmin/docs/`로 접근 가능합니다.

## 🚀 설치

```bash
# 다운로드 후 실행 권한 부여
chmod +x tkadmin tkctl

# 시스템 경로에 설치
sudo mkdir -p /usr/local/tkadmin/bin
sudo mv tkadmin tkctl /usr/local/tkadmin/bin/

# 서비스 등록
sudo /usr/local/tkadmin/bin/tkadmin -i
```

---

## ✨ 주요 특징

- **단일 바이너리**: 모든 웹 리소스 내장, 외부 의존성 없이 실행
- **환경 자동 탐색**: Redis, MariaDB, OpenSearch 등 자동 연결
- **Phoenix UI**: 다크 모드 Glassmorphism 기반 고성능 인터페이스
- **Auth Bridge**: TACHYON SPA 세션과 자동 연동, 별도 로그인 불필요
- **Watchdog & Alert**: 실시간 장애 감지, 자동 복구 및 관리자 알림
- **SSE 실시간 Push**: Server-Sent Events 기반 대시보드 실시간 갱신 (CPU 부하 79% 절감)
- **표준 런타임 관리**: 리눅스 표준 전술에 일치하는 `/run/tkadmin` PID 관리 및 `conf/` 설정 체계 도입
- **쿼리마법사**: MariaDB + OpenSearch 듀얼엔진 쿼리 실행, NDJSON 스트리밍, VirtualTable 가상 스크롤, 커서 페이지네이션
- **리포트마법사**: DnD 위자드 기반 커스텀 리포트 빌더 (49종 로그 카탈로그, 코드 자동 해석, Excel/PDF 내보내기, 템플릿 관리)
- **tkctl 통합**: 내장 CLI를 통한 한 줄 설치·삭제·운영 자동화
- **오프라인 매뉴얼**: Docusaurus 기반, 폐쇄망 환경에서도 100% 동작

## 🛠 기술 스택

- **Backend**: Go (Gin Web Framework)
- **Frontend**: Vanilla JS (Web Components) + Vanilla CSS
- **Database/Middleware**: MariaDB, Redis, OpenSearch, Kafka 연동
- **Documentation**: Docusaurus (오프라인 내장) + Live UI Mockup 렌더러

## 🏗 프로젝트 구조

```text
tkadmin/
├── cmd/
│   ├── tkadmin/            # tkadmin 서버 엔트리포인트
│   └── tkctl/              # tkctl CLI 엔트리포인트
├── internal/
│   ├── api/                # REST API 핸들러, SSE 스트림 및 라우팅
│   ├── auth/               # OS 계정 인증 (Recovery Mode)
│   ├── backup/             # 백업 스케줄러
│   ├── config/             # 환경 정보 탐색 및 설정 관리
│   ├── db/                 # SQLite 데이터베이스 연결
│   ├── dbconsole/          # DB 쿼리 실행 엔진 (MariaDB + OpenSearch 듀얼엔진, 스트리밍, 페이지네이션)
│   ├── deploy/             # 시스템 서비스 제어, tkctl 자가 치유
│   ├── logger/             # Zap 구조화 로깅
│   ├── querywizard/        # 쿼리마법사 + 리포트마법사 (JDBC 드라이버, 리포트 빌더)
│   ├── systemd/            # Watchdog, cgroup v2 직접 읽기
│   └── tkctl/              # tkctl CLI 클라이언트 핵심 로직
├── web/
│   ├── static/             # CSS, JS, Assets
│   ├── templates/          # HTML 템플릿
│   └── docusaurus/         # Docusaurus 사용자 매뉴얼 (go:embed 내장)
│       ├── tkadmin/        # 운영자 메뉴얼
│       └── tkctl/          # CLI 가이드
└── .github/workflows/
    ├── ci.yml              # 빌드 및 테스트 자동화
    ├── release.yml         # 바이너리 릴리즈 자동화
    └── deploy-docs.yml     # 온라인 매뉴얼 배포 자동화
```

## 📦 빌드

```bash
# Linux 빌드
./build.sh

# 빌드 옵션
./build.sh -d    # 매뉴얼 검증 + PDF 생성
./build.sh -t    # 테스트 실행
```

## 📜 개발 수칙

이 프로젝트는 엄격한 개발 수칙([.agent/rules.md](.agent/rules.md))을 준수합니다.
- **TDD 지향**: 중요 기능 수정 시 테스트 선행
- **문서화**: 코드 변경 시 `IMPLEMENTATION_SPEC.md`, `CHANGELOG.md` 즉시 갱신
- **언어 준수**: 모든 커밋 메시지와 문서는 **한국어**로 작성

---

© 2025–2026 TACHYON Incasys. All rights reserved.
