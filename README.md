
# Publikacje – statyczna strona

Lekka strona do prezentacji publikacji naukowych. Edytuj plik `data/publications.json`,
a zawartość odświeży się sama (renderowanie po stronie klienta).

## Struktura wpisu
```json
{
  "id": "unikalny-id",
  "title": "Tytuł",
  "authors": ["Imię Nazwisko", "Współautor"],
  "year": 2025,
  "venue": "Nazwa czasopisma / konferencji",
  "type": "journal",
  "language": "pl",
  "abstract": "Krótki opis…",
  "keywords": ["słowo1", "słowo2"],
  "pdf": "https://…",
  "url": "https://…",
  "doi": "10.…"
}
```

## Wdrożenie (GitHub Pages)
1. Utwórz repozytorium `publications`.
2. Skopiuj pliki do repo.
3. W ustawieniach włącz GitHub Pages dla gałęzi `main` (root).
4. (Opcjonalne) dodaj plik `CNAME` z treścią `publications.janczewski.it`.

## DNS (subdomena)
- Dodaj rekord CNAME: `publications.janczewski.it` → `twoja_nazwa_uzytkownika.github.io` (lub adres serwisu hostingowego).

## Wdrożenie (Netlify/Vercel)
- Przeciągnij folder na Netlify/Vercel i podłącz domenę `publications.janczewski.it` jako custom domain.

## RSS/Sitemap (opcjonalne)
Jeśli chcesz generować `feed.xml` i `sitemap.xml`, możesz dodać prosty krok build (np. GitHub Action)
albo lokalnie uruchamiać skrypt i commitować wygenerowane pliki.
