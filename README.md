# Azure Fundamentals Upskill
Rekruterzy w twojej firmie borykają się z dużą ilością malwaru podczas przeglądania CV. W związku z czym Firma zakupiła 2 narzędzia do skanowania plików.
- S_RiskAssessment - sprawdza, czy plik jest niebezpieczny

Firma nie posiada własnych serwerów i wszystkie zasoby trzyma w Azurze. Kierowniczka działu HR wymaga by jej pracownicy posiadali dostęp tylko do bezpiecznych CV.
Twoim zadaniem jest zaprojektować infrastrukturę (taki trochę DMZ tylko dla plików), zaimplementować aplikacje i napisać prosty formularz w html do wysyłania CV

W skrócie:
- Aplikacja webowa do wysyłania CV w formacie PDF
- Skanowanie CV przy użyciu zewnętrznej biblioteki i zapisywanie rezultatu
- Dostęp do Bezpiecznych CV po zalogowaniu

### Cel stworzonej aplikacji

- Rekruterzy mają dostęp tylko do CV, które przeszły pozytywnie skanowanie. 
- Zespół bezpieczeństwa ma dostęp do wszystkich plików, wraz z raportem skanowania. 
- CV mogą być przesyłane przez formularz na stronie www.


## Główne komponenty architektury

1. Web Application (Frontend + Backend)
   - Frontend: formularz HTML (właściwie to ReactJS + shadcn) do przesyłania pliku PDF. 
   - Backend (np. Node.js):
     - Odbiera plik. 
     - Wysyła plik do skanowania (S_RiskAssessment). 
     - Zapisuje wynik + plik do odpowiedniego kontenera (bezpieczny / niebezpieczny).

2. Azure Blob Storage
   - Jeden kontener:
     - safe-cv  
   - Każdy plik ma metadane skanowania w blob metadata lub osobnym JSON.

3. Azure Functions / Logic App / App Service Backend
   - Logika biznesowa:
     - Pobiera plik. 
     - Wysyła do S_RiskAssessment. 
     - Analizuje wynik. 
     - Przenosi plik do odpowiedniego kontenera.

4. Azure SQL / Cosmos DB
   - Przechowuje metadane:
     - Nazwa pliku 
     - Użytkownik 
     - Wynik skanowania 
     - Data uploadu

5. Authentication / Authorization
   - Jedna rola:
     - Recruiter → dostęp tylko do safe-cv.

     Budowanie aplikacji:
     - dotnet clean
     - dotnet build
     - func azure functionapp publish cv-scanner-func (publishowanie)