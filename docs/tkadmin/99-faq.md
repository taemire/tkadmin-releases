# 자주 묻는 질문 (FAQ)

tkadmin 운영 중 자주 발생하는 문제와 해결 방법을 안내합니다.

---

## Q1. 로그인이 안 됩니다

### Auth Bridge 동작 원리

tkadmin은 TACHYON 인증 시스템과 연동하는 **Auth Bridge** 방식으로 로그인을 처리합니다. 동작 흐름은 다음과 같습니다:

1. 사용자가 `/tkadmin/`에 접속하면 `tk_session` 쿠키 존재 여부를 확인합니다.
2. 쿠키가 없으면 `/tkadmin/bridge` 페이지로 리다이렉트합니다.
3. Bridge 페이지에서 브라우저의 `localStorage` 및 `sessionStorage`를 스캔하여 TACHYON JWT 토큰을 탐색합니다.
4. 토큰을 발견하면 서버로 전송하여 JWT 유효성을 검증하고, Redis에서 실제 세션 존재 여부를 확인합니다.
5. 검증에 성공하면 `tk_session` 쿠키를 설정하고 대시보드로 진입합니다.

### 확인 사항

**TACHYON 인증 서버 상태 확인**

TACHYON Auth 서비스가 정상 구동 중인지 확인합니다:

```bash
systemctl status TACHYON-Auth1
```

서비스가 중지된 경우 시작합니다:

```bash
systemctl start TACHYON-Auth1
```

**Redis 연결 상태 확인**

tkadmin은 Redis에 저장된 TACHYON 세션 데이터(`TOKEN:GUID`)를 실시간으로 검증합니다. Redis 연결에 문제가 있으면 로그인이 실패합니다.

```bash
# Redis 서비스 상태 확인
systemctl status redis

# Redis 포트 확인
netstat -nlpt | grep redis

# Redis 연결 테스트
redis-cli -h 127.0.0.1 -p 6379 ping
```

tkadmin 로그에서 Redis 관련 경고를 확인할 수 있습니다:

```bash
grep "REDIS" /usr/local/TACHYON/TTS40/logs/tkadmin.log
```

**Recovery Mode 접근**

TACHYON 인증 서버 자체에 장애가 있는 경우, Recovery Mode를 통해 긴급 접근할 수 있습니다. 자세한 내용은 [Recovery Mode 가이드](/admin/03-recovery-mode.md)를 참조하세요.

기본 Recovery 포트: `13701` (메인 포트 + 1)

```
http://서버주소:13701/recovery/
```

---

## Q2. 서비스가 시작되지 않습니다

### 서비스 상태 확인

```bash
systemctl status tkadmin
```

상태가 `failed`인 경우 상세 로그를 확인합니다:

```bash
journalctl -u tkadmin -n 50 --no-pager
```

### 포트 충돌 확인

tkadmin의 기본 포트는 **13700**입니다. 해당 포트가 이미 사용 중인지 확인합니다:

```bash
netstat -nlpt | grep 13700
# 또는
ss -nlpt | grep 13700
```

다른 프로세스가 포트를 점유하고 있다면, 해당 프로세스를 종료하거나 `tkadmin.yml`에서 포트를 변경합니다.

### 로그 파일 확인

```bash
tail -50 /usr/local/TACHYON/TTS40/logs/tkadmin.log
```

주요 오류 패턴:

- `ListenAndServe failed`: 포트 바인딩 실패 (포트 충돌 또는 권한 부족)
- `Database initialization failed`: SQLite DB 초기화 실패
- `Logger not initialized`: 로그 경로 설정 오류

### PID 싱글톤 체크

tkadmin은 동시에 하나의 인스턴스만 실행되도록 `tkadmin.pid` 파일을 사용합니다. 비정상 종료 후 PID 파일이 남아 있으면 새로운 인스턴스가 시작되지 않을 수 있습니다.

```bash
# PID 파일 확인
cat /usr/local/TACHYON/TTS40/tkadmin.pid

# 해당 PID의 프로세스가 실제로 실행 중인지 확인
ps -p $(cat /usr/local/TACHYON/TTS40/tkadmin.pid)

# 프로세스가 없으면 PID 파일 삭제 후 재시작
rm /usr/local/TACHYON/TTS40/tkadmin.pid
systemctl start tkadmin
```

---

## Q3. 설정 변경 후 반영되지 않습니다

### 포트 변경 시 재시작 필요

`port` 값을 변경한 경우 서비스를 재시작해야 적용됩니다. 웹 UI에서 설정을 저장하면 포트 변경이 감지될 때 재시작 확인 대화상자가 표시됩니다.

```bash
systemctl restart tkadmin
```

### NGINX 자동 동기화 확인

tkadmin은 설정 저장 시 NGINX `proxy_pass` 포트를 자동으로 동기화합니다. NGINX 설정이 올바르게 반영되었는지 확인합니다:

```bash
cat /usr/local/TACHYON/TTS40/nginx/conf/conf.d/tkadmin.location
```

`proxy_pass` 뒤의 포트 번호가 `tkadmin.yml`의 `port` 값과 일치하는지 확인하세요.

### tkadmin.yml 파일 직접 확인

설정 파일의 실제 내용을 확인합니다:

```bash
cat /usr/local/TACHYON/TTS40/tkadmin.yml
```

?> **팁**: YAML 문법 오류가 있으면 설정 파일 전체가 무시되고 기본값이 적용됩니다. YAML 들여쓰기에 탭(Tab) 대신 공백(Space)을 사용하고 있는지 확인하세요.

---

## Q4. 로그가 표시되지 않습니다

### 로그 파일 경로 확인

기본 로그 파일 경로는 `/usr/local/TACHYON/TTS40/logs/tkadmin.log`입니다. 파일이 존재하는지 확인합니다:

```bash
ls -la /usr/local/TACHYON/TTS40/logs/tkadmin.log
```

파일이 없는 경우 `tkadmin.yml`의 `logging.file` 설정을 확인합니다:

```yaml
logging:
  file: "logs/tkadmin.log"
```

!> **주의**: `logging.file` 값이 빈 문자열이거나 디렉토리 경로만 지정되면 치명적인 버그가 발생할 수 있습니다. 반드시 파일명을 포함한 전체 경로를 입력하세요.

### 로그 레벨 설정 확인

`tkadmin.yml`에서 로그 레벨을 확인합니다:

```yaml
logging:
  level: "info"    # debug, info, warn, error
```

상세한 로그를 보려면 `debug`로 변경합니다. `debug` 레벨은 `tkadmin.yml`의 `debug: true` 설정이 활성화된 경우에도 자동으로 적용됩니다.

### 브라우저 캐시 초기화

웹 UI에서 로그가 표시되지 않는 경우 브라우저 캐시를 초기화합니다:

- **Chrome/Edge**: `Ctrl + Shift + Delete` > 캐시된 이미지 및 파일 삭제
- 또는 `Ctrl + Shift + R`로 강제 새로고침

---

## Q5. 알림 배너가 사라지지 않습니다

### Active FAILURE vs 읽음 처리 차이

tkadmin의 알림 시스템은 두 가지 독립적인 상태를 관리합니다:

| 구분 | 설명 |
|------|------|
| **Active FAILURE 배너** | 현재 장애가 발생했으나 아직 복구되지 않은 서비스에 대한 빨간색 상단 배너 |
| **읽음/미읽음 상태** | 관리자가 해당 알림을 확인(읽음 처리)했는지 여부 |

### 배너 자동 숨김 정책

- 장애가 발생한 서비스에 대해 **복구 성공(RECOVERY_SUCCESS)** 알림이 수신되면, 해당 장애 배너는 **즉시 자동으로 숨김** 처리됩니다.
- 그러나 배너가 사라지더라도 **알림 뱃지(빨간 점)와 관리자 보고 목록의 미읽음 상태는 유지**됩니다.

### 읽음 처리 방법

관리자 보고 페이지에서 읽음 처리를 수행합니다:

1. 사이드바에서 **관리자 보고** 메뉴를 클릭합니다.
2. 미확인(미읽음) 항목이 시각적으로 강조 표시됩니다.
3. **전체 읽음** 버튼을 클릭하면 모든 미읽음 알림이 읽음 처리됩니다.

?> **팁**: 이 설계는 감사 추적성을 보장하기 위한 것입니다. 배너가 자동으로 사라지더라도, 관리자가 직접 읽음 처리하기 전까지는 사후 장애 이력을 확인할 수 있도록 미읽음 상태가 유지됩니다.

---

## Q5-1. 서비스가 자체 업데이트 중인데 장애 알림이 발생합니다

### Grace Period (Lazy Loading) 메커니즘

tkadmin의 Watchdog 엔진은 서비스가 자체적으로 설정 적용이나 업데이트를 위해 짧게 재시작되는 경우를 자동으로 감지하여, 불필요한 장애 알림을 억제하는 **Grace Period(유예 시간)** 메커니즘을 제공합니다.

#### 정상 동작인 경우

다음과 같은 상황에서는 Watchdog이 자동으로 유예 시간을 부여합니다:

- 서비스가 `auto-restart`, `start`, `stop` 등 **전환 상태**인 경우 → **15초** 유예
- 서비스가 `dead`, `failed` 상태이지만 직후 재시작되는 경우 → **5초** 유예

유예 시간 내에 서비스가 자동 복구되면, 장애 알림 없이 정상 처리됩니다.

#### 알림이 계속 발생하는 경우

Grace Period(15초) 이후에도 서비스가 복구되지 않으면 실제 장애로 판단하여 알림이 발생합니다. 이 경우:

1. 해당 서비스의 로그를 [시스템 로그](../3-features/06-log-viewer.md) 화면에서 확인합니다.
2. `journalctl -u <서비스명> -n 50 --no-pager` 명령으로 systemd 로그를 확인합니다.
3. 서비스의 설정 파일에 문법 오류가 없는지 점검합니다.

?> **팁**: Grace Period 기능은 자동으로 동작하며, 별도 설정 없이 활성화됩니다. 서비스 자체 업데이트로 인한 짧은 재시작(수 초~15초 이내)에서는 장애 알림이 발생하지 않습니다.

---

## Q6. 긴급 복구 모드로 접근하려면?

### Recovery 포트 접근 방법

TACHYON 인증 서버에 장애가 발생하여 정상적인 로그인이 불가능할 때, Recovery Mode를 통해 핵심 관리 기능에 접근할 수 있습니다.

기본 Recovery 포트는 **메인 포트 + 1** (기본값: `13701`)입니다.

```
http://서버주소:13701/recovery/
```

!> **주의**: Recovery Mode는 **Linux 환경에서만** 동작합니다.

### OS 계정(root) 인증

Recovery Mode는 TACHYON JWT 인증 대신 **운영체제 PAM 인증**을 사용합니다. Linux 시스템의 실제 계정(예: `root`)으로 로그인합니다.

- 로그인 가능 조건: `/etc/passwd`에서 해당 사용자의 셸이 `/sbin/nologin` 또는 `/bin/false`가 아닌 경우
- 인증 성공 시 `tk_recovery` 쿠키로 세션이 유지됩니다 (1시간 유효)

### emergency_ips 설정 확인

Recovery 포트 접근은 IP 기반 ACL(접근 제어 목록)로 제한됩니다:

- **자동 허용**: `127.0.0.1`, `::1` (localhost)
- **추가 허용**: `tkadmin.yml`의 `emergency_ips` 목록에 등록된 IP

```yaml
# tkadmin.yml 설정 예시
emergency_ips:
  - "10.10.1.100"
  - "192.168.1.50"
```

허용되지 않은 IP에서 접근하면 **403 Forbidden** 페이지가 표시되며, 클라이언트 IP와 차단 사유가 안내됩니다.

?> **팁**: Recovery Mode에서 제공되는 설정 변경 API를 통해 `emergency_ips` 목록에 본인의 IP를 추가할 수 있습니다. 다만 이를 위해서는 먼저 서버에 SSH로 접속하여 localhost에서 Recovery 포트에 접근해야 합니다.

---

## Q7. TACHYON 대시보드에 Admin 메뉴가 보이지 않습니다

### 인젝터 스크립트 설치 여부 확인

tkadmin 관리 메뉴가 TACHYON 대시보드 사이드바에 표시되려면 인젝터 스크립트가 설치되어 있어야 합니다.

```bash
# 인젝터 스크립트 파일 확인
ls -la /usr/local/TACHYON/TTS40/front/html/tkadmin_injector.js

# index.html에 스크립트 태그가 삽입되었는지 확인
grep "tkadmin_injector" /usr/local/TACHYON/TTS40/front/html/index.html
```

인젝터가 설치되어 있지 않다면 재설치합니다:

```bash
sudo ./tkadmin -i
```

### allowed_ids 설정 확인

`tkadmin.yml`의 `allowed_ids` 설정을 통해 tkadmin 메뉴가 표시될 TACHYON 사용자 ID를 제어할 수 있습니다.

```yaml
allowed_ids:
  - "tsadmin"
  - "operator01"
```

현재 로그인한 TACHYON 계정 ID가 `allowed_ids` 목록에 포함되어 있는지 확인하세요.

### show_link 활성화 여부 확인

`tkadmin.yml`에서 `show_link` 설정이 활성화되어 있는지 확인합니다:

```yaml
show_link: true
```

`show_link: false`(기본값)인 경우 인젝터 메뉴가 표시되지 않습니다.

?> **팁**: `show_link`와 `allowed_ids` 설정은 `/tkadmin/api/nav-config` API를 통해 인젝터 스크립트에 전달됩니다. 이 API는 인증 없이 접근 가능하므로 TACHYON 대시보드에서 바로 참조할 수 있습니다.

---

## Q8. 전문가 편집기에서 저장이 실패합니다

### YAML 문법 오류 확인

tkadmin의 전문가 편집기는 `.yml` 및 `.yml_dev` 파일 저장 시 YAML 구문 유효성을 자동으로 검사합니다. 문법 오류가 있으면 저장이 거부되며 오류 메시지가 표시됩니다.

주요 YAML 문법 오류 원인:

- **탭(Tab) 사용**: YAML은 들여쓰기에 탭을 허용하지 않습니다. 공백(Space)만 사용하세요.
- **콜론 뒤 공백 누락**: `key:value`가 아닌 `key: value` 형태여야 합니다.
- **따옴표 미닫힘**: 문자열에 특수문자(`#`, `:`, `{`, `}` 등)가 포함된 경우 따옴표로 감싸야 합니다.

### 파일 권한 확인

대상 파일에 대한 쓰기 권한이 있는지 확인합니다:

```bash
ls -la /usr/local/TACHYON/TTS40/conf/파일명
```

tkadmin은 `root` 권한으로 실행되므로 일반적으로 권한 문제가 발생하지 않지만, SELinux가 활성화된 환경에서는 추가 설정이 필요할 수 있습니다.

### Path Traversal 차단 안내

보안을 위해 다음과 같은 경로 접근은 차단됩니다:

- `..`을 포함하는 상대 경로 (상위 디렉토리 탐색)
- `/`로 시작하는 절대 경로
- `\`로 시작하는 Windows 스타일 경로

편집 가능한 파일은 `target_dir`(기본: `/usr/local/TACHYON/TTS40/`) 하위의 설정 파일로 제한됩니다.

!> **주의**: 전문가 편집기로 저장할 때마다 기존 파일이 `*.YYYYMMDDHHMMSS.bak` 형식으로 자동 백업됩니다. 잘못된 수정이 있더라도 백업 파일을 통해 원복할 수 있습니다.
