<link rel="stylesheet" href="../../assets/css/vazirmatn.css">

<div dir="rtl" lang="fa" class="vazirmatn">

# Week 01 Python Examples

این پوشه مثال‌های اجرایی جزوهٔ هفتهٔ اول را نگه می‌دارد. تمام Commandها را از داخل همین پوشه اجرا کنید.

## 1. ساخت محیط

### Linux / macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Windows PowerShell

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## 2. مثال بدون API

```bash
python 01_python_api_refresher.py
```

## 3. محاسبهٔ هزینه با قیمت فرضی

قیمت‌ها را از صفحهٔ روز Provider بردارید؛ این فایل هیچ قیمت ثابتی داخل خود ندارد.

```bash
python cost_calculator.py \
  --input-tokens 8000 \
  --output-tokens 1200 \
  --input-price 2 \
  --output-price 8 \
  --requests-per-month 100000
```

در PowerShell می‌توانید Command را در یک خط بنویسید.

## 4. آماده‌سازی Config محلی

```bash
cp .env.example .env
```

در Windows:

```powershell
Copy-Item .env.example .env
```

فایل `.env` را با Key واقعی پر کنید. این فایل در `.gitignore` است و نباید Commit شود.

## 5. اولین API Call

```bash
python 02_first_llm_call.py
```

## 6. مینی‌پروژهٔ Incident Brief

ابتدا بدون Network Call:

```bash
python incident_brief_cli.py --file sample_incident.log --dry-run
```

سپس پس از تنظیم Credential:

```bash
python incident_brief_cli.py --file sample_incident.log
```

## نکات امنیتی

- `sample_incident.log` ساختگی است.
- Regex موجود فقط برای آموزش است و DLP کامل محسوب نمی‌شود.
- Log واقعی Production را بدون مجوز، Classification، Masking و قرارداد مناسب به Provider خارجی نفرستید.
- Secret، Prompt حساس و محتوای خام را در Log برنامه ثبت نکنید.

</div>
