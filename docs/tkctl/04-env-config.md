# 환경 설정 및 설정 검증

`tkctl env db`와 같은 명령어를 통해 TACHYON MariaDB 사용 포트, 사용자 계정 등 환경 설정을 단일 콘솔에서 안전하게 통합 관리합니다.

## 설정 변경 (Environment DB Port 등)
- `env db --port <new>`
- 관련 컨피그 동기화 (Backend properties, Nginx streams 자동 갱신 적용)

## `--dry-run` 적용
- 변경이 예상되는 Nginx conf, 시스템 변수들을 미리 검토 (출력 전용)
