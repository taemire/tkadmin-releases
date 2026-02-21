# 설정 파일 레퍼런스

tkadmin의 모든 설정은 `tkadmin.yml` 파일을 통해 관리됩니다. 본 문서는 설정 파일의 전체 옵션과 환경 탐색(Discovery) 전략을 상세히 설명합니다.

---

## 설정 파일 경로

설정 파일은 바이너리와 동일한 디렉토리에 위치하며, 바이너리 이름에 기반하여 자동 결정됩니다.

- 기본 경로: `/usr/local/TACHYON/TTS40/tkadmin.yml`
- 결정 규칙: 실행 파일명에서 확장자를 제거한 뒤 `.yml`을 붙여 동일 디렉토리에서 탐색

설정 파일이 존재하지 않으면 내장된 기본값이 사용되며, 웹 UI를 통해 저장하면 파일이 자동 생성됩니다.

---

## 전체 설정 옵션

### 기본 설정

| 키 | 설명 | 기본값 | 허용 범위 | 재시작 필요 |
|----|------|--------|-----------|------------|
| `target_dir` | TACHYON 설치 경로 | `/usr/local/TACHYON/TTS40/` | 유효한 디렉토리 경로 | 예 |
| `listen_addr` | 서버 바인딩 주소 | `0.0.0.0` | 유효한 IP 주소 | 예 |
| `port` | 메인 서버 포트 | `13700` | 1024 ~ 65535 | 예 |
| `recovery_port` | Recovery Mode 서버 포트 | `port + 1` (13701) | 1024 ~ 65535 | 예 |
| `solution_name` | 솔루션 표시 이름 | `TACHYON Admin` | 임의 문자열 | 아니오 |
| `debug` | 디버그 모드 활성화 | `false` | `true` / `false` | 아니오 |

### 보안 설정

| 키 | 설명 | 기본값 | 허용 범위 | 재시작 필요 |
|----|------|--------|-----------|------------|
| `emergency_ips` | Recovery Mode 접근 허용 IP 목록 | `[]` (빈 배열) | IP 주소 문자열 배열 | 아니오 |
| `show_link` | TACHYON 대시보드 tkadmin 메뉴 표시 여부 | `false` | `true` / `false` | 아니오 |
| `allowed_ids` | tkadmin 메뉴가 표시될 TACHYON 사용자 ID 목록 | `["tsadmin"]` | 문자열 배열 | 아니오 |

### 로깅 설정

| 키 | 설명 | 기본값 | 허용 범위 | 재시작 필요 |
|----|------|--------|-----------|------------|
| `log_path` | 로그 파일 경로 (레거시) | `logs/tkadmin.log` | 유효한 파일 경로 | 예 |
| `logging.level` | 로그 출력 레벨 | `info` | `debug`, `info`, `warn`, `error` | 아니오 |
| `logging.file` | 로그 파일 경로 | `logs/tkadmin.log` | 유효한 파일 경로 (파일명 포함 필수) | 예 |
| `logging.max_size` | 로그 파일 최대 크기 (바이트) | `10485760` (10MB) | 양의 정수 | 아니오 |
| `logging.max_backups` | 보관할 로그 백업 파일 수 | `5` | 0 이상 정수 | 아니오 |
| `logging.max_age` | 로그 보존 기간 (일) | `30` | 0 이상 정수 | 아니오 |
| `logging.compress` | 로그 백업 파일 GZIP 압축 | `true` | `true` / `false` | 아니오 |

### 감사 로그 설정

| 키 | 설명 | 기본값 | 허용 범위 | 재시작 필요 |
|----|------|--------|-----------|------------|
| `audit_log_retention_days` | 감사 로그 보존 기간 (일) | `0` (영구 보존) | 0 이상 정수 | 아니오 |

---

## 설정 파일 전체 예시

```yaml
# tkadmin 설정 파일
target_dir: "/usr/local/TACHYON/TTS40/"
listen_addr: "0.0.0.0"
port: 13700
recovery_port: 13701
solution_name: "TACHYON Admin"
debug: false

# 보안 설정
emergency_ips:
  - "10.10.1.100"
  - "192.168.1.50"
show_link: true
allowed_ids:
  - "tsadmin"
  - "operator01"

# 감사 로그 보존 기간 (0 = 영구 보존)
audit_log_retention_days: 90

# 로깅 설정
logging:
  level: "info"
  file: "logs/tkadmin.log"
  max_size: 10485760       # 10MB (바이트 단위)
  max_backups: 5
  max_age: 30              # 30일
  compress: true
```

---

## 주요 설정 항목 상세

### port

메인 HTTP 서버가 바인딩하는 포트 번호입니다.

- **기본값**: `13700`
- 포트를 변경하면 NGINX `proxy_pass` 설정도 자동으로 동기화됩니다.
- 포트 변경 시 반드시 서비스를 재시작해야 합니다.

?> **팁**: 웹 UI에서 포트를 변경하고 저장하면, NGINX 설정이 자동으로 업데이트되고 재시작 확인 대화상자가 표시됩니다.

### recovery_port

Recovery Mode 서버가 바인딩하는 포트 번호입니다.

- **기본값**: `port + 1` (메인 포트가 13700이면 13701)
- Recovery 서버는 메인 서버와 독립적으로 동작하는 별도의 Gin 인스턴스입니다.
- Linux 환경에서만 구동됩니다.

### emergency_ips

Recovery Mode 접근이 허용되는 IP 주소 목록입니다.

- **기본값**: 빈 배열 `[]`
- `localhost`(127.0.0.1, ::1)는 항상 자동 허용됩니다.
- 이 목록에 없는 IP에서 Recovery 포트에 접근하면 403 Forbidden 페이지가 표시됩니다.
- 메인 서버의 인증 우회(Emergency Bypass)에도 동일한 IP 목록이 사용됩니다.

### show_link / allowed_ids

TACHYON 대시보드에서 tkadmin 메뉴 표시를 제어합니다.

- `show_link: true` 설정 시 인젝터 스크립트를 통해 TACHYON 대시보드에 tkadmin 메뉴가 표시됩니다.
- `allowed_ids`에 포함된 사용자 ID로 로그인한 경우에만 메뉴가 보입니다.
- 이 설정들은 인증 없이 접근 가능한 `/tkadmin/api/nav-config` API를 통해 인젝터 스크립트에 전달됩니다.

### logging

구조화된 로깅 시스템(Zap + Lumberjack)의 동작을 제어합니다.

- **로그 엔진**: go.uber.org/zap (고성능 구조화 JSON 로깅)
- **로테이션 엔진**: gopkg.in/natefinsh/lumberjack.v2
- 콘솔(컬러 인쇄)과 파일에 동시 출력됩니다.

!> **주의**: `logging.file` 값이 빈 문자열이거나 디렉토리 경로만 지정되면 치명적 버그가 발생할 수 있습니다. 반드시 파일명을 포함한 경로를 설정하세요.

---

## 환경 탐색(Discovery) 우선순위

tkadmin은 고정 설정에 의존하지 않고, TACHYON 서버의 운영 환경 정보를 동적으로 탐색하여 연결 정보를 결정합니다.

### 우선순위 체계

| 우선순위 | 레벨 | 소스 | 설명 |
|----------|------|------|------|
| 1 | **Level 1 (Direct)** | CLI 인자(Flags) | 실행 시 명령줄로 명시된 설정값 |
| 2 | **Level 2 (Discovery)** | 운영 파일 크롤링 | `app_info.properties_dev`, `*.yml_dev` 등에서 습득한 최신 정보 |
| 3 | **Level 3 (Internal Default)** | 소스 코드 내장 상수 | 바이너리 내 하드코딩된 기본값 (최후의 Fallback) |

### 탐색 대상 파일

- `conf/app_info.properties_dev`: 라이선스, DB 접속 정보, Redis 설정 등 핵심 메타데이터
- `*.yml_dev`: 각 마이크로서비스별 세부 연결 및 포트 정보

### 탐색 경로

TACHYON 설치 루트(`target_dir`) 하위의 다음 디렉토리를 탐색합니다:

- `conf/`: 공통 설정 파일 (Global 분류)
- `dist/`: 서비스 배포 디렉토리
- 기타 서비스 하위 디렉토리 (Service 분류)

### 설계 기조

| 원칙 | 설명 |
|------|------|
| **운영 환경 인지(Env-Aware)** | Redis 비밀번호 변경 등 환경 변화를 사용자 개입 없이 자동 감지 |
| **안정한 실행 보장** | 설정 파일이 훼손되거나 없어도 내장 Fallback으로 최소 관리 기능 유지 |
| **자동 동기화** | 환경 정보를 메모리에 캐싱하되, 주기적으로 재스캔하여 변경 사항 반영 |

?> **팁**: `tkadmin.yml` 설정 파일이 삭제되거나 손상되더라도 tkadmin은 내장 기본값과 운영 환경 크롤링을 통해 정상적으로 구동됩니다. 이는 극한의 장애 상황에서도 관리 도구의 가용성을 보장하기 위한 설계입니다.
