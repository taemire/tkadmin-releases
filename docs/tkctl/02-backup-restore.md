# 시스템 백업 및 복원

이 문서는 `tkctl`을 활용한 MariaDB 단편화, 증분 백업 및 OpenSearch 인덱스/스냅샷 관리 기능을 안내합니다.

## MariaDB
- `backup mariadb --type full`: 전체 백업
- `backup mariadb --type config`: 설정 파일 백업
- `restore mariadb`: 설정 및 데이터 복구

## OpenSearch
- 스냅샷 생성 및 ILM 정책 적용 가이드
