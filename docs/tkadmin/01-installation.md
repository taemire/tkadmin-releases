# 설치 가이드

## 사전 요구사항

tkadmin을 설치하기 전에 다음 조건이 충족되어야 합니다:

| 항목 | 요구사항 |
|------|---------|
| **운영체제** | Linux (RHEL/CentOS 7+, Rocky Linux 8/9 등) |
| **TACHYON 솔루션** | 설치 완료 (기본 경로: `/usr/local/TACHYON/TTS40/`) |
| **systemd** | 활성화 상태 (`systemctl` 명령 사용 가능) |
| **NGINX** | 설치 및 구동 중 (리버스 프록시 설정 자동 주입을 위해 필요) |
| **실행 권한** | `root` 또는 `sudo` 권한 필요 |

---

## 바이너리 배포

tkadmin은 **단일 바이너리** 파일로 배포됩니다. 별도의 설치 패키지나 의존성 라이브러리가 필요하지 않습니다.

1. 배포받은 `tkadmin`, `tkctl` 바이너리 파일을 설치 경로에 복사합니다.

```bash
# 설치 디렉토리 생성
sudo mkdir -p /usr/local/tkadmin/bin

# 바이너리 복사 및 실행 권한 부여
sudo cp tkadmin tkctl /usr/local/tkadmin/bin/
sudo chmod +x /usr/local/tkadmin/bin/tkadmin /usr/local/tkadmin/bin/tkctl
```

2. 바이너리 버전을 확인합니다.

```bash
/usr/local/tkadmin/bin/tkadmin -v
```

---

## 설치 명령어

### 서비스 설치

다음 명령어로 tkadmin을 시스템 서비스로 등록합니다:

```bash
/usr/local/tkadmin/bin/tkadmin -i
```

`-i` 옵션은 다음 작업을 자동으로 수행합니다:

1. **systemd 서비스 등록**: `tkadmin.service` 유닛 파일을 생성하고 서비스를 활성화합니다.
   - `LimitNOFILE=65535` 설정이 포함되어 대용량 처리를 지원합니다.
2. **NGINX 리버스 프록시 설정 주입**: `/tkadmin/` 경로에 대한 프록시 패스 규칙을 NGINX 설정에 자동으로 추가합니다.
   - 기본 포트 `13700`으로 `proxy_pass`가 설정됩니다.
3. **TACHYON 대시보드 인젝터 스크립트 삽입**: TACHYON SPA 대시보드의 `index.html`에 인젝터 스크립트(`tkadmin_injector.js`)를 자동으로 삽입합니다.
   - 사이드바에 'Admin' 메뉴가 추가됩니다.
   - 시스템 설정 페이지에 'tkadmin 이동' 버튼이 추가됩니다.
4. **서비스 시작**: 설치 완료 후 서비스가 자동으로 시작됩니다.

---

## 설치 확인

설치가 완료되면 다음 명령어로 서비스 상태를 확인합니다:

```bash
systemctl status tkadmin
```

정상적으로 설치된 경우 다음과 유사한 출력을 확인할 수 있습니다:

```
● tkadmin.service - tkadmin TACHYON Admin Console
     Loaded: loaded (/etc/systemd/system/tkadmin.service; enabled; ...)
     Active: active (running) since ...
   Main PID: 12345 (tkadmin)
     ...
```

추가로 NGINX 설정이 올바르게 적용되었는지 확인합니다:

```bash
nginx -t
systemctl status nginx
```

---

## 포트 정보

| 포트 | 용도 | 비고 |
|------|------|------|
| **13700** | 메인 서비스 포트 | NGINX 리버스 프록시를 통해 HTTPS(443)로 접근 |
| **13701** | Recovery 서비스 포트 | 긴급 관리용, 직접 HTTP 접근 (PAM 인증 + IP ACL) |

?> **팁**: 포트 번호는 `tkadmin.yml` 설정 파일에서 변경할 수 있습니다. Recovery 포트는 기본적으로 메인 포트 + 1로 자동 설정됩니다.

---

## 서비스 제거

tkadmin을 시스템에서 완전히 제거하려면 다음 명령어를 실행합니다:

```bash
/usr/local/tkadmin/bin/tkadmin -u
```

`-u` 옵션은 다음 작업을 수행합니다:

1. systemd 서비스 중지 및 삭제
2. NGINX 리버스 프록시 설정 제거
3. TACHYON 대시보드 인젝터 스크립트 원복 (삽입된 태그 및 관련 파일 제거)

?> **팁**: 제거 시 `tkadmin.yml` 설정 파일은 삭제되지 않고 보존됩니다. 재설치 시 기존 설정이 그대로 유지됩니다.

---

## 업데이트 절차

tkadmin을 업데이트할 때는 다음 절차를 준수해야 합니다:

1. 서비스 중지

```bash
systemctl stop tkadmin
```

2. 기존 바이너리를 새 바이너리로 교체

```bash
# 새 바이너리로 교체
sudo cp tkadmin tkctl /usr/local/tkadmin/bin/
sudo chmod +x /usr/local/tkadmin/bin/tkadmin /usr/local/tkadmin/bin/tkctl
```

3. 새 바이너리로 재설치

```bash
/usr/local/tkadmin/bin/tkadmin -i
```

!> **주의**: 업데이트 시 **기존 바이너리의 `-u` 옵션을 절대 실행하지 마세요.** 버그가 있는 기존 버전이 시스템을 손상시킬 수 있는 Critical Bug가 보고되어 있습니다. 반드시 `systemctl stop` -> 바이너리 교체 -> 새 바이너리 `-i` 순서를 따르세요.

---

## 기타 CLI 옵션

| 옵션 | 설명 |
|------|------|
| `-i` | systemd 서비스 등록, NGINX 설정 주입, 인젝터 설치 |
| `-u` | 서비스 중지/삭제, NGINX 설정 제거, 인젝터 원복 |
| `-k` | 실행 중인 tkadmin 프로세스 강제 종료 |
| `-r` | 백그라운드 데몬 모드로 실행 |
| `-v` | 버전 정보 출력 |
| `service start` | 시스템 서비스 시작 |
| `service stop` | 시스템 서비스 중지 |
| `service restart` | 시스템 서비스 재시작 |
| `service status` | 시스템 서비스 상태 조회 |

---

## 다음 단계

설치가 완료되었다면, [최초 접속 가이드](02-first-login.md)로 이동하여 tkadmin에 처음 접속하는 방법을 확인하세요.
