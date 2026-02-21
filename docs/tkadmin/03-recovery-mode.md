# Recovery Mode (긴급 복구 모드)

tkadmin은 TACHYON 인증 서버 장애 시에도 핵심 관리 기능에 접근할 수 있도록, 메인 서버와 독립된 포트로 동작하는 긴급 관리용 Recovery 서버를 제공합니다.

---

## 개요

| 항목 | 설명 |
|------|------|
| **독립 포트** | `recovery_port` (기본값: 메인 `port` + 1, 즉 `13701`) |
| **목적** | TACHYON 인증 서버(Auth) 장애 시 핵심 설정 관리 기능 접근 보장 |
| **플랫폼 제한** | Linux 전용 (`runtime.GOOS == "linux"`) |
| **인증 방식** | OS 계정 인증 (PAM) |
| **세션 관리** | `tk_recovery` 쿠키 (1시간 유효) |

Recovery 서버는 메인 서버 시작 시 별도의 고루틴(Goroutine)에서 독립적으로 구동됩니다. `recovery_port`가 0보다 큰 값으로 설정된 경우에만 시작됩니다.

---

## 접근 방법

### 1단계: Recovery 로그인 페이지 접속

브라우저에서 Recovery 포트로 직접 접근합니다:

```
http://서버주소:13701/recovery/
```

또는 서버 로컬에서 접근:

```bash
curl http://127.0.0.1:13701/recovery/
```

### 2단계: OS 계정으로 로그인

Recovery 로그인 페이지에서 Linux 시스템의 OS 계정으로 인증합니다.

- **사용자명**: Linux 시스템 계정 (예: `root`, 또는 로그인 가능한 일반 계정)
- **비밀번호**: 해당 OS 계정의 비밀번호

### 3단계: 관리 대시보드 진입

인증에 성공하면 tkadmin 대시보드에 **(RECOVERY MODE)** 표시와 함께 진입합니다.

---

## 인증 방식

### OS 계정 인증 (PAM)

Recovery Mode는 TACHYON JWT 인증 대신 운영체제의 PAM(Pluggable Authentication Modules) 인증을 사용합니다.

**인증 처리 과정:**

1. 사용자가 `username`과 `password`를 입력합니다.
2. `/etc/passwd`에서 해당 사용자의 존재 여부를 확인합니다.
3. 사용자의 로그인 셸이 유효한지 검증합니다.
   - 차단되는 셸: `/sbin/nologin`, `/usr/sbin/nologin`, `/bin/false`
4. `su` 명령을 통해 비밀번호를 검증합니다.
5. 인증 성공 시 `tk_recovery` 쿠키를 설정합니다.

**로그인 가능 조건:**

- `/etc/passwd`에 등록된 계정이어야 합니다.
- 로그인 셸이 nologin/false가 아닌 유효한 셸이어야 합니다.
- 올바른 비밀번호를 입력해야 합니다.

?> **팁**: 대부분의 환경에서 `root` 계정으로 로그인하는 것이 가장 확실합니다. tkadmin 프로세스 자체가 root 권한으로 실행되기 때문입니다.

### 세션 관리

- **쿠키 이름**: `tk_recovery`
- **유효 시간**: 3600초 (1시간)
- **쿠키 옵션**: `HttpOnly` 활성화
- **세션 검증**: 모든 API 요청 시 `tk_recovery` 쿠키의 `RECOVERY_SESSION_` 접두사를 검증합니다.
- 인증되지 않은 요청은 `/recovery/` 로그인 페이지로 리다이렉트됩니다.

---

## IP 기반 접근 제어 (ACL)

Recovery 서버는 보안을 위해 IP 기반 접근 제어를 적용합니다.

### 허용 대상

| IP | 허용 여부 | 설명 |
|----|-----------|------|
| `127.0.0.1` | 자동 허용 | IPv4 localhost |
| `::1` | 자동 허용 | IPv6 localhost |
| `localhost` | 자동 허용 | localhost 문자열 |
| `emergency_ips` 목록 | 설정 시 허용 | `tkadmin.yml`에 등록된 IP |

### 차단 시 동작

허용되지 않은 IP에서 접근하면 `error_403.html` 페이지가 표시됩니다:

- **표시 내용**: 클라이언트 IP, 차단 사유, `emergency_ips` 설정 안내
- **로그 기록**: `[RECOVERY-ACL] Denied access` 경고 로그가 기록됩니다.

### emergency_ips 설정 방법

`tkadmin.yml` 파일에서 허용할 IP를 설정합니다:

```yaml
emergency_ips:
  - "10.10.1.100"       # 관리자 PC
  - "192.168.1.50"      # 예비 관리자 PC
  - "172.16.0.10"       # 원격 관리 서버
```

!> **주의**: `emergency_ips`에 등록된 IP는 Recovery 포트뿐만 아니라 메인 서버의 인증 우회(Emergency Bypass)에도 사용됩니다. 신뢰할 수 있는 관리자 IP만 등록하세요.

---

## 제공 API (제한적)

Recovery Mode에서는 핵심 관리 기능에 해당하는 제한된 API만 제공됩니다.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/tkadmin/api/status` | 서비스 상태 조회 (서비스 목록, 시스템 리소스, 라이선스 정보) |
| `GET` | `/tkadmin/api/config` | 현재 설정 조회 |
| `POST` | `/tkadmin/api/config` | 설정 변경 (emergency_ips, port 등) |
| `POST` | `/tkadmin/api/config/restart` | 서비스 재시작 |
| `GET` | `/tkadmin/api/alerts` | 알림 목록 조회 |
| `GET` | `/tkadmin/api/audit-logs` | 감사 로그 조회 |
| `GET` | `/tkadmin/api/alerts/:id` | 알림 상세 조회 |

메인 서버에서 제공되는 다음 API는 Recovery Mode에서 **제공되지 않습니다**:

- 시스템 통계 (`/system/stats`)
- 서비스 리소스 (`/services`)
- 서비스 제어 (`/service/:action`)
- 외부 파일 편집 (`/config/external/*`)
- 로그 조회 (`/logs`)
- OS 환경 체크 (`/system/os-checks`)
- 모니터링 보고 (`/monitor/report`)

---

## 사용 시나리오

### 시나리오 1: TACHYON Auth 서비스 장애

1. TACHYON Auth 서비스가 중단되어 웹 UI 로그인이 불가능합니다.
2. 서버에 SSH로 접속합니다.
3. `http://127.0.0.1:13701/recovery/` 에 접근합니다.
4. `root` 계정으로 로그인합니다.
5. 대시보드에서 서비스 상태를 확인합니다.
6. 필요 시 설정을 변경하고 재시작합니다.

### 시나리오 2: 원격 긴급 접근

1. 관리자 PC의 IP가 `emergency_ips`에 등록되어 있습니다.
2. 브라우저에서 `http://서버주소:13701/recovery/` 에 접근합니다.
3. OS 계정으로 로그인하여 긴급 관리를 수행합니다.

### 시나리오 3: emergency_ips 미등록 시

1. 허용되지 않은 IP에서 Recovery 포트 접근 시 403 에러가 발생합니다.
2. 서버에 SSH로 접속하여 localhost에서 Recovery에 진입합니다.
3. 설정 변경 API를 통해 본인의 IP를 `emergency_ips`에 추가합니다.
4. 이후 원격에서도 Recovery 포트에 접근할 수 있습니다.

```bash
# SSH 접속 후 localhost에서 emergency_ips 추가
curl -b "tk_recovery=RECOVERY_SESSION_root" \
  -X POST http://127.0.0.1:13701/tkadmin/api/config \
  -H "Content-Type: application/json" \
  -d '{"emergency_ips": ["10.10.1.100"], "port": 13700, "target_dir": "/usr/local/TACHYON/TTS40/"}'
```

---

## 보안 고려사항

| 항목 | 설명 |
|------|------|
| **IP 제한** | localhost 및 emergency_ips 만 접근 가능하여 외부 공격 노출을 최소화 |
| **OS 인증** | TACHYON 토큰이 아닌 실제 운영체제 계정으로 인증하므로 별도 취약점에 의존하지 않음 |
| **제한된 API** | 전체 API의 일부만 노출하여 공격 표면을 최소화 |
| **세션 만료** | 1시간으로 세션 유효 시간을 제한하여 장기 세션 탈취 위험 감소 |
| **HttpOnly 쿠키** | JavaScript를 통한 쿠키 접근을 차단하여 XSS 공격 방어 |

!> **주의**: Recovery Mode는 긴급 상황에서의 관리 접근을 보장하기 위한 기능입니다. 일상적인 관리 작업에는 메인 서버를 통한 정상적인 TACHYON 인증을 사용하세요.
