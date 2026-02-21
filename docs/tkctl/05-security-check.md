# 시스템 보안 점검 (Fix-Security)

`tkctl fix-security`는 시스템 보안 강화를 위해 TACHYON 운영체제의 잠재적인 보안 취약점을 점검하고, 필요한 시스템 파일 및 계정 권한(Permissions)을 수정합니다.

## 옵션 가이드
- `--report` : 리소스, 설정 정책 변경이 필요한 파일 목록 점검 및 표시
- `--apply` : 실제 정책 업데이트 실행
- `--interactive` : 항목별 선택에 따른 점검 및 조치 (부분 선택 제공)
