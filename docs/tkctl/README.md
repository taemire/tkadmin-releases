# tkctl 릴리즈 노트 가이드 (Release Note Guide)

본 문서는 `taemire/tkadmin-releases` 리포지토리에 배포되는 `tkctl`(구 tkcli)의 릴리즈 내역을 자동으로 파싱하고 관리하기 위한 가이드입니다.

## 1. 릴리즈 리포지토리 구성
- **Repository**: `taemire/tkadmin-releases` (Public)
- **GitHub Pages**: `https://taemire.github.io/tkadmin-releases/`
- **목적**: 
  - 정규 릴리즈 바이너리(Linux/Windows) 배포
  - `tkctl` 전용 온라인 사용자 메뉴얼 호스팅
  - 릴리즈 히스토리 및 변경 사항(Changelog) 자동 게시

## 2. 릴리즈 자동화 워크플로우 (release.yml)
`.github/workflows/release.yml`은 다음 과정을 수행합니다:
1. **정적 빌드**: `CGO_ENABLED=0` 환경에서 리눅스/윈도우 바이너리 생성
2. **자산 통합**: 바이너리 + PDF 메뉴얼 + 통합 CHANGELOG 결합
3. **업로드**: GitHub Release 자산으로 등록

## 3. tkctl 전용 메뉴얼 통합
- **경로**: `docs/tkctl/manual/`
- **구조**:
  - `README.md`: tkctl 도구 개요 및 설치
  - `01-backup-restore.md`: 백업 및 복원 가이드
  - `02-service-management.md`: 서비스 제어 및 상태 확인
  - `03-env-config.md`: 환경 설정 및 DB 포트 관리
  - `04-security-check.md`: 보안 점검 및 자동 조치
  - `05-troubleshooting.md`: 주요 에러 코드 및 해결 방안

## 4. 버전 관리 (Semantic Versioning)
- `VERSION` 파일을 유일한 SSOT(Single Source of Truth)로 사용하여 `tkadmin`과 `tkctl`의 버전을 동기화합니다.
- 태그 푸시 (`git tag v0.9.0 && git push origin v0.9.0`) 시점에 릴리즈가 트리거됩니다.
