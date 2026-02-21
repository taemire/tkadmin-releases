# TACHYON 서비스 관리

tkctl은 CLI 환경에서 systemd 기반 TACHYON 구성 요소(Kafka, Redis, MariaDB 등)의 시작/정지/재시작을 원활하게 돕습니다.

## 주요 기능
- **전체 서비스 제어**: `service start/stop/restart all`을 통해 의존성에 맞는 올바른 순차 구동 지원
- **선택적 제어**: 개별 컴포넌트(`redis`, `kafka`)만 분리하여 제어 가능
- **상태 및 모니터링 출력**: 현재 서비스 가동률, 리소스 사용 현황(Metrics) 가시화
