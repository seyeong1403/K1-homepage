# -*- coding: utf-8 -*-
"""국문 페이지에서 영문 페이지(/en/)를 생성한다.

- 번역은 _i18n/*.json 의 '정확히 일치하는 텍스트 노드/속성값'만 치환한다.
  (부분 문자열 치환을 하지 않으므로 '년', '명' 같은 짧은 키가 다른 문장을 건드리지 않는다)
- 자산·링크 경로를 /en/ 기준으로 바꾸고, lang·canonical·OG 를 영문으로 맞춘다.
- 남은 한글은 리포트로 출력해 누락을 잡는다.
"""
import io, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I18N = os.path.join(ROOT, '_i18n')
EN = os.path.join(ROOT, 'en')
PAGES = ['index.html', 'about.html', 'business.html', 'projects.html',
         'recruit.html', 'news.html', 'contact.html', 'privacy.html']
KO = re.compile(r'[가-힣]')
SITE = 'https://k1tnc.co.kr'


def load(name):
    p = os.path.join(I18N, name)
    return json.load(io.open(p, encoding='utf-8')) if os.path.exists(p) else {}


def translate(html, table):
    """텍스트 노드와 지정 속성값만 정확히 일치할 때 치환."""
    miss = []

    def text_node(m):
        raw = m.group(1)
        key = raw.strip()
        if not key or not KO.search(key):
            return m.group(0)
        if key in table:
            lead = raw[:len(raw) - len(raw.lstrip())]
            tail = raw[len(raw.rstrip()):]
            return '>' + lead + table[key] + tail + '<'
        miss.append(key)
        return m.group(0)

    def attr(m):
        name, raw = m.group(1), m.group(2)
        key = raw.strip()
        if not key or not KO.search(key):
            return m.group(0)
        if key in table:
            return '%s="%s"' % (name, table[key])
        miss.append(key)
        return m.group(0)

    html = re.sub(r'>([^<>]+)<', text_node, html)
    html = re.sub(r'(alt|title|aria-label|placeholder|content)="([^"]+)"', attr, html)
    return html, miss


# 텍스트 노드가 아니어서 위 치환에 걸리지 않는 값들
# (폼 필드명은 수신 메일 본문에 그대로 찍히므로 영문이어야 한다)
POST = [
    ('name="문의목적"', 'name="Purpose"'),
    ('name="회사"', 'name="Company"'),
    ('name="이름"', 'name="Name"'),
    ('name="연락처"', 'name="Phone"'),
    ('name="이메일"', 'name="Email"'),
    ('name="문의내용"', 'name="Message"'),
    ('name="개인정보동의"', 'name="Consent"'),
    ('subject=[인재채용] 상시지원 이력서 제출', 'subject=[Careers] Open application'),
    # 180억원 = 180억 → 영문은 18 billion KRW 로 단위를 바꾼다
    ('<span data-count="180">180</span><em>B KRW</em>',
     '<span data-count="18">18</span><em>B KRW</em>'),
    # 국문 히어로의 강제 줄바꿈은 영문 문장에서 어색하다
    ('process for the shipbuilding,<br>offshore', 'process for the shipbuilding, offshore'),
    # 국문 인용구의 3행 구조가 영문에서는 2행이라 마지막 <br> 가 빈 줄로 남는다
    ('<em>with the unexpected</em><br></p>', '<em>with the unexpected</em></p>'),
]


def relink(html):
    """/en/ 안에서 동작하도록 자산은 상위로, 페이지 링크는 en 내부로."""
    html = re.sub(r'(href|src)="(css/|js/|assets/)', r'\1="../\2', html)
    html = html.replace('url(assets/', 'url(../assets/')
    return html


def add_hreflang(html, slug):
    """검색엔진에 국문/영문이 같은 페이지의 다른 언어판임을 알린다."""
    NL = chr(10)
    tags = ('<link rel="alternate" hreflang="ko" href="{s}/{p}">{n}'
            '<link rel="alternate" hreflang="en" href="{s}/en/{p}">{n}'
            '<link rel="alternate" hreflang="x-default" href="{s}/{p}">{n}'
            ).format(s=SITE, p=slug, n=NL)
    html = re.sub(r'<link rel="alternate" hreflang="[^"]*" href="[^"]*">' + NL, '', html)
    m = re.search(r'<link rel="canonical"[^>]*>' + NL, html)
    if not m:
        return html
    return html[:m.end()] + tags + html[m.end():]


def strip_lang(html):
    """이미 들어 있는 전환 버튼을 제거한다(스크립트를 여러 번 돌려도 중복되지 않도록)."""
    return re.sub(r'\s*<div class="lang[^"]*"[^>]*>.*?</div>\s*', '\n      ', html, flags=re.S)


def lang_switch(html, other_href, current):
    """헤더와 모바일 드로어에 KR/EN 전환을 넣는다."""
    kr_cls = ' is-on' if current == 'kr' else ''
    en_cls = ' is-on' if current == 'en' else ''
    kr_href = other_href if current == 'en' else '#'
    en_href = other_href if current == 'kr' else '#'
    block = (
        '<div class="lang" role="group" aria-label="Language">'
        '<a class="lang__b%s" href="%s"%s>KR</a>'
        '<a class="lang__b%s" href="%s"%s>EN</a>'
        '</div>'
    ) % (kr_cls, kr_href, ' aria-current="true"' if current == 'kr' else '',
         en_cls, en_href, ' aria-current="true"' if current == 'en' else '')

    html = html.replace('<div class="head__r">', '<div class="head__r">\n      ' + block, 1)
    html = html.replace('<a class="btn btn--solid drawer__cta"',
                        block.replace('class="lang"', 'class="lang lang--drawer"')
                        + '\n  <a class="btn btn--solid drawer__cta"', 1)
    return html


def build():
    if not os.path.isdir(EN):
        os.makedirs(EN)
    shell = load('shell.json')
    report = {}
    for page in PAGES:
        table = dict(shell)
        table.update(load(page.replace('.html', '.json')))
        html = io.open(os.path.join(ROOT, page), encoding='utf-8').read()
        html = strip_lang(html)

        html, miss = translate(html, table)
        for a, b in POST:
            html = html.replace(a, b)
        html = relink(html)

        # 언어 속성 · 정본 주소 · OG
        html = html.replace('<html lang="ko">', '<html lang="en">', 1)
        slug = '' if page == 'index.html' else page
        html = re.sub(r'<link rel="canonical" href="[^"]*">',
                      '<link rel="canonical" href="%s/en/%s">' % (SITE, slug), html)
        html = re.sub(r'<meta property="og:url" content="[^"]*">',
                      '<meta property="og:url" content="%s/en/%s">' % (SITE, slug), html)
        html = html.replace('<meta property="og:locale" content="ko_KR">',
                            '<meta property="og:locale" content="en_US">')
        html = add_hreflang(html, slug)

        # 국문 페이지로 가는 전환 링크
        html = lang_switch(html, '../' + page, 'en')

        io.open(os.path.join(EN, page), 'w', encoding='utf-8', newline='').write(html)
        report[page] = sorted(set(miss))

    # 국문 페이지에도 전환 버튼 추가
    for page in PAGES:
        p = os.path.join(ROOT, page)
        html = io.open(p, encoding='utf-8').read()
        slug = '' if page == 'index.html' else page
        html = add_hreflang(html, slug)
        html = lang_switch(strip_lang(html), 'en/' + page, 'kr')
        io.open(p, 'w', encoding='utf-8', newline='').write(html)

    total = sum(len(v) for v in report.values())
    print('생성 완료 — 미번역 문자열 %d개' % total)
    for page, miss in report.items():
        if miss:
            print('\n### %s (%d)' % (page, len(miss)))
            for m in miss:
                print('   ', m)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    build()
