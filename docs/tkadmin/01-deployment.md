# 배포 가이드 (시스템 관리자)

본 문서는 tkadmin의 신규 설치, 업데이트, 제거 절차를 시스템 관리자 관점에서 상세히 설명합니다.

---

## 배포 사전 요구사항

### 필수 환경

| 항목 | 요구사항 |
|------|----------|
| 운영체제 | Linux (systemd 기반, RHEL/CentOS 7+ 또는 Ubuntu 18.04+) |
| TACHYON | TTS40 설치 완료 (`/usr/local/TACHYON/TTS40/`) |
| 권한 | root 또는 sudo 권한 |
| NGINX | TACHYON 내장 NGINX (`/usr/local/TACHYON/TTS40/nginx/`) |
| Redis | TACHYON 세션 관리용 Redis 서버 (기본: `127.0.0.1:6379`) |

### 선택 환경

| 항목 | 용도 |
|------|------|
| Chromium/Chrome | 스크린샷 도구 기능 (선택사항) |

---

## 신규 설치 절차

### 1단계: 바이너리 전송

빌드된 tkadmin 바이너리를 대상 서버의 TACHYON 설치 경로로 전송합니다.

**SCP를 통한 전송:**

```bash
scp tkadmin root@서버주소:/usr/local/TACHYON/TTS40/
```

**USB를 통한 전송 (폐쇄망 환경):**

```bash
cp /mnt/usb/tkadmin /usr/local/TACHYON/TTS40/
chmod +x /usr/local/TACHYON/TTS40/tkadmin
```

### 2단계: 서비스 설치

TACHYON 설치 디렉토리에서 설치 명령을 실행합니다:

```bash
cd /usr/local/TACHYON/TTS40
sudo ./tkadmin -i
```

설치가 정상적으로 완료되면 다음 출력이 표시됩니다:

```
Service tkadmin.service installed and started successfully.
Injected NGINX include into /usr/local/TACHYON/TTS40/nginx/conf/conf.d/ssl.conf via block parsing
Injected tkadmin script into Tachyon index.html successfully.
```

### 3단계: 설치 확인

서비스 상태를 확인하여 정상 구동 여부를 점검합니다:

```bash
# systemd 서비스 상태 확인
systemctl status tkadmin

# 포트 리스닝 확인
netstat -nlpt | grep 13700

# 로그 파일 생성 확인
ls -la /usr/local/TACHYON/TTS40/logs/tkadmin.log

# 웹 접속 확인 (localhost)
curl -s http://127.0.0.1:13700/tkadmin/api/status | python3 -m json.tool
```

---

## 업데이트 절차

!> **주의**: 업데이트는 반드시 `deploy.bat`을 사용하여 수행합니다. 수동 배포(scp + ssh 조합)는 금지합니다.

### deploy.bat을 사용한 자동 업데이트 (권장)

Windows 개발 환경에서 `deploy.bat`을 실행하면 다음 절차가 자동으로 수행됩니다:

```batch
deploy.bat
```

`deploy.bat` 내부 동작 순서:

1. SSH 접속
2. `systemctl stop tkadmin` (안전 중지)
3. 기존 바이너리 삭제
4. 새 바이너리 SCP 전송
5. `tkadmin -i` 재설치

### 수동 업데이트 (deploy.bat 사용이 불가한 경우)

`deploy.bat`을 사용할 수 없는 환경에서는 다음 절차를 **정확한 순서**로 수행합니다:

```bash
# 1. 서비스 안전 중지
systemctl stop tkadmin

# 2. 기존 바이너리 삭제
rm /usr/local/TACHYON/TTS40/tkadmin

# 3. 새 바이너리 복사 (SCP, USB 등)
cp /경로/새_tkadmin /usr/local/TACHYON/TTS40/tkadmin
chmod +x /usr/local/TACHYON/TTS40/tkadmin

# 4. 새 바이너리로 재설치
cd /usr/local/TACHYON/TTS40
sudo ./tkadmin -i
```

!> **주의 (Critical Bug)**: 업데이트 시 기존(구버전) 바이너리의 `-u` 옵션을 **절대 실행하지 마십시오**. 구버전 바이너리에 존재하는 버그로 인해 로깅 설정이 빈 문자열이거나 디렉토리 경로만 지정된 경우, **제품 디렉토리 전체가 파일로 덮어써지는** 치명적 손상이 발생할 수 있습니다. (2025-12-19 발견)

### 설정 파일 보존 확인

업데이트 후 `tkadmin.yml` 설정 파일이 보존되었는지 확인합니다:

```bash
# 설정 파일 존재 확인
ls -la /usr/local/TACHYON/TTS40/tkadmin.yml

# 설정 내용 확인
cat /usr/local/TACHYON/TTS40/tkadmin.yml
```

!> **주의**: `tkadmin.yml` 설정 파일은 삭제하지 마십시오. 새 바이너리만 교체하고 설정 파일은 그대로 유지해야 합니다. 

### tkctl 자동 업데이트 (Self-Healing)

`tkadmin`은 서비스 시작 시 내장된 `tkctl` 바이너리의 무결성을 자동으로 검증합니다. `-i` 옵션 없이 바이너리만 교체하고 서비스를 재시작하더라도, `tkadmin`이 최신 버전의 `tkctl`을 자동으로 추출하여 `/usr/local/tkadmin/bin/tkctl` 경로에 동기화합니다.

---

## 로그 경로 검증

배포 후 로그 파일 경로가 올바르게 설정되었는지 반드시 확인합니다:

```bash
# 로그 파일 경로 확인
ls -la /usr/local/TACHYON/TTS40/logs/tkadmin.log

# 최근 로그 내용 확인
tail -20 /usr/local/TACHYON/TTS40/logs/tkadmin.log
```

`tkadmin.yml`의 로깅 설정이 올바른지 확인합니다:

```yaml
logging:
  file: "logs/tkadmin.log"    # 반드시 파일명을 포함해야 합니다
  level: "info"
  max_size: 10485760          # 10MB (바이트 단위)
  max_backups: 5
  max_age: 30
  compress: true
```

!> **주의**: `logging.file` 값이 빈 문자열(`""`)이거나 디렉토리 경로(`"logs/"`)만 지정되면 치명적 버그가 발생합니다. 반드시 파일명을 포함한 경로를 설정하세요.

---

## 서비스 제거

tkadmin을 완전히 제거해야 하는 경우 **현재 설치된 최신 바이너리**의 `-u` 옵션을 사용합니다:

```bash
cd /usr/local/TACHYON/TTS40
sudo ./tkadmin -u
```

제거 시 수행되는 작업:

1. systemd 서비스 중지 및 삭제 (`tkadmin.service`)
2. NGINX 설정에서 tkadmin 관련 include 제거 및 `tkadmin.location` 파일 삭제
3. TACHYON `index.html`에서 인젝터 스크립트 태그 제거
4. `tkadmin_injector.js` 파일 삭제
5. `tkctl` 바이너리 삭제 (`/usr/local/tkadmin/bin/tkctl`)

---

## 배포 체크리스트

배포 완료 후 다음 항목을 확인합니다:

- [ ] `systemctl status tkadmin` - 서비스 Active(running) 상태 확인
- [ ] `netstat -nlpt | grep 13700` - 포트 리스닝 확인
- [ ] 로그 파일 경로: `/usr/local/TACHYON/TTS40/logs/tkadmin.log` 정상 생성 확인
- [ ] `tkadmin.yml` 설정 파일 보존 여부 확인
- [ ] 웹 UI 접속 확인: `https://서버주소/tkadmin/`
- [ ] TACHYON 대시보드에서 tkadmin 메뉴 표시 확인 (show_link 활성 시)
- [ ] Recovery 포트 접근 확인: `http://127.0.0.1:13701/recovery/`

---

## 배포 수칙 요약

| 규칙 | 설명 |
|------|------|
| deploy.bat 사용 필수 | 수동 배포(scp + ssh)는 금지, 반드시 deploy.bat을 통해 배포 |
| 기존 바이너리 `-u` 실행 금지 | 구버전 바이너리의 언인스톨은 시스템 손상 위험 |
| 안전 중지 절차 | `systemctl stop` -> 바이너리 삭제 -> 새 바이너리 복사 -> `-i` 설치 |
| 설정 파일 보존 | `tkadmin.yml`은 삭제하지 않고 바이너리만 교체 |
| 로그 경로 검증 | 배포 후 `/usr/local/TACHYON/TTS40/logs/tkadmin.log` 경로 확인 |
| 시스템 리미트 | 서비스 유닛 파일에 `LimitNOFILE=65535` 설정 포함 확인 |
