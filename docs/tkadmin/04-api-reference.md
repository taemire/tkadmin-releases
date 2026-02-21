# API 레퍼런스

tkadmin이 제공하는 REST API의 전체 목록과 사용 방법을 설명합니다.

---

## 공통 사항

| 항목 | 설명 |
|------|------|
| **Base Path** | `/tkadmin/api/` |
| **인증 (메인)** | `tk_session` 쿠키 (TACHYON Auth Bridge) |
| **인증 (Recovery)** | `tk_recovery` 쿠키 (OS 계정 인증) |
| **인증 우회** | localhost 및 `emergency_ips` 목록의 IP는 인증 없이 접근 가능 |
| **응답 형식** | JSON (`Content-Type: application/json`) |
| **에러 응답** | `{"error": "에러 메시지"}` 형식 |

### 인증 흐름

1. **쿠키 확인**: `tk_session` 쿠키가 없으면 `/tkadmin/bridge`로 리다이렉트
2. **JWT 검증**: 쿠키의 JWT 토큰 유효성 검증
3. **Redis 세션 확인**: Redis에서 `TOKEN:GUID` 키로 실제 세션 존재 여부 확인
4. **세션 만료 시**: 쿠키 삭제 후 `/user/login?reason=expired`로 리다이렉트

---

### GET /tkadmin/api/stream (SSE)

서비스 상태, 시스템 리소스, 라이선스 정보를 실시간으로 Push합니다. SSE(Server-Sent Events) 프로토콜을 사용합니다.

**요청:**

```bash
curl -b "tk_session=<TOKEN>" -N https://서버주소/tkadmin/api/stream
```

**응답 형식:** `text/event-stream`

**이벤트 데이터:** `/tkadmin/api/status`와 동일한 JSON 구조가 `data:` 필드로 전송됩니다.

**동작 상세:**

| 항목 | 설명 |
|------|------|
| **연결 시** | 즉시 현재 상태 데이터를 1회 전송 |
| **변경 감지** | 5초 주기로 서버 상태를 체크하여 변경 시에만 Push |
| **Heartbeat** | 30초마다 SSE 주석(`: heartbeat`)을 전송하여 연결 유지 |
| **HTTP 헤더** | `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no` |

**이벤트 예시:**

```
data: {"services":[{"name":"TACHYON-Api1","status":"active","sub_state":"running","pid":"12345","cpu":"2.3","memory":"156.7"}],"system":{"cpu_usage":15.2},"version":"0.2.0","last_checked":"2026-02-18 17:50:00"}

: heartbeat

data: {"services":[...],"system":{"cpu_usage":16.8},...}
```

?> **팁**: SSE 연결은 브라우저의 `EventSource` API를 사용하여 자동으로 재연결됩니다. 네트워크 문제 시 3회 실패 후 5초 폴링으로 자동 전환됩니다.

---

### GET /tkadmin/api/status

서비스 상태, 설정 요약, 라이선스 정보, 시스템 리소스를 통합 조회합니다.

**요청:**

```bash
curl -b "tk_session=<TOKEN>" https://서버주소/tkadmin/api/status
```

**응답 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `services` | Array | TACHYON 서비스 상태 목록 (이름, 상태, PID, CPU, 메모리) |
| `config_summary` | String | 솔루션 이름 |
| `license` | Object | 라이선스 정보 (company, code, agents) |
| `system` | Object | 시스템 리소스 (CPU, 메모리, 디스크) |
| `version` | String | tkadmin 버전 |
| `last_checked` | String | 마지막 체크 시간 (YYYY-MM-DD HH:MM:SS) |

**응답 예시:**

```json
{
  "services": [
    {
      "name": "TACHYON-Api1",
      "status": "active",
      "sub_state": "running",
      "pid": "12345",
      "cpu": "2.3",
      "memory": "156.7"
    }
  ],
  "config_summary": "TACHYON Admin",
  "license": {
    "company": "주식회사 예시",
    "code": "COMP001",
    "agents": "5000"
  },
  "system": {
    "cpu_usage": 15.2,
    "memory_total": 16384,
    "memory_used": 8192,
    "disk_total": 500000,
    "disk_used": 250000
  },
  "version": "0.1.5.142",
  "last_checked": "2025-12-20 14:30:00"
}
```

---

### GET /tkadmin/api/system/stats

시스템 리소스 통계(CPU, 메모리, 디스크)를 조회합니다.

**요청:**

```bash
curl -b "tk_session=<TOKEN>" https://서버주소/tkadmin/api/system/stats
```

**응답:** 시스템 리소스 객체 (CPU 사용률, 메모리 총량/사용량, 디스크 총량/사용량, 업타임 등)

---

### GET /tkadmin/api/services

TACHYON 서비스 목록 및 리소스 사용 현황을 조회합니다.

**요청:**

```bash
curl -b "tk_session=<TOKEN>" https://서버주소/tkadmin/api/services
```

**응답:** 서비스 상태 배열 (각 서비스의 이름, 활성 상태, PID, CPU/메모리 사용량)

---

## 설정 관리

### GET /tkadmin/api/config

현재 tkadmin 설정을 조회합니다.

**요청:**

```bash
curl -b "tk_session=<TOKEN>" https://서버주소/tkadmin/api/config
```

**응답 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `target_dir` | String | TACHYON 설치 경로 |
| `listen_addr` | String | 서버 바인딩 주소 |
| `port` | Integer | 메인 서버 포트 |
| `solution_name` | String | 솔루션 표시 이름 |
| `emergency_ips` | Array | Recovery 접근 허용 IP 목록 |
| `log_path` | String | 로그 파일 경로 |
| `debug` | Boolean | 디버그 모드 여부 |
| `show_link` | Boolean | TACHYON 대시보드 메뉴 표시 여부 |
| `allowed_ids` | Array | 메뉴 표시 허용 사용자 ID 목록 |
| `client_ip` | String | 요청자의 현재 IP (편의 제공) |

**응답 예시:**

```json
{
  "target_dir": "/usr/local/TACHYON/TTS40/",
  "listen_addr": "0.0.0.0",
  "port": 13700,
  "solution_name": "TACHYON Admin",
  "emergency_ips": ["10.10.1.100"],
  "log_path": "logs/tkadmin.log",
  "debug": false,
  "show_link": true,
  "allowed_ids": ["tsadmin"],
  "client_ip": "10.10.1.100"
}
```

---

### POST /tkadmin/api/config

tkadmin 설정을 변경합니다. 설정은 `tkadmin.yml` 파일에 저장됩니다.

**요청:**

```bash
curl -b "tk_session=<TOKEN>" \
  -X POST https://서버주소/tkadmin/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "target_dir": "/usr/local/TACHYON/TTS40/",
    "port": 13700,
    "solution_name": "TACHYON Admin",
    "emergency_ips": ["10.10.1.100"],
    "show_link": true,
    "allowed_ids": ["tsadmin", "operator01"]
  }'
```

**응답 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `message` | String | 처리 결과 메시지 |
| `will_restart` | Boolean | 포트 변경으로 인해 재시작이 필요한지 여부 |

**응답 예시 (포트 변경 시):**

```json
{
  "message": "설정이 저장되었습니다. 포트 변경을 적용하려면 서비스를 재시작해주세요.",
  "will_restart": true
}
```

**응답 예시 (포트 미변경 시):**

```json
{
  "message": "설정이 저장되었습니다.",
  "will_restart": false
}
```

?> **팁**: 설정 저장 시 NGINX `proxy_pass` 포트가 자동으로 동기화됩니다.

---

### POST /tkadmin/api/config/restart

tkadmin 서비스를 재시작합니다. 내부적으로 `systemctl restart tkadmin` 명령을 실행합니다.

**요청:**

```bash
curl -b "tk_session=<TOKEN>" \
  -X POST https://서버주소/tkadmin/api/config/restart
```

**응답:**

```json
{
  "message": "서비스가 재시작됩니다."
}
```

!> **주의**: 재시작 요청 후 1초의 지연을 두고 서비스가 재시작됩니다. 재시작 완료까지 일시적으로 서비스에 접근할 수 없습니다.

---

### GET /tkadmin/api/nav-config

TACHYON 대시보드 인젝터용 네비게이션 설정을 조회합니다. 이 API는 **인증 없이** 접근 가능합니다.

**요청:**

```bash
curl https://서버주소/tkadmin/api/nav-config
```

**응답 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `show_link` | Boolean | 메뉴 표시 여부 |
| `allowed_ids` | Array | 메뉴 표시 허용 사용자 ID 목록 |

**응답 예시:**

```json
{
  "show_link": true,
  "allowed_ids": ["tsadmin"]
}
```

---

## 외부 파일 편집

### GET /tkadmin/api/config/external/files

TACHYON 설치 경로 하위의 편집 가능한 설정 파일 목록을 조회합니다.

**요청:**

```bash
curl -b "tk_session=<TOKEN>" https://서버주소/tkadmin/api/config/external/files
```

**응답:** 설정 파일 배열 (각 파일의 상대 경로, 카테고리(global/service/system), 최종 수정 시간)

탐색 대상 파일 패턴: `.yml`, `.yml_dev`, `.properties`, `.properties_dev`, `.json`, `.conf` (Nginx)

제외 디렉토리: `.git`, `node_modules`, `logs`, `temp`, `backup`, `dist`

---

### GET /tkadmin/api/config/external/file

특정 설정 파일의 내용을 조회합니다.

**요청 파라미터:**

| 파라미터 | 위치 | 필수 | 설명 |
|----------|------|------|------|
| `path` | Query | 예 | 파일의 상대 경로 (target_dir 기준) |

**요청:**

```bash
curl -b "tk_session=<TOKEN>" \
  "https://서버주소/tkadmin/api/config/external/file?path=conf/app_info.properties_dev"
```

**응답 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `path` | String | 파일 상대 경로 |
| `content` | String | 파일 내용 |

**보안 제한:**

- `..`이 포함된 경로는 차단됩니다 (Path Traversal 방지).
- `/` 또는 `\`로 시작하는 절대 경로는 차단됩니다.

---

### POST /tkadmin/api/config/external/file

설정 파일의 내용을 저장합니다.

**요청 본문:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `path` | String | 예 | 파일의 상대 경로 |
| `content` | String | 예 | 저장할 파일 내용 |

**요청:**

```bash
curl -b "tk_session=<TOKEN>" \
  -X POST https://서버주소/tkadmin/api/config/external/file \
  -H "Content-Type: application/json" \
  -d '{
    "path": "conf/app_info.properties_dev",
    "content": "# 수정된 설정 내용\nkey=value"
  }'
```

**응답:**

```json
{
  "message": "설정이 성공적으로 저장되었습니다."
}
```

**동작 상세:**

1. **보안 검사**: Path Traversal 차단 (`..`, `/`, `\` 시작 경로)
2. **구문 검증**: `.yml` / `.yml_dev` 파일은 YAML 문법 유효성을 검사한 후 저장
3. **자동 백업**: 기존 파일을 `*.YYYYMMDDHHMMSS.bak` 형식으로 백업
4. **감사 로그**: 변경 이력이 감사 로그에 기록됨

**에러 응답 예시 (YAML 문법 오류):**

```json
{
  "error": "YAML 문법 오류: yaml: line 5: did not find expected key"
}
```

---

## 서비스 제어

### POST /tkadmin/api/service/:action

TACHYON 서비스의 시작/중지/재시작을 제어합니다.

**경로 파라미터:**

| 파라미터 | 설명 |
|----------|------|
| `:action` | 수행할 작업: `start`, `stop`, `restart` |

**요청 파라미터:**

| 파라미터 | 위치 | 필수 | 설명 |
|----------|------|------|------|
| `service` | Query | 아니오 | 서비스 이름 (기본값: `tachyon-shield`) |

**요청:**

```bash
# TACHYON-Api1 서비스 재시작
curl -b "tk_session=<TOKEN>" \
  -X POST "https://서버주소/tkadmin/api/service/restart?service=TACHYON-Api1"

# 기본 서비스 중지
curl -b "tk_session=<TOKEN>" \
  -X POST https://서버주소/tkadmin/api/service/stop
```

**응답:**

```json
{
  "message": "Service restarted successfully"
}
```

내부적으로 `systemctl <action> <service>` 명령을 실행하며, Watchdog이 의도적인 동작으로 인식하도록 기록합니다.

---

### POST /tkadmin/api/monitor/report

외부 CLI 도구(tkcli 등)에서 수행한 서비스 제어 결과를 보고합니다.

**요청 본문:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `service` | String | 예 | 서비스 이름 |
| `action` | String | 예 | 수행된 작업 (`start`, `stop`, `restart`) |
| `status` | String | 예 | 결과 (`success`, `fail`, `pending`) |
| `source` | String | 예 | 보고 주체 (예: `tkcli`) |

**요청:**

```bash
curl -b "tk_session=<TOKEN>" \
  -X POST https://서버주소/tkadmin/api/monitor/report \
  -H "Content-Type: application/json" \
  -d '{
    "service": "TACHYON-Api1",
    "action": "restart",
    "status": "success",
    "source": "tkcli"
  }'
```

**응답:**

```json
{
  "message": "External action reported successfully"
}
```

**동작 상세:**

- `status`가 `pending`인 경우: 의도적 동작만 기록하고 반환 (Watchdog 알림 억제용)
- `status`가 `success`인 경우: `RECOVERY_SUCCESS` 타입 알림으로 등록
- `status`가 `fail`인 경우: `RECOVERY_FAILED` 타입 알림으로 등록

---

## 알림 / 감사 로그

### GET /tkadmin/api/alerts

Watchdog 감지 이벤트 및 외부 보고 알림 목록을 조회합니다.

**요청:**

```bash
curl -b "tk_session=<TOKEN>" https://서버주소/tkadmin/api/alerts
```

**응답:** 알림 배열 (각 알림의 ID, 시간, 서비스명, 유형, 메시지, 복구 여부, 읽음 상태)

알림 유형:

| 유형 | 설명 |
|------|------|
| `FAILURE` | 서비스 장애 감지 |
| `RECOVERY_SUCCESS` | 서비스 복구 성공 |
| `RECOVERY_FAILED` | 서비스 복구 실패 |
| `CONFIG_UPDATE` | 설정 파일 변경 |

---

### GET /tkadmin/api/alerts/unread

미읽음 알림 수를 조회합니다.

**요청:**

```bash
curl -b "tk_session=<TOKEN>" https://서버주소/tkadmin/api/alerts/unread
```

**응답:**

```json
{
  "unread_count": 3
}
```

---

### POST /tkadmin/api/alerts/read

모든 미읽음 알림을 읽음으로 처리합니다.

**요청:**

```bash
curl -b "tk_session=<TOKEN>" \
  -X POST https://서버주소/tkadmin/api/alerts/read
```

**응답:**

```json
{
  "message": "All alerts marked as read"
}
```

---

### GET /tkadmin/api/alerts/:id

특정 알림의 상세 정보를 조회합니다.

**경로 파라미터:**

| 파라미터 | 설명 |
|----------|------|
| `:id` | 알림 ID (정수) |

**요청:**

```bash
curl -b "tk_session=<TOKEN>" https://서버주소/tkadmin/api/alerts/42
```

**응답:**

```json
{
  "id": 42,
  "time": "2025-12-20T14:30:00Z",
  "service": "TACHYON-Api1",
  "type": "FAILURE",
  "message": "서비스 TACHYON-Api1이 비정상 종료되었습니다.",
  "is_healing": true,
  "read": false
}
```

---

### GET /tkadmin/api/audit-logs

감사 로그를 조회합니다. SQLite DB에 저장된 이력을 최신순으로 반환합니다.

**요청 파라미터:**

| 파라미터 | 위치 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `limit` | Query | 아니오 | `100` | 반환할 최대 레코드 수 |

**요청:**

```bash
curl -b "tk_session=<TOKEN>" "https://서버주소/tkadmin/api/audit-logs?limit=50"
```

**응답:** 감사 로그 배열 (각 로그의 ID, 시간, 서비스명, 유형, 메시지, 복구 시도 여부, 읽음 상태)

---

## 환경 체크

### GET /tkadmin/api/system/os-checks

운영체제 환경 설정 상태를 점검합니다. SELinux, 방화벽, OS 리미트 등을 확인합니다.

**요청:**

```bash
curl -b "tk_session=<TOKEN>" https://서버주소/tkadmin/api/system/os-checks
```

**응답:** OS 환경 체크 결과 (SELinux 모드, 방화벽 상태, 허용된 포트/서비스, OS 리미트 설정)

---

### POST /tkadmin/api/system/os-checks/selinux

SELinux 모드를 변경합니다.

**요청 본문:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `mode` | String | 예 | SELinux 모드 (`enforcing`, `permissive`, `disabled`) |

**요청:**

```bash
curl -b "tk_session=<TOKEN>" \
  -X POST https://서버주소/tkadmin/api/system/os-checks/selinux \
  -H "Content-Type: application/json" \
  -d '{"mode": "permissive"}'
```

**응답:**

```json
{
  "message": "SELinux 설정이 변경되었습니다."
}
```

---

### POST /tkadmin/api/system/os-checks/firewall

방화벽 포트 또는 서비스를 추가/제거합니다 (firewalld 기반).

**요청 본문:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `port` | String | 예 | 포트 번호 또는 서비스 이름 (예: `13700/tcp`, `http`) |
| `action` | String | 예 | 수행할 작업 (`add`, `remove`) |

**요청:**

```bash
curl -b "tk_session=<TOKEN>" \
  -X POST https://서버주소/tkadmin/api/system/os-checks/firewall \
  -H "Content-Type: application/json" \
  -d '{"port": "13700/tcp", "action": "add"}'
```

**응답:**

```json
{
  "message": "방화벽 정책이 반영되었습니다."
}
```

---

### POST /tkadmin/api/system/os-checks/limits

OS 리미트 설정(`/etc/security/limits.conf`)을 추가합니다.

**요청 본문:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `domain` | String | 예 | 도메인 (예: `*`, `root`) |
| `type` | String | 예 | 타입 (`soft`, `hard`) |
| `item` | String | 예 | 항목 (예: `nofile`, `nproc`) |
| `value` | String | 예 | 설정값 (예: `65535`) |

**요청:**

```bash
curl -b "tk_session=<TOKEN>" \
  -X POST https://서버주소/tkadmin/api/system/os-checks/limits \
  -H "Content-Type: application/json" \
  -d '{"domain": "*", "type": "hard", "item": "nofile", "value": "65535"}'
```

**응답:**

```json
{
  "message": "OS Limit 설정이 추가되었습니다."
}
```

---

## 로그 조회

### GET /tkadmin/api/logs

tkadmin 시스템 로그를 구조화된 JSON 형태로 조회합니다. 최신 로그가 먼저 반환되며, 로테이션된 `.gz` 압축 파일도 지원합니다.

**요청 파라미터:**

| 파라미터 | 위치 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `limit` | Query | 아니오 | `100` | 반환할 최대 로그 수 (최대 1000) |
| `search` | Query | 아니오 | - | 대소문자 무시 키워드 검색 |
| `level` | Query | 아니오 | - | 로그 레벨 필터 (`DEBUG`, `INFO`, `WARN`, `ERROR`) |
| `since` | Query | 아니오 | - | 시작 시간 필터 (이후 로그만 반환) |
| `until` | Query | 아니오 | - | 종료 시간 필터 (이전 로그만 반환) |

**요청:**

```bash
# 최근 50건 조회
curl -b "tk_session=<TOKEN>" "https://서버주소/tkadmin/api/logs?limit=50"

# ERROR 레벨만 필터링
curl -b "tk_session=<TOKEN>" "https://서버주소/tkadmin/api/logs?level=ERROR&limit=100"

# 키워드 검색
curl -b "tk_session=<TOKEN>" "https://서버주소/tkadmin/api/logs?search=redis&limit=50"

# 시간대 필터링
curl -b "tk_session=<TOKEN>" \
  "https://서버주소/tkadmin/api/logs?since=2025-12-20T10:00:00&until=2025-12-20T12:00:00"
```

**응답 필드:**

각 로그 항목의 필드:

| 필드 | 타입 | 설명 |
|------|------|------|
| `level` | String | 로그 레벨 (DEBUG, INFO, WARN, ERROR) |
| `ts` | String | 타임스탬프 |
| `caller` | String | 호출 위치 (소스 파일:라인) |
| `msg` | String | 로그 메시지 |
| `fields` | Object | 추가 구조화 데이터 (선택) |

**응답 예시:**

```json
[
  {
    "level": "INFO",
    "ts": "2025-12-20T14:30:00.123Z",
    "caller": "main.go:142",
    "msg": "[SERVER] Starting tkadmin",
    "fields": {
      "addr": ":13700",
      "version": "0.1.5.142"
    }
  },
  {
    "level": "WARN",
    "ts": "2025-12-20T14:29:58.456Z",
    "caller": "main.go:152",
    "msg": "[REDIS] Connection warning",
    "fields": {
      "error": "dial tcp 127.0.0.1:6379: connect: connection refused",
      "addr": "127.0.0.1:6379"
    }
  }
]
```

---

## 서비스 파일 로그 (v0.2.2)

### GET /tkadmin/api/service/logs/file/list

TACHYON 서비스별 로그 파일 목록을 조회합니다. 실제 파일이 존재하는 서비스만 반환됩니다.

**요청:**

```bash
curl -b "tk_session=<TOKEN>" https://서버주소/tkadmin/api/service/logs/file/list
```

**응답 필드:**

각 서비스 항목:

| 필드 | 타입 | 설명 |
|------|------|------|
| `service` | String | 서비스 이름 |
| `category` | String | 카테고리 (TACHYON Core, Communication, 미들웨어, 보안, 관리도구) |
| `log_path` | String | 로그 파일 절대 경로 |

**응답 예시:**

```json
[
  {"service": "TACHYON-Package", "category": "TACHYON Core", "log_path": "/usr/local/TACHYON/TTS40/dist/.../package.log"},
  {"service": "kafka", "category": "미들웨어", "log_path": "/usr/local/TACHYON/TTS40/dist/.../server.log"},
  {"service": "tkadmin", "category": "관리도구", "log_path": "/usr/local/tkadmin/logs/tkadmin.log"}
]
```

---

### GET /tkadmin/api/service/logs/file

서비스 파일 로그의 내용을 offset 기반으로 읽습니다. 증분 읽기를 지원하여 실시간 폴링에 적합합니다.

**요청 파라미터:**

| 파라미터 | 위치 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `service` | Query | 예 | - | 서비스 이름 |
| `lines` | Query | 아니오 | `100` | 반환할 최대 줄 수 |
| `offset` | Query | 아니오 | `0` | 파일 읽기 시작 위치 (바이트) |

**요청:**

```bash
# 초기 로드 (최근 100줄)
curl -b "tk_session=<TOKEN>" \
  "https://서버주소/tkadmin/api/service/logs/file?service=TACHYON-Package&lines=100"

# 증분 읽기 (offset 이후의 새 줄만)
curl -b "tk_session=<TOKEN>" \
  "https://서버주소/tkadmin/api/service/logs/file?service=TACHYON-Package&lines=100&offset=45678"
```

**응답 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `lines` | Array | 로그 줄 배열 (각 줄: `{line, level}`) |
| `offset` | Integer | 다음 읽기 시작 위치 (바이트) |
| `fileSize` | Integer | 현재 파일 크기 (바이트) |
| `rotated` | Boolean | 로그 로테이션 감지 여부 |

**응답 예시:**

```json
{
  "lines": [
    {"line": "2026-02-19 08:10:00 [INFO] Service started", "level": "info"},
    {"line": "2026-02-19 08:10:01 [WARN] Connection retry", "level": "warn"}
  ],
  "offset": 46200,
  "fileSize": 46200,
  "rotated": false
}
```

?> **팁**: `offset`을 이전 응답의 `offset` 값으로 지정하면 새로 추가된 줄만 반환됩니다. `rotated`가 `true`이면 로그 파일이 로테이션되어 offset이 0으로 리셋된 것을 의미합니다.



### 메인 서버 API

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| `GET` | `/tkadmin/api/status` | 통합 상태 조회 | 필요 |
| `GET` | `/tkadmin/api/stream` | SSE 실시간 상태 Push | 필요 |
| `GET` | `/tkadmin/api/system/stats` | 시스템 리소스 통계 | 필요 |
| `GET` | `/tkadmin/api/services` | 서비스 목록 및 리소스 | 필요 |
| `GET` | `/tkadmin/api/config` | 설정 조회 | 필요 |
| `POST` | `/tkadmin/api/config` | 설정 변경 | 필요 |
| `POST` | `/tkadmin/api/config/restart` | 서비스 재시작 | 필요 |
| `GET` | `/tkadmin/api/nav-config` | 네비게이션 설정 | 불필요 |
| `GET` | `/tkadmin/api/config/external/files` | 외부 설정 파일 목록 | 필요 |
| `GET` | `/tkadmin/api/config/external/file` | 외부 설정 파일 내용 | 필요 |
| `POST` | `/tkadmin/api/config/external/file` | 외부 설정 파일 저장 | 필요 |
| `POST` | `/tkadmin/api/service/:action` | 서비스 제어 | 필요 |
| `POST` | `/tkadmin/api/monitor/report` | 외부 보고 수신 | 필요 |
| `GET` | `/tkadmin/api/alerts` | 알림 목록 | 필요 |
| `GET` | `/tkadmin/api/alerts/unread` | 미읽음 알림 수 | 필요 |
| `POST` | `/tkadmin/api/alerts/read` | 전체 읽음 처리 | 필요 |
| `GET` | `/tkadmin/api/alerts/:id` | 알림 상세 | 필요 |
| `GET` | `/tkadmin/api/audit-logs` | 감사 로그 | 필요 |
| `GET` | `/tkadmin/api/system/os-checks` | OS 환경 체크 | 필요 |
| `POST` | `/tkadmin/api/system/os-checks/selinux` | SELinux 설정 | 필요 |
| `POST` | `/tkadmin/api/system/os-checks/firewall` | 방화벽 설정 | 필요 |
| `POST` | `/tkadmin/api/system/os-checks/limits` | OS 리미트 설정 | 필요 |
| `GET` | `/tkadmin/api/logs` | 로그 조회 | 필요 |
| `GET` | `/tkadmin/api/service/logs/file/list` | 서비스 파일 로그 목록 | 필요 |
| `GET` | `/tkadmin/api/service/logs/file` | 서비스 파일 로그 읽기 | 필요 |

### Recovery 서버 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/recovery/` | Recovery 로그인 페이지 |
| `POST` | `/recovery/login` | OS 계정 인증 |
| `GET` | `/tkadmin/api/status` | 상태 조회 |
| `GET` | `/tkadmin/api/config` | 설정 조회 |
| `POST` | `/tkadmin/api/config` | 설정 변경 |
| `POST` | `/tkadmin/api/config/restart` | 서비스 재시작 |
| `GET` | `/tkadmin/api/alerts` | 알림 조회 |
| `GET` | `/tkadmin/api/audit-logs` | 감사 로그 |
| `GET` | `/tkadmin/api/alerts/:id` | 알림 상세 |
